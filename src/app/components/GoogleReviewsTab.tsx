import React from 'react';
import { Star } from 'lucide-react';
import type { GoogleReview, RiskLevel } from '@/data/auditData';

function highlightKeywords(text: string, keywords: string[]) {
  if (!keywords.length) return text;
  const pattern = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(pattern);
  return parts.map((part, i) => {
    const isKeyword = keywords.some(k => k.toLowerCase() === part.toLowerCase());
    if (isKeyword) {
      return (
        <mark
          key={`gkw-${i}`}
          className="rounded px-0.5"
          style={{ background: '#FEF3C7', color: '#B45309', fontWeight: 600 }}
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={`star-${i}`}
          size={13}
          style={{ color: i <= rating ? '#D97706' : '#E2E8F0', fill: i <= rating ? '#D97706' : 'none' }}
        />
      ))}
    </div>
  );
}

function getSentimentBorder(sentiment: RiskLevel) {
  if (sentiment === 'critical') return '#FECDD3';
  if (sentiment === 'moderate') return '#FDE68A';
  return '#A7F3D0';
}

function ReviewCard({ review }: { review: GoogleReview }) {
  return (
    <div
      className="evidence-card rounded-xl border p-4 transition-all duration-200 bg-white shadow-sm"
      style={{
        borderColor: '#E2E8F0',
        borderLeft: `3px solid ${getSentimentBorder(review.sentiment)}`,
      }}
    >
      {/* Reviewer header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-slate-100 text-slate-700">
            {review.reviewer.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-slate-900">
              {review.reviewer}
            </p>
            <p className="text-xs text-slate-500">
              {review.tenure}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StarRating rating={review.rating} />
          <span className="text-xs text-slate-400">
            {review.date}
          </span>
        </div>
      </div>

      {/* Review text */}
      <p className="text-sm leading-relaxed mb-3 text-slate-600">
        &ldquo;{highlightKeywords(review.excerpt, review.keywords)}&rdquo;
      </p>

      {/* Keywords */}
      <div className="flex flex-wrap gap-1.5">
        {review.keywords.map(kw => (
          <span
            key={`kw-${review.id}-${kw}`}
            className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500"
          >
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}

interface Props {
  reviews: GoogleReview[];
}

export default function GoogleReviewsTab({ reviews }: Props) {
  if (!reviews.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Star size={40} className="text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-700">
          No low-rating reviews indexed
        </p>
        <p className="text-xs mt-1 text-slate-400">
          1 and 2-star Google Maps reviews for this society will appear here once indexed.
        </p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {reviews.map(r => (
        <ReviewCard key={r.id} review={r} />
      ))}
    </div>
  );
}