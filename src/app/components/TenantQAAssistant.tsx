'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Send,
  Sparkles,
} from 'lucide-react';
import type { AssistantCitation, SocietyAuditData } from '@/data/auditData';

interface TenantQAAssistantProps {
  auditData: SocietyAuditData;
}

interface AssistantResult {
  status: 'answered' | 'insufficient_evidence' | 'audit_expired' | 'error';
  answer: string;
  citations: AssistantCitation[];
  additionalSearchPerformed: boolean;
}

const PRESET_QUESTIONS = [
  'Water tanker frequency & charges',
  'Deposit refund track record',
  'Monsoon road & traffic conditions',
  'Bachelor and visitor policy',
];

const INSUFFICIENT_ANSWER =
  "We didn't find enough reliable information to answer this confidently.";
const REQUEST_FAILED_ANSWER = "We couldn't complete this request right now. Please try again.";

function readMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;
  const data = payload as Record<string, unknown>;
  if (typeof data.answer === 'string' && data.answer.trim()) return data.answer;
  if (typeof data.message === 'string' && data.message.trim()) return data.message;
  return fallback;
}

function readCitations(payload: unknown): AssistantCitation[] {
  if (!payload || typeof payload !== 'object') return [];
  const citations = (payload as Record<string, unknown>).citations;
  if (!Array.isArray(citations)) return [];

  const validCitations = citations.filter((citation): citation is AssistantCitation => {
    if (!citation || typeof citation !== 'object') return false;
    const item = citation as Record<string, unknown>;
    return (
      typeof item.evidenceId === 'string' &&
      typeof item.title === 'string' &&
      typeof item.sourceDomain === 'string' &&
      (item.sourceUrl === null || typeof item.sourceUrl === 'string') &&
      (item.scope === 'society' || item.scope === 'locality' || item.scope === 'city')
    );
  });

  return Array.from(
    new Map(validCitations.map((citation) => [citation.evidenceId, citation])).values()
  );
}

