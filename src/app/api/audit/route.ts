import { NextResponse } from 'next/server';

import { createAuditCacheKey, getCachedAuditByQuery, setCachedAudit } from '@/lib/audit/auditCache';
import { deriveRiskScores } from '@/lib/audit/riskScoring';
import { classifyGroundedAudit, configuredGeminiModels } from '@/lib/ai/groundedAudit';
import { classifyEvidenceDeterministically } from '@/lib/audit/deterministicClassification';
import {
  EvidenceRetrievalError,
  PropertyResolutionError,
  retrieveSocietyEvidence,
} from '@/lib/evidence/retrieveSocietyEvidence';
import {
  AUDIT_SCHEMA_VERSION,
  type AuditResponseData,
  type ClassifiedFinding,
  type DashboardCategory,
  type DashboardLeaseDiscussionPoint,
  type EvidenceDossier,
  type EvidenceRecord,
  type FindingSeverity,
  type GeminiGroundedClassification,
  type RiskCategory,
  type RiskLevel,
} from '@/lib/evidence/types';

export const runtime = 'nodejs';

const INSUFFICIENT_TTL_MS = 2 * 60 * 60 * 1_000;

const CATEGORY_DISPLAY: Record<RiskCategory, { id: string; label: string; icon: string }> = {
  water: { id: 'cat-water', label: 'Water Security', icon: 'Droplets' },
  deposit: { id: 'cat-deposit', label: 'Deposit Safety', icon: 'IndianRupee' },
  civic: { id: 'cat-infra', label: 'Civic Infrastructure', icon: 'Construction' },
  rwa: { id: 'cat-rwa', label: 'RWA & Society Rules', icon: 'ShieldCheck' },
};

function validInput(value: string, maxLength: number): boolean {
  const hasControlCharacter = Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });
  return value.length >= 2 && value.length <= maxLength && !hasControlCharacter;
}

function emptyClassification(summary: string): GeminiGroundedClassification {
  return {
    status: 'insufficient_evidence',
    summary,
    findings: [],
    insufficientCategories: ['water', 'deposit', 'civic', 'rwa'],
    analysisAttempts: 0,
    analysisOrigin: 'none',
    modelUsed: null,
  };
}

const LEASE_POINT_TEMPLATES: Partial<
  Record<RiskCategory, Pick<DashboardLeaseDiscussionPoint, 'title' | 'body' | 'riskAddressed'>>
> = {
  water: {
    title: 'Water Supply Responsibility',
    body: 'Ask the agreement to specify whether emergency or private water costs are included in maintenance or billed separately.',
    riskAddressed: 'Water-cost responsibility',
  },
  deposit: {
    title: 'Deposit Return & Itemized Deductions',
    body: 'Agree on a written deposit-return timeline and require itemized deductions supported by the agreement.',
    riskAddressed: 'Deposit handling',
  },
  civic: {
    title: 'Discuss Access Disruptions',
    body: 'Clarify practical arrangements if surrounding road, flooding, or civic works affect access to the property.',
    riskAddressed: 'Civic and access disruption',
  },
  rwa: {
    title: 'Recurring / Society / Parking / Water Charges',
    body: 'List applicable society rules and identify who pays recurring, move-in, parking, and society-imposed charges.',
    riskAddressed: 'Society rules and charges',
  },
};

const BASELINE_LEASE_POINTS: DashboardLeaseDiscussionPoint[] = [
  {
    id: 'baseline-deposit', clauseNumber: '01', title: 'Deposit Return & Itemized Deductions',
    body: 'Agree on a written return timeline and require itemized deductions.',
    riskAddressed: 'General renter safeguard', priority: 'must-have', kind: 'baseline', evidenceIds: [],
  },
  {
    id: 'baseline-condition', clauseNumber: '02', title: 'Move-in Condition & Meter Record',
    body: 'Record pre-existing damage, fixtures, and meter readings at possession.',
    riskAddressed: 'General renter safeguard', priority: 'recommended', kind: 'baseline', evidenceIds: [],
  },
  {
    id: 'baseline-charges', clauseNumber: '03', title: 'Recurring / Society / Parking / Water Charges',
    body: 'Clarify who pays maintenance, parking, move-in, water or tanker, and society-imposed charges.',
    riskAddressed: 'General renter safeguard', priority: 'recommended', kind: 'baseline', evidenceIds: [],
  },
];

