import type { EvidenceTopic, RiskCategory } from './types';

const TOPIC_PATTERNS: Array<[EvidenceTopic, RegExp]> = [
  ['water', /\b(water|tanker|borewell|bore well|supply|pressure|sewage|plumb(?:ing)?)\b/i],
  ['deposit', /\b(deposit|refund|deduct(?:ion|ed)?|withhold|move[ -]?out|repaint(?:ing)?)\b/i],
  ['maintenance', /\b(maintenance|repair|common area|amenit(?:y|ies)|management)\b/i],
  ['power', /\b(power|electricity|backup|generator|\bdg\b|outage)\b/i],
  ['lift', /\b(lift|elevator)\b/i],
  ['noise', /\b(noise|loud|construction sound|disturbance)\b/i],
  ['traffic', /\b(traffic|congestion|commute|gridlock|bottleneck|road|junction)\b/i],
  ['flooding', /\b(flood|flooding|waterlog(?:ged|ging)?|drainage|monsoon)\b/i],
  ['civic', /\b(municipal|civic|corporation|authority|infrastructure|stormwater|storm water)\b/i],
  ['rwa', /\b(rwa|association|society rule|resident rule|tenant rule|bachelor|pet rule)\b/i],
  ['security', /\b(security|guard|gated|access control|mygate)\b/i],
  ['visitor', /\b(visitor|guest|entry gate|gate entry)\b/i],
  ['delivery', /\b(delivery|courier|swiggy|zomato|amazon|porter)\b/i],
  ['parking', /\b(parking|car park|two wheeler|vehicle slot)\b/i],
];

const RESIDENTIAL_CONTEXT =
  /\b(tenant|rent|rental|resident|living|flat|apartment|landlord|owner|lease|move[ -]?(?:in|out)|maintenance|society)\b/i;

const NON_TENANT_CONTEXT =
  /\b(sales office|site visit|property tour|broker|booking experience|event venue|wedding|restaurant|hotel)\b/i;

const SOFT_ONLY_TOPICS = new Set<EvidenceTopic>(['security', 'visitor', 'delivery', 'parking']);

export function detectEvidenceTopics(text: string): EvidenceTopic[] {
  const topics = TOPIC_PATTERNS.filter(([, pattern]) => pattern.test(text)).map(([topic]) => topic);

  return topics.length > 0 ? topics : ['other'];
}

export function assessTenantRelevance(text: string): {
  topics: EvidenceTopic[];
  tenantRelevant: boolean;
  relevanceScore: number;
} {
  const normalized = text.trim();
  const topics = detectEvidenceTopics(normalized);
  const substantiveTopics = topics.filter(
    (topic) => topic !== 'other' && !SOFT_ONLY_TOPICS.has(topic)
  );
  const hasResidentialContext = RESIDENTIAL_CONTEXT.test(normalized);
  const hasNonTenantContext = NON_TENANT_CONTEXT.test(normalized);
  const isSoftOnly =
    topics.some((topic) => SOFT_ONLY_TOPICS.has(topic)) && substantiveTopics.length === 0;

  let score = 0;
  if (hasResidentialContext) score += 0.35;
  score += Math.min(0.45, substantiveTopics.length * 0.18);
  if (normalized.length >= 80) score += 0.1;
  if (normalized.length >= 180) score += 0.05;
  if (hasNonTenantContext) score -= 0.35;
  if (isSoftOnly) score -= 0.25;

  score = Math.max(0, Math.min(1, Number(score.toFixed(2))));

  return {
    topics,
    tenantRelevant:
      !hasNonTenantContext &&
      !isSoftOnly &&
      (hasResidentialContext || substantiveTopics.length > 0),
    relevanceScore: score,
  };
}

export function topicToRiskCategory(topic: EvidenceTopic): RiskCategory | null {
  if (topic === 'water') return 'water';
  if (topic === 'deposit') return 'deposit';
  if (['traffic', 'flooding', 'civic'].includes(topic)) return 'civic';
  if (
    ['maintenance', 'power', 'lift', 'noise', 'rwa', 'security', 'visitor', 'parking'].includes(
      topic
    )
  ) {
    return 'rwa';
  }
  return null;
}

export function categoriesForTopics(topics: EvidenceTopic[]): RiskCategory[] {
  return Array.from(
    new Set(
      topics
        .map(topicToRiskCategory)
        .filter((category): category is RiskCategory => category !== null)
    )
  );
}

export function tokenizeForMatching(value: string): string[] {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);
}
