'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ExternalLink, FileSearch, MapPin, Star } from 'lucide-react';
import type { EvidenceRecord } from '@/lib/evidence/types';

interface Props {
  records: EvidenceRecord[];
}

function isHttpUrl(value: string | null): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function scopeLabel(scope: EvidenceRecord['scope']) {
  if (scope === 'society') return 'Society evidence';
  if (scope === 'locality') return 'Locality context';
  return 'City context';
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          size={13}
          className={index <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}
        />
      ))}
    </div>
  );
}

function ReviewCard({ record }: { record: EvidenceRecord }) {
  const [expanded, setExpanded] = useState(false);
  const long = record.snippet.length > 180;
  const directUrl = isHttpUrl(record.sourceUrl) ? record.sourceUrl : null;
  const destinationUrl = isHttpUrl(record.sourceDestinationUrl)
    ? record.sourceDestinationUrl
    : null;

  return (
    <article
      className={`evidence-card rounded-2xl border p-5 transition-all duration-200 bg-white shadow-xs hover:shadow-md flex flex-col justify-between ${
        record.includedInAnalysis
          ? 'border-blue-200 border-l-4 border-l-blue-500'
          : 'border-slate-200 border-l-4 border-l-slate-300'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-900 leading-tight">
                {record.author || 'Google Maps reviewer'}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  record.includedInAnalysis
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                {record.includedInAnalysis ? <CheckCircle2 size={10} /> : <FileSearch size={10} />}
                {record.includedInAnalysis ? 'Used in this assessment' : 'Browsing context only'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {record.sourceDomain || 'Google Maps'} · {scopeLabel(record.scope)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {record.rating !== null && <StarRating rating={record.rating} />}
            {(record.dateLabel || record.date) && (
              <span className="text-[11px] text-slate-400">{record.dateLabel || record.date}</span>
            )}
          </div>
        </div>

        {record.title && record.title !== record.snippet && (
          <h4 className="text-sm font-bold text-slate-900 mb-2 leading-snug">{record.title}</h4>
        )}

        <p className="text-sm leading-relaxed text-slate-700 mb-3">
          &ldquo;
          {long && !expanded ? `${record.snippet.slice(0, 180)}…` : record.snippet}
          &rdquo;
          {long && (
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="ml-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
              {expanded ? 'Show less' : 'Read full snippet'}
            </button>
          )}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
            Platform: Google Maps
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
            Quality: {formatLabel(record.sourceQuality)}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
            Identity: {formatLabel(record.identityMatch)}
          </span>
          {record.tenantRelevant && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              Tenant relevant
            </span>
          )}
          {record.topics.map((topic) => (
            <span
              key={`google-review-${record.id}-topic-${topic}`}
              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800"
            >
              #{topic}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 mt-2">
        <span className="text-[11px] font-semibold text-slate-400">
          Relevance {Math.round(record.relevanceScore * 100)}%
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {directUrl && (
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
            >
              Exact source <ExternalLink size={10} />
            </a>
          )}
          {!directUrl && destinationUrl && (
            <a
              href={destinationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
            >
              <MapPin size={10} /> Place destination <ExternalLink size={10} />
            </a>
          )}
          {!directUrl && !destinationUrl && (
            <span className="text-[11px] text-slate-400">No direct URL supplied</span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function GoogleReviewsTab({ records }: Props) {
  const [visibleCount, setVisibleCount] = useState(4);
  const [filter, setFilter] = useState<'all' | 'analysis' | 'context'>('all');

  const filteredRecords = useMemo(() => {
    if (filter === 'analysis') return records.filter((record) => record.includedInAnalysis);
    if (filter === 'context') return records.filter((record) => !record.includedInAnalysis);
    return records;
  }, [filter, records]);

  const displayedRecords = filteredRecords.slice(0, visibleCount);
  const remainingCount = Math.max(0, filteredRecords.length - visibleCount);

  if (!records.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Star size={40} className="text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-700">
          No Google Maps reviews found
        </p>
        <p className="text-xs mt-1 text-slate-400">
          FlatTruth will not create substitute reviews when none are returned.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80">
          {(
            [
              ['all', 'All sources'],
              ['analysis', 'Used in this assessment'],
              ['context', 'Browsing context'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setFilter(id);
                setVisibleCount(4);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filter === id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500 font-medium">
          {records.length} public sources ·{' '}
          <span className="font-bold text-slate-800">
            {records.filter((record) => record.includedInAnalysis).length}
          </span>{' '}
          used in this assessment
        </div>
      </div>

      {displayedRecords.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {displayedRecords.map((record) => (
            <ReviewCard key={`google-review-${record.id}`} record={record} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-sm text-slate-500">
          No reviews match this filter.
        </div>
      )}

      {remainingCount > 0 && (
        <div className="flex justify-center pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() =>
              setVisibleCount((current) => Math.min(current + 4, filteredRecords.length))
            }
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-xs"
          >
            Load more retrieved reviews ({remainingCount}) <ChevronDown size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
