'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Award,
  RotateCcw,
  BookOpen,
  ArrowRight,
  AlertCircle,
  Home,
} from 'lucide-react';
import { VocabularyWord } from '@/lib/vocabulary/types';

interface SessionCompletionProps {
  unitTitle: string;
  level: string;
  wordsStudied: VocabularyWord[];
  accuracy: number;
  correctCount: number;
  incorrectCount: number;
  difficultWords: VocabularyWord[];
  onRestartUnit?: () => void;
  onReviewDifficult?: () => void;
}

export default function SessionCompletion({
  unitTitle,
  level,
  wordsStudied,
  accuracy,
  correctCount,
  incorrectCount,
  difficultWords,
  onRestartUnit,
  onReviewDifficult,
}: SessionCompletionProps) {
  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/90 text-center space-y-6"
      >
        {/* Celebration Trophy Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
          <Award className="w-8 h-8" />
        </div>

        {/* Title & Unit */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
            {level} • Completed
          </span>
          <h2 className="font-display text-[32px] sm:text-[40px] font-bold tracking-[-0.02em] text-slate-950 pt-2">
            Session Completed!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">{unitTitle}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 py-4 border-y border-slate-100">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-2xl font-extrabold text-blue-600">{accuracy}%</p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Quiz Accuracy</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-2xl font-extrabold text-slate-900">{wordsStudied.length}</p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Words Studied</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-2xl font-extrabold text-emerald-600">{correctCount}</p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Correct</p>
          </div>
        </div>

        {/* Difficult Words List if any */}
        {difficultWords.length > 0 && (
          <div className="text-left space-y-2 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Words Recommended for Extra Review ({difficultWords.length}):</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {difficultWords.map((word) => (
                <span
                  key={word.id}
                  className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-xs font-semibold text-slate-800 shadow-2xs"
                >
                  {word.word}{' '}
                  <span className="font-hind-siliguri text-slate-500 text-[11px]">
                    ({word.bengali_meaning.split(',')[0]})
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {difficultWords.length > 0 && onReviewDifficult && (
            <button
              type="button"
              onClick={onReviewDifficult}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Review Difficult Words
            </button>
          )}

          <Link
            href="/practice/vocabulary"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
          >
            <Home className="w-3.5 h-3.5" />
            Vocabulary Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

