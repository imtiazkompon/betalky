'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Flame,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  Bookmark,
  Search,
  ArrowRight,
} from 'lucide-react';
import VocabSubNav from '@/components/vocabulary/VocabSubNav';
import {
  getAllVocabularyUnits,
  getVocabularyStats,
  getWordsDueForReview,
} from '@/lib/vocabulary/vocabulary-store';
import { VocabularyStats, VocabularyLevel, VocabularyUnit } from '@/lib/vocabulary/types';

export default function VocabularyLandingPage() {
  const [stats, setStats] = useState<VocabularyStats | null>(null);
  const [units, setUnits] = useState<VocabularyUnit[]>([]);
  const [dueWordsCount, setDueWordsCount] = useState(0);

  const loadData = () => {
    const s = getVocabularyStats();
    const u = getAllVocabularyUnits();
    const due = getWordsDueForReview();
    setStats(s);
    setUnits(u);
    setDueWordsCount(due.length);
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('betalky_vocab_updated', handleUpdate);
    window.addEventListener('betalky_vocab_progress_updated', handleUpdate);
    window.addEventListener('betalky_vocab_session_updated', handleUpdate);

    return () => {
      window.removeEventListener('betalky_vocab_updated', handleUpdate);
      window.removeEventListener('betalky_vocab_progress_updated', handleUpdate);
      window.removeEventListener('betalky_vocab_session_updated', handleUpdate);
    };
  }, []);

  const levelInfo: {
    level: VocabularyLevel;
    subtitle: string;
    color: string;
    bgBadge: string;
  }[] = [
    {
      level: 'Beginner',
      subtitle: 'Everyday English',
      color: 'border-slate-200/80 hover:border-emerald-300',
      bgBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      level: 'Intermediate',
      subtitle: 'Expressive English',
      color: 'border-slate-200/80 hover:border-blue-300',
      bgBadge: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      level: 'Advanced',
      subtitle: 'Nuanced English',
      color: 'border-slate-200/80 hover:border-indigo-300',
      bgBadge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
  ];

  return (
    <div className="min-h-screen text-slate-800 antialiased font-sans">
      <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10 sm:space-y-12">
        {/* Internal Sub-Navigation */}
        <VocabSubNav />

        {/* Section A: Welcome & Header */}
        <section className="space-y-5">
          <div className="space-y-1.5">
            <h1 className="font-display text-[40px] sm:text-[52px] font-bold leading-[0.98] tracking-[-0.02em] text-slate-950">
              Build your <span className="font-serif-display font-normal italic tracking-[-0.01em]">vocabulary.</span>
            </h1>
            <p className="text-[15px] leading-[1.7] text-slate-600 max-w-[540px]">
              Learn practical words across three proficiency levels with pronunciation and interactive quizzes.
            </p>
          </div>

          {/* Activity Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-1">
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Learned
              </span>
              <p className="text-2xl font-bold text-slate-900">
                {stats?.totalWordsLearned ?? 0}
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                In Progress
              </span>
              <p className="text-2xl font-bold text-slate-900">
                {stats?.wordsCurrentlyLearning ?? 0}
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                Due Today
              </span>
              <p className="text-2xl font-bold text-slate-900">
                {dueWordsCount}
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                Streak
              </span>
              <p className="text-2xl font-bold text-slate-900">
                {stats?.learningStreak ?? 0}{' '}
                <span className="text-xs font-normal text-slate-400">days</span>
              </p>
            </div>
          </div>
        </section>

        {/* Section C: Continue Learning Card */}
        {stats?.lastSession ? (
          <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  {stats.lastSession.level}
                </span>
                <span className="text-xs text-slate-400">In Progress</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 pt-0.5">
                {stats.lastSession.unit_title}
              </h3>
            </div>

            <Link
              href={`/practice/vocabulary/session/${stats.lastSession.unit_id}`}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 shrink-0"
            >
              <span>Resume Session</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </section>
        ) : (
          <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Ready to Start
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 pt-0.5">
                Start with Beginner Unit 1
              </h3>
              <p className="text-xs text-slate-500">
                Learn 10 everyday conversation words with audio and quizzes.
              </p>
            </div>

            <Link
              href="/practice/vocabulary/level/Beginner"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 shrink-0"
            >
              <span>Start Unit 1</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </section>
        )}

        {/* Section D: Daily Revision Card */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Daily Revision</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 pt-0.5">
              {dueWordsCount > 0
                ? `${dueWordsCount} words ready for review`
                : 'All caught up for today'}
            </h3>
            <p className="text-xs text-slate-500">
              {dueWordsCount > 0
                ? 'Review previously learned words to strengthen memory.'
                : 'No words currently due for revision.'}
            </p>
          </div>

          <Link
            href="/practice/vocabulary/review"
            className={`inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold transition active:scale-95 shrink-0 ${
              dueWordsCount > 0
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            }`}
          >
            <span>{dueWordsCount > 0 ? 'Start Review' : 'Open Review Deck'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </section>

        {/* Section B: Level Selection (3 Clean Cards) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[22px] sm:text-[24px] font-bold tracking-[-0.015em] text-slate-950">
              Proficiency Levels
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {levelInfo.map((item) => {
              const levelProgress = stats?.levelProgress[item.level] || {
                total: 0,
                learned: 0,
                percentage: 0,
              };

              return (
                <div
                  key={item.level}
                  className={`bg-white rounded-3xl p-5 sm:p-6 border shadow-2xs transition-all flex flex-col justify-between gap-5 ${item.color}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.bgBadge}`}
                      >
                        {item.level}
                      </span>
                      <span className="text-xs text-slate-400">
                        {levelProgress.learned} / {levelProgress.total}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {item.subtitle}
                      </h3>
                    </div>

                    {/* Minimal Progress Bar */}
                    <div className="pt-1 space-y-1.5">
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${levelProgress.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-medium text-slate-400">
                        <span>Progress</span>
                        <span>{levelProgress.percentage}%</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/practice/vocabulary/level/${item.level}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition active:scale-95"
                  >
                    <span>Explore Level</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section E: Quick Actions */}
        <section className="space-y-3 pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/practice/vocabulary/level/Beginner"
              className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 transition shadow-2xs group flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition">
                Learn Words
              </span>
            </Link>

            <Link
              href="/practice/vocabulary/review"
              className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 transition shadow-2xs group flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-900 group-hover:text-amber-600 transition">
                Daily Review
              </span>
            </Link>

            <Link
              href="/practice/vocabulary/my-words"
              className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 transition shadow-2xs group flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Bookmark className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-900 group-hover:text-purple-600 transition">
                Notebook
              </span>
            </Link>

            <Link
              href="/practice/vocabulary/search"
              className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 transition shadow-2xs group flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Search className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-900 group-hover:text-emerald-600 transition">
                Search
              </span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
