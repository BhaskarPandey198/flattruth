'use client';

import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import type { RiskLevel } from '@/data/auditData';

interface Props {
  score: number;
  level: RiskLevel;
}

function getGaugeColor(level: RiskLevel) {
  if (level === 'high') return '#E11D48';
  if (level === 'moderate') return '#D97706';
  if (level === 'insufficient_evidence') return '#94A3B8';
  return '#059669';
}

function getRiskLabel(level: RiskLevel) {
  if (level === 'high') return 'High Risk';
  if (level === 'moderate') return 'Moderate';
  if (level === 'insufficient_evidence') return 'Not Enough Direct Evidence';
  return 'Low Risk';
}

export default function RiskGaugeChart({ score, level }: Props) {
  const color = getGaugeColor(level);
  const data = [{ name: 'score', value: score, fill: color }];

  return (
    <div className="relative" style={{ width: 200, height: 200 }}>
      <ResponsiveContainer width={200} height={200}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="100%"
          startAngle={225}
          endAngle={-45}
          data={data}
          barSize={16}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          {/* Track */}
          <RadialBar
            background={{ fill: '#E2E8F0' }}
            dataKey="value"
            angleAxisId={0}
            cornerRadius={8}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      {/* Center overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ pointerEvents: 'none' }}
      >
        <span className="text-5xl font-extrabold tabular-nums leading-none" style={{ color }}>
          {score}
        </span>
        <span className="text-sm font-semibold mt-1 text-slate-400">/ 100</span>
        <span
          className="text-xs font-bold mt-1.5 px-2 py-0.5 rounded-full"
          style={{ background: `${color}18`, color }}
        >
          {getRiskLabel(level)}
        </span>
      </div>
    </div>
  );
}
