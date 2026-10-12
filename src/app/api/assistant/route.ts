import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

import { getCachedAuditById } from '@/lib/audit/auditCache';
import { getQuestionSearch, setQuestionSearch } from '@/lib/assistant/questionSearchCache';
import {
  answerQuestionFromEvidence,
  GeminiGroundingError,
  selectEvidenceForQuestion,
} from '@/lib/ai/groundedAudit';
import { validateAssistantDossierFallback } from '@/lib/evidence/validateAssistantDossier';
import { normalizeAssistantSearchResults } from '@/lib/evidence/normalizeSerpResults';
import { searchSerpApi } from '@/lib/evidence/serpApiClient';
import { tokenizeForMatching } from '@/lib/evidence/tenantRelevance';
import type { EvidenceDossier, EvidenceRecord } from '@/lib/evidence/types';

export const runtime = 'nodejs';

interface AssistantPayload {
  auditId?: unknown;
  question?: unknown;
  dossier?: unknown;
}

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function hasUnsafeControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return (code <= 31 && ![9, 10, 13].includes(code)) || code === 127;
  });
}

const SAFE_INSUFFICIENT_MESSAGE =
  "We didn't find enough reliable information to answer this confidently.";

function assistantSearchTerms(question: string): string {
  const stopWords = new Set([
    'about', 'could', 'does', 'from', 'have', 'much', 'should', 'tell', 'that', 'their',
    'there', 'these', 'they', 'this', 'what', 'when', 'where', 'which', 'with', 'would',
  ]);
  return tokenizeForMatching(question)
    .filter((token) => token.length >= 3 && !stopWords.has(token))
    .slice(0, 10)
    .join(' ');
}

async function targetedEvidenceSearch(
  dossier: EvidenceDossier,
  question: string
): Promise<{ evidence: EvidenceRecord[]; cacheHit: boolean }> {
  const key = createHash('sha256')
    .update(`${dossier.query.societyName}|${dossier.query.city}|${question}`.toLowerCase())
    .digest('hex');
  const cached = getQuestionSearch(key);
  if (cached) return { evidence: cached, cacheHit: true };

  const terms = assistantSearchTerms(question);
  const resolvedName = dossier.resolvedPlace?.title ?? dossier.query.societyName;
  const payload = await searchSerpApi({
    engine: 'google',
    q: `"${resolvedName.replace(/["\r\n]/g, ' ')}" "${dossier.query.city.replace(/["\r\n]/g, ' ')}" ${terms}`,
    location: `${dossier.query.city}, India`,
    gl: 'in',
    hl: 'en',
    num: 10,
  });
  const evidence = normalizeAssistantSearchResults(payload, {
    societyName: dossier.query.societyName,
    city: dossier.query.city,
    resolvedPlace: dossier.resolvedPlace,
    retrievedAt: new Date().toISOString(),
  });
  if (process.env.NODE_ENV !== 'production') {
    console.info('[FlatTruth:assistant-search]', { cacheHit: false, normalizedCount: evidence.length });
  }
  setQuestionSearch(key, evidence);
  return { evidence, cacheHit: false };
}

function citationsFor(ids: string[], evidence: EvidenceRecord[]) {
  const byId = new Map(evidence.map((record) => [record.id, record] as const));
  const uniqueIds = Array.from(new Set(ids));
  return uniqueIds.flatMap((evidenceId) => {
    const record = byId.get(evidenceId);
    return record
      ? [{ evidenceId, title: record.title, sourceDomain: record.sourceDomain, sourceUrl: record.sourceUrl, scope: record.scope }]
      : [];
  });
}

export async function POST(request: Request) {
  let body: AssistantPayload;
  let additionalSearchPerformed = false;
  let searchCacheHit = false;
  try {
    body = (await request.json()) as AssistantPayload;
  } catch {
    return NextResponse.json(
      { error: 'invalid_request', message: 'A JSON request body is required.' },
      { status: 400 }
    );
  }

  const auditId = cleanString(body.auditId);
  const question = cleanString(body.question);
  if (
    !auditId ||
    auditId.length > 100 ||
    !question ||
    question.length > 800 ||
    hasUnsafeControlCharacter(question)
  ) {
    return NextResponse.json(
      {
        error: 'invalid_request',
        message: 'A valid auditId and question are required.',
      },
      { status: 400 }
    );
  }

  const cached = getCachedAuditById(auditId);
  const fallbackDossier = cached ? null : validateAssistantDossierFallback(body.dossier, auditId);
  const dossier = cached?.dossier ?? fallbackDossier;
  if (!dossier) {
    return NextResponse.json(
      {
        status: 'audit_expired',
        error: 'audit_expired',
        message: 'This audit is no longer available. Run the society audit again.',
      },
      { status: 409 }
    );
  }

  try {
    let selectedEvidence = selectEvidenceForQuestion(question, dossier.evidence);
    if (selectedEvidence.length > 0) {
      const dossierResult = await answerQuestionFromEvidence(question, dossier, selectedEvidence);
      if (dossierResult.evidenceIds.length > 0) {
        return NextResponse.json({
          status: 'answered',
          answer: dossierResult.answer,
          citations: citationsFor(dossierResult.evidenceIds, selectedEvidence),
          additionalSearchPerformed: false,
          searchCacheHit: false,
          answerOrigin: dossierResult.origin,
          modelUsed: dossierResult.modelUsed,
        });
      }
    }

    // The dossier could not answer: make exactly one targeted SerpApi search.
    let targeted: Awaited<ReturnType<typeof targetedEvidenceSearch>>;
    try {
      targeted = await targetedEvidenceSearch(dossier, question);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.info('[FlatTruth:assistant-search-failure]', {
          name: error instanceof Error ? error.name : 'unknown',
        });
      }
      return NextResponse.json({
        status: 'insufficient_evidence',
        answer: SAFE_INSUFFICIENT_MESSAGE,
        citations: [],
        additionalSearchPerformed: false,
        searchCacheHit: false,
      });
    }
    additionalSearchPerformed = true;
    searchCacheHit = targeted.cacheHit;
    const combinedEvidence = [...dossier.evidence, ...targeted.evidence];
    selectedEvidence = selectEvidenceForQuestion(question, combinedEvidence);
    if (selectedEvidence.length === 0) {
      return NextResponse.json({ status: 'insufficient_evidence', answer: SAFE_INSUFFICIENT_MESSAGE, citations: [], additionalSearchPerformed: true, searchCacheHit: targeted.cacheHit });
    }
    const searchResult = await answerQuestionFromEvidence(question, dossier, selectedEvidence);
    if (searchResult.evidenceIds.length === 0) {
      return NextResponse.json({ status: 'insufficient_evidence', answer: SAFE_INSUFFICIENT_MESSAGE, citations: [], additionalSearchPerformed: true, searchCacheHit: targeted.cacheHit });
    }
    return NextResponse.json({
      status: 'answered',
      answer: searchResult.answer,
      citations: citationsFor(searchResult.evidenceIds, selectedEvidence),
      additionalSearchPerformed: true,
      searchCacheHit: targeted.cacheHit,
      answerOrigin: searchResult.origin,
      modelUsed: searchResult.modelUsed,
    });
  } catch (error) {
    const code = error instanceof GeminiGroundingError ? error.code : 'upstream_error';
    return NextResponse.json(
      {
        status: 'error',
        error: 'analysis_error',
        message: "We couldn't complete this request right now. Please try again.",
        code,
        additionalSearchPerformed,
        searchCacheHit,
      },
      { status: code === 'missing_key' ? 503 : 502 }
    );
  }
}
