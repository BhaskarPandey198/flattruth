'use client';

import React, { useState } from 'react';
import { MessageSquare, Star, Newspaper } from 'lucide-react';
import type { SocietyAuditData } from '@/data/auditData';
import RedditEvidenceTab from './RedditEvidenceTab';
import GoogleReviewsTab from './GoogleReviewsTab';
import NewsTab from './NewsTab';

interface Props {
  auditData: SocietyAuditData;
}

const TABS = [
  { id: 'tab-reddit', label: 'Reddit & Twitter', icon: MessageSquare, countKey: 'redditThreads' as const },
  { id: 'tab-google', label: '1 & 2 Star Google Reviews', icon: Star, countKey: 'googleReviews' as const },
  { id: 'tab-news', label: 'Civic & News Reports', icon: Newspaper, countKey: 'newsMentions' as const },
];

export default function EvidenceTabs({ auditData }: Props) {
  const [activeTab, setActiveTab] = useState('tab-reddit');

  return (
    <section className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      {/* Tab header */}
      <div className="flex overflow-x-auto scrollbar-thin border-b border-slate-200">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const count = auditData.signalCounts[tab.countKey];
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap transition-all duration-150 flex-shrink-0 border-b-2"
              style={{
                borderBottomColor: isActive ? '#10B981' : 'transparent',
                color: isActive ? '#047857' : '#64748B',
                background: isActive ? '#F0FDF4' : 'transparent',
              }}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
              <span
                className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                style={{
                  background: isActive ? '#DCFCE7' : '#F1F5F9',
                  color: isActive ? '#047857' : '#64748B',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="p-5 fade-in">
        {activeTab === 'tab-reddit' && <RedditEvidenceTab signals={auditData.redditSignals} />}
        {activeTab === 'tab-google' && <GoogleReviewsTab reviews={auditData.googleReviews} />}
        {activeTab === 'tab-news' && <NewsTab signals={auditData.newsSignals} />}
      </div>
    </section>
  );
}