import React from 'react';
import { ArrowUp, MessageSquare, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { RedditSignal, RiskLevel } from '@/data/auditData';

function getSentimentStyle(sentiment: RiskLevel) {
  if (sentiment === 'critical') return { color: '#BE123C', bg: '#FFF1F2', label: 'Critical Signal' };
  if (sentiment === 'moderate') return { color: '#B45309', bg: '#FFFBEB', label: 'Warning Signal' };
  return { color: '#047857', bg: '#ECFDF5', label: 'Positive Signal' };
}

function SentimentIcon({ sentiment }: { sentiment: RiskLevel }) {
  if (sentiment === 'critical') return <TrendingDown size={12} />;
  if (sentiment === 'moderate') return <Minus size={12} />;
  return <TrendingUp size={12} />;
}

function highlightKeywords(text: string, keywords: string[]) {
  if (!keywords.length) return text;
  const pattern = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(pattern);
  return parts.map((part, i) => {
    const isKeyword = keywords.some(k => k.toLowerCase() === part.toLowerCase());
    if (isKeyword) {
      return (
        <mark
          key={`kw-${i}`}
          className="rounded px-0.5"
          style={{ background: '#FEF3C7', color: '#B45309', fontWeight: 600 }}
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}

function RedditCard({ signal }: { signal: RedditSignal }) {
  const style = getSentimentStyle(signal.sentiment);
  return (
    <div
      className="evidence-card rounded-xl border border-slate-200 p-4 transition-all duration-200 bg-white shadow-sm"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200">
            {signal.subreddit}
          </span>
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border"
            style={{ background: style.bg, color: style.color, borderColor: style.color + '40' }}
          >
            <SentimentIcon sentiment={signal.sentiment} />
            {style.label}
          </span>
        </div>
        <span className="text-xs flex-shrink-0 text-slate-400">
          {signal.date}
        </span>
      </div>

      <h4 className="text-sm font-bold mb-2 leading-snug text-slate-900">
        {signal.title}
      </h4>

      <p className="text-sm leading-relaxed mb-3 text-slate-600">
        &ldquo;{highlightKeywords(signal.excerpt, signal.keywords)}&rdquo;
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <ArrowUp size={11} className="text-orange-500" />
            {signal.upvotes.toLocaleString('en-IN')} upvotes
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare size={11} />
            {signal.comments} comments
          </span>
        </div>
        <a
          href={signal.url}
          className="flex items-center gap-1 text-xs font-medium transition-colors duration-150 text-emerald-600 hover:text-emerald-700"
        >
          View thread <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
}

interface Props {
  signals: RedditSignal[];
}

export default function RedditEvidenceTab({ signals }: Props) {
  if (!signals.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MessageSquare size={40} className="text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-700">
          No Reddit signals yet
        </p>
        <p className="text-xs mt-1 text-slate-400">
          Reddit and Twitter discussions for this society will appear here once indexed.
        </p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {signals.map(s => (
        <RedditCard key={s.id} signal={s} />
      ))}
    </div>
  );
}