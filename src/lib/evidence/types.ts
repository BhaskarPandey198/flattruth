export const AUDIT_SCHEMA_VERSION = 'v8';

export type EvidenceType = 'google_review' | 'community' | 'news' | 'civic' | 'web';

export type EvidencePlatform = 'google_maps' | 'reddit' | 'government' | 'news_site' | 'web';

export type EvidenceScope = 'society' | 'locality' | 'city';
export type IdentityMatch = 'strong' | 'moderate' | 'weak';
export type SourceQuality = 'primary' | 'major_publication' | 'community' | 'general_web';

export type EvidenceTopic =
  | 'water'
  | 'deposit'
  | 'maintenance'
  | 'power'
  | 'lift'
  | 'noise'
  | 'traffic'
  | 'flooding'
  | 'civic'
  | 'rwa'
  | 'security'
  | 'visitor'
  | 'delivery'
  | 'parking'
  | 'other';

export type SerpEngine = 'google_maps' | 'google_maps_reviews' | 'google' | 'google_news';

export type SearchQueryId =
  | 'maps'
  | 'maps_reviews'
  | 'community'
  | 'news'
  | 'civic_context'
  | 'assistant_search';

export interface EvidenceRecord {
  id: string;
  type: EvidenceType;
  platform: EvidencePlatform;

  /** A direct URL to this exact record/article when SerpApi supplied one. */
  sourceUrl: string | null;
  /** A place or publisher destination, kept distinct from the record URL. */
  sourceDestinationUrl: string | null;
  sourceDomain: string;
  sourceName: string | null;

  title: string;
  snippet: string;
  date: string | null;
  dateLabel: string | null;
  author: string | null;
  rating: number | null;

  scope: EvidenceScope;
  identityMatch: IdentityMatch;
  /** Deterministic 0..1 score assigned by server-owned matching rules. */
  relevanceScore: number;
  sourceQuality: SourceQuality;
  topics: EvidenceTopic[];

  tenantRelevant: boolean;
  includedInAnalysis: boolean;
  retrievedAt: string;

  provenance: {
    engine: SerpEngine;
    searchId: string | null;
    queryId: SearchQueryId;
    resultPosition: number | null;
    reviewId: string | null;
    placeId: string | null;
    dataId: string | null;
  };

