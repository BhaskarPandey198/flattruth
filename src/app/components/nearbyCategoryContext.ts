import type { EvidenceRecord } from '@/data/auditData';

// Same source-quality gate as Around this property. This is display-only:
// these records never become category findings or score inputs.
export function isAcceptedContextSource(record: EvidenceRecord): boolean {
  return record.includedInAnalysis && (
    record.sourceQuality === 'primary' ||
    record.sourceQuality === 'major_publication' ||
    record.platform === 'reddit'
  );
}

const CATEGORY_CONTEXT: Record<string, { empty: string; topics: [string, RegExp][] }> = {
  'cat-water': {
    empty: 'No strong nearby water reports found.',
    topics: [['water supply or quality', /\b(?:water\s+(?:supply|shortage|scarcity|contamination|quality|crisis)|tanker|borewell|drinking\s+water)\b/i]],
  },
  'cat-deposit': {
    empty: 'No strong nearby public discussion found.',
    topics: [['rental deposits', /\b(?:(?:rental|security|rent)\s+deposit|deposit\s+(?:refund|return|deduction|dispute)|(?:landlord|tenant)\b.{0,60}\bdeposit)\b/i]],
  },
  'cat-infra': {
    empty: 'No strong nearby civic reports found.',
    topics: [
      ['traffic', /\b(?:traffic|congestion)\b/i],
      ['flooding or waterlogging', /\b(?:flood(?:s|ing|ed)?|waterlogging|waterlogged)\b/i],
      ['road conditions', /\b(?:potholes?|road\s+(?:damage|repair|work|closure|condition|construction)s?)\b/i],
      ['sewage or drainage', /\b(?:sewage|sewer|drainage|drains?)\b/i],
      ['civic water issues', /\b(?:water\s+(?:supply|shortage|scarcity|contamination|crisis)|drinking\s+water)\b/i],
      ['civic infrastructure', /\b(?:civic\s+(?:infrastructure|issues?|works?)|municipal\s+(?:infrastructure|works?))\b/i],
    ],
  },
  'cat-rwa': {
    empty: 'No reliable nearby public discussion found.',
    topics: [
      ['visitor rules', /\b(?:visitor|guest)s?\s+(?:rules?|restrictions?|polic(?:y|ies)|ban|entry)\b/i],
      ['bachelor restrictions', /\b(?:bachelors?\s+(?:restrictions?|ban|not\s+allowed)|(?:no|banned|restrict\w*)\s+bachelors?)\b/i],
      ['move-in restrictions', /\bmove[ -]in\s+(?:restrictions?|rules?|charges?|fees?|timings?)\b/i],
      ['society enforcement', /\b(?:society|rwa|association)\s+(?:rules?|restrictions?|enforcement|fines?|penalt\w*)\b/i],
    ],
  },
};

export function nearbyCategoryContext(categoryId: string, evidence: EvidenceRecord[]) {
  const config = CATEGORY_CONTEXT[categoryId];
  if (!config) return { summary: 'No strong nearby public discussion found.', records: [] };
  const seen = new Set<string>();
  const candidates = evidence.filter((record) => {
    if (!['locality', 'city'].includes(record.scope) || !record.tenantRelevant ||
      !isAcceptedContextSource(record)) return false;
    const text = `${record.title} ${record.snippet}`;
    if (!config.topics.some(([, pattern]) => pattern.test(text))) return false;
    // Count a source once even if it was returned by multiple searches.
    let key = record.id;
    if (record.sourceUrl) {
      try {
        const url = new URL(record.sourceUrl);
        key = `${url.hostname}${url.pathname.replace(/\/$/, '')}`;
      } catch { return false; }
    }
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  // Prefer locality records; city-only records must explicitly stay city-wide.
  const locality = candidates.filter((record) => record.scope === 'locality');
  const records = locality.length ? locality : candidates.filter((record) => record.scope === 'city');
  if (!records.length) return { summary: config.empty, records };
  const topics = config.topics.filter(([, pattern]) =>
    records.some((record) => pattern.test(`${record.title} ${record.snippet}`))
  ).map(([label]) => label);
  const topicText = topics.length > 1
    ? `${topics.slice(0, -1).join(', ')} and ${topics[topics.length - 1]}`
    : topics[0];
  const scope = locality.length ? 'surrounding-area' : 'city-wide';
  const summary = `${records.length} ${scope} ${records.length === 1 ? 'report mentions' : 'reports mention'} ${topicText}.`;
  return { summary, records };
}
