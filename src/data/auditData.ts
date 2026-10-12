import type {
  AssistantCitation,
  AuditResponseData,
  DashboardCategory,
  DashboardGoogleReview,
  DashboardLeaseDiscussionPoint,
  DashboardNewsSignal,
  DashboardRedFlag,
  DashboardRedditSignal,
  EvidenceRecord,
  EvidenceScope,
  LocationConfidence,
  RiskLevel,
  SourceQuality,
} from '@/lib/evidence/types';

export type {
  AssistantCitation,
  EvidenceRecord,
  EvidenceScope,
  LocationConfidence,
  RiskLevel,
  SourceQuality,
};

export type CategoryScore = DashboardCategory;
export type RedFlag = DashboardRedFlag;
export type RedditSignal = DashboardRedditSignal;
export type GoogleReview = DashboardGoogleReview;
export type NewsSignal = DashboardNewsSignal;

export type LeaseClause = DashboardLeaseDiscussionPoint;

/** The UI renders the exact validated server response contract. */
export type SocietyAuditData = AuditResponseData;

export const CITIES = [
  { id: 'pune', label: 'Pune' },
  { id: 'bengaluru', label: 'Bengaluru' },
  { id: 'gurgaon', label: 'Gurgaon' },
  { id: 'mumbai', label: 'Mumbai' },
  { id: 'delhi', label: 'Delhi' },
] as const;
