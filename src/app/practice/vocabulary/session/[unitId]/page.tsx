'use client';

import React, { useState, useEffect, use, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import VocabSubNav from '@/components/vocabulary/VocabSubNav';
import VocabularyCard from '@/components/vocabulary/VocabularyCard';
import PracticeQuiz from '@/components/vocabulary/PracticeQuiz';
import SessionCompletion from '@/components/vocabulary/SessionCompletion';
import {
  getAllVocabularyWords,
  getAllVocabularyUnits,
  getUserProgressMap,
  saveLearningSession,
} from '@/lib/vocabulary/vocabulary-store';
import { generateQuizForWords } from '@/lib/vocabulary/quiz-generator';
import {
  VocabularyWord,
  VocabularyUnit,
  QuizQuestion,
  LearningSessionState,
} from '@/lib/vocabulary/types';

interface PageProps {
  params: Promise<{ unitId: string }>;
}

function SessionPageContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const unitId = resolvedParams.unitId || '';

  const [unit, setUnit] = useState<VocabularyUnit | null>(null);
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [allWords, setAllWords] = useState<VocabularyWord[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, any>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  // Session phases: 'learn' | 'quiz' | 'completed'
  const [sessionPhase, setSessionPhase] = useState<'learn' | 'quiz' | 'completed'>('learn');

  // Quiz questions & results
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizResults, setQuizResults] = useState<{
    accuracy: number;
    correctCount: number;
    incorrectCount: number;
    difficultWordIds: string[];
  } | null>(null);

  const [sessionId] = useState<string>(
    () => `session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  );

  useEffect(() => {
    const all = getAllVocabularyWords();
    const allUnits = getAllVocabularyUnits();
    const pMap = getUserProgressMap();

    const targetUnit = allUnits.find((u) => u.id === unitId) || allUnits[0];
    const unitWords = all.filter((w) => w.unit_id === targetUnit?.id);

    setUnit(targetUnit || null);
    setWords(unitWords.length > 0 ? unitWords : all.slice(0, 10));
    setAllWords(all);
    setProgressMap(pMap);

    // Save in-progress session
    if (targetUnit) {
      saveLearningSession({
        id: sessionId,
        level: targetUnit.level,
        unit_id: targetUnit.id,
        unit_title: targetUnit.title,
        session_status: 'in_progress',
        words_studied: unitWords.map((w) => w.id),
        started_at: new Date().toISOString(),
      });
    }
  }, [unitId, sessionId]);

  const handleStartQuiz = () => {
    const questions = generateQuizForWords(words, allWords);
    setQuizQuestions(questions);
    setSessionPhase('quiz');
  };

  const handleQuizFinish = (results: {
    totalQuestions: number;
    correctCount: number;
    incorrectCount: number;
    accuracy: number;
    difficultWordIds: string[];
  }) => {
    setQuizResults(results);
    setSessionPhase('completed');

    if (unit) {
      saveLearningSession({
        id: sessionId,
        level: unit.level,
        unit_id: unit.id,
        unit_title: unit.title,
        session_status: 'completed',
        words_studied: words.map((w) => w.id),
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        accuracy: results.accuracy,
        correct_count: results.correctCount,
        incorrect_count: results.incorrectCount,
        difficult_words: results.difficultWordIds,
      });
    }
  };

  const handleRestartUnit = () => {
    setCurrentIndex(0);
    setSessionPhase('learn');
    setQuizResults(null);
  };

  if (!unit || words.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-slate-500 text-sm">Loading session...</p>
      </div>
    );
  }

  const currentWord = words[currentIndex];
  const difficultWords = (quizResults?.difficultWordIds || [])
    .map((id) => allWords.find((w) => w.id === id))
    .filter(Boolean) as VocabularyWord[];

  return (
    <div className="min-h-screen text-slate-800 antialiased font-sans">
      <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        <VocabSubNav />

        {/* Phase Indicator Bar */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              {unit.level}
            </span>
            <span className="text-slate-900 font-bold truncate max-w-xs sm:max-w-md">
              {unit.title}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <span
              className={`px-2.5 py-1 rounded-full ${
                sessionPhase === 'learn'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              1. Learn ({currentIndex + 1}/{words.length})
            </span>
            <span
              className={`px-2.5 py-1 rounded-full ${
                sessionPhase === 'quiz'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              2. Practice Quiz
            </span>
            <span
              className={`px-2.5 py-1 rounded-full ${
                sessionPhase === 'completed'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              3. Results
            </span>
          </div>
        </div>

        {/* Phase 1: Interactive Learning Cards */}
        {sessionPhase === 'learn' && currentWord && (
          <VocabularyCard
            word={currentWord}
            currentIndex={currentIndex}
            totalWords={words.length}
            userProgress={progressMap[currentWord.id]}
            onPrev={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            onNext={() => setCurrentIndex((prev) => Math.min(words.length - 1, prev + 1))}
            onCompleteSession={handleStartQuiz}
            onProgressUpdated={() => setProgressMap(getUserProgressMap())}
          />
        )}

        {/* Phase 2: Practice Quiz */}
        {sessionPhase === 'quiz' && (
          <PracticeQuiz
            questions={quizQuestions}
            studiedWords={words}
            sessionId={sessionId}
            onFinish={handleQuizFinish}
          />
        )}

        {/* Phase 3: Completion Results */}
        {sessionPhase === 'completed' && quizResults && (
          <SessionCompletion
            unitTitle={unit.title}
            level={unit.level}
            wordsStudied={words}
            accuracy={quizResults.accuracy}
            correctCount={quizResults.correctCount}
            incorrectCount={quizResults.incorrectCount}
            difficultWords={difficultWords}
            onRestartUnit={handleRestartUnit}
            onReviewDifficult={() => {
              if (difficultWords.length > 0) {
                setWords(difficultWords);
                setCurrentIndex(0);
                setSessionPhase('learn');
              }
            }}
          />
        )}
      </main>
    </div>
  );
}

export default function SessionPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <p className="text-slate-500 text-sm">Loading session...</p>
        </div>
      }
    >
      <SessionPageContent {...props} />
    </Suspense>
  );
}
