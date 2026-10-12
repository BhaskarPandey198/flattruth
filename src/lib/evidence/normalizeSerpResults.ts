import { createHash } from 'crypto';

import { assessTenantRelevance, tokenizeForMatching } from './tenantRelevance';
import type {
  AuditSubjectType,
  EvidencePlatform,
  EvidenceRecord,
  EvidenceScope,
  EvidenceType,
  IdentityMatch,
  MapsResolution,
  PropertyResolutionCandidate,
  ResolvedPlace,
  SearchQueryId,
  SerpEngine,
  SourceQuality,
} from './types';

type UnknownRecord = Record<string, unknown>;

export interface NormalizationContext {
  societyName: string;
  city: string;
  resolvedPlace: ResolvedPlace | null;
  retrievedAt: string;
  subjectType?: AuditSubjectType;
}

const GENERIC_IDENTITY_TOKENS = new Set([
  'apartment',
  'apartments',
  'residential',
  'residency',
  'residences',
  'society',
  'housing',
  'project',
  'complex',
  'tower',
  'towers',
]);

const PRIMARY_DOMAIN_SUFFIXES = ['.gov.in', '.nic.in', 'rera.gov.in'];

const PRIMARY_EXACT_DOMAINS = new Set(['mohua.gov.in', 'pib.gov.in', 'indiacode.nic.in']);

const MAJOR_PUBLICATION_DOMAINS = [
  'thehindu.com',
  'indianexpress.com',
  'hindustantimes.com',
  'timesofindia.indiatimes.com',
  'economictimes.indiatimes.com',
  'livemint.com',
  'deccanherald.com',
  'ndtv.com',
  'news18.com',
  'business-standard.com',
  'punemirror.com',
  'bangaloremirror.indiatimes.com',
  'citizenmatters.in',
];

const EXCLUDED_CONTEXT_DOMAINS = [
  '99acres.com', 'magicbricks.com', 'housing.com', 'nobroker.in', 'squareyards.com',
  'commonfloor.com', 'makaan.com', 'youtube.com', 'facebook.com', 'instagram.com',
  'bankbazaar.com', 'hdfcbank.com', 'icicibank.com', 'wikipedia.org',
];

function isExcludedContextDomain(domain: string): boolean {
  return EXCLUDED_CONTEXT_DOMAINS.some((candidate) => domainMatches(domain, candidate));
}

export function isEligibleLocalityEvidence(record: EvidenceRecord): boolean {
  if (record.scope === 'society') return false;
  if (isExcludedContextDomain(record.sourceDomain)) return false;
  const locality = record.location.locality;
  if (!locality || !normalizedPhrase(`${record.title} ${record.snippet}`).includes(normalizedPhrase(locality))) {
    return false;
  }
  const hasCivicTopic = record.topics.some((topic) =>
    ['water', 'traffic', 'flooding', 'civic', 'power', 'security'].includes(topic)
  );
  if (!hasCivicTopic) return false;
  return (
    record.sourceQuality === 'primary' ||
    record.sourceQuality === 'major_publication' ||
    record.platform === 'reddit'
  );
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function records(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function nestedRecord(record: UnknownRecord, key: string): UnknownRecord | null {
  return isRecord(record[key]) ? record[key] : null;
}

function firstString(record: UnknownRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = stringValue(record[key]);
    if (value) return value;
  }
  return null;
}

function normalizedPhrase(value: string): string {
  return tokenizeForMatching(value).join(' ');
}

function identityTokens(value: string): string[] {
  const filtered = tokenizeForMatching(value).filter(
    (token) => !GENERIC_IDENTITY_TOKENS.has(token)
  );
  return filtered.length > 0 ? filtered : tokenizeForMatching(value);
}

function strictIdentityTokens(value: string): string[] {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !GENERIC_IDENTITY_TOKENS.has(token));
}

const CITY_ALIASES: Record<string, string[]> = {
  bengaluru: ['bengaluru', 'bangalore'],
  bangalore: ['bengaluru', 'bangalore'],
  gurgaon: ['gurgaon', 'gurugram'],
  gurugram: ['gurgaon', 'gurugram'],
};

