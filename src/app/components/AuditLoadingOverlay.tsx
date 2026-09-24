'use client';

import React, { useEffect, useState } from 'react';

const STAGES = [
  { label: 'Parsing local map reviews and ratings...', from: 0, to: 30 },
  { label: 'Scanning community threads for water & deposit disputes...', from: 31, to: 70 },
  { label: 'Synthesizing risk signals & calculating Tenant Risk Index...', from: 71, to: 100 },
];

interface AuditLoadingOverlayProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export default function AuditLoadingOverlay({ isVisible, onComplete }: AuditLoadingOverlayProps) {
  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setStageIndex(0);
      setFadeOut(false);
      return;
    }

    const totalDuration = 2000;
    const intervalMs = 20;
    const steps = totalDuration / intervalMs;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const rawPct = (currentStep / steps) * 100;
      const pct = Math.min(Math.round(rawPct), 100);
      setProgress(pct);

      if (pct >= 71) setStageIndex(2);
      else if (pct >= 31) setStageIndex(1);
      else setStageIndex(0);

      if (pct >= 100) {
        clearInterval(timer);
        setFadeOut(true);
        setTimeout(() => {
          onComplete?.();
        }, 350);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isVisible, onComplete]);

  if (!isVisible && !fadeOut) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300"
      style={{
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(8px)',
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}
    >
      <div className="rounded-2xl border border-slate-200 p-8 flex flex-col items-center gap-6 w-full max-w-md mx-4 bg-white shadow-xl">
        {/* Animated shield icon */}
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-emerald-50 border border-emerald-200">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        {/* Title */}
        <div className="text-center">
          <h3 className="text-lg font-bold mb-1 text-slate-900">
            Running Live Audit
          </h3>
          <p className="text-sm text-slate-500">
            Aggregating public signals in real time
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full space-y-2">
          <div className="w-full h-2 rounded-full overflow-hidden bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #059669, #34D399)',
                boxShadow: '0 0 8px rgba(5,150,105,0.4)',
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium transition-all duration-300 text-emerald-700">
              {STAGES[stageIndex]?.label}
            </p>
            <span className="text-xs font-bold tabular-nums text-emerald-700">
              {progress}%
            </span>
          </div>
        </div>

        {/* Stage dots */}
        <div className="flex items-center gap-3">
          {STAGES.map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  background: i <= stageIndex ? '#059669' : '#E2E8F0',
                  boxShadow: i === stageIndex ? '0 0 6px rgba(5,150,105,0.5)' : 'none',
                  transform: i === stageIndex ? 'scale(1.3)' : 'scale(1)',
                }}
              />
              {i < STAGES.length - 1 && (
                <div
                  className="w-6 h-px transition-all duration-300"
                  style={{ background: i < stageIndex ? '#059669' : '#E2E8F0' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
