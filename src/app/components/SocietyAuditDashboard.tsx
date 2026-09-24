'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Toaster } from 'sonner';
import { QUICK_TRY_CHIPS, PRESTIGE_FALCON_CITY, type SocietyAuditData } from '@/data/auditData';
import TopBar from './TopBar';
import SearchSection from './SearchSection';
import AuditSkeleton from './AuditSkeleton';
import AuditLoadingOverlay from './AuditLoadingOverlay';
import SocietySummaryHeader from './SocietySummaryHeader';
import CategoryScoreGrid from './CategoryScoreGrid';
import RedFlagsBanner from './RedFlagsBanner';
import EvidenceTabs from './EvidenceTabs';
import LeaseClauseGenerator from './LeaseClauseGenerator';
import TenantQAAssistant from './TenantQAAssistant';

function buildSocietyContext(data: SocietyAuditData): string {
  const topFlags = data.redFlags.slice(0, 2).map(f => f.title).join('; ');
  const cats = data.categories.map(c => `${c.label}: ${c.score}/100 (${c.headline})`).join(', ');
  return `Risk Index: ${data.tenantRiskIndex}/100. Categories: ${cats}. Key issues: ${topFlags}. Signal counts: ${data.signalCounts.googleReviews} Google reviews, ${data.signalCounts.redditThreads} Reddit threads.`;
}

export default function SocietyAuditDashboard() {
  const [auditData, setAuditData] = useState<SocietyAuditData>(PRESTIGE_FALCON_CITY);
  const [isLoading, setIsLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [pendingData, setPendingData] = useState<SocietyAuditData | null>(null);
  const [activeChipId, setActiveChipId] = useState<string>('chip-pfc');
  const isDraftingRef = useRef(false);

  // When overlay completes, reveal the new data synchronously
  const handleOverlayComplete = useCallback(() => {
    if (pendingData) {
      setAuditData(pendingData);
      setPendingData(null);
    }
    setShowOverlay(false);
    setIsLoading(false);
    isDraftingRef.current = false;
  }, [pendingData]);

  const triggerSocietySwitch = useCallback((chipId: string, data: SocietyAuditData) => {
    if (chipId === activeChipId) return;
    setActiveChipId(chipId);
    setPendingData(data);
    setIsLoading(true);
    setShowOverlay(true);
    isDraftingRef.current = true;
  }, [activeChipId]);

  const handleChipSelect = useCallback((chipId: string, data: SocietyAuditData) => {
    triggerSocietySwitch(chipId, data);
  }, [triggerSocietySwitch]);

  const handleSearch = useCallback((query: string, _city: string) => {
    const match = QUICK_TRY_CHIPS.find(
      c => c.label.toLowerCase().includes(query.toLowerCase())
    );
    if (match) {
      triggerSocietySwitch(match.id, match.data);
    }
  }, [triggerSocietySwitch]);

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
      {/* Multi-stage loading overlay */}
      <AuditLoadingOverlay isVisible={showOverlay} onComplete={handleOverlayComplete} />

      <TopBar />
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-16 pb-20">
        <SearchSection
          activeChipId={activeChipId}
          onChipSelect={handleChipSelect}
          onSearch={handleSearch}
          isLoading={isLoading}
        />
        {isLoading && !showOverlay ? (
          <AuditSkeleton />
        ) : (
          <div className="fade-in space-y-6 mt-2">
            <SocietySummaryHeader auditData={auditData} isAiAnalyzing={false} />
            <CategoryScoreGrid categories={auditData.categories} isAiAnalyzing={false} />
            <RedFlagsBanner redFlags={auditData.redFlags} />
            <EvidenceTabs auditData={auditData} />
            {/* Tenant Due-Diligence Assistant — between Category Breakdown and Lease Safeguards */}
            <TenantQAAssistant
              societyName={auditData.societyName}
              societyContext={buildSocietyContext(auditData)}
            />
            <LeaseClauseGenerator
              leaseClauses={auditData.leaseClauses}
              societyName={auditData.societyName}
              isAiLoading={false}
              isAiGenerated={false}
            />
          </div>
        )}
      </main>
    </div>
  );
}