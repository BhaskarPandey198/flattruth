import { randomUUID } from 'crypto';

import {
  deduplicateEvidence,
  normalizeCivicContextResults,
  normalizeCommunityResults,
  normalizeMapsReviews,
  normalizeNewsResultsWithDiagnostics,
  resolveMapsResult,
} from './normalizeSerpResults';
import { searchSerpApi, SerpApiError } from './serpApiClient';
import { categoriesForTopics, tokenizeForMatching } from './tenantRelevance';
import {
  AUDIT_SCHEMA_VERSION,
  type AuditSubjectType,
  type EvidenceDossier,
  type EvidenceRecord,
  type LocationConfidence,
  type PropertyResolutionCandidate,
  type PropertyResolutionState,
  type SearchQueryId,
} from './types';

const COMPLETE_TTL_MS = 24 * 60 * 60 * 1_000;
const INSUFFICIENT_TTL_MS = 2 * 60 * 60 * 1_000;

export class EvidenceRetrievalError extends Error {
  readonly failedSearches: SearchQueryId[];

  constructor(message: string, failedSearches: SearchQueryId[]) {
    super(message);
    this.name = 'EvidenceRetrievalError';
    this.failedSearches = failedSearches;
  }
}

export class PropertyResolutionError extends Error {
  readonly state: Exclude<PropertyResolutionState, 'resolved'>;
  readonly candidates: PropertyResolutionCandidate[];

  constructor(state: Exclude<PropertyResolutionState, 'resolved'>, candidates: PropertyResolutionCandidate[]) {
    super(state === 'needs_confirmation' ? 'Property confirmation is required.' : 'No reliable Maps property match was found.');
    this.name = 'PropertyResolutionError';
    this.state = state;
    this.candidates = candidates;
  }
}

function quoted(value: string): string {
  return `"${value
    .replace(/["\r\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()}"`;
}

function isTransientMapsFailure(failure: {
  code: SerpApiError['code'] | 'unknown';
  status: number | null;
}): boolean {
  return failure.code === 'timeout' || (failure.code === 'upstream_error' && (failure.status === null || failure.status >= 500));
}

function normalizedText(value: string): string {
  return tokenizeForMatching(value).join(' ');
}

function isResidentialAreaName(value: string): boolean {
  return /\b(phase|sector|township|locality|neighbou?rhood)\b/i.test(value);
}

function strictSocietyAndCityMatch(record: EvidenceRecord, society: string, city: string): boolean {
  const text = normalizedText(`${record.title} ${record.snippet}`);
  const societyPhrase = normalizedText(society);
  const cityAliases: Record<string, string[]> = {
    bangalore: ['bangalore', 'bengaluru'],
    bengaluru: ['bangalore', 'bengaluru'],
    gurgaon: ['gurgaon', 'gurugram'],
    gurugram: ['gurgaon', 'gurugram'],
  };
  const cityPhrase = normalizedText(city);
  return Boolean(societyPhrase) && text.includes(societyPhrase) && (cityAliases[cityPhrase] ?? [cityPhrase]).some((alias) => text.includes(alias));
}

function restrictUnverifiedIdentityEvidence(
  evidence: EvidenceRecord[],
  society: string,
  city: string
): EvidenceRecord[] {
  return evidence.map((record) => {
    if (!['community', 'news'].includes(record.provenance.queryId) || strictSocietyAndCityMatch(record, society, city)) {
      return record;
    }
    // Preserve the retrieved record for browsing, but do not let a result that
    // lacks both the requested society and city establish property identity.
    return { ...record, scope: 'city', identityMatch: 'weak', includedInAnalysis: false };
  });
}

