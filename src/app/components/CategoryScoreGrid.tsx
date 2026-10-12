'use client';

import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Construction,
  Droplets,
  FileQuestion,
  IndianRupee,
  Info,
  ShieldCheck,
} from 'lucide-react';
import type { CategoryScore, EvidenceRecord } from '@/data/auditData';
import { nearbyCategoryContext } from './nearbyCategoryContext';

interface CategoryScoreGridProps {
  categories: CategoryScore[];
  evidence: EvidenceRecord[];
  isAiAnalyzing?: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Droplets,
  IndianRupee,
  Construction,
  ShieldCheck,
};

function getRiskConfig(score: number | null) {
  if (score === null) {
    return {
      badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
      barColor: 'bg-slate-300',
      borderColor: 'border-slate-200 hover:border-slate-300',
      hoverShadow: 'hover:shadow-slate-500/10',
      iconBg: 'bg-slate-100 text-slate-500 border-slate-200',
      badgeIcon: FileQuestion,
      label: 'Not enough direct evidence',
    };
  }
  if (score >= 65) {
    return {
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
      barColor: 'bg-rose-500',
      borderColor: 'border-rose-200 hover:border-rose-400',
      hoverShadow: 'hover:shadow-rose-500/10',
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
      badgeIcon: AlertOctagon,
      label: 'High risk',
    };
  }
  if (score >= 35) {
    return {
      badgeBg: 'bg-amber-50 text-amber-900 border-amber-200',
      barColor: 'bg-amber-500',
      borderColor: 'border-amber-200 hover:border-amber-400',
      hoverShadow: 'hover:shadow-amber-500/10',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      badgeIcon: AlertTriangle,
      label: 'Moderate risk',
    };
  }
  return {
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    barColor: 'bg-emerald-500',
    borderColor: 'border-emerald-200 hover:border-emerald-400',
    hoverShadow: 'hover:shadow-emerald-500/10',
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    badgeIcon: CheckCircle2,
    label: 'Low risk',
  };
}

function scopeLabel(scope: CategoryScore['scope']) {
  if (scope === 'society') return 'Society evidence';
  if (scope === 'locality') return 'Locality context';
  if (scope === 'city') return 'City context';
  return 'No supported scope';
}

export default function CategoryScoreGrid({ categories, evidence }: CategoryScoreGridProps) {
  const scoredCategories = categories.filter((category) => category.score !== null);
  const unsupportedCategories = categories.filter((category) => category.score === null);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 px-1">
        <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
          Society Risk
        </h2>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
          Higher score = higher risk
        </span>
      </div>

      <p className="px-1 text-xs leading-relaxed text-slate-600">
        Scores require direct society evidence. Locality and city records may corroborate a signal
        but cannot create a society risk score by themselves.
      </p>

      {scoredCategories.length > 0 ? (
        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
          {scoredCategories.map((category) => {
            const Icon = ICON_MAP[category.icon] || Info;
            const config = getRiskConfig(category.score);
            const BadgeIcon = config.badgeIcon;
            const score =
              category.score === null
                ? null
                : Math.min(Math.max(category.score, 0), category.maxScore);

            return (
              <div
                key={category.id}
                className={`rounded-2xl border bg-white p-5 transition-all duration-150 ease-out flex flex-col justify-between shadow-xs hover:-translate-y-1 hover:shadow-md ${config.borderColor} ${config.hoverShadow}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${config.iconBg}`}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {category.label}
                        </h3>
                        <span
                          className={`mt-1 inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-md border ${config.badgeBg}`}
                        >
                          <BadgeIcon size={10} />
                          {config.label}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      {score === null ? (
                        <span className="text-xl font-black text-slate-400 leading-none">—</span>
                      ) : (
                        <div className="flex items-baseline justify-end gap-0.5">
                          <span className="text-2xl font-black text-slate-900 leading-none">
                            {score}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            /{category.maxScore}
                          </span>
                        </div>
                      )}
                      <span className="block mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        risk
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full transition-all duration-500 ease-out ${config.barColor}`}
                      style={{ width: score === null ? '0%' : `${score}%` }}
                    />
                  </div>

                  <p className="text-xs font-bold text-slate-900 leading-snug mb-2">
                    {category.headline}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-100 mt-2 space-y-2">
                  <p className="text-xs leading-relaxed text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                    {category.detail}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-bold text-slate-500">
                    <span className="capitalize">{scopeLabel(category.scope)}</span>
                    <span>
                      {category.evidenceIds.length}{' '}
                      {category.evidenceIds.length === 1 ? 'citation' : 'citations'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-xs">
          No category has enough direct society evidence for a risk score yet.
        </div>
      )}

      {unsupportedCategories.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {unsupportedCategories.map((category) => {
            const Icon = ICON_MAP[category.icon] || Info;
            const nearby = nearbyCategoryContext(category.id, evidence);
            return (
              <div
                key={category.id}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500">
                  <Icon size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">{category.label}</p>
                  <p className="text-[11px] font-semibold text-slate-500">
                    No strong society-specific evidence yet
                  </p>
                </div>
                </div>
                <div className="mt-3 border-t border-slate-200/70 pt-2.5 text-[11px] leading-relaxed text-slate-500">
                  <p className="font-semibold text-slate-600">Nearby context</p>
                  <p className="mt-1">{nearby.summary}</p>
                  {nearby.records.length > 0 && (
                    <>
                      <p className="mt-1">Area context only; this risk area remains unscored.</p>
                      <details className="mt-1.5">
                        <summary className="cursor-pointer font-semibold">View supporting sources</summary>
                        <ul className="mt-1.5 space-y-1">
                          {nearby.records.map((record) => (
                            <li key={`nearby-${category.id}-${record.id}`}>
                              {record.sourceUrl ? (
                                <a href={record.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                                  {record.title}
                                </a>
                              ) : <span>{record.title}</span>}
                              <span className="block">{record.sourceDomain} · {record.scope} context</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    </>
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
