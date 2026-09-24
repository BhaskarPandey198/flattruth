'use client';

import React, { useState } from 'react';
import { Droplets, IndianRupee, Construction, ShieldAlert, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import type { CategoryScore, RiskLevel } from '@/data/auditData';

const ICON_MAP: Record<string, React.ElementType> = {
  Droplets,
  IndianRupee,
  Construction,
  ShieldAlert,
};

function getRiskColors(level: RiskLevel) {
  if (level === 'critical') return { text: '#BE123C', bg: '#FFF1F2', border: '#FECDD3', bar: '#E11D48' };
  if (level === 'moderate') return { text: '#B45309', bg: '#FFFBEB', border: '#FDE68A', bar: '#D97706' };
  return { text: '#047857', bg: '#ECFDF5', border: '#A7F3D0', bar: '#059669' };
}

function getRiskLabel(level: RiskLevel) {
  if (level === 'critical') return 'Critical';
  if (level === 'moderate') return 'Moderate';
  return 'Safe';
}

function CategoryCard({ cat }: { cat: CategoryScore }) {
  const [expanded, setExpanded] = useState(false);
  const colors = getRiskColors(cat.level);
  const IconComp = ICON_MAP[cat.icon] ?? ShieldAlert;
  const pct = (cat.score / cat.maxScore) * 100;

  return (
    <div
      className="rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-200 cursor-pointer bg-white shadow-sm"
      style={{
        borderColor: expanded ? colors.border : '#E2E8F0',
        boxShadow: expanded ? `0 0 0 1px ${colors.border}, 0 1px 3px 0 rgba(0,0,0,0.06)` : '0 1px 3px 0 rgba(0,0,0,0.06)',
      }}
      onClick={() => setExpanded(v => !v)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border"
            style={{ background: colors.bg, borderColor: colors.border }}
          >
            <IconComp size={18} style={{ color: colors.text }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {cat.label}
            </p>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold mt-0.5 border"
              style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
            >
              {getRiskLabel(cat.level)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span
              className="text-3xl font-extrabold tabular-nums leading-none"
              style={{ color: colors.text }}
            >
              {cat.score}
            </span>
            <span className="text-sm font-medium ml-1 text-slate-400">
              /100
            </span>
          </div>
          {expanded
            ? <ChevronUp size={16} className="text-slate-400" />
            : <ChevronDown size={16} className="text-slate-400" />
          }
        </div>
      </div>

      {/* Score bar */}
      <div>
        <div className="score-bar-track">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: colors.bar }}
          />
        </div>
      </div>

      {/* Headline */}
      <p className="text-sm font-semibold text-slate-700">
        {cat.headline}
      </p>

      {/* Expandable detail */}
      {expanded && (
        <p className="text-sm leading-relaxed fade-in text-slate-600">
          {cat.detail}
        </p>
      )}
    </div>
  );
}

interface Props {
  categories: CategoryScore[];
  isAiAnalyzing?: boolean;
}

export default function CategoryScoreGrid({ categories, isAiAnalyzing = false }: Props) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-slate-900">
            Category Breakdown
          </h3>
          {isAiAnalyzing && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
              <Loader2 size={10} className="animate-spin" />
              AI scoring…
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400">
          Click a card to expand details
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {categories.map(cat => (
          <CategoryCard key={cat.id} cat={cat} />
        ))}
      </div>
    </section>
  );
}