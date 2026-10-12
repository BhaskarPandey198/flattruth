'use client';

import React, { useState } from 'react';
import { AlertCircle, Check, Copy, ExternalLink, FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { EvidenceRecord, LeaseClause } from '@/data/auditData';

interface Props {
  leaseClauses: LeaseClause[];
  societyName: string;
  evidence: EvidenceRecord[];
  isAiLoading?: boolean;
  isAiGenerated?: boolean;
}

export default function LeaseClauseGenerator({ leaseClauses, societyName, evidence }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const activeClauses = leaseClauses || [];

  const handleCopySingle = async (clause: LeaseClause) => {
    const textToCopy = `${clause.clauseNumber}: ${clause.title}\n${clause.body}`;
    await navigator.clipboard.writeText(textToCopy);
    setCopiedId(clause.id);
    toast.success(`Copied ${clause.clauseNumber} to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = async () => {
    const fullText =
      `LEASE DISCUSSION POINTS FOR ${societyName.toUpperCase()}\n\n` +
      activeClauses
        .map(
          (clause) =>
            `${clause.clauseNumber} - ${clause.title.toUpperCase()}\n` +
            `Addresses: ${clause.riskAddressed}\n${clause.body}\n`
        )
        .join('\n');

    await navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    toast.success(`Copied ${activeClauses.length} discussion points`);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center flex-shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-base">Lease discussion points</h3>
              {activeClauses.length > 0 && (
                <span className="inline-flex items-center text-[11px] font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {activeClauses.length} evidence-linked prompt
                  {activeClauses.length === 1 ? '' : 's'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Review any available prompts with a qualified local lawyer before using them.
            </p>
          </div>
        </div>

        {activeClauses.length > 0 && (
          <button
            type="button"
            onClick={handleCopyAll}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white shadow-xs hover:shadow-md transition-all cursor-pointer flex-shrink-0"
          >
            {copiedAll ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>
              {copiedAll
                ? 'Discussion points copied'
                : `Copy discussion points (${activeClauses.length})`}
            </span>
          </button>
        )}
      </div>

      <div className="my-4 px-3.5 py-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900 font-medium">
        <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <span>
          General negotiation guidance, not legal advice. Review with a qualified professional where appropriate.
        </span>
      </div>

      {activeClauses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
          <p className="text-sm font-bold text-slate-800">
            No evidence-grounded lease prompts available
          </p>
          <p className="mt-1 text-xs text-slate-500">
            FlatTruth will not create society-specific clauses when public sources do not support
            them.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          {activeClauses.map((clause) => {
            const isCopied = copiedId === clause.id;
            const isMustHave = clause.priority === 'must-have';
            const cited = clause.evidenceIds.flatMap((id) => {
              const record = evidence.find((item) => item.id === id);
              return record ? [record] : [];
            });

            return (
              <div
                key={clause.id}
                className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm hover:border-slate-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-700">
                        {clause.clauseNumber}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isMustHave
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {clause.priority}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopySingle(clause)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                    >
                      {isCopied ? (
                        <Check size={11} className="text-emerald-600" />
                      ) : (
                        <Copy size={11} />
                      )}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug mb-1">
                    {clause.title}
                  </h4>
                  <span className={`mb-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black ${clause.kind === 'evidence_triggered' ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-700'}`}>
                    {clause.kind === 'evidence_triggered' ? 'Supported by public evidence' : 'General negotiation checklist'}
                  </span>
                  <p className="text-[11px] font-bold text-slate-500 mb-2">
                    Addresses: <span className="text-slate-700">{clause.riskAddressed}</span>
                  </p>
                  <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs font-mono leading-relaxed text-slate-800 select-all">
                    &ldquo;{clause.body}&rdquo;
                  </div>
                  {cited.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {cited.map((record) => record.sourceUrl ? (
                        <a key={`lease-source-${clause.id}-${record.id}`} href={record.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-bold text-blue-700 hover:underline">
                          {record.sourceDomain} <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span key={`lease-source-${clause.id}-${record.id}`} className="block text-[10px] font-bold text-slate-500">{record.sourceDomain}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
