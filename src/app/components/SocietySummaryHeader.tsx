'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Building2, Hash, Clock, MessageSquare, Star, Newspaper, Loader2 } from 'lucide-react';
import type { SocietyAuditData, RiskLevel } from '@/data/auditData';

const RiskGaugeChart = dynamic(() => import('./RiskGaugeChart'), { ssr: false });

interface Props {
  auditData: SocietyAuditData;
  isAiAnalyzing?: boolean;
}

function getRiskColors(level: RiskLevel) {
  if (level === 'critical') return { text: '#BE123C', bg: '#FFF1F2', border: '#FECDD3' };
  if (level === 'moderate') return { text: '#B45309', bg: '#FFFBEB', border: '#FDE68A' };
  return { text: '#047857', bg: '#ECFDF5', border: '#A7F3D0' };
}

function getRiskLabel(level: RiskLevel) {
  if (level === 'critical') return 'Severe Red Flag';
  if (level === 'moderate') return 'Moderate Concern';
  return 'Low Risk';
}

export default function SocietySummaryHeader({ auditData, isAiAnalyzing = false }: Props) {
  const colors = getRiskColors(auditData.riskLevel);
  const totalSignals = auditData.signalCounts.googleReviews + auditData.signalCounts.redditThreads + auditData.signalCounts.newsMentions + auditData.signalCounts.twitterPosts;

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      {/* Top accent bar */}
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${colors.text}, transparent)` }}
      />

      <div className="p-6 lg:p-8">
        <div className="flex flex-col xl:flex-row gap-8 items-start xl:items-center">
          {/* Left: society info */}
          <div className="flex-1 min-w-0">
            {/* Society name + risk badge */}
            <div className="flex flex-wrap items-start gap-3 mb-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-slate-900">
                {auditData.societyName}
              </h2>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-1 flex-shrink-0 border"
                style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full pulse-ring"
                  style={{ background: colors.text }}
                />
                {getRiskLabel(auditData.riskLevel)}
              </span>
              {isAiAnalyzing && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-1 flex-shrink-0 bg-violet-50 text-violet-700 border border-violet-200">
                  <Loader2 size={10} className="animate-spin" />
                  Analyzing…
                </span>
              )}
              {!isAiAnalyzing && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-1 flex-shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span>●</span>
                  Audit Verified
                </span>
              )}
            </div>

            {/* Metadata row */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4">
              <span className="flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin size={13} />
                {auditData.locality}, {auditData.city}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-slate-500">
                <Building2 size={13} />
                {auditData.municipalWard}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-slate-500">
                <Hash size={13} />
                {auditData.pincode}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-slate-500">
                <Clock size={13} />
                Last audited: {auditData.lastAuditedAt}
              </span>
            </div>

            {/* Risk summary badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold mb-6 border"
              style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
            >
              <span>⚠</span>
              <span>{auditData.riskSummary}</span>
            </div>

            {/* Signal counts */}
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest mb-1 text-slate-400" style={{ letterSpacing: '0.08em' }}>
                  Total Signals
                </p>
                <p className="text-2xl font-bold tabular-nums text-slate-900">
                  {totalSignals.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="w-px self-stretch bg-slate-200" />

              <div className="flex flex-wrap gap-5">
                {[
                  { key: 'sig-gr', icon: Star, label: 'Google Reviews', value: auditData.signalCounts.googleReviews, color: '#D97706' },
                  { key: 'sig-rd', icon: MessageSquare, label: 'Reddit Threads', value: auditData.signalCounts.redditThreads, color: '#DC4500' },
                  { key: 'sig-nm', icon: Newspaper, label: 'News Mentions', value: auditData.signalCounts.newsMentions, color: '#2563EB' },
                  { key: 'sig-tw', icon: Newspaper, label: 'Twitter/X Posts', value: auditData.signalCounts.twitterPosts, color: '#0284C7' },
                ].map(item => (
                  <div key={item.key} className="flex items-center gap-2">
                    <item.icon size={14} style={{ color: item.color }} />
                    <div>
                      <p className="text-lg font-bold tabular-nums leading-tight text-slate-900">
                        {item.value}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Gauge */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0 w-full xl:w-auto">
            <div>
              <p className="text-xs font-semibold uppercase text-center mb-2 text-slate-400" style={{ letterSpacing: '0.1em' }}>
                Tenant Risk Index
              </p>
              <RiskGaugeChart score={auditData.tenantRiskIndex} level={auditData.riskLevel} />
            </div>
            <div className="flex gap-3 text-xs">
              {[
                { key: 'legend-safe', color: '#059669', label: '0–35 Safe' },
                { key: 'legend-mod', color: '#D97706', label: '36–65 Moderate' },
                { key: 'legend-crit', color: '#BE123C', label: '66–100 Severe' },
              ].map(l => (
                <span key={l.key} className="flex items-center gap-1 text-slate-500">
                  <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}