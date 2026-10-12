'use client';

import React, { useState } from 'react';
import { Building2, ExternalLink, MapPin, Star } from 'lucide-react';
import type { SocietyAuditData } from '@/data/auditData';

export default function PropertySnapshot({ auditData }: { auditData: SocietyAuditData }) {
  const [imageFailed, setImageFailed] = useState(false);
  const snapshot = auditData.propertySnapshot;
  const showImage = Boolean(snapshot.imageUrl) && !imageFailed;
  const mapDetailsUnavailable = auditData.retrievalWarnings.includes('maps');

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="grid min-h-48 grid-cols-1 md:grid-cols-[280px_1fr]">
        <div className="relative min-h-48 bg-gradient-to-br from-slate-200 to-slate-100">
          {showImage ? (
            // The remote host is supplied dynamically by the selected Maps result.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={snapshot.imageUrl ?? undefined}
              alt={`${snapshot.resolvedName} Google Maps place photo`}
              onError={() => setImageFailed(true)}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500">
              <Building2 size={36} />
              <span className="text-xs font-bold">{mapDetailsUnavailable ? 'Map details unavailable' : 'No Maps place photo available'}</span>
            </div>
          )}
          <span className="absolute bottom-3 left-3 rounded-full bg-slate-950/80 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
            {showImage ? 'Google Maps place photo' : mapDetailsUnavailable ? 'Requested property' : 'Property location'}
          </span>
        </div>

        <div className="flex flex-col justify-center p-6">
          <p className="text-[11px] font-black uppercase tracking-widest text-emerald-700">{mapDetailsUnavailable ? 'Requested property' : 'Property snapshot'}</p>
          <h2 className="mt-2 text-xl font-black text-slate-900">{snapshot.resolvedName}</h2>
          <p className="mt-2 flex items-start gap-2 text-sm text-slate-600">
            <MapPin size={16} className="mt-0.5 shrink-0 text-emerald-600" />
            <span>{snapshot.address || [auditData.locality, auditData.city].filter(Boolean).join(', ')}</span>
          </p>
          {mapDetailsUnavailable && (
            <p className="mt-2 text-xs text-amber-800">Map details could not be verified for this search.</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 capitalize">
              {auditData.locationConfidence} location confidence
            </span>
            {snapshot.rating !== null && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-900">
                <Star size={12} className="fill-amber-500 text-amber-500" /> {snapshot.rating}
                {snapshot.reviewCount !== null ? ` (${snapshot.reviewCount} reviews)` : ''}
              </span>
            )}
          </div>
          <p className="mt-2 text-[10px] text-slate-500">Maps rating is context only and never determines the tenant risk score.</p>
          {snapshot.sourceUrl && (
            <a href={snapshot.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex w-fit items-center gap-2 text-xs font-extrabold text-emerald-700 hover:text-emerald-800">
              View on Google Maps <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
