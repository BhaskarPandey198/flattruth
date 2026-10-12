'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { SocietyAuditData } from '@/data/auditData';

export default function WhatMattersBeforeSigning({ auditData }: { auditData: SocietyAuditData }) {
  const evidenceById = new Map(auditData.evidence.map((record) => [record.id, record]));
  const strongest = auditData.categories
    .filter((category) => category.score !== null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3);

  if (strongest.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
        What matters before you sign
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {strongest.map((category) => {
          const cited = category.evidenceIds.flatMap((id) => {
            const record = evidenceById.get(id);
            return record ? [record] : [];
          });
          return (
            <details key={category.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <summary className="cursor-pointer list-none">
                <h3 className="text-sm font-extrabold text-slate-900">{category.label}</h3>
                <p className="mt-1 text-xs font-bold capitalize text-slate-600">
                  {category.level} concern · {cited.length} supporting source{cited.length === 1 ? '' : 's'}
                </p>
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">{category.detail}</p>
              <div className="mt-2 space-y-1">
                {cited.map((record) => record.sourceUrl ? (
                  <a key={`signing-${category.id}-source-${record.id}`} href={record.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:underline">
                    {record.sourceDomain} <ExternalLink size={10} />
                  </a>
                ) : (
                  <span key={`signing-${category.id}-source-${record.id}`} className="block text-[11px] font-bold text-slate-500">{record.sourceDomain}</span>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
