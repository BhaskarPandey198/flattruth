import { classifySourceQuality, trustworthyExternalUrl } from './normalizeSerpResults';
import {
  AUDIT_SCHEMA_VERSION,
  type EvidenceDossier,
  type EvidencePlatform,
  type EvidenceRecord,
  type EvidenceScope,
  type EvidenceTopic,
  type EvidenceType,
  type IdentityMatch,
  type SearchQueryId,
  type SerpEngine,
  type SourceQuality,
} from './types';

type UnknownRecord = Record<string, unknown>;

const TYPES: EvidenceType[] = ['google_review', 'community', 'news', 'civic', 'web'];
const PLATFORMS: EvidencePlatform[] = ['google_maps', 'reddit', 'government', 'news_site', 'web'];
const SCOPES: EvidenceScope[] = ['society', 'locality', 'city'];
const MATCHES: IdentityMatch[] = ['strong', 'moderate', 'weak'];
const QUALITIES: SourceQuality[] = ['primary', 'major_publication', 'community', 'general_web'];
const TOPICS: EvidenceTopic[] = [
  'water',
  'deposit',
  'maintenance',
  'power',
  'lift',
  'noise',
  'traffic',
  'flooding',
  'civic',
  'rwa',
  'security',
  'visitor',
  'delivery',
  'parking',
  'other',
];
const ENGINES: SerpEngine[] = ['google_maps', 'google_maps_reviews', 'google', 'google_news'];
const QUERY_IDS: SearchQueryId[] = [
  'maps',
  'maps_reviews',
  'community',
  'news',
  'civic_context',
  'assistant_search',
];

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cleanString(value: unknown, maxLength: number, nullable = false): string | null {
  if (nullable && value === null) return null;
  if (typeof value !== 'string') return null;
  const cleaned = value.trim();
  return cleaned && cleaned.length <= maxLength ? cleaned : null;
}

function cleanNullableUrl(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  return trustworthyExternalUrl(value) ?? undefined;
}

function nullableString(value: unknown, maxLength: number): string | null | undefined {
  if (value === null) return null;
  const cleaned = cleanString(value, maxLength);
  return cleaned ?? undefined;
}

function enumValue<T extends string>(value: unknown, allowed: T[]): T | null {
  return typeof value === 'string' && allowed.includes(value as T) ? (value as T) : null;
}

function finiteNumber(value: unknown, minimum: number, maximum: number): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum
    ? value
    : null;
}

