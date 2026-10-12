'use client';

import React, { useMemo, useState } from 'react';
import { MessageSquare, Newspaper, Star } from 'lucide-react';
import type { SocietyAuditData } from '@/data/auditData';
import GoogleReviewsTab from './GoogleReviewsTab';
import NewsTab from './NewsTab';
import RedditEvidenceTab from './RedditEvidenceTab';

interface Props {
  auditData: SocietyAuditData;
}

const TABS = [
  {
    id: 'tab-community',
    label: 'Community & Web',
    icon: MessageSquare,
    activeClasses: 'bg-orange-600 text-white shadow-md border-orange-600',
    inactiveClasses:
      'bg-orange-50/80 text-orange-900 border-orange-200 hover:bg-orange-100 hover:border-orange-300',
    badgeActive: 'bg-white/25 text-white',
    badgeInactive: 'bg-orange-200/90 text-orange-950',
    iconActive: 'text-white scale-110',
    iconInactive: 'text-orange-600',
  },
  {
    id: 'tab-google',
    label: 'Google Maps Reviews',
    icon: Star,
    activeClasses: 'bg-amber-500 text-white shadow-md border-amber-600',
    inactiveClasses:
      'bg-amber-50/80 text-amber-950 border-amber-200 hover:bg-amber-100 hover:border-amber-300',
    badgeActive: 'bg-white/25 text-white',
    badgeInactive: 'bg-amber-200/90 text-amber-950',
    iconActive: 'text-white fill-white scale-110 drop-shadow-xs',
    iconInactive: 'text-amber-600 fill-amber-500',
  },
  {
    id: 'tab-news',
    label: 'News & Civic Context',
    icon: Newspaper,
    activeClasses: 'bg-blue-600 text-white shadow-md border-blue-700',
    inactiveClasses:
      'bg-blue-50/80 text-blue-950 border-blue-200 hover:bg-blue-100 hover:border-blue-300',
    badgeActive: 'bg-white/25 text-white',
    badgeInactive: 'bg-blue-200/90 text-blue-950',
    iconActive: 'text-white scale-110',
    iconInactive: 'text-blue-600',
  },
] as const;

export default function EvidenceTabs({ auditData }: Props) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('tab-community');
  const evidence = useMemo(() => auditData.evidence || [], [auditData.evidence]);

  const partitions = useMemo(
    () => ({
      community: evidence.filter((record) => record.type === 'community' || record.type === 'web'),
      google: evidence.filter((record) => record.type === 'google_review'),
      news: evidence.filter((record) => record.type === 'news' || record.type === 'civic'),
    }),
    [evidence]
  );

  const counts: Record<(typeof TABS)[number]['id'], number> = {
    'tab-community': partitions.community.length,
    'tab-google': partitions.google.length,
    'tab-news': partitions.news.length,
  };
  const topicHighlights = useMemo(() => {
    const labels: Record<string, string> = {
      water: 'Water', deposit: 'Deposit', civic: 'Civic infrastructure', rwa: 'RWA / society rules',
      traffic: 'Traffic', flooding: 'Flooding',
    };
    return Object.entries(labels).flatMap(([topic, label]) => {
      const matching = evidence.filter((record) => record.topics.includes(topic as never));
      return matching.length ? [{ topic, label, count: matching.length }] : [];
    });
  }, [evidence]);

  return (
    <section className="rounded-2xl border border-slate-200/90 overflow-hidden bg-white shadow-xs">
      <div className="px-4 pt-4 pb-3 bg-slate-50 border-b border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-base font-black text-slate-900">Source-backed evidence</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Public sources remain visible even when they are not used in the risk assessment.
            </p>
          </div>
          <span
            title="FlatTruth removes property ads, weak matches and irrelevant sources before calculating risk."
            className="cursor-help text-xs font-bold rounded-full bg-white border border-slate-200 px-2.5 py-1 text-slate-700"
          >
            {evidence.length} public sources found ·{' '}
            {evidence.filter((record) => record.includedInAnalysis).length} used in this assessment ·{' '}
            {evidence.filter((record) => !record.includedInAnalysis).length} filtered as weak or irrelevant
          </span>
        </div>

        {topicHighlights.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {topicHighlights.map((item) => (
              <span key={item.topic} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700">
                {item.label}: {item.count} source-backed signal{item.count === 1 ? '' : 's'}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2.5 sm:gap-3 items-center">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 border cursor-pointer ${
                  isActive ? tab.activeClasses : tab.inactiveClasses
                }`}
              >
                <tab.icon
                  size={16}
                  className={`transition-transform duration-200 ${
                    isActive ? tab.iconActive : tab.iconInactive
                  }`}
                />
                <span className="tracking-tight">{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-black transition-all ${
                    isActive ? tab.badgeActive : tab.badgeInactive
                  }`}
                >
                  {counts[tab.id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div key={activeTab} className="p-6 fade-in">
        {activeTab === 'tab-community' && <RedditEvidenceTab records={partitions.community} />}
        {activeTab === 'tab-google' && <GoogleReviewsTab records={partitions.google} />}
        {activeTab === 'tab-news' && <NewsTab records={partitions.news} />}
      </div>
    </section>
  );
}
