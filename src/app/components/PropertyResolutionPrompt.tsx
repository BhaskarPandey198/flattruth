'use client';

import React from 'react';
import { Building2, MapPin } from 'lucide-react';
import type { PropertyResolutionCandidate } from '@/lib/evidence/types';

export default function PropertyResolutionPrompt({
  candidates,
  onSelect,
}: {
  candidates: PropertyResolutionCandidate[];
  onSelect: (candidateId: string) => void;
}) {
  return (
    <section className="mx-auto mt-4 max-w-4xl rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-slate-900">Which property did you mean?</h2>
      <p className="mt-1 text-sm text-slate-600">
        The Maps result is not an exact, unambiguous match. Confirm a candidate before FlatTruth retrieves or scores evidence.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {candidates.map((candidate) => {
          const candidateId = candidate.dataId ?? candidate.placeId;
          return (
            <button
              key={candidateId ?? `${candidate.title}-${candidate.address}`}
              type="button"
              disabled={!candidateId || !candidate.cityMatch}
              onClick={() => candidateId && onSelect(candidateId)}
              className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left transition hover:border-emerald-400 hover:bg-emerald-50/40 disabled:cursor-not-allowed disabled:opacity-55"
            >
              <div className="flex h-28 items-center justify-center bg-slate-200">
                {candidate.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={candidate.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="text-slate-500" size={28} />
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-extrabold text-slate-900">{candidate.title}</p>
                <p className="mt-1 flex gap-1 text-xs leading-relaxed text-slate-600">
                  <MapPin className="mt-0.5 shrink-0" size={12} />
                  {candidate.address || 'Address unavailable'}
                </p>
                <p className="mt-2 text-[11px] font-bold text-blue-700">{candidate.matchReason}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
