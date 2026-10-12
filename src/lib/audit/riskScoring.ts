import { categoriesForTopics } from '../evidence/tenantRelevance';
import type {
  AuditConfidence,
  CategoryRiskResult,
  ClassifiedFinding,
  DeterministicRiskResult,
  EvidenceRecord,
  EvidenceScope,
  FindingSeverity,
  GeminiGroundedClassification,
  LocationConfidence,
  RiskCategory,
  RiskLevel,
  SourceQuality,
} from '../evidence/types';

const CATEGORIES: RiskCategory[] = ['water', 'deposit', 'civic', 'rwa'];
const SEVERITY_SCORE: Record<FindingSeverity, number> = { low: 25, moderate: 55, high: 85 };
const QUALITY_WEIGHT: Record<SourceQuality, number> = {
  primary: 1,
  major_publication: 0.9,
  community: 0.7,
  general_web: 0.5,
};
const IDENTITY_WEIGHT = { strong: 1, moderate: 0.75, weak: 0.4 } as const;
const SCOPE_WEIGHT: Record<EvidenceScope, number> = { society: 1, locality: 0.65, city: 0.35 };

function evidenceWeight(record: EvidenceRecord): number {
  return (
    QUALITY_WEIGHT[record.sourceQuality] *
    IDENTITY_WEIGHT[record.identityMatch] *
    SCOPE_WEIGHT[record.scope] *
    record.relevanceScore
  );
}

function sourceKey(record: EvidenceRecord): string {
  return `${record.platform}:${record.sourceDomain}`;
}

function communityRecordKey(record: EvidenceRecord): string {
  return record.provenance.reviewId ?? record.sourceUrl ?? record.id;
}

function isSocietyEvidence(record: EvidenceRecord): boolean {
  return record.scope === 'society' && record.identityMatch !== 'weak';
}

function isStrongSocietyEvidence(record: EvidenceRecord): boolean {
  return record.scope === 'society' && record.identityMatch === 'strong';
}

function supportsCategory(record: EvidenceRecord, category: RiskCategory): boolean {
  return categoriesForTopics(record.topics).includes(category);
}

function categoryMeetsSupportRule(records: EvidenceRecord[], category: RiskCategory): boolean {
  const supporting = records.filter((record) => supportsCategory(record, category));
  const society = supporting.filter(isSocietyEvidence);
  const strongSociety = society.filter(isStrongSocietyEvidence);

  if (strongSociety.some((record) => record.sourceQuality === 'primary')) return true;
  if (strongSociety.some((record) => record.sourceQuality === 'major_publication')) return true;

  const mapsReview = strongSociety.some(
    (record) => record.type === 'google_review' && record.tenantRelevant && record.relevanceScore >= 0.65
  );
  const mapsCorroboration = supporting.some(
    (record) => record.type !== 'google_review' && record.includedInAnalysis
  );
  if (mapsReview && mapsCorroboration) return true;

  const independentCommunity = new Set(
    society.filter((record) => record.sourceQuality === 'community').map(communityRecordKey)
  );
  if (independentCommunity.size >= 2) return true;

  const hasContextCorroboration = supporting.some(
    (record) =>
      record.scope !== 'society' &&
      (record.sourceQuality === 'primary' || record.sourceQuality === 'major_publication')
  );
  return strongSociety.length >= 1 && hasContextCorroboration;
}

function supportForFinding(finding: ClassifiedFinding, byId: Map<string, EvidenceRecord>): number {
  const bestBySource = new Map<string, number>();
  for (const id of finding.evidenceIds) {
    const evidence = byId.get(id);
    if (!evidence?.includedInAnalysis) continue;
    const key = sourceKey(evidence);
    bestBySource.set(key, Math.max(bestBySource.get(key) ?? 0, evidenceWeight(evidence)));
  }
  return Array.from(bestBySource.values())
    .sort((a, b) => b - a)
    .slice(0, 3)
    .reduce((sum, value) => sum + value, 0);
}

