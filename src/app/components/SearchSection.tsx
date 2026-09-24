'use client';

import React, { useState, useRef } from 'react';
import { Search, MapPin, ChevronDown, Loader2 } from 'lucide-react';
import { QUICK_TRY_CHIPS, CITIES, type SocietyAuditData } from '@/data/auditData';

interface SearchSectionProps {
  activeChipId: string;
  onChipSelect: (chipId: string, data: SocietyAuditData) => void;
  onSearch: (query: string, city: string) => void;
  isLoading: boolean;
}

export default function SearchSection({ activeChipId, onChipSelect, onSearch, isLoading }: SearchSectionProps) {
  const [query, setQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Bengaluru');
  const [cityOpen, setCityOpen] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);

  const handleSearch = () => {
    if (query.trim()) onSearch(query.trim(), selectedCity);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <section className="pt-10 pb-6">
      {/* Hero headline */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 text-slate-900">
          Know the truth before you sign.
        </h1>
        <p className="text-base sm:text-lg max-w-2xl mx-auto text-slate-600">
          Unfiltered risk audits for Indian housing societies — synthesized from verified tenant grievances and civic records.
        </p>
      </div>

      {/* Search bar row */}
      <div className="flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto mb-5">
        {/* City selector */}
        <div className="relative flex-shrink-0" ref={cityRef}>
          <button
            type="button"
            onClick={() => setCityOpen(v => !v)}
            className="flex items-center gap-2 px-4 h-12 rounded-xl border border-slate-300 text-sm font-semibold w-full sm:w-auto transition-colors duration-150 bg-white text-slate-900 hover:border-slate-400"
          >
            <MapPin size={15} className="text-emerald-600" />
            <span>{selectedCity}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          {cityOpen && (
            <div className="absolute top-14 left-0 z-50 rounded-xl border border-slate-200 shadow-lg min-w-[180px] overflow-hidden bg-white">
              {CITIES.map(city => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => { setSelectedCity(city.label); setCityOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm transition-colors duration-100"
                  style={{
                    background: selectedCity === city.label ? '#ECFDF5' : 'transparent',
                    color: selectedCity === city.label ? '#047857' : '#0F172A',
                    fontWeight: selectedCity === city.label ? 600 : 400,
                  }}
                >
                  {city.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search input */}
        <div className="flex-1 relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
          />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search society name, locality, or pincode…"
            className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-300 text-sm outline-none transition-all duration-150 focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 bg-white text-slate-900 placeholder-slate-400"
          />
        </div>

        {/* CTA button */}
        <button
          type="button"
          onClick={handleSearch}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-5 h-12 rounded-xl text-sm font-bold transition-all duration-150 disabled:opacity-60 flex-shrink-0 action-btn bg-emerald-600 text-white hover:bg-emerald-700"
          style={{ minWidth: '200px' }}
        >
          {isLoading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Auditing…</span>
            </>
          ) : (
            <>
              <Search size={15} />
              <span>Generate Due-Diligence Audit</span>
            </>
          )}
        </button>
      </div>

      {/* Quick-try chips */}
      <div className="flex flex-wrap gap-2 justify-center max-w-3xl mx-auto">
        <span className="text-xs font-medium self-center mr-1 text-slate-400">
          Quick try:
        </span>
        {QUICK_TRY_CHIPS.map(chip => (
          <button
            key={chip.id}
            type="button"
            onClick={() => onChipSelect(chip.id, chip.data)}
            disabled={isLoading}
            className="chip-btn px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-150 disabled:opacity-50"
            style={{
              background: activeChipId === chip.id ? '#ECFDF5' : '#FFFFFF',
              borderColor: activeChipId === chip.id ? '#10B981' : '#E2E8F0',
              color: activeChipId === chip.id ? '#047857' : '#64748B',
              fontWeight: activeChipId === chip.id ? 600 : 400,
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </section>
  );
}