  location: {
    requestedSociety: string;
    requestedCity: string;
    resolvedSociety: string | null;
    locality: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}

export interface ResolvedPlace {
  title: string;
  address: string | null;
  locality: string | null;
  placeId: string | null;
  dataId: string | null;
  latitude: number | null;
  longitude: number | null;
  sourceDestinationUrl: string | null;
  imageUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
}

export type MapsConfidence = 'high' | 'moderate' | 'low' | 'none';
export type LocationConfidence = 'high' | 'moderate' | 'low';
export type AuditConfidence = 'low' | 'moderate' | 'high';
export type PropertyResolutionState = 'resolved' | 'needs_confirmation' | 'not_found';
export type AuditSubjectType = 'society' | 'residential_area';

export interface PropertyResolutionCandidate extends ResolvedPlace {
  matchReason: string;
  identityMatch: IdentityMatch;
  cityMatch: boolean;
}

export interface MapsResolution {
  state: PropertyResolutionState;
  confidence: MapsConfidence;
  selectedPlace: ResolvedPlace | null;
  candidates: PropertyResolutionCandidate[];
  competingCandidates: number;
  reasons: string[];
}

export interface EvidenceDossier {
  schemaVersion: typeof AUDIT_SCHEMA_VERSION;
  auditId: string;
  cacheKey: string;
  query: {
    societyName: string;
    city: string;
  };
  subjectType: AuditSubjectType;
  resolvedPlace: ResolvedPlace | null;
  resolutionState: PropertyResolutionState;
  mapsConfidence: MapsConfidence;
  locationConfidence: LocationConfidence;
  evidenceStatus: 'sufficient' | 'insufficient_evidence';
  insufficiencyReasons: string[];
  evidence: EvidenceRecord[];
  retrievedAt: string;
  expiresAt: string;
  searchesPerformed: SearchQueryId[];
  /** Attempted searches that failed; any such dossier must not be cached. */
  retrievalWarnings: SearchQueryId[];
}

export type RiskCategory = 'water' | 'deposit' | 'civic' | 'rwa';
export type FindingSeverity = 'low' | 'moderate' | 'high';
export type RiskLevel = FindingSeverity | 'insufficient_evidence';

export interface ClassifiedFinding {
  id: string;
  category: RiskCategory;
  severity: FindingSeverity;
  scope: EvidenceScope;
  title: string;
  summary: string;
  evidenceIds: string[];
}

export interface GeminiGroundedClassification {
  status: 'classified' | 'insufficient_evidence';
  summary: string;
  findings: ClassifiedFinding[];
  insufficientCategories: RiskCategory[];
  analysisAttempts: number;
  analysisOrigin: 'gemini_grounded' | 'deterministic_fallback' | 'none';
  modelUsed: string | null;
}

export interface DashboardLeaseDiscussionPoint {
  id: string;
  clauseNumber: string;
  title: string;
  body: string;
  riskAddressed: string;
  priority: 'must-have' | 'recommended' | 'negotiable';
  kind: 'evidence_triggered' | 'baseline';
  evidenceIds: string[];
}

export interface PropertySnapshot {
  imageUrl: string | null;
  imageLabel: 'Google Maps place photo' | 'Property location';
  resolvedName: string;
  address: string | null;
  rating: number | null;
  reviewCount: number | null;
  sourceUrl: string | null;
}

export interface CategoryRiskResult {
  category: RiskCategory;
  score: number | null;
  severity: RiskLevel;
  evidenceIds: string[];
  scope: EvidenceScope | null;
  summary: string;
}

export interface DeterministicRiskResult {
  status: 'scored' | 'insufficient_evidence';
  overallRiskScore: number | null;
  riskLevel: RiskLevel;
  categories: CategoryRiskResult[];
  auditConfidence: AuditConfidence;
  evidenceCoverage: number;
  scoredCategoryCount: number;
  sourceFamilyCount: number;
  societyEvidenceCount: number;
  contextEvidenceCount: number;
  scoreState: 'full' | 'preliminary' | 'none';
}

export interface DashboardCategory {
  id: string;
  label: string;
  score: number | null;
  maxScore: 100;
  level: RiskLevel;
  headline: string;
  detail: string;
  icon: string;
  evidenceIds: string[];
  scope: EvidenceScope | null;
}

export interface DashboardRedFlag {
  id: string;
  tag: string;
  tagLevel: FindingSeverity;
  title: string;
  body: string;
  reportedBy: string;
  date: string | null;
  evidenceIds: string[];
  scope: EvidenceScope;
}

export interface DashboardRedditSignal {
  id: string;
  evidenceId: string;
  title: string;
  subreddit: string;
  excerpt: string;
  upvotes: number | null;
  comments: number | null;
  date: string | null;
  url: string | null;
  sentiment: RiskLevel;
  keywords: string[];
  sourceDomain: string;
  scope: EvidenceScope;
  sourceQuality: SourceQuality;
  includedInAnalysis: boolean;
}

export interface DashboardGoogleReview {
  id: string;
  evidenceId: string;
  reviewer: string | null;
  rating: number | null;
  excerpt: string;
  date: string | null;
  keywords: string[];
  sentiment: RiskLevel;
  tenure: string | null;
  url: string | null;
  sourceDestinationUrl: string | null;
  sourceDomain: string;
  scope: EvidenceScope;
  sourceQuality: SourceQuality;
  includedInAnalysis: boolean;
}

export interface DashboardNewsSignal {
  id: string;
  evidenceId: string;
  headline: string;
  source: string;
  sourceType: 'civic' | 'news' | 'web';
  excerpt: string;
  date: string | null;
  url: string | null;
  relevanceTags: string[];
  sourceDomain: string;
  scope: EvidenceScope;
  sourceQuality: SourceQuality;
  includedInAnalysis: boolean;
}

export interface AuditResponseData {
  schemaVersion: typeof AUDIT_SCHEMA_VERSION;
  auditId: string;
  societyId: string;
  resolutionState: 'resolved';
  subjectType: AuditSubjectType;
  auditStatus: 'complete' | 'partial' | 'no_reliable_evidence';
  evidenceStatus: 'sufficient' | 'insufficient_evidence';
  societyName: string;
  locality: string | null;
  city: string;
  municipalWard: string | null;
  pincode: string | null;
  builder: string | null;
  completionYear: number | null;
  totalUnits: number | null;
  tenantRiskIndex: number | null;
  riskLevel: RiskLevel;
  auditConfidence: AuditConfidence;
  evidenceCoverage: number;
  riskSummary: string;
  signalCounts: {
    googleReviews: number;
    redditThreads: number;
    newsMentions: number;
    twitterPosts: 0;
    totalRetrieved: number;
    usedInAnalysis: number;
    societySpecific: number;
    localityOrCity: number;
    filteredOut: number;
  };
  lastAuditedAt: string;
  retrievedAt: string;
  expiresAt: string;
  locationConfidence: LocationConfidence;
  insufficiencyReasons: string[];
  retrievalWarnings: SearchQueryId[];
  analysisAttempts: number;
  scoreOrigin: GeminiGroundedClassification['analysisOrigin'];
  modelUsed: string | null;
  scoreState: DeterministicRiskResult['scoreState'];
  propertySnapshot: PropertySnapshot;
  categories: DashboardCategory[];
  redFlags: DashboardRedFlag[];
  redditSignals: DashboardRedditSignal[];
  googleReviews: DashboardGoogleReview[];
  newsSignals: DashboardNewsSignal[];
  leaseClauses: DashboardLeaseDiscussionPoint[];
  evidence: EvidenceRecord[];
  assistantDossier: AssistantDossierFallback;
}

/**
 * Minimal normalized dossier that lets the assistant survive independent
 * Next.js route bundles during the local demo. The assistant validates every
 * field and uses this only after a server-cache miss.
 */
export interface AssistantDossierFallback {
  schemaVersion: typeof AUDIT_SCHEMA_VERSION;
  auditId: string;
  query: {
    societyName: string;
    city: string;
  };
  resolvedPlace: ResolvedPlace | null;
  locationConfidence: LocationConfidence;
  evidenceStatus: EvidenceDossier['evidenceStatus'];
  evidence: EvidenceRecord[];
  retrievedAt: string;
  expiresAt: string;
}

export interface AssistantCitation {
  evidenceId: string;
  title: string;
  sourceDomain: string;
  sourceUrl: string | null;
  scope: EvidenceScope;
}