function leaseDiscussionPoints(
  classification: GeminiGroundedClassification
): DashboardLeaseDiscussionPoint[] {
  const triggered = classification.findings.flatMap((finding, index) => {
    const template = LEASE_POINT_TEMPLATES[finding.category];
    if (!template) return [];
    return [{
      id: `lease-${finding.category}`,
      clauseNumber: String(index + 1).padStart(2, '0'),
      ...template,
      priority: finding.severity === 'high' ? ('must-have' as const) : ('recommended' as const),
      kind: 'evidence_triggered' as const,
      evidenceIds: finding.evidenceIds,
    }];
  }).slice(0, 3);
  return [...triggered, ...BASELINE_LEASE_POINTS.slice(0, Math.max(0, 3 - triggered.length))];
}

function evidenceSeverity(evidenceId: string, findings: ClassifiedFinding[]): RiskLevel {
  const order: Record<FindingSeverity, number> = { low: 1, moderate: 2, high: 3 };
  const severities = findings
    .filter((finding) => finding.evidenceIds.includes(evidenceId))
    .map((finding) => finding.severity);
  if (severities.length === 0) return 'insufficient_evidence';
  return severities.sort((a, b) => order[b] - order[a])[0];
}

function projectCategories(
  scores: ReturnType<typeof deriveRiskScores>,
  classification: GeminiGroundedClassification
): DashboardCategory[] {
  return scores.categories.map((category) => {
    const display = CATEGORY_DISPLAY[category.category];
    const finding = classification.findings.find(
      (candidate) => candidate.category === category.category
    );
    return {
      id: display.id,
      label: display.label,
      score: category.score,
      maxScore: 100,
      level: category.severity,
      headline:
        category.score === null ? 'Not enough direct evidence' : (finding?.title ?? 'Risk signal'),
      detail: category.summary,
      icon: display.icon,
      evidenceIds: category.evidenceIds,
      scope: category.scope,
    };
  });
}