function recordCount(value: unknown): number {
  return Array.isArray(value)
    ? value.filter((item) => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
        .length
    : 0;
}

function mapsCandidateCount(payload: Record<string, unknown>): number {
  return (
    recordCount(payload.local_results) +
    (payload.place_results && typeof payload.place_results === 'object' ? 1 : 0)
  );
}

function determineLocationConfidence(
  mapsConfidence: EvidenceDossier['mapsConfidence'],
  evidence: EvidenceRecord[]
): LocationConfidence {
  const strongSocietyMatches = evidence.filter(
    (record) => record.scope === 'society' && record.identityMatch === 'strong'
  ).length;

  if (mapsConfidence === 'high' && strongSocietyMatches > 0) return 'high';
  if (mapsConfidence === 'high' || mapsConfidence === 'moderate' || strongSocietyMatches >= 2) {
    return 'moderate';
  }
  return 'low';
}

function evaluateSufficiency(
  evidence: EvidenceRecord[],
  mapsConfidence: EvidenceDossier['mapsConfidence']
): string[] {
  const included = evidence.filter((record) => record.includedInAnalysis);
  const sourceFamilies = new Set(included.map((record) => record.platform));
  const societyMatches = included.filter(
    (record) => record.scope === 'society' && record.identityMatch !== 'weak'
  );
  const strongSocietyMatches = societyMatches.filter((record) => record.identityMatch === 'strong');
  const categories = new Set(included.flatMap((record) => categoriesForTopics(record.topics)));
  const reasons: string[] = [];
  const hasHighConfidenceMaps = mapsConfidence === 'high';

  if (included.length < (hasHighConfidenceMaps ? 3 : 4)) {
    reasons.push(
      `Only ${included.length} relevant public ${included.length === 1 ? 'source could' : 'sources could'} be used in this assessment.`
    );
  }
  if (sourceFamilies.size < 2) {
    reasons.push('Fewer than two independent source families were retrieved.');
  }
  if (hasHighConfidenceMaps) {
    if (societyMatches.length < 1) {
      reasons.push('No retrieved record could be tied to the resolved society.');
    }
  } else if (strongSocietyMatches.length < 2) {
    reasons.push(
      'Without a high-confidence Maps match, at least two strong society-and-city matches are required.'
    );
  }
  if (categories.size < 2) {
    reasons.push('Fewer than two tenant-risk categories have usable evidence.');
  }

  return reasons;
}

export async function retrieveSocietyEvidence(input: {
  societyName: string;
  city: string;
  cacheKey: string;
  confirmedIdentifier?: string | null;
}): Promise<EvidenceDossier> {
  const retrievedAt = new Date().toISOString();
  const society = input.societyName.trim();
  const city = input.city.trim();

  // Maps resolution is deliberately first because its confidence controls the
  // fourth call and its locality can make the news search more precise.
  let mapsPayload: Record<string, unknown> = {};
  let mapsFailure: { code: SerpApiError['code'] | 'unknown'; status: number | null; reason: string } | null = null;
  const retrievalWarnings: SearchQueryId[] = [];
  try {
    if (process.env.NODE_ENV !== 'production' && process.env.FLATTRUTH_SIMULATE_MAPS_FAILURE === '1') {
      throw new SerpApiError('timeout', 'Simulated Maps timeout.');
    }
    mapsPayload = await searchSerpApi({
      engine: 'google_maps',
      type: 'search',
      q: `${society}, ${city}`,
      gl: 'in',
      hl: 'en',
    });
  } catch (error) {
    // A Maps outage or no usable Maps response lowers location confidence but
    // does not suppress strong society+city evidence from independent sources.
    retrievalWarnings.push('maps');
    mapsFailure =
      error instanceof SerpApiError
        ? { code: error.code, status: error.status, reason: error.message.slice(0, 200) }
        : { code: 'unknown', status: null, reason: 'Unknown Maps retrieval failure.' };
  }

  if (mapsFailure && !isTransientMapsFailure(mapsFailure)) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[FlatTruth:maps-retrieval-failure]', mapsFailure);
    }
    throw new EvidenceRetrievalError('Maps property resolution failed.', ['maps']);
  }
  const mapsResolution = mapsFailure
    ? {
        state: 'resolved' as const,
        confidence: 'none' as const,
        selectedPlace: null,
        candidates: [],
        competingCandidates: 0,
        reasons: ['Property map details were temporarily unavailable.'],
      }
    : resolveMapsResult(mapsPayload, society, city, input.confirmedIdentifier);
  if (process.env.NODE_ENV !== 'production') {
    console.info('[FlatTruth:maps-candidates]', {
      count: mapsCandidateCount(mapsPayload),
      state: mapsResolution.state,
      confidence: mapsResolution.confidence,
      candidateTitles: mapsResolution.candidates.map((candidate) => candidate.title),
    });
  }
  if (!mapsFailure && (mapsResolution.state !== 'resolved' || !mapsResolution.selectedPlace)) {
    throw new PropertyResolutionError(
      mapsResolution.state === 'resolved' ? 'not_found' : mapsResolution.state,
      mapsResolution.candidates
    );
  }
  const resolvedSociety = mapsResolution.selectedPlace?.title ?? society;
  const subjectType: AuditSubjectType =
    !mapsFailure &&
    mapsResolution.confidence === 'high' &&
    isResidentialAreaName(resolvedSociety)
      ? 'residential_area'
      : 'society';
  const trustworthyLocality =
    ['high', 'moderate'].includes(mapsResolution.confidence) &&
    mapsResolution.selectedPlace?.locality
      ? mapsResolution.selectedPlace.locality
      : null;

  // Keep the property identity precise, but do not exclude the word "rent".
  // Many genuine tenant discussions and rental-community pages naturally contain
  // that term; excluding it caused useful society evidence to disappear.
  const communityQuery =
    `${quoted(resolvedSociety)} ${quoted(city)} ` +
    '(tenant OR resident OR rent OR water OR tanker OR maintenance OR deposit OR sewage OR lift OR power OR visitor OR parking) ' +
    '-sale -resale -broker -buy';

  const newsIdentity = trustworthyLocality
    ? `(${quoted(resolvedSociety)} OR ${quoted(trustworthyLocality)})`
    : quoted(resolvedSociety);
  const newsQuery =
    `${newsIdentity} ${quoted(city)} ` +
    '(water OR sewage OR flooding OR traffic OR road OR municipal OR civic)';

  const requests: Array<{
    queryId: Exclude<SearchQueryId, 'maps'>;
    promise: Promise<Record<string, unknown>>;
  }> = [
    {
      queryId: 'community',
      promise: searchSerpApi({
        engine: 'google',
        q: communityQuery,
        location: `${city}, India`,
        gl: 'in',
        hl: 'en',
        num: 10,
      }),
    },
    {
      queryId: 'news',
      promise: searchSerpApi({
        engine: 'google',
        tbm: 'nws',
        q: newsQuery,
        location: `${city}, India`,
        gl: 'in',
        hl: 'en',
        num: 10,
      }),
    },
  ];

  const reviewIdentifier =
    mapsResolution.selectedPlace?.dataId ?? mapsResolution.selectedPlace?.placeId;
  const mapsReviewsPlanned =
    subjectType === 'society' && mapsResolution.confidence === 'high' && Boolean(reviewIdentifier);
  const mapsReviewsSkipReason = mapsReviewsPlanned
    ? null
    : subjectType === 'residential_area'
      ? 'The resolved result is a residential area, not a single society.'
      : mapsResolution.confidence !== 'high'
      ? `Maps confidence was ${mapsResolution.confidence}.`
      : 'The selected Maps candidate had neither data_id nor place_id.';
  if (process.env.NODE_ENV !== 'production') {
    console.info('[FlatTruth:maps-resolution]', {
      rawCandidateCount: mapsCandidateCount(mapsPayload),
      selectedTitle: mapsResolution.selectedPlace?.title ?? null,
      selectedAddress: mapsResolution.selectedPlace?.address ?? null,
      confidence: mapsResolution.confidence,
      hasDataId: Boolean(mapsResolution.selectedPlace?.dataId),
      hasPlaceId: Boolean(mapsResolution.selectedPlace?.placeId),
      competingCandidates: mapsResolution.competingCandidates,
      confidenceReasons: mapsResolution.reasons,
      mapsReviewsPlanned,
      mapsReviewsSkipReason,
      mapsFailure,
    });
  }
  if (mapsReviewsPlanned && reviewIdentifier) {
    const reviewLookup = mapsResolution.selectedPlace?.dataId
      ? { data_id: mapsResolution.selectedPlace.dataId }
      : { place_id: reviewIdentifier };
    requests.push({
      queryId: 'maps_reviews',
      promise: searchSerpApi({
        engine: 'google_maps_reviews',
        ...reviewLookup,
        sort_by: 'newestFirst',
        hl: 'en',
      }),
    });
  } else {
    const contextIdentity = trustworthyLocality
      ? `${quoted(trustworthyLocality)} ${quoted(city)}`
      : quoted(city);
    requests.push({
      queryId: 'civic_context',
      promise: searchSerpApi({
        engine: 'google',
        q:
          `${contextIdentity} ` +
          '(municipal OR civic OR water supply OR tanker OR flooding OR drainage OR road OR traffic OR maintenance)',
        location: `${city}, India`,
        gl: 'in',
        hl: 'en',
        num: 10,
      }),
    });
  }

  // A cold audit performs at most three post-resolution calls (four total).
  const settled = await Promise.allSettled(requests.map((request) => request.promise));
  const failedSearches = settled.flatMap((result, index) =>
    result.status === 'rejected' ? [requests[index].queryId] : []
  );
  retrievalWarnings.push(...failedSearches);
  if (failedSearches.length === requests.length) {
    throw new EvidenceRetrievalError(
      'All post-resolution evidence searches failed.',
      failedSearches
    );
  }

  const payloadByQuery = new Map<Exclude<SearchQueryId, 'maps'>, Record<string, unknown>>();
  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      payloadByQuery.set(requests[index].queryId, result.value);
    }
  });

  const context = {
    societyName: resolvedSociety,
    city,
    resolvedPlace: mapsResolution.selectedPlace,
    retrievedAt,
    subjectType,
  };
  if (process.env.NODE_ENV !== 'production') {
    console.info('[FlatTruth:normalization-start]', { searchCount: payloadByQuery.size });
  }
  const normalizedNews = normalizeNewsResultsWithDiagnostics(
    payloadByQuery.get('news') ?? {},
    context
  );
  if (process.env.NODE_ENV !== 'production') {
    console.info('[FlatTruth:news-normalization]', normalizedNews.diagnostics);
  }
  const civicContextScope: 'locality' | 'city' = trustworthyLocality ? 'locality' : 'city';
  const rawMapsReviews = recordCount(payloadByQuery.get('maps_reviews')?.reviews);
  const normalizedMapsReviews = normalizeMapsReviews(
    payloadByQuery.get('maps_reviews') ?? {},
    context
  );
  if (process.env.NODE_ENV !== 'production') {
    console.info('[FlatTruth:maps-reviews]', {
      callMade: requests.some((request) => request.queryId === 'maps_reviews'),
      skipReason: mapsReviewsSkipReason,
      requestFailed: failedSearches.includes('maps_reviews'),
      rawCount: rawMapsReviews,
      normalizedCount: normalizedMapsReviews.length,
    });
  }
  const retrievedEvidence = deduplicateEvidence([
    ...normalizeCommunityResults(payloadByQuery.get('community') ?? {}, context),
    ...normalizedNews.records,
    ...normalizeCivicContextResults(
      payloadByQuery.get('civic_context') ?? {},
      context,
      civicContextScope
    ),
    ...normalizedMapsReviews,
  ]);
  const evidence = mapsFailure
    ? restrictUnverifiedIdentityEvidence(retrievedEvidence, society, city)
    : retrievedEvidence;
  if (process.env.NODE_ENV !== 'production') {
    console.info('[FlatTruth:normalization-end]', {
      evidenceCount: evidence.length,
      includedCount: evidence.filter((record) => record.includedInAnalysis).length,
    });
  }

  const insufficiencyReasons = evaluateSufficiency(evidence, mapsResolution.confidence);
  const evidenceStatus = insufficiencyReasons.length === 0 ? 'sufficient' : 'insufficient_evidence';
  const ttl = evidenceStatus === 'sufficient' ? COMPLETE_TTL_MS : INSUFFICIENT_TTL_MS;

  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    auditId: randomUUID(),
    cacheKey: input.cacheKey,
    query: { societyName: society, city },
    subjectType,
    resolvedPlace: mapsResolution.selectedPlace,
    resolutionState: 'resolved',
    mapsConfidence: mapsResolution.confidence,
    locationConfidence: determineLocationConfidence(mapsResolution.confidence, evidence),
    evidenceStatus,
    insufficiencyReasons,
    evidence,
    retrievedAt,
    expiresAt: new Date(Date.now() + ttl).toISOString(),
    searchesPerformed: ['maps', ...requests.map((request) => request.queryId)],
    retrievalWarnings,
  };
}
