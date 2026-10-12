import React from 'react';
import { AlertTriangle, Calendar, ExternalLink, Layers3, Users } from 'lucide-react';
import type { EvidenceRecord, RedFlag } from '@/data/auditData';

function getTagColors(level: RedFlag['tagLevel']) {
  if (level === 'high') {
    return {
      text: '#BE123C',
      bg: '#FFF1F2',
      border: '#FECDD3',
      leftBar: '#E11D48',
      label: 'High risk',
    };
  }
  if (level === 'moderate') {
    return {
      text: '#B45309',
      bg: '#FFFBEB',
      border: '#FDE68A',
      leftBar: '#D97706',
      label: 'Moderate risk',
    };
  }
  return {
    text: '#047857',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    leftBar: '#059669',
    label: 'Low risk',
  };
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

function scopeLabel(scope: RedFlag['scope']) {
  if (scope === 'society') return 'Society scope';
  if (scope === 'locality') return 'Locality context';
  return 'City context';
}

function RedFlagCard({ flag, evidence }: { flag: RedFlag; evidence: EvidenceRecord[] }) {
  const colors = getTagColors(flag.tagLevel);
  const citations = flag.evidenceIds
    .map((evidenceId) => evidence.find((record) => record.id === evidenceId))
    .filter((record): record is EvidenceRecord => Boolean(record));

  return (
    <div
      className="rounded-xl border p-5 transition-all duration-200 bg-white shadow-sm"
      style={{
        borderColor: colors.border,
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
              style={{
                background: colors.bg,
                color: colors.text,
                borderColor: colors.border,
              }}
            >
              {colors.label}
            </span>
            <span className="text-[10px] font-black uppercase tracking-wide rounded-md bg-slate-100 text-slate-600 px-2 py-1">
              {scopeLabel(flag.scope)}
            </span>
            <h4 className="text-sm font-bold text-slate-900">{flag.title}</h4>
          </div>
          <p className="text-sm leading-relaxed mb-3 text-slate-600">{flag.body}</p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            {flag.reportedBy && (
              <span className="flex items-center gap-1">
                <Users size={11} />
                {flag.reportedBy}
              </span>
            )}
            {flag.date && (
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {flag.date}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
              <Layers3 size={11} /> Citations
            </span>
            {citations.length === 0 ? (
              <span className="text-[11px] text-slate-400">No displayable citation</span>
            ) : (
              citations.map((record, index) => {
                const directUrl = isHttpUrl(record.sourceUrl) ? record.sourceUrl : null;
                const destinationUrl = isHttpUrl(record.sourceDestinationUrl)
                  ? record.sourceDestinationUrl
                  : null;
                const url = directUrl || destinationUrl;
                const label = `${index + 1}. ${record.sourceDomain || record.sourceName || 'Source'}`;

                return url ? (
                  <a
                    key={`red-flag-${flag.id}-source-${record.id}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={directUrl ? 'Open exact source' : 'Open source destination'}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                  >
                    {label}
                    <ExternalLink size={10} />
                  </a>
                ) : (
                  <span
                    key={`red-flag-${flag.id}-source-${record.id}`}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600"
                  >
                    {label}
                  </span>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  redFlags: RedFlag[];
  evidence?: EvidenceRecord[];
}

export default function RedFlagsBanner({ redFlags, evidence = [] }: Props) {
  if (!redFlags.length) return null;
  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200">
          <AlertTriangle size={15} className="text-rose-600" />
          <h3 className="text-sm font-bold text-rose-700">Grounded risk findings</h3>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          {redFlags.length} {redFlags.length === 1 ? 'finding' : 'findings'}
        </span>
      </div>
      <div className="space-y-3">
        {redFlags.map((flag) => (
          <RedFlagCard key={flag.id} flag={flag} evidence={evidence} />
        ))}
      </div>
    </section>
  );
}
