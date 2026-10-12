'use client';

import React from 'react';
import {
  AlertTriangle,
  Clock3,
  Database,
  ExternalLink,
  FileSearch,
  Layers3,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import type { SocietyAuditData } from '@/data/auditData';

interface Props {
  auditData: SocietyAuditData;
  isAiAnalyzing?: boolean;
}

function getRiskPresentation(score: number | null) {
  if (score === null) {
    return {
      label: 'Not enough direct evidence',
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
      bar: 'bg-slate-300',
      stroke: '#94A3B8',
      summary: 'bg-slate-50 border-slate-200 text-slate-700',
      Icon: FileSearch,
    };
  }
  if (score >= 65) {
    return {
      label: 'High risk',
      badge: 'bg-rose-100 text-rose-900 border-rose-200',
      bar: 'bg-rose-500',
      stroke: '#E11D48',
      summary: 'bg-rose-50/80 border-rose-200 text-rose-950',
      Icon: AlertTriangle,
    };
  }
  if (score >= 35) {
    return {
      label: 'Moderate risk',
      badge: 'bg-amber-100 text-amber-950 border-amber-200',
      bar: 'bg-amber-500',
      stroke: '#D97706',
      summary: 'bg-amber-50/80 border-amber-200 text-amber-950',
      Icon: AlertTriangle,
    };
  }
  return {
    label: 'Low risk',
    badge: 'bg-emerald-100 text-emerald-950 border-emerald-200',
    bar: 'bg-emerald-500',
    stroke: '#059669',
    summary: 'bg-emerald-50/80 border-emerald-200 text-emerald-950',
    Icon: ShieldCheck,
  };
}

function formatTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
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

function RiskGaugeScoreCard({
  score,
  scoreState,
  scoredCategories,
}: {
  score: number | null;
  scoreState: SocietyAuditData['scoreState'];
  scoredCategories: number;
}) {
  const config = getRiskPresentation(score);
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = score === null ? 0 : Math.min(Math.max(score, 0), 100);
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2">
        Tenant Risk Score
      </span>

      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="10" />
          {score !== null && (
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={config.stroke}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <span className="text-3xl font-black text-slate-900 leading-none">
            {score === null ? '—' : score}
          </span>
          {score !== null && (
            <span className="text-[11px] font-bold text-slate-400 mt-0.5">/ 100 risk</span>
          )}
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border mt-1.5 ${config.badge}`}
          >
            {config.label}
          </span>
        </div>
      </div>
      {scoreState === 'preliminary' && (
        <p className="mt-1 text-[10px] font-bold text-slate-500">
          Based on available evidence for {scoredCategories}{' '}
          {scoredCategories === 1 ? 'risk area' : 'risk areas'}
        </p>
      )}

      <div className="w-full max-w-[180px] h-2 bg-slate-200 rounded-full overflow-hidden mt-3 mb-1.5">
        <div
          className={`h-full transition-all duration-700 ease-out ${config.bar}`}
          style={{ width: score === null ? '0%' : `${clampedScore}%` }}
        />
      </div>

      <div className="flex items-center gap-2.5 mt-1 text-[10px] font-bold text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>0–34 Low</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>35–64 Moderate</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>65–100 High</span>
        </span>
      </div>
    </div>
  );
}

export default function SocietySummaryHeader({ auditData }: Props) {
  const score = auditData.tenantRiskIndex;
  const risk = getRiskPresentation(score);
  const RiskIcon = risk.Icon;
  const coverageLabel =
    auditData.evidenceCoverage >= 70
      ? 'Strong coverage'
      : auditData.evidenceCoverage >= 40
        ? 'Moderate coverage'
        : 'Limited coverage';
  const evidence = auditData.evidence || [];
  const includedCount = evidence.filter((record) => record.includedInAnalysis).length;
  const societyScopedCount = evidence.filter((record) => record.scope === 'society').length;
  const contextualCount = evidence.filter((record) => record.scope !== 'society').length;
  const reviewCount = evidence.filter((record) => record.type === 'google_review').length;
  const communityCount = evidence.filter((record) => record.type === 'community').length;
  const newsCount = evidence.filter(
    (record) => record.type === 'news' || record.type === 'civic'
  ).length;
  const webCount = evidence.filter((record) => record.type === 'web').length;
  const placeDestinationCandidate = evidence.find((record) =>
    isHttpUrl(record.sourceDestinationUrl)
  )?.sourceDestinationUrl;
  const placeDestination = isHttpUrl(placeDestinationCandidate || null)
    ? placeDestinationCandidate
    : null;

  const locationParts = [auditData.locality, auditData.city].filter(Boolean);
  const retrievedLabel = auditData.retrievedAt
    ? formatTimestamp(auditData.retrievedAt)
    : auditData.lastAuditedAt;
  const scoredCategories = auditData.categories.filter((category) => category.score !== null).length;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="p-6 sm:p-7 pb-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {auditData.societyName}
            </h1>
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${risk.badge}`}
            >
              <RiskIcon size={12} />
              <span>{risk.label}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
              <Database size={12} />
              <span>Public evidence reviewed</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-2.5 text-xs sm:text-sm font-semibold text-slate-500">
            <span className="flex items-center gap-1 text-slate-800">
              <MapPin size={13} className="text-emerald-600" />
              <span>{locationParts.join(', ') || auditData.city}</span>
            </span>
            <span>·</span>
            <span className="text-slate-400">Retrieved {retrievedLabel}</span>
          </div>
        </div>

        {placeDestination && (
          <a
            href={placeDestination ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex-shrink-0"
          >
            <MapPin size={14} className="text-emerald-600" />
            <span>Open place destination</span>
            <ExternalLink size={12} className="text-slate-400" />
          </a>
        )}
      </div>

      <div className="p-6 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-6 sm:p-7 flex flex-col justify-between min-h-64">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-300">
              <Layers3 size={14} /> Source-backed assessment
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-3 tracking-tight">
              Every finding stays connected to its source
            </h2>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              {score !== null
                ? 'This score is based on the public evidence shown below. '
                : 'This assessment is based on the public evidence shown below. '}
              Society-specific evidence and broader locality context remain separately scoped.
              Only eligible records can influence findings and risk scores.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-8">
            <div className="rounded-xl border border-white/10 bg-white/8 p-3">
              <div className="text-2xl font-black">{evidence.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-300">
                Public sources found
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/8 p-3">
              <div className="text-2xl font-black">{includedCount}</div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-300">
                Used in this assessment
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/8 p-3">
              <div className="text-2xl font-black">{societyScopedCount}</div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-300">
                Society scope
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/8 p-3">
              <div className="text-2xl font-black">{contextualCount}</div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-300">
                Locality / city
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-50/80 p-5 sm:p-6 rounded-2xl border border-slate-200">
          <RiskGaugeScoreCard
            score={score}
            scoreState={auditData.scoreState}
            scoredCategories={scoredCategories}
          />

          <div className="mt-3 rounded-xl border border-blue-200 bg-white p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                  Evidence Coverage
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-600">{coverageLabel}</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900">
                  {auditData.evidenceCoverage}
                </span>
                <span className="text-xs font-bold text-slate-400">/100</span>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-700"
                style={{ width: `${auditData.evidenceCoverage}%` }}
              />
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
              Coverage measures evidence breadth and usability. It is not a risk score.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-600 pt-4 mt-2 border-t border-slate-200/90">
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/70 shadow-2xs">
              <span className="text-slate-500">Maps reviews</span>
              <span className="text-slate-900 font-black">{reviewCount}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/70 shadow-2xs">
              <span className="text-slate-500">Community</span>
              <span className="text-slate-900 font-black">{communityCount}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/70 shadow-2xs">
              <span className="text-slate-500">News / civic</span>
              <span className="text-slate-900 font-black">{newsCount}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/70 shadow-2xs">
              <span className="text-slate-500">Other web</span>
              <span className="text-slate-900 font-black">{webCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-7 pb-6 space-y-2.5">
        {auditData.retrievalWarnings.includes('maps') && (
          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-xs font-medium leading-relaxed text-amber-900 flex items-start gap-2.5">
            <MapPin size={15} className="flex-shrink-0 mt-0.5" />
            <span>Property map details were temporarily unavailable. FlatTruth continued using public web evidence.</span>
          </div>
        )}
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium leading-relaxed flex items-start gap-2.5 ${risk.summary}`}
        >
          <RiskIcon size={15} className="flex-shrink-0 mt-0.5" />
          <span>{auditData.riskSummary}</span>
        </div>
        {(auditData.auditStatus === 'no_reliable_evidence' ||
          auditData.auditStatus === 'partial') &&
          auditData.insufficiencyReasons.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <div className="flex items-center gap-2 font-bold text-slate-800 mb-1.5">
                <Clock3 size={14} /> Evidence coverage limits
              </div>
              <ul className="list-disc pl-5 space-y-1">
                {auditData.insufficiencyReasons.map((reason) => (
                  <li key={`summary-insufficiency-${reason}`}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
      </div>
    </div>
  );
}
