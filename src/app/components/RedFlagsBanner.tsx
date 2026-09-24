import React from 'react';
import { AlertTriangle, Users, Calendar } from 'lucide-react';
import type { RedFlag, RiskLevel } from '@/data/auditData';

function getTagColors(level: RiskLevel) {
  if (level === 'critical') return { text: '#BE123C', bg: '#FFF1F2', border: '#FECDD3', cardBorder: '#FECDD3', leftBar: '#E11D48' };
  if (level === 'moderate') return { text: '#B45309', bg: '#FFFBEB', border: '#FDE68A', cardBorder: '#FDE68A', leftBar: '#D97706' };
  return { text: '#047857', bg: '#ECFDF5', border: '#A7F3D0', cardBorder: '#A7F3D0', leftBar: '#059669' };
}

function RedFlagCard({ flag }: { flag: RedFlag }) {
  const colors = getTagColors(flag.tagLevel);
  return (
    <div
      className="rounded-xl border p-5 transition-all duration-200 bg-white shadow-sm"
      style={{
        borderColor: colors.cardBorder,
        borderLeft: `3px solid ${colors.leftBar}`,
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-shrink-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center border"
            style={{ background: colors.bg, borderColor: colors.border }}
          >
            <AlertTriangle size={16} style={{ color: colors.text }} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wide border"
              style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
            >
              [{flag.tag}]
            </span>
            <h4 className="text-sm font-bold text-slate-900">
              {flag.title}
            </h4>
          </div>
          <p className="text-sm leading-relaxed mb-3 text-slate-600">
            {flag.body}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Users size={11} />
              {flag.reportedBy}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {flag.date}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  redFlags: RedFlag[];
}

export default function RedFlagsBanner({ redFlags }: Props) {
  if (!redFlags.length) return null;
  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200">
          <AlertTriangle size={15} className="text-rose-600" />
          <h3 className="text-sm font-bold text-rose-700">
            High Priority Red Flags
          </h3>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          {redFlags.length} alerts
        </span>
      </div>
      <div className="space-y-3">
        {redFlags.map(flag => (
          <RedFlagCard key={flag.id} flag={flag} />
        ))}
      </div>
    </section>
  );
}