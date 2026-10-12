'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, DatabaseZap, RefreshCw, Search } from 'lucide-react';
import { Toaster } from 'sonner';
import type { SocietyAuditData } from '@/data/auditData';
import type { AuditPreset } from '@/data/auditPresets';
import type { PropertyResolutionCandidate } from '@/lib/evidence/types';
import TopBar from './TopBar';
import SearchSection from './SearchSection';
import AuditSkeleton from './AuditSkeleton';
import AuditLoadingOverlay from './AuditLoadingOverlay';
import SocietySummaryHeader from './SocietySummaryHeader';
import PropertySnapshot from './PropertySnapshot';
import CategoryScoreGrid from './CategoryScoreGrid';
import LocalityContextSection from './LocalityContextSection';
import RedFlagsBanner from './RedFlagsBanner';
import EvidenceTabs from './EvidenceTabs';
import LeaseClauseGenerator from './LeaseClauseGenerator';
import TenantQAAssistant from './TenantQAAssistant';
import PropertyResolutionPrompt from './PropertyResolutionPrompt';
import WhatMattersBeforeSigning from './WhatMattersBeforeSigning';

interface AuditRequest {
  query: string;
  city: string;
  chipId: string;
  candidateId?: string;
}

interface AuditError {
  title: string;
  message: string;
}

function getApiError(_payload: unknown, _status: number): AuditError {
  return {
    title: "We couldn't complete this search",
    message: 'Please try again in a moment.',
  };
}