function cityMatches(text: string, city: string): boolean {
  const normalizedText = normalizedPhrase(text);
  const cityKey = normalizedPhrase(city);
  return (CITY_ALIASES[cityKey] ?? [cityKey]).some((alias) => normalizedText.includes(alias));
}

function identityMatch(text: string, societyName: string): IdentityMatch {
  const haystack = normalizedPhrase(text);
  const needle = normalizedPhrase(societyName);
  if (needle && haystack.includes(needle)) return 'strong';

  const tokens = identityTokens(societyName);
  if (tokens.length === 0) return 'weak';
  const matches = tokens.filter((token) => haystack.includes(token)).length;
  const coverage = matches / tokens.length;

  if (coverage >= 0.8 && matches >= Math.min(2, tokens.length)) return 'strong';
  if (coverage >= 0.55 && matches >= Math.min(2, tokens.length)) return 'moderate';
  return 'weak';
}

function determineScope(
  text: string,
  societyName: string,
  city: string,
  locality: string | null
): { scope: EvidenceScope; identityMatch: IdentityMatch } {
  const baseMatch = identityMatch(text, societyName);
  const normalizedText = normalizedPhrase(text);
  const cityConfirmed = cityMatches(text, city);
  const localityConfirmed = locality ? normalizedText.includes(normalizedPhrase(locality)) : false;
  // A same-named project in another city must not become a strong identity
  // match merely because its project name appears in a result.
  const match: IdentityMatch =
    baseMatch === 'strong' && !cityConfirmed && !localityConfirmed ? 'moderate' : baseMatch;
  if (match !== 'weak') return { scope: 'society', identityMatch: match };

  const normalizedLocality = locality ? normalizedPhrase(locality) : '';
  if (normalizedLocality && normalizedText.includes(normalizedLocality)) {
    return { scope: 'locality', identityMatch: 'weak' };
  }

  return { scope: 'city', identityMatch: 'weak' };
}