function projectAudit(
  dossier: EvidenceDossier,
  classification: GeminiGroundedClassification,
  scores: ReturnType<typeof deriveRiskScores>,
  statusOverride?: AuditResponseData['auditStatus']
): AuditResponseData {
  const evidenceById = new Map(dossier.evidence.map((record) => [record.id, record]));
  const googleReviews = dossier.evidence.filter((record) => record.type === 'google_review');
  const reddit = dossier.evidence.filter((record) => record.platform === 'reddit');
  const news = dossier.evidence.filter((record) => ['news', 'civic'].includes(record.type));
  const includedEvidence = dossier.evidence.filter((record) => record.includedInAnalysis);
  const auditStatus =
    statusOverride ??
    (scores.scoreState === 'full'
      ? 'complete'
      : scores.scoredCategoryCount > 0 || includedEvidence.some((record) => record.scope !== 'society')
        ? 'partial'
        : 'no_reliable_evidence');

  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    auditId: dossier.auditId,
    societyId: dossier.auditId,
    resolutionState: 'resolved',
    subjectType: dossier.subjectType,
    auditStatus,
    evidenceStatus:
      auditStatus === 'complete' || auditStatus === 'partial'
          ? 'sufficient'
          : 'insufficient_evidence',
    societyName: dossier.resolvedPlace?.title ?? dossier.query.societyName,
    locality: dossier.resolvedPlace?.locality ?? null,
    city: dossier.query.city,
    municipalWard: null,
    pincode: null,
    builder: null,
    completionYear: null,
    totalUnits: null,
    tenantRiskIndex: scores.overallRiskScore,
    riskLevel: scores.riskLevel,
    auditConfidence: scores.auditConfidence,
    evidenceCoverage: scores.evidenceCoverage,
    riskSummary:
      dossier.subjectType === 'residential_area'
        ? 'This is an area intelligence report. Area evidence is not used to create a society-specific Tenant Risk Score.'
        : auditStatus === 'complete'
        ? classification.summary
        : auditStatus === 'partial'
            ? scores.overallRiskScore === null
              ? 'Property resolved — locality context available. Society-specific risks remain unscored.'
              : classification.summary
            : 'We did not find enough reliable public information to generate a score.',
    signalCounts: {
      googleReviews: googleReviews.length,
      redditThreads: reddit.length,
      newsMentions: news.length,
      twitterPosts: 0,
      totalRetrieved: dossier.evidence.length,
      usedInAnalysis: includedEvidence.length,
      societySpecific: includedEvidence.filter((record) => record.scope === 'society').length,
      localityOrCity: includedEvidence.filter((record) => record.scope !== 'society').length,
      filteredOut: dossier.evidence.length - includedEvidence.length,
    },
    lastAuditedAt: dossier.retrievedAt,
    retrievedAt: dossier.retrievedAt,
    expiresAt: dossier.expiresAt,
    locationConfidence: dossier.locationConfidence,
    insufficiencyReasons: dossier.insufficiencyReasons,
    retrievalWarnings: dossier.retrievalWarnings,
    analysisAttempts: classification.analysisAttempts,
    scoreOrigin: classification.analysisOrigin,
    modelUsed: classification.modelUsed,
    scoreState: scores.scoreState,
    propertySnapshot: {
      imageUrl: dossier.resolvedPlace?.imageUrl ?? null,
      imageLabel: dossier.resolvedPlace?.imageUrl ? 'Google Maps place photo' : 'Property location',
      resolvedName: dossier.resolvedPlace?.title ?? dossier.query.societyName,
      address: dossier.resolvedPlace?.address ?? null,
      rating: dossier.resolvedPlace?.rating ?? null,
      reviewCount: dossier.resolvedPlace?.reviewCount ?? null,
      sourceUrl: dossier.resolvedPlace?.sourceDestinationUrl ?? null,
    },
    categories: projectCategories(scores, classification),
    redFlags: classification.findings
      .filter((finding) => finding.severity !== 'low')
      .filter((finding) =>
        finding.evidenceIds.some((id) => evidenceById.get(id)?.scope === 'society')
      )
      .map((finding) => {
        const cited = finding.evidenceIds
          .map((id) => evidenceById.get(id))
          .filter((record): record is EvidenceRecord => Boolean(record));
        return {
          id: finding.id,
          tag: `${finding.category.toUpperCase()} RISK`,
          tagLevel: finding.severity,
          title: finding.title,
          body: finding.summary,
          reportedBy:
            Array.from(new Set(cited.map((record) => record.sourceDomain))).join(', ') ||
            'Retrieved evidence',
          date: cited.find((record) => record.date)?.date ?? null,
          evidenceIds: finding.evidenceIds,
          scope: finding.scope,
        };
      }),
    redditSignals: reddit.map((record) => ({
      id: record.id,
      evidenceId: record.id,
      title: record.title,
      subreddit: record.sourceName ?? 'Reddit',
      excerpt: record.snippet,
      upvotes: null,
      comments: null,
      date: record.date,
      url: record.sourceUrl,
      sentiment: evidenceSeverity(record.id, classification.findings),
      keywords: record.topics,
      sourceDomain: record.sourceDomain,
      scope: record.scope,
      sourceQuality: record.sourceQuality,
      includedInAnalysis: record.includedInAnalysis,
    })),
    googleReviews: googleReviews.map((record) => ({
      id: record.id,
      evidenceId: record.id,
      reviewer: record.author,
      rating: record.rating,
      excerpt: record.snippet,
      date: record.date,
      keywords: record.topics,
      sentiment: evidenceSeverity(record.id, classification.findings),
      tenure: null,
      url: record.sourceUrl,
      sourceDestinationUrl: record.sourceDestinationUrl,
      sourceDomain: record.sourceDomain,
      scope: record.scope,
      sourceQuality: record.sourceQuality,
      includedInAnalysis: record.includedInAnalysis,
    })),
    newsSignals: news.map((record) => ({
      id: record.id,
      evidenceId: record.id,
      headline: record.title,
      source: record.sourceName ?? record.sourceDomain,
      sourceType: record.type === 'civic' ? 'civic' : 'news',
      excerpt: record.snippet,
      date: record.date,
      url: record.sourceUrl,
      relevanceTags: record.topics,
      sourceDomain: record.sourceDomain,
      scope: record.scope,
      sourceQuality: record.sourceQuality,
      includedInAnalysis: record.includedInAnalysis,
    })),
    leaseClauses: leaseDiscussionPoints(classification),
    evidence: dossier.evidence,
    assistantDossier: {
      schemaVersion: dossier.schemaVersion,
      auditId: dossier.auditId,
      query: dossier.query,
      resolvedPlace: dossier.resolvedPlace,
      locationConfidence: dossier.locationConfidence,
      evidenceStatus: dossier.evidenceStatus,
      evidence: dossier.evidence,
      retrievedAt: dossier.retrievedAt,
      expiresAt: dossier.expiresAt,
    },
  };
}

