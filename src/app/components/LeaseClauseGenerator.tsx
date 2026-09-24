'use client';

import React, { useState } from 'react';
import { FileText, Copy, Check, AlertTriangle, Info, Star, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { LeaseClause } from '@/data/auditData';

function getPriorityStyle(priority: LeaseClause['priority']) {
  if (priority === 'must-have') return { text: '#BE123C', bg: '#FFF1F2', border: '#FECDD3', label: 'Must-Have', icon: AlertTriangle };
  if (priority === 'recommended') return { text: '#B45309', bg: '#FFFBEB', border: '#FDE68A', label: 'Recommended', icon: Star };
  return { text: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', label: 'Optional', icon: Info };
}

function ClauseCard({ clause }: { clause: LeaseClause }) {
  const [copied, setCopied] = useState(false);
  const style = getPriorityStyle(clause.priority);
  const PriorityIcon = style.icon;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${clause.clauseNumber} — ${clause.title}\n\n${clause.body}`).then(() => {
      setCopied(true);
      toast.success(`${clause.clauseNumber} copied to clipboard`, {
        description: clause.title,
        duration: 2500,
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="rounded-xl border p-5 flex flex-col gap-4 bg-white shadow-sm"
      style={{
        borderColor: '#E2E8F0',
        borderTop: `3px solid ${style.text}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border"
            style={{ background: style.bg, borderColor: style.border }}
          >
            <FileText size={16} style={{ color: style.text }} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-bold text-slate-400">
                {clause.clauseNumber}
              </span>
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border"
                style={{ background: style.bg, color: style.text, borderColor: style.border }}
              >
                <PriorityIcon size={10} />
                {style.label}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {clause.title}
            </h4>
            <p className="text-xs mt-0.5 text-slate-500">
              Addresses: {clause.riskAddressed}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex-shrink-0 action-btn border"
          style={{
            background: copied ? '#ECFDF5' : '#F8FAFC',
            color: copied ? '#047857' : '#64748B',
            borderColor: copied ? '#A7F3D0' : '#E2E8F0',
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Clause body */}
      <div
        className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 font-mono text-xs leading-relaxed text-slate-800"
      >
        {clause.body}
      </div>
    </div>
  );
}

function ClauseCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 p-5 flex flex-col gap-4 animate-pulse bg-white shadow-sm" style={{ borderTop: '3px solid #A7F3D0' }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg flex-shrink-0 bg-slate-100" />
        <div className="flex-1 space-y-2">
          <div className="h-3 rounded w-24 bg-slate-100" />
          <div className="h-4 rounded w-48 bg-slate-100" />
          <div className="h-3 rounded w-36 bg-slate-100" />
        </div>
      </div>
      <div className="rounded-lg p-4 space-y-2 bg-slate-50 border border-slate-200">
        <div className="h-3 rounded w-full bg-slate-100" />
        <div className="h-3 rounded w-5/6 bg-slate-100" />
        <div className="h-3 rounded w-4/6 bg-slate-100" />
      </div>
    </div>
  );
}

interface Props {
  leaseClauses: LeaseClause[];
  societyName: string;
  isAiLoading?: boolean;
  isAiGenerated?: boolean;
}

export default function LeaseClauseGenerator({ leaseClauses, societyName, isAiLoading = false, isAiGenerated = false }: Props) {
  const [allCopied, setAllCopied] = useState(false);

  const handleCopyAll = () => {
    const allText = leaseClauses
      .map(c => `${c.clauseNumber} — ${c.title}\n\n${c.body}`)
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(allText).then(() => {
      setAllCopied(true);
      toast.success('All lease clauses copied!', {
        description: `${leaseClauses.length} clauses for ${societyName} copied to clipboard.`,
        duration: 3000,
      });
      setTimeout(() => setAllCopied(false), 2500);
    });
  };

  return (
    <section className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 border border-emerald-200">
            <FileText size={18} className="text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900">
                Automated Lease Safeguard Clauses
              </h3>
              {isAiLoading && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                  <Loader2 size={10} className="animate-spin" />
                  Drafting clauses…
                </span>
              )}
              {!isAiLoading && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles size={10} />
                  3 Active Safeguards
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {isAiLoading
                ? 'Generating tailored legal safeguards based on detected red flags…'
                : `${leaseClauses.length} risk-specific legal clauses for ${societyName} — add to your rental agreement before signing`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCopyAll}
          disabled={isAiLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 flex-shrink-0 action-btn disabled:opacity-50 disabled:cursor-not-allowed border"
          style={{
            background: allCopied ? '#ECFDF5' : '#10B981',
            color: allCopied ? '#047857' : '#FFFFFF',
            borderColor: allCopied ? '#A7F3D0' : 'transparent',
          }}
        >
          {allCopied ? <Check size={14} /> : <Copy size={14} />}
          {allCopied ? 'All Clauses Copied!' : 'Copy All Agreement Clauses'}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="px-6 py-3 flex items-start gap-2 border-b border-amber-100 bg-amber-50">
        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5 text-amber-600" />
        <p className="text-xs leading-relaxed text-amber-700">
          Clauses are automatically drafted based on public tenant risk signals. Review with legal counsel before signing.
        </p>
      </div>

      {/* Clause cards */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {isAiLoading ? (
          <>
            <ClauseCardSkeleton />
            <ClauseCardSkeleton />
            <ClauseCardSkeleton />
          </>
        ) : (
          leaseClauses.map(clause => (
            <ClauseCard key={clause.id} clause={clause} />
          ))
        )}
      </div>
    </section>
  );
}