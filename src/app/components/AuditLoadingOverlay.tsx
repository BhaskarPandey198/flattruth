'use client';

import React, { useEffect, useState } from 'react';

const STAGES = [
  'Resolving the society and location...',
  'Retrieving community, news, and review evidence...',
  'Reviewing risk signals across public sources...',
];

interface AuditLoadingOverlayProps {
  isVisible: boolean;
}

export default function AuditLoadingOverlay({ isVisible }: AuditLoadingOverlayProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      return;
    }

    setProgress(6);
    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 94) return current;
        const remaining = 94 - current;
        return Math.min(94, current + Math.max(1, Math.ceil(remaining / 10)));
      });
    }, 350);

    return () => window.clearInterval(timer);
  }, [isVisible]);

  if (!isVisible) return null;

  const stageIndex = progress >= 71 ? 2 : progress >= 31 ? 1 : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(8px)',
      }}
      role="status"
      aria-live="polite"
      aria-label="Running evidence audit"
    >
      <div className="mx-4 flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#059669"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-pulse"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        <div className="text-center">
          <h3 className="mb-1 text-lg font-bold text-slate-900">Running Live Audit</h3>
          <p className="text-sm text-slate-500">Reviewing public sources for relevant evidence</p>
        </div>

        <div className="w-full space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #059669, #34D399)',
                boxShadow: '0 0 8px rgba(5,150,105,0.4)',
              }}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-left text-xs font-medium text-emerald-700 transition-all duration-300">
              {STAGES[stageIndex]}
            </p>
            <span className="text-xs font-bold tabular-nums text-emerald-700">{progress}%</span>
          </div>
        </div>

        <div className="flex items-center gap-3" aria-hidden="true">
          {STAGES.map((stage, index) => (
            <div key={stage} className="flex items-center gap-1.5">
              <div
                className="h-2 w-2 rounded-full transition-all duration-300"
                style={{
                  background: index <= stageIndex ? '#059669' : '#E2E8F0',
                  boxShadow: index === stageIndex ? '0 0 6px rgba(5,150,105,0.5)' : 'none',
                  transform: index === stageIndex ? 'scale(1.3)' : 'scale(1)',
                }}
              />
              {index < STAGES.length - 1 && (
                <div
                  className="h-px w-6 transition-all duration-300"
                  style={{ background: index < stageIndex ? '#059669' : '#E2E8F0' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