function broadestScope(
  evidenceIds: string[],
  byId: Map<string, EvidenceRecord>
): EvidenceScope | null {
  const scopes = evidenceIds
    .map((id) => byId.get(id)?.scope)
    .filter((scope): scope is EvidenceScope => Boolean(scope));
  if (scopes.includes('society')) return 'society';
  if (scopes.includes('locality')) return 'locality';
  return scopes.includes('city') ? 'city' : null;
}

export function riskLevelForScore(score: number | null): RiskLevel {
  if (score === null) return 'insufficient_evidence';
  if (score <= 34) return 'low';
  if (score <= 64) return 'moderate';
  return 'high';
}

function roundRiskScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value / 5) * 5));
}

function categoryResult(
  category: RiskCategory,
  findings: ClassifiedFinding[],
  byId: Map<string, EvidenceRecord>
): { result: CategoryRiskResult; support: number } {
  const relevant = findings.filter((finding) => finding.category === category);
  const citedRecords = Array.from(
    new Map(
      relevant
        .flatMap((finding) => finding.evidenceIds)
        .map((id) => byId.get(id))
        .filter((record): record is EvidenceRecord => Boolean(record))
        .map((record) => [record.id, record] as const)
    ).values()
  );
  const societyGroundedFindings = relevant.filter((finding) =>
    finding.evidenceIds.some((id) => {
      const record = byId.get(id);
      return record ? isSocietyEvidence(record) : false;
    })
  );
  const eligible = categoryMeetsSupportRule(citedRecords, category);
  const weighted = societyGroundedFindings
    .map((finding) => ({ finding, support: supportForFinding(finding, byId) }))
    .filter(({ support }) => support > 0);

  if (!eligible || weighted.length === 0) {
    return {
      support: 0,
      result: {
        category,
        score: null,
        severity: 'insufficient_evidence',
        evidenceIds: [],
        scope: null,
        summary: 'Not enough direct evidence.',
      },
    };
  }

  const support = weighted.reduce((sum, item) => sum + item.support, 0);
  const rawScore =
    weighted.reduce((sum, item) => sum + SEVERITY_SCORE[item.finding.severity] * item.support, 0) /
    support;
  const score = roundRiskScore(rawScore);
  const evidenceIds = Array.from(new Set(weighted.flatMap(({ finding }) => finding.evidenceIds)));

  return {
    support,
    result: {
      category,
      score,
      severity: riskLevelForScore(score),
      evidenceIds,
      scope: broadestScope(evidenceIds, byId),
      summary: weighted.map(({ finding }) => finding.summary).join(' '),
    },
  };
}

function effectiveIdentityConfidence(
  locationConfidence: LocationConfidence,
  included: EvidenceRecord[]
): LocationConfidence {
  const strongSociety = included.filter(isStrongSocietyEvidence).length;
  if (locationConfidence === 'high' || strongSociety >= 3) return 'high';
  if (locationConfidence === 'moderate' || strongSociety >= 1) return 'moderate';
  return 'low';
}

function deriveAuditConfidence(input: {
  societyCount: number;
  contextCount: number;
  sourceFamilyCount: number;
  assessedCategoryCount: number;
  highQualityCount: number;
  usedCount: number;
  identityConfidence: LocationConfidence;
}): AuditConfidence {
  if (
    input.societyCount >= 4 &&
    input.sourceFamilyCount >= 2 &&
    input.assessedCategoryCount >= 3 &&
    input.highQualityCount >= 1 &&
    input.usedCount >= 5 &&
    input.identityConfidence === 'high'
  ) {
    return 'high';
  }
  if (
    input.societyCount >= 2 &&
    input.sourceFamilyCount >= 2 &&
    input.assessedCategoryCount >= 2 &&
    input.usedCount >= 3 &&
    input.identityConfidence !== 'low' &&
    (input.contextCount >= 1 || input.highQualityCount >= 1)
  ) {
    return 'moderate';
  }
  return 'low';
}

