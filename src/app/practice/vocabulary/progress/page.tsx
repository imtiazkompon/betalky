'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Flame,
  CheckCircle2,
  Award,
  Target,
  TrendingUp,
} from 'lucide-react';
import VocabSubNav from '@/components/vocabulary/VocabSubNav';
import { getVocabularyStats } from '@/lib/vocabulary/vocabulary-store';
import { VocabularyStats } from '@/lib/vocabulary/types';

export default function ProgressDashboardPage() {
  const [stats, setStats] = useState<VocabularyStats | null>(null);

  useEffect(() => {
    setStats(getVocabularyStats());
  }, []);

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-slate-500 text-sm">Loading statistics...</p>
      </div>
    );
  }

  const maxWeeklyCount = Math.max(1, ...stats.weeklyActivity.map((w) => w.count));

  return (
    <div className="min-h-screen text-slate-800 antialiased font-sans">
      <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10 sm:space-y-12">
        <VocabSubNav />

        {/* Header */}
        <div className="space-y-1">
          <h1 className="font-display text-[40px] sm:text-[52px] font-bold leading-[0.98] tracking-[-0.02em] text-slate-950">
            Learning <span className="font-serif-display font-normal italic tracking-[-0.01em]">progress.</span>
          </h1>
          <p className="text-[15px] leading-[1.7] text-slate-600 max-w-[540px]">
            Your vocabulary activity and mastery analytics.
          </p>
        </div>

        {/* Top 4 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Mastered
            </span>
            <p className="text-2xl font-bold text-slate-900">{stats.totalWordsLearned}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-blue-500" />
              Accuracy
            </span>
            <p className="text-2xl font-bold text-slate-900">{stats.averageAccuracy}%</p>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-500" />
              Attempts
            </span>
            <p className="text-2xl font-bold text-slate-900">{stats.totalQuizAttempts}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              Streak
            </span>
            <p className="text-2xl font-bold text-slate-900">
              {stats.learningStreak}{' '}
              <span className="text-xs font-normal text-slate-400">days</span>
            </p>
          </div>
        </div>

        {/* Weekly Activity Chart */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[22px] sm:text-[24px] font-bold tracking-[-0.015em] text-slate-950">Weekly Activity</h2>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>

          <div className="flex items-end justify-between gap-2 h-36 pt-4 border-b border-slate-100">
            {stats.weeklyActivity.map((item, idx) => {
              const heightPct = Math.max(8, Math.round((item.count / maxWeeklyCount) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-mono font-semibold text-slate-400 opacity-0 group-hover:opacity-100 transition">
                    {item.count}
                  </span>
                  <div className="w-full max-w-[28px] bg-slate-100 rounded-t-lg overflow-hidden h-full flex items-end">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        item.count > 0 ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">{item.day}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Level Breakdown Progress */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-5">
          <h2 className="font-display text-[22px] sm:text-[24px] font-bold tracking-[-0.015em] text-slate-950">Progress by Level</h2>

          <div className="space-y-4">
            {/* Beginner */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-800">Beginner (Everyday)</span>
                <span className="text-slate-400">
                  {stats.levelProgress.Beginner.learned} / {stats.levelProgress.Beginner.total} ({stats.levelProgress.Beginner.percentage}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.levelProgress.Beginner.percentage}%` }}
                />
              </div>
            </div>

            {/* Intermediate */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-800">Intermediate (Expressive)</span>
                <span className="text-slate-400">
                  {stats.levelProgress.Intermediate.learned} / {stats.levelProgress.Intermediate.total} ({stats.levelProgress.Intermediate.percentage}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${stats.levelProgress.Intermediate.percentage}%` }}
                />
              </div>
            </div>

            {/* Advanced */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-800">Advanced (Nuanced)</span>
                <span className="text-slate-400">
                  {stats.levelProgress.Advanced.learned} / {stats.levelProgress.Advanced.total} ({stats.levelProgress.Advanced.percentage}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${stats.levelProgress.Advanced.percentage}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Action link */}
        <div className="pt-2 text-center">
          <Link
            href="/practice/vocabulary"
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
          >
            Continue Learning Words
          </Link>
        </div>
      </main>
    </div>
  );
}
