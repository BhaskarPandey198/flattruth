'use client';

import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, ExternalLink, FileSearch, MessageSquare } from 'lucide-react';
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

function CommunityCard({ record }: { record: EvidenceRecord }) {
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
          ? 'border-orange-200 border-l-4 border-l-orange-500'
          : 'border-slate-200 border-l-4 border-l-slate-300'
      }`}
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
              {formatLabel(record.platform)}
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
          {(record.dateLabel || record.date) && (
            <span className="text-xs text-slate-400">{record.dateLabel || record.date}</span>
          )}
        </div>

        <h4 className="text-sm font-bold text-slate-900 mb-1.5 leading-snug">{record.title}</h4>
        <p className="text-[11px] font-semibold text-slate-500 mb-2">
          {record.sourceName || record.sourceDomain || 'Indexed community source'} ·{' '}
          {scopeLabel(record.scope)}
        </p>

        <p className="text-sm leading-relaxed text-slate-700 mb-3">
          {long && !expanded ? `${record.snippet.slice(0, 180)}…` : record.snippet}
          {long && (
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="ml-1 text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline"
            >
              {expanded ? 'Show less' : 'Read full snippet'}
            </button>
          )}
        </p>

        <div className="flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
            Quality: {formatLabel(record.sourceQuality)}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
            Identity: {formatLabel(record.identityMatch)}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
            Relevance {Math.round(record.relevanceScore * 100)}%
          </span>
          {record.topics.map((topic) => (
            <span
              key={`community-${record.id}-topic-${topic}`}
              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-orange-50 text-orange-800"
            >
              #{topic}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-3">
        {directUrl ? (
          <a
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700 hover:text-orange-900"
          >
            Open exact source <ExternalLink size={10} />
          </a>
        ) : destinationUrl ? (
          <a
            href={destinationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
          >
            Open source destination <ExternalLink size={10} />
          </a>
        ) : (
          <span className="text-[11px] text-slate-400">No direct URL supplied</span>
        )}
      </div>
    </article>
  );
}

export default function RedditEvidenceTab({ records }: Props) {
  const [visibleCount, setVisibleCount] = useState(4);
  const displayedRecords = records.slice(0, visibleCount);
  const remainingCount = Math.max(0, records.length - visibleCount);

  if (!records.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MessageSquare size={40} className="text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-700">
          No community or web sources found
        </p>
        <p className="text-xs mt-1 text-slate-400">
          FlatTruth will not manufacture discussions when search results are sparse.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 text-xs text-slate-500 font-medium">
        <span>Original community and general-web search results</span>
        <span>
          <strong className="text-slate-800">{records.length}</strong> public sources ·{' '}
          <strong className="text-slate-800">
            {records.filter((record) => record.includedInAnalysis).length}
          </strong>{' '}
          used in this assessment
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {displayedRecords.map((record) => (
          <CommunityCard key={`community-record-${record.id}`} record={record} />
        ))}
      </div>

      {remainingCount > 0 && (
        <div className="flex justify-center pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setVisibleCount((current) => Math.min(current + 4, records.length))}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-xs"
          >
            Load more retrieved results ({remainingCount}) <ChevronDown size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
