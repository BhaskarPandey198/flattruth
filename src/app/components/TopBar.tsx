'use client';

import React from 'react';
import Image from 'next/image';
import { Database, ShieldAlert } from 'lucide-react';

export default function TopBar() {
  return (
    <header className="w-full bg-white border-b border-slate-200/90 sticky top-0 z-50 shadow-xs m-0 p-0">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-16 h-14 sm:h-16 flex items-center justify-between">
        {/* Brand with Sliced Shield Asset */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 relative flex-shrink-0 flex items-center justify-center">
              <Image
                src="/assets/images/app_logo.png"
                alt="FlatTruth Logo"
                width={30}
                height={30}
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                priority
              />
            </div>
            <span className="font-black text-xl text-slate-900 tracking-tight">
              Flat<span className="text-emerald-600">Truth</span>
            </span>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            <ShieldAlert size={12} className="text-slate-500" />
            Unfiltered Rental Due Diligence
          </span>
        </div>

        {/* Evidence provenance badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
            <Database size={12} className="text-emerald-600" />
            <span>Source-linked public evidence</span>
          </span>
        </div>
      </div>
    </header>
  );
}
