import React from 'react';
import { Shield } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';

export default function TopBar() {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm"
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-16">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <AppLogo size={32} />
              <span className="text-xl font-bold tracking-tight hidden sm:block text-slate-900">
                FlatTruth
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 text-xs font-medium text-slate-500 bg-slate-50">
              <Shield size={11} />
              <span>Unfiltered Rental Due Diligence</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {[
              { href: '/', label: 'Audit Dashboard' },
            ]?.map(item => (
              <a
                key={`nav-${item?.label}`}
                href={item?.href}
                className="text-sm font-medium transition-colors duration-150 text-emerald-600 hover:text-emerald-700"
              >
                {item?.label}
              </a>
            ))}
          </nav>

          {/* Right: data source badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Live Public Signal Network (Verified)</span>
              <span className="sm:hidden">Live Data</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}