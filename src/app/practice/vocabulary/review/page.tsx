'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw, CheckCircle2, Sparkles, BookOpen, ArrowRight } from 'lucide-react';
import VocabSubNav from '@/components/vocabulary/VocabSubNav';
import PracticeQuiz from '@/components/vocabulary/PracticeQuiz';
import SessionCompletion from '@/components/vocabulary/SessionCompletion';
import {
  getAllVocabularyWords,
  getWordsDueForReview,
} from '@/lib/vocabulary/vocabulary-store';
import { generateQuizForWords } from '@/lib/vocabulary/quiz-generator';
import { VocabularyWord, QuizQuestion } from '@/lib/vocabulary/types';

export default function DailyReviewPage() {
  const [reviewWords, setReviewWords] = useState<VocabularyWord[]>([]);
  const [allWords, setAllWords] = useState<VocabularyWord[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizResults, setQuizResults] = useState<{
    accuracy: number;
    correctCount: number;
    incorrectCount: number;
    difficultWordIds: string[];
  } | null>(null);

  useEffect(() => {
    const all = getAllVocabularyWords();
    const due = getWordsDueForReview();
    setAllWords(all);
    setReviewWords(due);
  }, []);

  const handleStartReview = (wordsToReview: VocabularyWord[]) => {
    const questions = generateQuizForWords(wordsToReview, allWords);
    setReviewWords(wordsToReview);
    setQuizQuestions(questions);
    setIsStarted(true);
    setIsCompleted(false);
  };

  const handleQuizFinish = (results: {
    totalQuestions: number;
    correctCount: number;
    incorrectCount: number;
    accuracy: number;
    difficultWordIds: string[];
  }) => {
    setQuizResults(results);
    setIsCompleted(true);
  };

  const difficultWords = (quizResults?.difficultWordIds || [])
    .map((id) => allWords.find((w) => w.id === id))
    .filter(Boolean) as VocabularyWord[];

  return (
    <div className="min-h-screen text-slate-800 antialiased font-sans">
      <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        <VocabSubNav />

        {!isStarted && !isCompleted && (
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-1">
              <h1 className="font-display text-[40px] sm:text-[52px] font-bold leading-[0.98] tracking-[-0.02em] text-slate-950">
                Daily <span className="font-serif-display font-normal italic tracking-[-0.01em]">revision.</span>
              </h1>
              <p className="text-[15px] leading-[1.7] text-slate-600 max-w-[540px]">
                Strengthen long-term retention with scheduled spaced reviews.
              </p>
            </div>

            {/* Status Card */}
            {reviewWords.length > 0 ? (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Due For Review
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      {reviewWords.length} words ready
                    </h3>
                  </div>
                  <span className="text-3xl font-bold text-amber-600">
                    {reviewWords.length}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {reviewWords.map((w) => (
                    <span
                      key={w.id}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800"
                    >
                      {w.word}
                    </span>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleStartReview(reviewWords)}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
                  >
                    Start Revision Quiz
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-2xs text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">All Caught Up!</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    No words scheduled for review right now. Learn a new unit or practice an instant refresh.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleStartReview(allWords.slice(0, 10))}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition active:scale-95 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    Refresh 10 Words
                  </button>
                  <Link
                    href="/practice/vocabulary/level/Beginner"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition active:scale-95 shadow-xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Learn New Unit
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quiz In Progress */}
        {isStarted && !isCompleted && (
          <PracticeQuiz
            questions={quizQuestions}
            studiedWords={reviewWords}
            onFinish={handleQuizFinish}
          />
        )}

        {/* Review Completed */}
        {isCompleted && quizResults && (
          <SessionCompletion
            unitTitle="Daily Spaced Repetition Revision"
            level="All Levels"
            wordsStudied={reviewWords}
            accuracy={quizResults.accuracy}
            correctCount={quizResults.correctCount}
            incorrectCount={quizResults.incorrectCount}
            difficultWords={difficultWords}
            onRestartUnit={() => {
              setIsStarted(false);
              setIsCompleted(false);
            }}
          />
        )}
      </main>
    </div>
  );
}
