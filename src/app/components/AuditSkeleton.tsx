import React from 'react';

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className ?? ''} bg-slate-100`}
    />
  );
}

export default function AuditSkeleton() {
  return (
    <div className="space-y-6 mt-2">
      {/* Society header skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-3">
            <SkeletonBlock className="h-8 w-2/3" />
            <SkeletonBlock className="h-4 w-1/2" />
            <div className="flex gap-3 flex-wrap pt-1">
              {['sk-b1', 'sk-b2', 'sk-b3'].map(k => (
                <SkeletonBlock key={k} className="h-6 w-28" />
              ))}
            </div>
            <div className="flex gap-6 pt-2">
              {['sk-s1', 'sk-s2', 'sk-s3'].map(k => (
                <SkeletonBlock key={k} className="h-12 w-24" />
              ))}
            </div>
          </div>
          <SkeletonBlock className="h-48 w-48 rounded-full mx-auto lg:mx-0 flex-shrink-0" />
        </div>
      </div>

      {/* Category cards skeleton — 4 cards in 2x2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {['sk-c1', 'sk-c2', 'sk-c3', 'sk-c4'].map(k => (
          <div key={k} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-9 w-9 rounded-lg" />
              <SkeletonBlock className="h-5 w-28" />
            </div>
            <SkeletonBlock className="h-10 w-16" />
            <SkeletonBlock className="h-2 w-full rounded-full" />
            <SkeletonBlock className="h-4 w-3/4" />
            <SkeletonBlock className="h-4 w-full" />
          </div>
        ))}
      </div>

      {/* Red flags skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-3">
        <SkeletonBlock className="h-6 w-48" />
        {['sk-f1', 'sk-f2', 'sk-f3'].map(k => (
          <SkeletonBlock key={k} className="h-20 w-full" />
        ))}
      </div>

      {/* Evidence tabs skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
        <div className="flex gap-6 border-b border-slate-200 pb-3">
          {['sk-t1', 'sk-t2', 'sk-t3'].map(k => (
            <SkeletonBlock key={k} className="h-5 w-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {['sk-e1', 'sk-e2', 'sk-e3', 'sk-e4', 'sk-e5', 'sk-e6'].map(k => (
            <div key={k} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <SkeletonBlock className="h-5 w-full" />
              <SkeletonBlock className="h-4 w-1/3" />
              <SkeletonBlock className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}