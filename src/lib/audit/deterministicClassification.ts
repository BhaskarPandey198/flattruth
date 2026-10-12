import { categoriesForTopics } from '../evidence/tenantRelevance';
import type {
  EvidenceDossier,
  EvidenceRecord,
  EvidenceScope,
  FindingSeverity,
  GeminiGroundedClassification,
  RiskCategory,
} from '../evidence/types';

const CONCERN_TERMS: Record<RiskCategory, RegExp> = {
  water:
    /\b(shortage|scarcity|tanker|no water|water supply (?:cut|disruption)|low pressure|sewage|disconnection)\b/i,
  civic:
    /\b(flooding|waterlogging|congestion|blocked road|pothole|sewage overflow|construction disruption|traffic jam)\b/i,
  deposit:
    /\b(deduction|withheld|deposit dispute|refund delay|repainting charge|deposit refund)\b/i,
  rwa:
    /\b(visitor restriction|bachelor restriction|move-in charge|parking restriction|access restriction|society rule|rwa rule)\b/i,
};

const HIGH_CONCERN_TERMS =
  /\b(no water|sewage overflow|disconnection|severe flooding|deposit withheld|blocked road)\b/i;

const QUALITY_WEIGHT = {
  primary: 1,
  major_publication: 0.9,
  community: 0.7,
  general_web: 0.45,
} as const;
const SCOPE_WEIGHT = { society: 1, locality: 0.55, city: 0.25 } as const;
const IDENTITY_WEIGHT = { strong: 1, moderate: 0.7, weak: 0.25 } as const;

function weakestScope(records: EvidenceRecord[]): EvidenceScope {
  if (records.some((record) => record.scope === 'city')) return 'city';
  if (records.some((record) => record.scope === 'locality')) return 'locality';
  return 'society';
}

function recordWeight(record: EvidenceRecord): number {
  return (
    QUALITY_WEIGHT[record.sourceQuality] *
    SCOPE_WEIGHT[record.scope] *
    IDENTITY_WEIGHT[record.identityMatch] *
    record.relevanceScore
  );
}

function severityFor(records: EvidenceRecord[]): FindingSeverity {
  const combined = records.map((record) => `${record.title} ${record.snippet}`).join(' ');
  const support = records.reduce((sum, record) => sum + recordWeight(record), 0);
  if (HIGH_CONCERN_TERMS.test(combined) && support >= 1.2) return 'high';
  if (records.length >= 2 || support >= 0.85) return 'moderate';
  return 'low';
}

/**
 * Conservative outage fallback. It extracts only explicit concern language
 * from records that already passed normalization and inclusion rules.
 */
export function classifyEvidenceDeterministically(
  dossier: EvidenceDossier,
  analysisAttempts: number
): GeminiGroundedClassification {
  const eligible = dossier.evidence.filter(
    (record) => record.includedInAnalysis && record.tenantRelevant
  );
  const categories: RiskCategory[] = ['water', 'deposit', 'civic', 'rwa'];
  const findings = categories.flatMap((category, index) => {
    const matching = eligible
      .filter((record) => categoriesForTopics(record.topics).includes(category))
      .filter((record) => CONCERN_TERMS[category].test(`${record.title} ${record.snippet}`))
      .sort((a, b) => recordWeight(b) - recordWeight(a))
      .slice(0, 3);
    if (matching.length === 0) return [];

    const strongest = matching[0];
    return [
      {
        id: `fallback-finding-${index + 1}`,
        category,
        severity: severityFor(matching),
        scope: weakestScope(matching),
        title: `${category.charAt(0).toUpperCase()}${category.slice(1)} risk signal`,
        summary: `A retrieved source reports: ${strongest.snippet.slice(0, 500)}`,
        evidenceIds: matching.map((record) => record.id),
      },
    ];
  });

  return {
    status: findings.length > 0 ? 'classified' : 'insufficient_evidence',
    summary:
      findings.length > 0
        ? 'This assessment is based on explicit concern language in the retrieved public sources.'
        : 'The available public sources did not provide enough direct evidence for a risk finding.',
    findings,
    insufficientCategories: categories.filter(
      (category) => !findings.some((finding) => finding.category === category)
    ),
    analysisAttempts,
    analysisOrigin: findings.length > 0 ? 'deterministic_fallback' : 'none',
    modelUsed: null,
  };
}