export default function SocietyAuditDashboard() {
  const [auditData, setAuditData] = useState<SocietyAuditData | null>(null);
  const [selectedCity, setSelectedCity] = useState('Bengaluru');
  const [isLoading, setIsLoading] = useState(false);
  const [activeChipId, setActiveChipId] = useState('');
  const [auditError, setAuditError] = useState<AuditError | null>(null);
  const [lastRequest, setLastRequest] = useState<AuditRequest | null>(null);
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [resolutionCandidates, setResolutionCandidates] = useState<PropertyResolutionCandidate[]>([]);
  const requestSequence = useRef(0);
  const activeController = useRef<AbortController | null>(null);

  const handleSearch = useCallback(async (query: string, city: string, chipId = '', candidateId = '') => {
    const normalizedQuery = query.trim();
    const normalizedCity = city.trim();
    if (!normalizedQuery || !normalizedCity) return;

    activeController.current?.abort();
    const controller = new AbortController();
    const requestId = ++requestSequence.current;
    const publicRequestId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `audit-${Date.now()}-${requestId}`;
    activeController.current = controller;

    const request = { query: normalizedQuery, city: normalizedCity, chipId, candidateId };
    setLastRequest(request);
    setActiveSearchQuery(normalizedQuery);
    setSelectedCity(normalizedCity);
    setActiveChipId(chipId);
    setAuditError(null);
    setAuditData(null);
    setResolutionCandidates([]);
    setIsLoading(true);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams();
      params.set('society', normalizedQuery);
      params.set('city', normalizedCity);
      window.history.replaceState(null, '', `?${params.toString()}`);
    }

    try {
      const apiParams = new URLSearchParams({ society: normalizedQuery, city: normalizedCity, requestId: publicRequestId });
      if (candidateId) apiParams.set('candidateId', candidateId);
      const response = await fetch(
        `/api/audit?${apiParams.toString()}`,
        { signal: controller.signal, cache: 'no-store' }
      );

      const payload: unknown = await response.json().catch(() => null);

      if (requestId !== requestSequence.current) return;
      if (!response.ok) {
        setAuditError(getApiError(payload, response.status));
        return;
      }

      const result = payload as {
        success?: boolean;
        status?:
          'retrieval_error' | 'needs_confirmation' | 'no_reliable_evidence' | 'partial' | 'complete';
        data?: SocietyAuditData;
        candidates?: PropertyResolutionCandidate[];
        error?: string;
        message?: string;
        requestId?: string;
      } | null;
      if (result?.requestId !== publicRequestId) return;
      if (result?.status === 'needs_confirmation' && result.candidates?.length) {
        setResolutionCandidates(result.candidates);
        return;
      }
      if (result?.status === 'no_reliable_evidence' && !result.data) {
        setAuditError({
          title: 'No reliable property match found',
          message: result.message || 'Check the society name and city, then try again.',
        });
        return;
      }
      if (!result.success || !result.data?.auditId) {
        setAuditError(getApiError(payload, response.status));
        return;
      }

      const effectiveCity = result.data.city || normalizedCity;
      setAuditData(result.data);
      setSelectedCity(effectiveCity);

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams();
        params.set('society', normalizedQuery);
        params.set('city', effectiveCity);
        window.history.replaceState(null, '', `?${params.toString()}`);
      }
    } catch {
      if (controller.signal.aborted || requestId !== requestSequence.current) return;
      setAuditError({
        title: "We couldn't complete this search",
        message: 'Please try again in a moment.',
      });
    } finally {
      if (requestId === requestSequence.current) {
        activeController.current = null;
        setIsLoading(false);
      }
    }
  }, []);

  const handleChipSelect = useCallback(
    (preset: AuditPreset) => {
      void handleSearch(preset.query, preset.city, preset.id);
    },
    [handleSearch]
  );

  const handleCityChange = useCallback((city: string) => {
    setSelectedCity(city);
    setActiveChipId('');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const urlSociety = params.get('society')?.trim();
    const urlCity = params.get('city')?.trim();

    if (urlSociety) {
      void handleSearch(urlSociety, urlCity || 'Bengaluru');
    }

    return () => {
      activeController.current?.abort();
    };
  }, [handleSearch]);

  const isNoEvidence = auditData?.auditStatus === 'no_reliable_evidence';
  const isPartial = auditData?.auditStatus === 'partial';

  return (
    <div className="min-h-screen bg-slate-100">
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
            fontFamily: 'var(--font-sans)',
          },
        }}
      />
      <AuditLoadingOverlay isVisible={isLoading} />

      <TopBar />
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-16 pb-20">
        <SearchSection
          activeChipId={activeChipId}
          submittedQuery={activeSearchQuery}
          selectedCity={selectedCity}
          onCityChange={handleCityChange}
          onChipSelect={handleChipSelect}
          onSearch={(query, city) => void handleSearch(query, city)}
          isLoading={isLoading}
        />

        {auditError && (
          <div
            className="mt-3 mb-6 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 shrink-0 text-rose-600" size={18} />
              <div>
                <p className="text-sm font-extrabold text-rose-900">{auditError.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-rose-700">{auditError.message}</p>
              </div>
            </div>
            {lastRequest && (
              <button
                type="button"
                onClick={() =>
                  void handleSearch(lastRequest.query, lastRequest.city, lastRequest.chipId, lastRequest.candidateId)
                }
                disabled={isLoading}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-extrabold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50"
              >
                <RefreshCw size={13} />
                Retry audit
              </button>
            )}
          </div>
        )}

        {!auditData && isLoading && <AuditSkeleton />}

        {!isLoading && resolutionCandidates.length > 0 && lastRequest && (
          <PropertyResolutionPrompt
            candidates={resolutionCandidates}
            onSelect={(candidateId) =>
              void handleSearch(lastRequest.query, lastRequest.city, lastRequest.chipId, candidateId)
            }
          />
        )}

        {!auditData && !isLoading && resolutionCandidates.length === 0 && !auditError && (
          <section className="mx-auto mt-8 max-w-3xl rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700">
              <Search size={22} />
            </div>
            <h2 className="mt-4 text-lg font-black text-slate-900">
              Start with a society and city
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
              FlatTruth reviews public sources first, then shows only the risks supported by those
              records. Areas without enough evidence remain unscored.
            </p>
          </section>
        )}

        {auditData && (
          <div className="fade-in mt-2 space-y-6">
            {isPartial && (
              <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4" role="status">
                <div className="flex items-start gap-3">
                  <DatabaseZap className="mt-0.5 shrink-0 text-blue-700" size={18} />
                  <div>
                    <p className="text-sm font-extrabold text-blue-950">
                      {auditData.categories.some((category) => category.score !== null)
                        ? 'What FlatTruth found'
                        : 'Property resolved — locality context available'}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-blue-800">
                      {auditData.categories.some((category) => category.score !== null)
                        ? "Some risks have strong public evidence, while others don't have enough information yet."
                        : 'Verified surrounding-area evidence is shown below without attributing it to the society.'}
                    </p>
                  </div>
                </div>
              </section>
            )}
            {isNoEvidence && (
              <section
                className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
                role="status"
              >
                <div className="flex items-start gap-3">
                  <DatabaseZap className="mt-0.5 shrink-0 text-amber-700" size={18} />
                  <div>
                    <p className="text-sm font-extrabold text-amber-950">
                      No reliable public evidence found
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-amber-800">
                      We didn't find enough reliable public information to generate a score.
                    </p>
                    {auditData.insufficiencyReasons.length > 0 && (
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-800">
                        {auditData.insufficiencyReasons.map((reason) => (
                          <li key={`dashboard-insufficiency-${reason}`}>{reason}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </section>
            )}

            <PropertySnapshot
              key={`property-snapshot-${auditData.auditId}`}
              auditData={auditData}
            />
            <SocietySummaryHeader auditData={auditData} isAiAnalyzing={false} />
            <WhatMattersBeforeSigning auditData={auditData} />
            <CategoryScoreGrid categories={auditData.categories} evidence={auditData.evidence} isAiAnalyzing={false} />
            <LocalityContextSection auditData={auditData} />
            <RedFlagsBanner redFlags={auditData.redFlags} evidence={auditData.evidence} />
            <EvidenceTabs auditData={auditData} />
            <TenantQAAssistant
              key={`tenant-assistant-${auditData.auditId}`}
              auditData={auditData}
            />
            <LeaseClauseGenerator
              leaseClauses={auditData.leaseClauses}
              societyName={auditData.societyName}
              evidence={auditData.evidence}
              isAiLoading={false}
              isAiGenerated={false}
            />
          </div>
        )}
      </main>
    </div>
  );
}