function deriveEvidenceCoverage(input: {
  societyCount: number;
  sourceFamilyCount: number;
  usedCount: number;
  retrievedCount: number;
  assessedCategoryCount: number;
  locationConfidence: LocationConfidence;
}): number {
  const societyVolume = Math.min(input.societyCount / 5, 1) * 30;
  const sourceDiversity = Math.min(input.sourceFamilyCount / 3, 1) * 20;
  const usedRatio =
    input.retrievedCount > 0 ? Math.min(input.usedCount / input.retrievedCount, 1) * 20 : 0;
  const categoryCoverage = Math.min(input.assessedCategoryCount / 4, 1) * 20;
  const location =
    input.locationConfidence === 'high' ? 10 : input.locationConfidence === 'moderate' ? 7 : 3;
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(societyVolume + sourceDiversity + usedRatio + categoryCoverage + location)
    )
  );
}

export function deriveRiskScores(
  classification: GeminiGroundedClassification,
  evidence: EvidenceRecord[],
  locationConfidence: LocationConfidence
): DeterministicRiskResult {
  const included = evidence.filter((record) => record.includedInAnalysis);
  const byId = new Map(included.map((record) => [record.id, record] as const));
  const scored = CATEGORIES.map((category) =>
    categoryResult(category, classification.findings, byId)
  );
  const assessed = scored.filter(({ result }) => result.score !== null);
  const scoredEvidenceIds = new Set(assessed.flatMap(({ result }) => result.evidenceIds));
  const scoredEvidence = included.filter((record) => scoredEvidenceIds.has(record.id));
  const societyEvidence = included.filter(isSocietyEvidence);
  const contextEvidence = included.filter((record) => record.scope !== 'society');
  const sourceFamilies = new Set(included.map((record) => record.platform));
  const scoredSourceFamilies = new Set(scoredEvidence.map((record) => record.platform));
  const identityConfidence = effectiveIdentityConfidence(locationConfidence, included);
  const highQualityCount = included.filter(
    (record) => record.sourceQuality === 'primary' || record.sourceQuality === 'major_publication'
  ).length;
  const auditConfidence = deriveAuditConfidence({
    societyCount: societyEvidence.length,
    contextCount: contextEvidence.length,
    sourceFamilyCount: sourceFamilies.size,
    assessedCategoryCount: assessed.length,
    highQualityCount,
    usedCount: included.length,
    identityConfidence,
  });
  const evidenceCoverage = deriveEvidenceCoverage({
    societyCount: societyEvidence.length,
    sourceFamilyCount: sourceFamilies.size,
    usedCount: included.length,
    retrievedCount: evidence.length,
    assessedCategoryCount: assessed.length,
    locationConfidence,
  });

  const fullEligible =
    classification.status === 'classified' &&
    assessed.length >= 2 &&
    scoredEvidence.some(isSocietyEvidence) &&
    scoredSourceFamilies.size >= 2 &&
    identityConfidence !== 'low';

  const preliminaryEligible =
    classification.status === 'classified' &&
    assessed.length >= 1 &&
    scoredEvidence.some(isSocietyEvidence) &&
    identityConfidence !== 'low';

  if (!fullEligible && !preliminaryEligible) {
    return {
      status: 'insufficient_evidence',
      overallRiskScore: null,
      riskLevel: 'insufficient_evidence',
      categories: scored.map(({ result }) => result),
      auditConfidence,
      evidenceCoverage,
      scoredCategoryCount: assessed.length,
      sourceFamilyCount: sourceFamilies.size,
      societyEvidenceCount: societyEvidence.length,
      contextEvidenceCount: contextEvidence.length,
      scoreState: 'none',
    };
  }

  const totalSupport = assessed.reduce((sum, item) => sum + item.support, 0);
  const overallRiskScore = roundRiskScore(
    assessed.reduce((sum, item) => sum + (item.result.score ?? 0) * item.support, 0) / totalSupport
  );

  return {
    status: 'scored',
    overallRiskScore,
    riskLevel: riskLevelForScore(overallRiskScore),
    categories: scored.map(({ result }) => result),
    auditConfidence: fullEligible ? auditConfidence : identityConfidence === 'high' ? 'moderate' : 'low',
    evidenceCoverage,
    scoredCategoryCount: assessed.length,
    sourceFamilyCount: sourceFamilies.size,
    societyEvidenceCount: societyEvidence.length,
    contextEvidenceCount: contextEvidence.length,
    scoreState: fullEligible ? 'full' : 'preliminary',
  };
}
