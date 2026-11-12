'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RecentFeedbackSummary } from '@/types/betalky';
import { mergeHistorySessions } from '@/lib/session-store';
import { ArrowRight, ArrowUpRight, Mic, Search } from 'lucide-react';
import { PageHeader, It, primaryPill, primaryPillDisc } from '@/components/ui/Editorial';

export default function HistoryPage() {
  const [sessions, setSessions] = useState<RecentFeedbackSummary[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    // 1. Immediately load real stored sessions from user practice
    const initialReal = mergeHistorySessions([]);
    setSessions(initialReal);

    // 2. Query Supabase API for any authenticated cloud sessions
    async function fetchSessions() {
      try {
        const res = await fetch('/api/sessions');
        if (res.ok) {
          const data = await res.json();
          let serverFormatted: RecentFeedbackSummary[] = [];
          if (data.sessions && data.sessions.length > 0) {
            serverFormatted = data.sessions.map((s: any) => {
              const assessment = Array.isArray(s.assessment_reports)
                ? s.assessment_reports[0]
                : s.assessment_reports;
              return {
                id: s.id,
                session_id: s.id,
                topic_title: s.topic_title,
                date_formatted: new Date(s.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }),
                score: assessment?.overall_score || 6.0,
                descriptor: assessment?.assessment_verdict || 'Completed practice',
              };
            });
          }

          const combined = mergeHistorySessions(serverFormatted);
          setSessions(combined);
        } else {
          setSessions(mergeHistorySessions([]));
        }
      } catch (err) {
        console.warn('History fetch note:', err);
        setSessions(mergeHistorySessions([]));
      }
    }
    fetchSessions();
  }, []);

  const filtered = sessions.filter((s) => {
    const matchesSearch = s.topic_title.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-3xl space-y-10 px-4 py-10 sm:px-6 sm:py-14">
        <PageHeader
          title={
            <>
              Every word, <It>on the record.</It>
            </>
          }
          lede="Review and revisit every speaking assessment you've completed."
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by topic…"
              className="w-full rounded-full border border-[#E7E3DB] bg-white/80 py-3 pl-11 pr-4 text-[14px] text-slate-900 placeholder:text-slate-400 transition focus:border-slate-950 focus:outline-none"
            />
          </div>
          <Link href="/dashboard" className={`${primaryPill} self-start sm:self-auto`}>
            New practice
            <span className={primaryPillDisc}>
              <Mic className="h-4 w-4" />
            </span>
          </Link>
        </div>

        {filtered.length > 0 ? (
          <ul className="border-t border-slate-950">
            {filtered.map((item, index) => (
              <li key={item.id}>
                <Link
                  href={`/assessment/${item.session_id}`}
                  className="group flex items-center gap-4 border-b border-[#E7E3DB] py-5 transition-colors hover:bg-white/60 sm:gap-6"
                >
                  <span className="w-7 shrink-0 text-[12px] tabular-nums text-slate-400">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display line-clamp-2 text-[16px] font-bold tracking-[-0.01em] text-slate-950 transition-transform duration-500 group-hover:translate-x-1 sm:line-clamp-1 sm:text-[18px]">
                      {item.topic_title}
                    </h3>
                    <p className="mt-1 text-[12px] text-slate-500">
                      {item.date_formatted}
                      <span className="mx-1.5 text-slate-300">·</span>
                      {item.descriptor}
                    </p>
                  </div>
                  <span className="font-serif-display shrink-0 text-[32px] leading-none text-slate-950">
                    {typeof item.score === 'number' ? item.score.toFixed(1) : item.score}
                  </span>
                  <ArrowUpRight className="hidden h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-slate-950 sm:block" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-[24px] border border-dashed border-[#CDC7BB] px-6 py-16 text-center">
            <p className="font-serif-display text-[26px] italic text-slate-800">
              {search ? 'No matching sessions.' : 'Your first session awaits.'}
            </p>
            <p className="mx-auto mt-2 max-w-[360px] text-[13px] leading-relaxed text-slate-500">
              {search
                ? 'Try a different keyword or topic title.'
                : 'Record a one-minute answer and your assessment will be kept here.'}
            </p>
            {!search && (
              <Link href="/dashboard" className={`${primaryPill} mt-8`}>
                Start practising
                <span className={primaryPillDisc}>
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
