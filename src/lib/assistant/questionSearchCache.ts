import type { EvidenceRecord } from '../evidence/types';

const TTL_MS = 2 * 60 * 60 * 1_000;
const GLOBAL_KEY = '__flatTruthAssistantSearchCacheV1';

interface Entry {
  expiresAt: number;
  evidence: EvidenceRecord[];
}

type GlobalWithCache = typeof globalThis & { [GLOBAL_KEY]?: Map<string, Entry> };

function cache(): Map<string, Entry> {
  const globalObject = globalThis as GlobalWithCache;
  globalObject[GLOBAL_KEY] ??= new Map<string, Entry>();
  return globalObject[GLOBAL_KEY];
}

export function getQuestionSearch(key: string): EvidenceRecord[] | null {
  const store = cache();
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }
  return entry.evidence;
}

export function setQuestionSearch(key: string, evidence: EvidenceRecord[]): void {
  cache().set(key, { evidence, expiresAt: Date.now() + TTL_MS });
}
