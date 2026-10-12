'use client';

import React, { useState } from 'react';
import {
  Building,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileSearch,
  Landmark,
  Newspaper,
} from 'lucide-react';
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

function scopePresentation(scope: EvidenceRecord['scope']) {
  if (scope === 'society') {
    return {
      label: 'Society evidence',
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }
  if (scope === 'locality') {
    return {
      label: 'Locality context',
      classes: 'bg-amber-50 text-amber-800 border-amber-200',
    };
  }
  return {
    label: 'City context',
    classes: 'bg-slate-100 text-slate-700 border-slate-200',
  };
}

function NewsCard({ record }: { record: EvidenceRecord }) {
  const [expanded, setExpanded] = useState(false);
  const long = record.snippet.length > 180;
  const directUrl = isHttpUrl(record.sourceUrl) ? record.sourceUrl : null;
  const destinationUrl = isHttpUrl(record.sourceDestinationUrl)
    ? record.sourceDestinationUrl
    : null;
  const scope = scopePresentation(record.scope);
  const SourceIcon =
    record.platform === 'government' ? Landmark : record.type === 'civic' ? Building : Newspaper;

  return (
    <article
      className={`evidence-card rounded-2xl border bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between ${
        record.includedInAnalysis
          ? 'border-blue-200 border-l-4 border-l-blue-500'
          : 'border-slate-200 border-l-4 border-l-slate-300'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-start gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-600">
              <SourceIcon size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {formatLabel(record.type)}
                </span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${scope.classes}`}
                >
                  {scope.label}
                </span>
              </div>
              <p className="text-xs text-slate-700 font-bold mt-1">
                {record.sourceName || record.sourceDomain || 'Indexed source'}
              </p>
            </div>
          </div>
          {(record.dateLabel || record.date) && (
            <span className="text-xs text-slate-400 flex-shrink-0">
              {record.dateLabel || record.date}
            </span>
          )}
        </div>

        <h4 className="text-sm font-bold text-slate-900 mb-1.5 leading-snug">{record.title}</h4>
        <p className="text-sm leading-relaxed text-slate-700 mb-3">
          {long && !expanded ? `${record.snippet.slice(0, 180)}…` : record.snippet}
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

        <div className="flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
            Platform: {formatLabel(record.platform)}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
            Quality: {formatLabel(record.sourceQuality)}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
            Identity: {formatLabel(record.identityMatch)}
          </span>
          {record.topics.map((topic) => (
            <span
              key={`news-${record.id}-topic-${topic}`}
              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-800"
            >
              #{topic}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 mt-3">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border ${
            record.includedInAnalysis
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}
        >
          {record.includedInAnalysis ? <CheckCircle2 size={10} /> : <FileSearch size={10} />}
          {record.includedInAnalysis ? 'Used in this assessment' : 'Browsing context only'}
        </span>
        {directUrl ? (
          <a
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 hover:text-blue-800"
          >
            Read exact source <ExternalLink size={12} />
          </a>
        ) : destinationUrl ? (
          <a
            href={destinationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            Open source destination <ExternalLink size={12} />
          </a>
        ) : (
          <span className="text-[11px] text-slate-400">No direct URL supplied</span>
        )}
      </div>
    </article>
  );
}

export default function NewsTab({ records }: Props) {
  const [visibleCount, setVisibleCount] = useState(4);
  const displayedRecords = records.slice(0, visibleCount);
  const remainingCount = Math.max(0, records.length - visibleCount);

  if (!records.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Newspaper size={40} className="text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-700">
          No news or civic sources found
        </p>
        <p className="text-xs mt-1 text-slate-400">
          Missing coverage is not treated as evidence of low risk.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 text-xs text-slate-500 font-semibold">
        <span>Original news, civic, and government search results</span>
        <span>
          <strong className="text-slate-900">{records.length}</strong> public sources ·{' '}
          <strong className="text-slate-900">
            {records.filter((record) => record.includedInAnalysis).length}
          </strong>{' '}
          used in this assessment
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {displayedRecords.map((record) => (
          <NewsCard key={`news-record-${record.id}`} record={record} />
        ))}
      </div>

      {remainingCount > 0 && (
        <div className="flex justify-center pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setVisibleCount((current) => Math.min(current + 4, records.length))}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-xs"
          >
            Load more retrieved reports ({remainingCount}) <ChevronDown size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