function validateEvidence(
  value: unknown,
  query: { societyName: string; city: string }
): EvidenceRecord | null {
  if (!isRecord(value) || !isRecord(value.provenance) || !isRecord(value.location)) return null;
  const provenance = value.provenance;
  const location = value.location;

  const sourceUrl = cleanNullableUrl(value.sourceUrl);
  const destinationUrl = cleanNullableUrl(value.sourceDestinationUrl);
  if (sourceUrl === undefined || destinationUrl === undefined) return null;

  const id = cleanString(value.id, 96);
  const type = enumValue(value.type, TYPES);
  const platform = enumValue(value.platform, PLATFORMS);
  const scope = enumValue(value.scope, SCOPES);
  const identityMatch = enumValue(value.identityMatch, MATCHES);
  const sourceQuality = enumValue(value.sourceQuality, QUALITIES);
  const title = cleanString(value.title, 500);
  const snippet = cleanString(value.snippet, 2_500);
  const sourceDomain = cleanString(value.sourceDomain, 253);
  const engine = enumValue(provenance.engine, ENGINES);
  const queryId = enumValue(provenance.queryId, QUERY_IDS);
  const relevanceScore = finiteNumber(value.relevanceScore, 0, 1);
  const topics = Array.isArray(value.topics)
    ? Array.from(new Set(value.topics.map((topic) => enumValue(topic, TOPICS)).filter(Boolean)))
    : [];

  if (
    !id ||
    !type ||
    !platform ||
    !scope ||
    !identityMatch ||
    !sourceQuality ||
    !title ||
    !snippet ||
    !sourceDomain ||
    !engine ||
    !queryId ||
    relevanceScore === null ||
    topics.length === 0 ||
    typeof value.tenantRelevant !== 'boolean' ||
    typeof value.includedInAnalysis !== 'boolean'
  ) {
    return null;
  }
  if (classifySourceQuality(sourceDomain, platform) !== sourceQuality) return null;

  const requestedSociety = cleanString(location.requestedSociety, 140);
  const requestedCity = cleanString(location.requestedCity, 80);
  if (requestedSociety !== query.societyName || requestedCity !== query.city) return null;

  const retrievedAt = cleanString(value.retrievedAt, 64);
  if (!retrievedAt || !Number.isFinite(Date.parse(retrievedAt))) return null;
  const sourceName = nullableString(value.sourceName, 300);
  const date = nullableString(value.date, 64);
  const dateLabel = nullableString(value.dateLabel, 100);
  const author = nullableString(value.author, 300);
  const rating = value.rating === null ? null : finiteNumber(value.rating, 0, 5);
  if (
    sourceName === undefined ||
    date === undefined ||
    dateLabel === undefined ||
    author === undefined ||
    (rating === null && value.rating !== null)
  ) {
    return null;
  }

  const nullableProvenanceString = (key: string, maxLength: number) =>
    nullableString(provenance[key], maxLength);
  const searchId = nullableProvenanceString('searchId', 200);
  const reviewId = nullableProvenanceString('reviewId', 200);
  const placeId = nullableProvenanceString('placeId', 300);
  const dataId = nullableProvenanceString('dataId', 300);
  const resultPosition =
    provenance.resultPosition === null ? null : finiteNumber(provenance.resultPosition, 0, 10_000);
  if (
    searchId === undefined ||
    reviewId === undefined ||
    placeId === undefined ||
    dataId === undefined ||
    (resultPosition === null && provenance.resultPosition !== null)
  ) {
    return null;
  }

  const resolvedSociety = nullableString(location.resolvedSociety, 300);
  const locality = nullableString(location.locality, 200);
  const address = nullableString(location.address, 600);
  const latitude = location.latitude === null ? null : finiteNumber(location.latitude, -90, 90);
  const longitude =
    location.longitude === null ? null : finiteNumber(location.longitude, -180, 180);
  if (
    resolvedSociety === undefined ||
    locality === undefined ||
    address === undefined ||
    (latitude === null && location.latitude !== null) ||
    (longitude === null && location.longitude !== null)
  ) {
    return null;
  }

  return {
    id,
    type,
    platform,
    sourceUrl,
    sourceDestinationUrl: destinationUrl,
    sourceDomain,
    sourceName,
    title,
    snippet,
    date,
    dateLabel,
    author,
    rating,
    scope,
    identityMatch,
    relevanceScore,
    sourceQuality,
    topics: topics as EvidenceTopic[],
    tenantRelevant: value.tenantRelevant,
    includedInAnalysis: value.includedInAnalysis,
    retrievedAt,
    provenance: {
      engine,
      searchId,
      queryId,
      resultPosition,
      reviewId,
      placeId,
      dataId,
    },
    location: {
      requestedSociety,
      requestedCity,
      resolvedSociety,
      locality,
      address,
      latitude,
      longitude,
    },
  };
}

export function validateAssistantDossierFallback(
  value: unknown,
  expectedAuditId: string
): EvidenceDossier | null {
  if (!isRecord(value) || value.schemaVersion !== AUDIT_SCHEMA_VERSION) return null;
  const auditId = cleanString(value.auditId, 100);
  if (!auditId || auditId !== expectedAuditId || !isRecord(value.query)) return null;

  const societyName = cleanString(value.query.societyName, 140);
  const city = cleanString(value.query.city, 80);
  const retrievedAt = cleanString(value.retrievedAt, 64);
  const expiresAt = cleanString(value.expiresAt, 64);
  if (
    !societyName ||
    !city ||
    !retrievedAt ||
    !expiresAt ||
    !Number.isFinite(Date.parse(retrievedAt)) ||
    !Number.isFinite(Date.parse(expiresAt)) ||
    Date.parse(expiresAt) <= Date.now() ||
    !Array.isArray(value.evidence) ||
    value.evidence.length === 0 ||
    value.evidence.length > 50
  ) {
    return null;
  }

  const query = { societyName, city };
  const evidence = value.evidence.map((record) => validateEvidence(record, query));
  if (evidence.some((record) => !record)) return null;
  const validatedEvidence = evidence as EvidenceRecord[];
  if (new Set(validatedEvidence.map((record) => record.id)).size !== validatedEvidence.length) {
    return null;
  }

  const locationConfidence = enumValue(value.locationConfidence, ['high', 'moderate', 'low']);
  const evidenceStatus = enumValue(value.evidenceStatus, ['sufficient', 'insufficient_evidence']);
  const subjectType = enumValue(value.subjectType, ['society', 'residential_area']) ?? 'society';
  if (!locationConfidence || !evidenceStatus) return null;

  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    auditId,
    cacheKey: `validated-client-fallback:${auditId}`,
    query,
    subjectType,
    // Client fallback evidence is validated field-by-field. The richer Maps
    // object is intentionally not trusted back from the browser.
    resolvedPlace: null,
    resolutionState: 'resolved',
    mapsConfidence: locationConfidence === 'high' ? 'high' : locationConfidence,
    locationConfidence,
    evidenceStatus,
    insufficiencyReasons: [],
    evidence: validatedEvidence,
    retrievedAt,
    expiresAt,
    searchesPerformed: [],
    retrievalWarnings: [],
  };
}
