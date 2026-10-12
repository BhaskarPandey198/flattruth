'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, MapPin, ChevronDown, Loader2 } from 'lucide-react';
import { CITIES } from '@/data/auditData';
import { AUDIT_PRESETS, type AuditPreset } from '@/data/auditPresets';

interface SearchSectionProps {
  activeChipId: string;
  submittedQuery: string;
  selectedCity: string;
  onCityChange: (city: string) => void;
  onChipSelect: (preset: AuditPreset) => void;
  onSearch: (query: string, city: string) => void;
  isLoading: boolean;
}

export default function SearchSection({
  activeChipId,
  submittedQuery,
  selectedCity,
  onCityChange,
  onChipSelect,
  onSearch,
  isLoading,
}: SearchSectionProps) {
  const [query, setQuery] = useState('');
  const [isCityOpen, setIsCityOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(submittedQuery);
  }, [submittedQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!query.trim()) {
      inputRef.current?.focus();
      return;
    }

    onSearch(query.trim(), selectedCity);
  };

  return (
    <section className="pt-6 pb-4 text-center">
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
        Know the ground reality before you pay your deposit.
      </h1>
      <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
        Independent risk audits grounded in retrieved reviews, community discussions, and
        public-interest reporting.
      </p>

      {/* Main Search Bar */}
      <div className="mt-6 max-w-3xl mx-auto relative">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-300 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-200/60 transition-all duration-200"
        >
          {/* City Dropdown */}
          <div className="relative w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsCityOpen((v) => !v)}
              className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-xs font-extrabold text-slate-800 border border-slate-200 transition-all duration-150 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-emerald-600" />
                <span>{selectedCity}</span>
              </div>
              <ChevronDown size={13} className="text-slate-400" />
            </button>

            {isCityOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 text-left animate-tab-reveal">
                {CITIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onCityChange(c.label);
                      setIsCityOpen(false);
                    }}
                    className={`w-full px-3.5 py-2 text-xs font-bold text-left transition-colors flex items-center justify-between ${
                      selectedCity === c.label
                        ? 'bg-emerald-50 text-emerald-700 font-extrabold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span>{c.label}</span>
                    {selectedCity === c.label && (
                      <span className="text-emerald-600 text-xs">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Input: Accepts Any Society or PIN */}
          <div className="relative flex-1 w-full">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type any society name, locality, or 6-digit PIN..."
              className="w-full px-3 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none bg-transparent"
              autoComplete="off"
            />
          </div>

          {/* Audit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-400 active:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm hover:shadow-lg hover:shadow-emerald-500/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-150 cursor-pointer flex-shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Auditing...</span>
              </>
            ) : (
              <>
                <Search size={14} />
                <span>Generate Due-Diligence Audit</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Try Chips Suite */}
        <div className="flex items-center justify-center gap-2 mt-3.5 flex-wrap">
          <span className="text-xs text-slate-500 font-extrabold">Quick try:</span>
          {AUDIT_PRESETS.map((chip) => {
            const isActive = activeChipId === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  setQuery(chip.query);
                  onChipSelect(chip);
                }}
                disabled={isLoading}
                className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition-all duration-150 border cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-500 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50/60 hover:shadow-xs'
                } disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
