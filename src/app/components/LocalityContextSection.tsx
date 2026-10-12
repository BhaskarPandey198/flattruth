'use client';

import React from 'react';
import { ExternalLink, MapPinned } from 'lucide-react';
import type { SocietyAuditData } from '@/data/auditData';
import { isAcceptedContextSource } from './nearbyCategoryContext';

interface Props {
  auditData: SocietyAuditData;
}

const CONTEXT_TOPICS = new Set(['water', 'traffic', 'flooding', 'civic', 'maintenance']);

export default function LocalityContextSection({ auditData }: Props) {
  const context = auditData.evidence
    .filter(
      (record) =>
        record.scope === 'locality' &&
        isAcceptedContextSource(record) &&
        record.topics.some((topic) => CONTEXT_TOPICS.has(topic))
    )
    .sort(
      (a, b) =>
        Number(b.includedInAnalysis) - Number(a.includedInAnalysis) ||
        b.relevanceScore - a.relevanceScore
    )
    .slice(0, 6);

  return (
    <section className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-xs">
      <div className="border-b border-blue-100 bg-blue-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-white text-blue-700">
            <MapPinned size={18} />
          </div>
          <div>
            <h2 className="text-base font-black uppercase tracking-wide text-slate-900">Around this property</h2>
            <p className="mt-1 text-xs leading-relaxed text-blue-900">
              Verified locality-level context. These signals describe the surrounding area and are
              not automatically attributed to the society.
            </p>
          </div>
        </div>
      </div>

      {context.length < 2 ? (
        <p className="p-5 text-sm font-semibold text-slate-600">
          We didn't find strong locality-level risk reports in the available public sources.
        </p>
      ) : <div className="grid grid-cols-1 gap-3 p-5 lg:grid-cols-2">
        {context.map((record) => {
          const content = (
            <>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-extrabold uppercase tracking-wide">
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-800">
                  {record.scope} context
                </span>
                <span className="text-slate-500">{record.sourceDomain}</span>
                {record.includedInAnalysis && (
                  <span className="text-emerald-700">Used as corroboration</span>
                )}
              </div>
              <h3 className="mt-2 text-sm font-bold leading-snug text-slate-900">{record.title}</h3>
              <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-600">
                {record.snippet}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {record.topics
                  .filter((topic) => CONTEXT_TOPICS.has(topic))
                  .map((topic) => (
                    <span
                      key={topic}
                      className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold capitalize text-slate-600"
                    >
                      {topic}
                    </span>
                  ))}
              </div>
            </>
          );

          return record.sourceUrl ? (
            <a
              key={`locality-included-${record.id}`}
              href={record.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/30"
            >
              {content}
              <ExternalLink
                size={13}
                className="absolute right-3 top-3 text-slate-400 group-hover:text-blue-600"
              />
            </a>
          ) : (
            <div key={`locality-browsing-${record.id}`} className="rounded-xl border border-slate-200 bg-white p-4">
              {content}
            </div>
          );
        })}
      </div>}
    </section>
  );
}
