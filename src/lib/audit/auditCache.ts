import type { AuditResponseData, EvidenceDossier } from '../evidence/types';
import { AUDIT_SCHEMA_VERSION } from '../evidence/types';

const CACHE_PREFIX = `flattruth:audit:${AUDIT_SCHEMA_VERSION}`;

export interface CachedAudit {
  dossier: EvidenceDossier;
  data: AuditResponseData;
  cachedAt: string;
}

interface AuditCacheRegistry {
  byQuery: Map<string, CachedAudit>;
  byAuditId: Map<string, CachedAudit>;
}

const globalCache = globalThis as typeof globalThis & {
  __flatTruthAuditCacheV8?: AuditCacheRegistry;
};

const registry =
  globalCache.__flatTruthAuditCacheV8 ??
  (globalCache.__flatTruthAuditCacheV8 = {
    byQuery: new Map<string, CachedAudit>(),
    byAuditId: new Map<string, CachedAudit>(),
  });

const { byQuery, byAuditId } = registry;

function normalizeCachePart(value: string): string {
  return value.trim().toLowerCase().normalize('NFKC').replace(/\s+/g, ' ');
}

export function createAuditCacheKey(societyName: string, city: string, confirmedIdentifier = ''): string {
  return `${CACHE_PREFIX}:${encodeURIComponent(normalizeCachePart(city))}:${encodeURIComponent(
    normalizeCachePart(societyName)
  )}:${encodeURIComponent(normalizeCachePart(confirmedIdentifier))}`;
}

function isExpired(entry: CachedAudit): boolean {
  const expiresAt = Date.parse(entry.dossier.expiresAt);
  return !Number.isFinite(expiresAt) || expiresAt <= Date.now();
}

function evict(entry: CachedAudit): void {
  byQuery.delete(entry.dossier.cacheKey);
  byAuditId.delete(entry.dossier.auditId);
}

export function getCachedAuditByQuery(cacheKey: string): CachedAudit | null {
  const entry = byQuery.get(cacheKey);
  if (!entry) return null;
  if (isExpired(entry)) {
    evict(entry);
    return null;
  }
  return entry;
}

export function getCachedAuditById(auditId: string): CachedAudit | null {
  const entry = byAuditId.get(auditId);
  if (!entry) return null;
  if (isExpired(entry)) {
    evict(entry);
    return null;
  }
  return entry;
}

export function setCachedAudit(entry: CachedAudit): void {
  const previous = byQuery.get(entry.dossier.cacheKey);
  if (previous) byAuditId.delete(previous.dossier.auditId);
  byQuery.set(entry.dossier.cacheKey, entry);
  byAuditId.set(entry.dossier.auditId, entry);
}