export default function TenantQAAssistant({ auditData }: TenantQAAssistantProps) {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<AssistantResult | null>(null);
  const [askedTopic, setAskedTopic] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [searchPhase, setSearchPhase] = useState<'dossier' | 'additional'>('dossier');
  const activeController = useRef<AbortController | null>(null);

  useEffect(() => {
    activeController.current?.abort();
    setResult(null);
    setAskedTopic('');
    setQuestion('');
    setIsAnswering(false);
    setSearchPhase('dossier');

    return () => activeController.current?.abort();
  }, [auditData.auditId]);

  const handleAsk = async (queryText: string) => {
    const normalizedQuestion = queryText.trim();
    if (!normalizedQuestion || isAnswering || !auditData.auditId) return;

    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;

    setAskedTopic(normalizedQuestion);
    setIsAnswering(true);
    setSearchPhase('dossier');
    setResult(null);
    const phaseTimer = window.setTimeout(() => setSearchPhase('additional'), 1_200);
    let didTimeout = false;
    const requestTimer = window.setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, 90_000);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditId: auditData.auditId,
          question: normalizedQuestion,
          dossier: auditData.assistantDossier,
        }),
        signal: controller.signal,
      });
      const payload: unknown = await response.json().catch(() => null);
      if (controller.signal.aborted) {
        if (didTimeout && activeController.current === controller) {
          setResult({
            status: 'error',
            answer: REQUEST_FAILED_ANSWER,
            citations: [],
            additionalSearchPerformed: false,
          });
        }
        return;
      }

      const responseStatus =
        payload && typeof payload === 'object'
          ? (payload as Record<string, unknown>).status
          : undefined;
      const responseCode =
        payload && typeof payload === 'object'
          ? (payload as Record<string, unknown>).code
          : undefined;

      if (response.status === 409 || responseCode === 'audit_expired') {
        setResult({
          status: 'audit_expired',
          answer:
            'This audit is no longer available. Run the society audit again before asking another question.',
          citations: [],
          additionalSearchPerformed: false,
        });
        return;
      }

      if (!response.ok) {
        setResult({
          status: 'error',
          answer: readMessage(
            payload,
            REQUEST_FAILED_ANSWER
          ),
          citations: [],
          additionalSearchPerformed: Boolean(
            (payload as Record<string, unknown> | null)?.additionalSearchPerformed
          ),
        });
        return;
      }

      if (responseStatus === 'insufficient_evidence') {
        setResult({
          status: 'insufficient_evidence',
          answer: readMessage(payload, INSUFFICIENT_ANSWER),
          citations: readCitations(payload),
          additionalSearchPerformed: Boolean(
            (payload as Record<string, unknown> | null)?.additionalSearchPerformed
          ),
        });
        return;
      }

      const answer = readMessage(payload, '');
      if (!answer) {
        setResult({
          status: 'error',
          answer: INSUFFICIENT_ANSWER,
          citations: [],
          additionalSearchPerformed: false,
        });
        return;
      }

      const citations = readCitations(payload);
      if (citations.length === 0) {
        setResult({
          status: 'error',
          answer: INSUFFICIENT_ANSWER,
          citations: [],
          additionalSearchPerformed: false,
        });
        return;
      }

      setResult({
        status: 'answered',
        answer,
        citations,
        additionalSearchPerformed: Boolean(
          (payload as Record<string, unknown> | null)?.additionalSearchPerformed
        ),
      });
    } catch {
      if (controller.signal.aborted) {
        if (didTimeout && activeController.current === controller) {
          setResult({
            status: 'error',
            answer: REQUEST_FAILED_ANSWER,
            citations: [],
            additionalSearchPerformed: false,
          });
        }
        return;
      }
      setResult({
        status: 'error',
        answer: REQUEST_FAILED_ANSWER,
        citations: [],
        additionalSearchPerformed: false,
      });
    } finally {
      window.clearTimeout(phaseTimer);
      window.clearTimeout(requestTimer);
      if (activeController.current === controller) {
        activeController.current = null;
        setIsAnswering(false);
        setQuestion('');
      }
    }
  };

  const resultIsWarning =
    result?.status === 'insufficient_evidence' ||
    result?.status === 'audit_expired' ||
    result?.status === 'error';

  return (
    <div className="mb-8 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-100 bg-purple-50 text-purple-600">
          <Bot size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Tenant Due-Diligence Assistant</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-700">
              <Sparkles size={11} /> Grounded AI
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Ask about {auditData.societyName} ({auditData.city}) — answers use retrieved evidence and at most one targeted public-source search
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {PRESET_QUESTIONS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => void handleAsk(item)}
            disabled={isAnswering || !auditData.auditId}
            className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {item}
          </button>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleAsk(question);
        }}
        className="relative flex items-center gap-2"
      >
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={`Ask what the retrieved records say about ${auditData.societyName}...`}
          maxLength={500}
          disabled={isAnswering || !auditData.auditId}
          className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-4 pr-12 text-sm text-slate-900 shadow-xs outline-none placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-400 disabled:bg-slate-50"
        />
        <button
          type="submit"
          disabled={isAnswering || !question.trim() || !auditData.auditId}
          className="absolute right-1.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-purple-600 text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Ask the evidence assistant"
        >
          {isAnswering ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </form>

      {(result || isAnswering) && (
        <div
          className={`mt-4 rounded-xl border p-4 ${
            resultIsWarning
              ? 'border-amber-200 bg-amber-50/70'
              : 'border-purple-100 bg-purple-50/50'
          }`}
        >
          <div
            className={`mb-1.5 flex items-center gap-2 text-xs font-semibold ${
              resultIsWarning ? 'text-amber-800' : 'text-purple-800'
            }`}
          >
            {resultIsWarning ? <AlertCircle size={13} /> : <Sparkles size={13} />}
            <span>{askedTopic}</span>
          </div>

          {isAnswering ? (
            <div className="flex items-center gap-2 py-1 text-sm text-slate-600">
              <Loader2 size={16} className="animate-spin text-purple-600" />
              <span>
                {searchPhase === 'dossier'
                  ? 'Searching existing evidence…'
                  : 'Searching additional public sources if needed…'}
              </span>
            </div>
          ) : result ? (
            <div className="text-sm leading-relaxed text-slate-700">
              <p>{result.answer}</p>
              {result.additionalSearchPerformed && (
                <p className="mt-2 text-[11px] font-bold text-purple-700">
                  One targeted public-source search was used for this question.
                </p>
              )}

              {result.citations.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                    Sources
                  </p>
                  {result.citations.map((citation) => {
                    const content = (
                      <>
                        <span className="min-w-0 flex-1 truncate">{citation.title}</span>
                        <span className="shrink-0 text-[10px] uppercase text-slate-500">
                          {citation.scope} scope
                        </span>
                        {citation.sourceUrl && <ExternalLink size={12} className="shrink-0" />}
                      </>
                    );

                    return citation.sourceUrl ? (
                      <a
                        key={`assistant-source-${citation.evidenceId}-${citation.scope}`}
                        href={citation.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-purple-300 hover:text-purple-700"
                      >
                        {content}
                      </a>
                    ) : (
                      <div
                        key={`assistant-source-${citation.evidenceId}-${citation.scope}`}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                        title={citation.sourceDomain}
                      >
                        {content}
                      </div>
                    );
                  })}
                </div>
              )}

              {result.status === 'answered' && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                  <CheckCircle2 size={12} />
                  <span>
                    Based on {result.citations.length}{' '}
                    {result.citations.length === 1 ? 'supporting source' : 'supporting sources'}
                  </span>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
