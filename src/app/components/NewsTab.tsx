import React from 'react';
import { Newspaper, ExternalLink, Scale, Building2, Radio } from 'lucide-react';
import type { NewsSignal } from '@/data/auditData';

function getSourceIcon(type: NewsSignal['sourceType']) {
  if (type === 'legal') return Scale;
  if (type === 'civic') return Building2;
  return Radio;
}

function getSourceColors(type: NewsSignal['sourceType']) {
  if (type === 'legal') return { text: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' };
  if (type === 'civic') return { text: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' };
  return { text: '#047857', bg: '#ECFDF5', border: '#A7F3D0' };
}

function getSourceLabel(type: NewsSignal['sourceType']) {
  if (type === 'legal') return 'Legal';
  if (type === 'civic') return 'Civic';
  return 'Media';
}

function NewsCard({ signal }: { signal: NewsSignal }) {
  const SourceIcon = getSourceIcon(signal.sourceType);
  const colors = getSourceColors(signal.sourceType);

  return (
    <div
      className="evidence-card rounded-xl border border-slate-200 p-4 transition-all duration-200 bg-white shadow-sm"
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border"
          style={{ background: colors.bg, borderColor: colors.border }}
        >
          <SourceIcon size={16} style={{ color: colors.text }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full border"
              style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
            >
              {getSourceLabel(signal.sourceType)}
            </span>
            <span className="text-xs text-slate-400">
              {signal.source}
            </span>
            <span className="text-xs text-slate-400">
              · {signal.date}
            </span>
          </div>
          <h4 className="text-sm font-bold leading-snug text-slate-900">
            {signal.headline}
          </h4>
        </div>
      </div>

      <p className="text-sm leading-relaxed mb-3 text-slate-600">
        {signal.excerpt}
      </p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {signal.relevanceTags.map(tag => (
            <span
              key={`tag-${signal.id}-${tag}`}
              className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500"
            >
              {tag}
            </span>
          ))}
        </div>
        <a
          href={signal.url}
          className="flex items-center gap-1 text-xs font-medium flex-shrink-0 transition-colors duration-150 text-emerald-600 hover:text-emerald-700"
        >
          Read <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
}

interface Props {
  signals: NewsSignal[];
}

export default function NewsTab({ signals }: Props) {
  if (!signals.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Newspaper size={40} className="text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-700">
          No civic reports found
        </p>
        <p className="text-xs mt-1 text-slate-400">
          BBMP notices, BWSSB updates, and news mentions will appear here once indexed.
        </p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {signals.map(s => (
        <NewsCard key={s.id} signal={s} />
      ))}
    </div>
  );
}