export function trustworthyExternalUrl(value: unknown): string | null {
  const raw = stringValue(value);
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    if (hostname === 'serpapi.com' || hostname.endsWith('.serpapi.com')) return null;
    if (parsed.searchParams.has('api_key')) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/** Place photos are display-only. Provider-internal and credential-bearing
 * URLs are not exposed to the browser. */
function trustworthyPlaceImageUrl(value: unknown): string | null {
  const raw = stringValue(value);
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.searchParams.has('api_key')) {
      return null;
    }
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    if (hostname === 'serpapi.com' || hostname.endsWith('.serpapi.com')) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function domainForUrl(url: string | null): string {
  if (!url) return 'unknown';
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

function domainMatches(domain: string, candidate: string): boolean {
  return domain === candidate || domain.endsWith(`.${candidate}`);
}

export function classifySourceQuality(domain: string, platform: EvidencePlatform): SourceQuality {
  const normalized = domain.toLowerCase();
  if (
    PRIMARY_EXACT_DOMAINS.has(normalized) ||
    PRIMARY_DOMAIN_SUFFIXES.some((suffix) => normalized.endsWith(suffix))
  ) {
    return 'primary';
  }
  if (MAJOR_PUBLICATION_DOMAINS.some((candidate) => domainMatches(normalized, candidate))) {
    return 'major_publication';
  }
  if (platform === 'reddit' || platform === 'google_maps') return 'community';
  return 'general_web';
}

function platformForDomain(domain: string): EvidencePlatform {
  if (domainMatches(domain, 'reddit.com')) return 'reddit';
  if (domainMatches(domain, 'google.com') && domain.includes('maps')) return 'google_maps';
  if (
    PRIMARY_EXACT_DOMAINS.has(domain) ||
    PRIMARY_DOMAIN_SUFFIXES.some((suffix) => domain.endsWith(suffix))
  ) {
    return 'government';
  }
  if (MAJOR_PUBLICATION_DOMAINS.some((candidate) => domainMatches(domain, candidate))) {
    return 'news_site';
  }
  return 'web';
}

function evidenceId(parts: Array<string | null | number>): string {
  return `ev-${createHash('sha256')
    .update(parts.map((part) => String(part ?? '')).join('|'))
    .digest('hex')
    .slice(0, 16)}`;
}

function searchId(payload: UnknownRecord): string | null {
  const metadata = nestedRecord(payload, 'search_metadata');
  return metadata ? stringValue(metadata.id) : null;
}

function sourceName(record: UnknownRecord): string | null {
  const source = record.source;
  if (typeof source === 'string') return source.trim() || null;
  if (isRecord(source)) return firstString(source, ['name', 'title']);
  return firstString(record, ['publisher', 'displayed_link']);
}

function relevanceForRecord(
  text: string,
  match: IdentityMatch,
  scope: EvidenceScope
): ReturnType<typeof assessTenantRelevance> {
  const assessed = assessTenantRelevance(text);
  const identityWeight = match === 'strong' ? 1 : match === 'moderate' ? 0.7 : 0.25;
  const scopeWeight = scope === 'society' ? 1 : scope === 'locality' ? 0.7 : 0.3;
  const relevanceScore = Number(
    Math.max(
      0,
      Math.min(1, assessed.relevanceScore * 0.65 + identityWeight * 0.2 + scopeWeight * 0.15)
    ).toFixed(2)
  );
  return { ...assessed, relevanceScore };
}

function inclusionDecision(
  type: EvidenceType,
  scope: EvidenceScope,
  match: IdentityMatch,
  tenantRelevant: boolean,
  relevanceScore: number,
  quality: SourceQuality
): boolean {
  if (!tenantRelevant || relevanceScore < 0.45) return false;

  if (scope === 'society') {
    if (match === 'weak') return false;

    // Primary publications, major news sources, Reddit and Maps reviews remain
    // eligible under the existing rules. We also allow a *strongly matched*
    // general-web result when its tenant relevance is high. This restores useful
    // resident/community evidence that was being discarded solely because the
    // domain was not on a small publication allow-list, while still rejecting
    // moderate/weak identity matches and low-relevance pages.
    if (quality !== 'general_web') return true;
    return match === 'strong' && relevanceScore >= 0.7;
  }

  if ((scope === 'locality' || scope === 'city') && ['news', 'civic', 'web'].includes(type)) {
    return quality === 'primary' || quality === 'major_publication';
  }
  return false;
}

function parseLocality(address: string | null, city: string, societyName: string): string | null {
  if (!address) return null;
  const cityPhrase = normalizedPhrase(city);
  const societyPhrase = normalizedPhrase(societyName);
  const pieces = address
    .split(',')
    .map((piece) => piece.trim())
    .filter(Boolean);
  const cityIndex = pieces.findIndex((piece) => normalizedPhrase(piece).includes(cityPhrase));
  const beforeCity =
    cityIndex > 0 ? pieces.slice(0, cityIndex).reverse() : pieces.slice().reverse();

  return (
    beforeCity.find((piece) => {
      const normalized = normalizedPhrase(piece);
      return (
        normalized.length >= 3 &&
        !normalized.includes(societyPhrase) &&
        !/\b(india|road|street|highway|karnataka|maharashtra|haryana|delhi)\b/i.test(piece) &&
        !/\b\d{5,6}\b/.test(piece)
      );
    }) ?? null
  );
}

function rawMapsCandidates(payload: UnknownRecord): UnknownRecord[] {
  const local = records(payload.local_results);
  const place = isRecord(payload.place_results) ? [payload.place_results] : [];
  return [...local, ...place];
}

function mapsCandidateScore(
  candidate: UnknownRecord,
  societyName: string,
  city: string
): { score: number; identity: IdentityMatch; cityCompatible: boolean; residential: boolean } {
  const title = firstString(candidate, ['title', 'name']) ?? '';
  const address = firstString(candidate, ['address', 'full_address']) ?? '';
  const typeText = [
    firstString(candidate, ['type', 'category']) ?? '',
    Array.isArray(candidate.types) ? candidate.types.join(' ') : '',
  ].join(' ');
  const identity = identityMatch(title, societyName);
  const exactName = normalizedPhrase(title) === normalizedPhrase(societyName);
  const cityCompatible = cityMatches(`${title} ${address}`, city);
  const residential =
    /\b(apartment|condominium|housing|residential|gated community|society)\b/i.test(
      `${typeText} ${title}`
    );
  const identityScore = identity === 'strong' ? 1 : identity === 'moderate' ? 0.65 : 0.15;
  const score =
    identityScore * 0.62 +
    (cityCompatible ? 0.2 : 0) +
    (residential ? 0.08 : 0) +
    (exactName ? 0.1 : 0);
  return { score, identity, cityCompatible, residential };
}

export function resolveMapsResult(
  payload: UnknownRecord,
  societyName: string,
  city: string,
  confirmedIdentifier?: string | null
): MapsResolution {
  const seenCandidateIds = new Set<string>();
  const candidates = rawMapsCandidates(payload)
    .filter((candidate) => Boolean(firstString(candidate, ['title', 'name'])))
    .filter((candidate) => {
      const identifier = firstString(candidate, ['data_id', 'place_id']);
      const contentKey = normalizedPhrase(
        `${firstString(candidate, ['title', 'name']) ?? ''} ${firstString(candidate, ['address', 'full_address']) ?? ''}`
      );
      if ((identifier && seenCandidateIds.has(identifier)) || seenCandidateIds.has(contentKey)) return false;
      if (identifier) seenCandidateIds.add(identifier);
      seenCandidateIds.add(contentKey);
      return true;
    })
    .map((candidate, index) => ({
      candidate,
      index,
      ...mapsCandidateScore(candidate, societyName, city),
    }))
    .sort((a, b) => b.score - a.score);

  const toPlace = (raw: UnknownRecord): ResolvedPlace | null => {
    const title = firstString(raw, ['title', 'name']);
    if (!title) return null;
    const address = firstString(raw, ['address', 'full_address']);
    const gps = nestedRecord(raw, 'gps_coordinates');
    return {
      title,
      address,
      locality: parseLocality(address, city, title),
      placeId: firstString(raw, ['place_id']),
      dataId: firstString(raw, ['data_id']),
      latitude: gps ? numberValue(gps.latitude) : null,
      longitude: gps ? numberValue(gps.longitude) : null,
      sourceDestinationUrl: trustworthyExternalUrl(firstString(raw, ['link', 'maps_url'])),
      imageUrl: trustworthyPlaceImageUrl(firstString(raw, ['serpapi_thumbnail', 'thumbnail', 'image'])),
      rating: numberValue(raw.rating),
      reviewCount: numberValue(raw.reviews) ?? numberValue(raw.reviews_count),
    };
  };
  const publicCandidates: PropertyResolutionCandidate[] = candidates.slice(0, 3).flatMap((entry) => {
    const place = toPlace(entry.candidate);
    return place ? [{
      ...place,
      identityMatch: entry.identity,
      cityMatch: entry.cityCompatible,
      matchReason: `${entry.identity === 'strong' ? 'Strong' : entry.identity === 'moderate' ? 'Partial' : 'Weak'} name match${entry.cityCompatible ? ' in the requested city' : '; city not confirmed'}.`,
    }] : [];
  });

  const confirmed = confirmedIdentifier
    ? candidates.find(({ candidate }) =>
        [firstString(candidate, ['data_id']), firstString(candidate, ['place_id'])].includes(confirmedIdentifier)
      )
    : null;
  if (confirmed?.cityCompatible) {
    const selectedPlace = toPlace(confirmed.candidate);
    if (selectedPlace) {
      return {
        state: 'resolved',
        confidence: confirmed.identity === 'strong' ? 'high' : 'moderate',
        selectedPlace,
        candidates: publicCandidates,
        competingCandidates: 0,
        reasons: ['The user explicitly confirmed this Maps candidate.', 'Address matches the requested city.'],
      };
    }
  }

  const best = candidates[0];
  if (!best || best.score < 0.25) {
    return {
      state: 'not_found',
      confidence: 'none',
      selectedPlace: null,
      candidates: publicCandidates,
      competingCandidates: 0,
      reasons: ['No compatible Google Maps candidate was returned.'],
    };
  }

  const raw = best.candidate;
  const title = firstString(raw, ['title', 'name']);
  if (!title) {
    return {
      state: 'not_found',
      confidence: 'none',
      selectedPlace: null,
      candidates: publicCandidates,
      competingCandidates: 0,
      reasons: ['The Maps candidate did not include a source title.'],
    };
  }
  const placeId = firstString(raw, ['place_id']);
  const dataId = firstString(raw, ['data_id']);
  const closeCompetitors = candidates.filter(
    (candidate, index) =>
      index > 0 &&
      best.score - candidate.score <= 0.08 &&
      candidate.cityCompatible &&
      normalizedPhrase(firstString(candidate.candidate, ['title', 'name']) ?? '') !== normalizedPhrase(title)
  ).length;
  const hasReviewIdentifier = Boolean(dataId || placeId);
  const requestedIdentityTokens = new Set(strictIdentityTokens(societyName));
  const titleIdentityTokens = new Set(strictIdentityTokens(title));
  const materialNameMatch =
    Array.from(requestedIdentityTokens).every((token) => titleIdentityTokens.has(token)) &&
    Array.from(titleIdentityTokens).every((token) => requestedIdentityTokens.has(token));

  let confidence: MapsResolution['confidence'] = 'low';
  if (
    best.identity === 'strong' &&
    materialNameMatch &&
    best.cityCompatible &&
    hasReviewIdentifier &&
    closeCompetitors === 0 &&
    best.score >= 0.82
  ) {
    confidence = 'high';
  } else if (best.identity !== 'weak' && best.cityCompatible && best.score >= 0.6) {
    confidence = 'moderate';
  }

  const reasons = [
    `Society identity match: ${best.identity}.`,
    best.cityCompatible
      ? 'Address matches the requested city.'
      : 'Address does not confirm the city.',
    closeCompetitors > 0
      ? `${closeCompetitors} similarly ranked Maps candidate(s) were found.`
      : 'No similarly ranked Maps candidate was found.',
  ];

  return {
    state: confidence === 'high' ? 'resolved' : 'needs_confirmation',
    confidence,
    selectedPlace: confidence === 'high' ? toPlace(raw) : null,
    candidates: publicCandidates,
    competingCandidates: closeCompetitors,
    reasons,
  };
}

function commonEvidenceFields(
  raw: UnknownRecord,
  context: NormalizationContext,
  options: {
    engine: SerpEngine;
    queryId: SearchQueryId;
    payloadSearchId: string | null;
    position: number;
    type: EvidenceType;
    platform: EvidencePlatform;
    sourceUrl: string | null;
    sourceDestinationUrl?: string | null;
    title: string;
    snippet: string;
    forceSocietyIdentity?: boolean;
    forceContextScope?: 'locality' | 'city';
  }
): EvidenceRecord {
  const combinedText = `${options.title} ${options.snippet}`;
  const resolvedScope = options.forceSocietyIdentity
    ? ({ scope: 'society', identityMatch: 'strong' } as const)
    : determineScope(
        combinedText,
        context.societyName,
        context.city,
        context.resolvedPlace?.locality ?? null
      );
  const { scope: inferredScope, identityMatch: inferredMatch } = resolvedScope;
  const areaText = normalizedPhrase(combinedText);
  const areaName = normalizedPhrase(context.societyName);
  const areaCityMatches = cityMatches(combinedText, context.city);
  const isVerifiedAreaRecord =
    context.subjectType === 'residential_area' &&
    Boolean(areaName) &&
    areaText.includes(areaName) &&
    areaCityMatches;
  const scope = options.forceContextScope ?? (context.subjectType === 'residential_area' ? (isVerifiedAreaRecord ? 'locality' : 'city') : inferredScope);
  const match = options.forceContextScope ? 'weak' : context.subjectType === 'residential_area' ? (isVerifiedAreaRecord ? 'strong' : 'weak') : inferredMatch;
  const assessed = relevanceForRecord(combinedText, match, scope);
  const domain = domainForUrl(options.sourceUrl ?? options.sourceDestinationUrl ?? null);
  const quality = classifySourceQuality(domain, options.platform);
  const standardInclusion = inclusionDecision(
    options.type,
    scope,
    match,
    assessed.tenantRelevant,
    assessed.relevanceScore,
    quality
  );
  const areaCommunityInclusion =
    context.subjectType === 'residential_area' &&
    isVerifiedAreaRecord &&
    options.type === 'community' &&
    quality === 'community' &&
    assessed.tenantRelevant &&
    assessed.relevanceScore >= 0.45;
  const includedInAnalysis = (standardInclusion || areaCommunityInclusion) && !isExcludedContextDomain(domain);
  const dateLabel = firstString(raw, ['date', 'published_at', 'date_utc']);
  const exactDate = firstString(raw, ['iso_date', 'extracted_date', 'published_at']);
  const gps = context.resolvedPlace;

  return {
    id: evidenceId([options.queryId, options.sourceUrl, options.title, options.position]),
    type: options.type,
    platform: options.platform,
    sourceUrl: options.sourceUrl,
    sourceDestinationUrl: options.sourceDestinationUrl ?? null,
    sourceDomain: domain,
    sourceName: sourceName(raw),
    title: options.title,
    snippet: options.snippet,
    date: exactDate ?? dateLabel,
    dateLabel,
    author: firstString(raw, ['author', 'user_name', 'reviewer_name']),
    rating: numberValue(raw.rating),
    scope,
    identityMatch: match,
    relevanceScore: assessed.relevanceScore,
    sourceQuality: quality,
    topics: assessed.topics,
    tenantRelevant: assessed.tenantRelevant,
    includedInAnalysis,
    retrievedAt: context.retrievedAt,
    provenance: {
      engine: options.engine,
      searchId: options.payloadSearchId,
      queryId: options.queryId,
      resultPosition: numberValue(raw.position) ?? options.position + 1,
      reviewId: firstString(raw, ['review_id']),
      placeId: context.resolvedPlace?.placeId ?? null,
      dataId: context.resolvedPlace?.dataId ?? null,
    },
    location: {
      requestedSociety: context.societyName,
      requestedCity: context.city,
      resolvedSociety: context.resolvedPlace?.title ?? null,
      locality: context.resolvedPlace?.locality ?? null,
      address: context.resolvedPlace?.address ?? null,
      latitude: gps?.latitude ?? null,
      longitude: gps?.longitude ?? null,
    },
  };
}

export function normalizeCommunityResults(
  payload: UnknownRecord,
  context: NormalizationContext
): EvidenceRecord[] {
  const id = searchId(payload);
  return records(payload.organic_results).flatMap((raw, index) => {
    const title = firstString(raw, ['title']);
    const snippet = firstString(raw, ['snippet', 'description']);
    if (!title || !snippet) return [];
    const sourceUrl = trustworthyExternalUrl(raw.link);
    const domain = domainForUrl(sourceUrl);
    const platform = platformForDomain(domain);
    const type: EvidenceType =
      platform === 'reddit' ? 'community' : platform === 'government' ? 'civic' : 'web';

    return [
      commonEvidenceFields(raw, context, {
        engine: 'google',
        queryId: 'community',
        payloadSearchId: id,
        position: index,
        type,
        platform,
        sourceUrl,
        title,
        snippet,
      }),
    ];
  });
}

export function normalizeAssistantSearchResults(
  payload: UnknownRecord,
  context: NormalizationContext
): EvidenceRecord[] {
  return normalizeCommunityResults(payload, context).map((record) => ({
    ...record,
    id: evidenceId(['assistant_search', record.sourceUrl, record.title]),
    provenance: { ...record.provenance, queryId: 'assistant_search' },
  }));
}

export function normalizeNewsResults(
  payload: UnknownRecord,
  context: NormalizationContext
): EvidenceRecord[] {
  return normalizeNewsResultsWithDiagnostics(payload, context).records;
}

export interface NewsNormalizationDiagnostics {
  rawCount: number;
  normalizedCount: number;
  rejectedCount: number;
  rejectedByReason: Record<string, number>;
}

export function normalizeNewsResultsWithDiagnostics(
  payload: UnknownRecord,
  context: NormalizationContext
): { records: EvidenceRecord[]; diagnostics: NewsNormalizationDiagnostics } {
  const id = searchId(payload);
  const news = [...records(payload.news_results), ...records(payload.top_stories)];
  const rejectedByReason: Record<string, number> = {};
  const normalized = news.flatMap((raw, index) => {
    const title = firstString(raw, ['title']);
    const snippet = firstString(raw, ['snippet', 'description']);
    if (!title) {
      rejectedByReason.missing_title = (rejectedByReason.missing_title ?? 0) + 1;
      return [];
    }
    if (!snippet) {
      rejectedByReason.missing_snippet = (rejectedByReason.missing_snippet ?? 0) + 1;
      return [];
    }
    const sourceUrl = trustworthyExternalUrl(raw.link);
    const domain = domainForUrl(sourceUrl);
    const platform = platformForDomain(domain);
    const type: EvidenceType = platform === 'government' ? 'civic' : 'news';

    return [
      commonEvidenceFields(raw, context, {
        engine: 'google',
        queryId: 'news',
        payloadSearchId: id,
        position: index,
        type,
        platform: platform === 'web' ? 'news_site' : platform,
        sourceUrl,
        title,
        snippet,
      }),
    ];
  });

  return {
    records: normalized,
    diagnostics: {
      rawCount: news.length,
      normalizedCount: normalized.length,
      rejectedCount: news.length - normalized.length,
      rejectedByReason,
    },
  };
}

export function normalizeCivicContextResults(
  payload: UnknownRecord,
  context: NormalizationContext,
  scope: 'locality' | 'city'
): EvidenceRecord[] {
  const id = searchId(payload);
  return records(payload.organic_results).flatMap((raw, index) => {
    const title = firstString(raw, ['title']);
    const snippet = firstString(raw, ['snippet', 'description']);
    if (!title || !snippet) return [];
    const sourceUrl = trustworthyExternalUrl(raw.link);
    const domain = domainForUrl(sourceUrl);
    const platform = platformForDomain(domain);

    const normalized = commonEvidenceFields(raw, context, {
        engine: 'google',
        queryId: 'civic_context',
        payloadSearchId: id,
        position: index,
        type: platform === 'government' ? 'civic' : 'web',
        platform,
        sourceUrl,
        title,
        snippet,
        forceContextScope: scope,
      });
    return isEligibleLocalityEvidence(normalized) ? [normalized] : [];
  });
}

function reviewUser(raw: UnknownRecord): UnknownRecord | null {
  return isRecord(raw.user) ? raw.user : null;
}

export function normalizeMapsReviews(
  payload: UnknownRecord,
  context: NormalizationContext
): EvidenceRecord[] {
  const id = searchId(payload);
  const normalized = records(payload.reviews).flatMap((raw, index) => {
    const snippet = firstString(raw, ['snippet', 'text', 'review']);
    if (!snippet) return [];
    const user = reviewUser(raw);
    const author = user ? firstString(user, ['name']) : firstString(raw, ['author', 'user_name']);
    const augmented = { ...raw, author };
    const sourceUrl = trustworthyExternalUrl(firstString(raw, ['link', 'review_link']));

    return [
      commonEvidenceFields(augmented, context, {
        engine: 'google_maps_reviews',
        queryId: 'maps_reviews',
        payloadSearchId: id,
        position: index,
        type: 'google_review',
        platform: 'google_maps',
        sourceUrl,
        sourceDestinationUrl: context.resolvedPlace?.sourceDestinationUrl ?? null,
        title: firstString(raw, ['title']) ?? 'Google Maps review',
        snippet,
        forceSocietyIdentity: true,
      }),
    ];
  });

  const topicCounts = new Map<string, number>();
  return normalized.map((record) => {
    if (!record.includedInAnalysis) return record;
    const primaryTopic = record.topics.find((topic) => topic !== 'other') ?? 'other';
    const count = topicCounts.get(primaryTopic) ?? 0;
    topicCounts.set(primaryTopic, count + 1);
    return count >= 3 ? { ...record, includedInAnalysis: false } : record;
  });
}

function canonicalDedupeKey(record: EvidenceRecord): string {
  if (record.sourceUrl) {
    try {
      const parsed = new URL(record.sourceUrl);
      return `${parsed.hostname.toLowerCase()}${parsed.pathname.replace(/\/$/, '')}`;
    } catch {
      // Fall through to content identity.
    }
  }
  return normalizedPhrase(`${record.title} ${record.snippet.slice(0, 160)}`);
}

export function deduplicateEvidence(recordsToDedupe: EvidenceRecord[]): EvidenceRecord[] {
  const seen = new Map<string, EvidenceRecord>();
  for (const record of recordsToDedupe) {
    const key = canonicalDedupeKey(record);
    const existing = seen.get(key);
    if (!existing || record.relevanceScore > existing.relevanceScore) seen.set(key, record);
  }
  return Array.from(seen.values());
}