async function handleAuditRequest(request: Request) {
  const { searchParams } = new URL(request.url);
  const societyName = (searchParams.get('society') ?? '').trim();
  const city = (searchParams.get('city') ?? '').trim();
  const requestId = (searchParams.get('requestId') ?? '').trim();
  const confirmedIdentifier = (searchParams.get('candidateId') ?? '').trim();
  if (process.env.NODE_ENV !== 'production') {
    console.info('[FlatTruth:audit-request]', { requestId, societyLength: societyName.length, city });
  }

  if (
    !validInput(societyName, 140) ||
    !validInput(city, 80) ||
    !validInput(requestId, 100) ||
    (confirmedIdentifier && !validInput(confirmedIdentifier, 300))
  ) {
    return NextResponse.json(
      {
        success: false,
        error: 'invalid_query',
        message: 'A valid society name and city are required.',
        requestId,
      },
      { status: 400 }
    );
  }

  const cacheKey = createAuditCacheKey(societyName, city, confirmedIdentifier);
  const cached = getCachedAuditByQuery(cacheKey);
  if (cached) {
    return NextResponse.json({
      success: true,
      status: cached.data.auditStatus,
      data: cached.data,
      cached: true,
      requestId,
    });
  }

  let dossier: EvidenceDossier;
  try {
    if (process.env.NODE_ENV !== 'production') console.info('[FlatTruth:retrieval-start]', { requestId });
    dossier = await retrieveSocietyEvidence({ societyName, city, cacheKey, confirmedIdentifier });
    if (process.env.NODE_ENV !== 'production') {
      console.info('[FlatTruth:retrieval-end]', { requestId, evidenceCount: dossier.evidence.length });
    }
  } catch (error) {
    if (error instanceof PropertyResolutionError) {
      return NextResponse.json({
        success: true,
        status: error.state === 'needs_confirmation' ? 'needs_confirmation' : 'no_reliable_evidence',
        resolutionState: error.state,
        candidates: error.candidates,
        message:
          error.state === 'needs_confirmation'
            ? 'Which property did you mean?'
            : 'No reliable Maps property match was found. Check the society name and city.',
        requestId,
      });
    }
    const failedSearches = error instanceof EvidenceRetrievalError ? error.failedSearches : [];
    return NextResponse.json(
      {
        success: false,
        error: 'retrieval_error',
        message: "We couldn't complete this search right now. Please try again.",
        failedSearches,
        requestId,
      },
      { status: 502 }
    );
  }

  let classification: GeminiGroundedClassification;
  let usedDeterministicFallback = false;
  if (!dossier.evidence.some((record) => record.includedInAnalysis)) {
    classification = emptyClassification(
      'The available public sources did not provide enough direct evidence for a risk finding.'
    );
  } else {
    try {
      classification = await classifyGroundedAudit(dossier);
    } catch {
      usedDeterministicFallback = true;
      classification = classifyEvidenceDeterministically(dossier, configuredGeminiModels().length);
      if (process.env.NODE_ENV !== 'production') {
        console.info('[FlatTruth:deterministic-fallback]', {
          requestId,
          findingCount: classification.findings.length,
        });
      }
    }
  }

  const scores = deriveRiskScores(classification, dossier.evidence, dossier.locationConfidence);
  if (scores.status === 'insufficient_evidence') {
    const reasons = new Set(dossier.insufficiencyReasons);
    reasons.add(
      scores.scoredCategoryCount === 0
        ? 'No risk area had enough direct society evidence for a score.'
        : `${scores.scoredCategoryCount} ${scores.scoredCategoryCount === 1 ? 'risk area has' : 'risk areas have'} enough direct society evidence for a score.`
    );
    dossier = {
      ...dossier,
      insufficiencyReasons: Array.from(reasons),
      expiresAt: new Date(Date.now() + INSUFFICIENT_TTL_MS).toISOString(),
    };
  } else if (scores.auditConfidence === 'low') {
    dossier = {
      ...dossier,
      insufficiencyReasons: Array.from(
        new Set([
          ...dossier.insufficiencyReasons,
          'Public information was limited for several risk areas.',
        ])
      ),
      expiresAt: new Date(Date.now() + INSUFFICIENT_TTL_MS).toISOString(),
    };
  }

  const data = projectAudit(dossier, classification, scores);
  // Any upstream warning means the result was assembled from a partial
  // retrieval and must not enter either the 24-hour or short-lived cache.
  if (dossier.retrievalWarnings.length === 0 && !usedDeterministicFallback) {
    setCachedAudit({ dossier, data, cachedAt: new Date().toISOString() });
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info('[FlatTruth:audit-response]', {
      requestId,
      status: data.auditStatus,
      scoreState: data.scoreState,
      scoreOrigin: data.scoreOrigin,
    });
  }
  return NextResponse.json({
    success: true,
    status: data.auditStatus,
    data,
    cached: false,
    partialRetrieval: dossier.retrievalWarnings.length > 0,
    requestId,
  });
}

export async function GET(request: Request) {
  try {
    return await handleAuditRequest(request);
  } catch (error) {
    console.error('[FlatTruth:audit-unhandled]', {
      name: error instanceof Error ? error.name : 'unknown',
    });
    return NextResponse.json(
      {
        success: false,
        error: 'audit_service_error',
        message: 'The audit service could not complete this request. Please retry.',
      },
      { status: 500 }
    );
  }
}
