'use client';

import React, { useState, useEffect, use, Suspense } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Volume2,
  Bookmark,
} from 'lucide-react';
import VocabSubNav from '@/components/vocabulary/VocabSubNav';
import WordDetailModal from '@/components/vocabulary/WordDetailModal';
import {
  getAllVocabularyWords,
  getAllVocabularyUnits,
  getUserProgressMap,
  toggleBookmarkWord,
} from '@/lib/vocabulary/vocabulary-store';
import { speakEnglishWord } from '@/lib/vocabulary/speech';
import { VocabularyLevel, VocabularyUnit, VocabularyWord } from '@/lib/vocabulary/types';

interface PageProps {
  params: Promise<{ level: string }>;
}

function LevelPageContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const rawLevel = resolvedParams.level || 'Beginner';
  const levelCapitalized =
    rawLevel.charAt(0).toUpperCase() + rawLevel.slice(1).toLowerCase();
  const currentLevel: VocabularyLevel = ['Beginner', 'Intermediate', 'Advanced'].includes(
    levelCapitalized
  )
    ? (levelCapitalized as VocabularyLevel)
    : 'Beginner';

  const [units, setUnits] = useState<VocabularyUnit[]>([]);
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, any>>({});
  const [selectedWordForModal, setSelectedWordForModal] = useState<VocabularyWord | null>(null);

  const loadData = () => {
    const allUnits = getAllVocabularyUnits().filter((u) => u.level === currentLevel);
    const allWords = getAllVocabularyWords().filter((w) => w.level === currentLevel);
    const pMap = getUserProgressMap();

    setUnits(allUnits);
    setWords(allWords);
    setProgressMap(pMap);
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('betalky_vocab_updated', handleUpdate);
    window.addEventListener('betalky_vocab_progress_updated', handleUpdate);

    return () => {
      window.removeEventListener('betalky_vocab_updated', handleUpdate);
      window.removeEventListener('betalky_vocab_progress_updated', handleUpdate);
    };
  }, [currentLevel]);

  const levelDescriptions: Record<VocabularyLevel, { title: string; desc: string }> = {
    Beginner: {
      title: 'Everyday English',
      desc: 'Practical vocabulary for daily conversations and routine tasks.',
    },
    Intermediate: {
      title: 'Expressive English',
      desc: 'Expressive vocabulary to articulate thoughts, workplace scenarios, and opinions.',
    },
    Advanced: {
      title: 'Nuanced English',
      desc: 'Sophisticated vocabulary for critical discussions and formal communication.',
    },
  };

  const handleAudioClick = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    speakEnglishWord(word);
  };

  const handleBookmarkClick = (e: React.MouseEvent, wordId: string) => {
    e.stopPropagation();
    toggleBookmarkWord(wordId);
    loadData();
  };

  return (
    <div className="min-h-screen text-slate-800 antialiased font-sans">
      <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10 sm:space-y-12">
        <VocabSubNav />

        {/* Level Banner */}
        <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              {currentLevel}
            </span>
            <span className="text-xs text-slate-400">
              {words.length} Words
            </span>
          </div>

          <h1 className="font-display text-[40px] sm:text-[52px] font-bold leading-[0.98] tracking-[-0.02em] text-slate-950">
            {levelDescriptions[currentLevel].title}
          </h1>

          <p className="text-[15px] leading-[1.7] text-slate-600 max-w-[540px]">
            {levelDescriptions[currentLevel].desc}
          </p>
        </section>

        {/* Units Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[22px] sm:text-[24px] font-bold tracking-[-0.015em] text-slate-950">Learning Units</h2>
            <span className="text-xs text-slate-400">10 words per unit</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {units.map((unit) => {
              const unitWords = words.filter((w) => w.unit_id === unit.id);
              const learnedInUnit = unitWords.filter(
                (w) => progressMap[w.id]?.status === 'learned'
              ).length;
              const isCompleted = unitWords.length > 0 && learnedInUnit === unitWords.length;
              const isInProgress = learnedInUnit > 0 && !isCompleted;

              return (
                <div
                  key={unit.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5"
                >
                  <div className="space-y-2 max-w-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Unit {unit.display_order}
                      </span>
                      {isCompleted ? (
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      ) : isInProgress ? (
                        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                          {learnedInUnit}/{unitWords.length} Learned
                        </span>
                      ) : null}
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{unit.title}</h3>

                    {/* Word Preview Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {unitWords.slice(0, 6).map((w) => (
                        <span
                          key={w.id}
                          className="px-2.5 py-0.5 rounded-lg bg-slate-50 border border-slate-200/60 text-[11px] font-medium text-slate-600"
                        >
                          {w.word}
                        </span>
                      ))}
                      {unitWords.length > 6 && (
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold text-slate-400">
                          +{unitWords.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/practice/vocabulary/session/${unit.id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 shrink-0"
                  >
                    <span>{isCompleted ? 'Review Unit' : isInProgress ? 'Continue Unit' : 'Start Unit'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* Level Vocabulary Word Directory */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[22px] sm:text-[24px] font-bold tracking-[-0.015em] text-slate-950">Word Directory</h2>
            <span className="text-xs text-slate-400">{words.length} words</span>
          </div>

          <div className="bg-white border border-[#E7E3DB] rounded-[24px] shadow-[0_30px_60px_-45px_rgba(14,13,11,0.35)] divide-y divide-slate-100 overflow-hidden">
            {words.map((w) => {
              const p = progressMap[w.id];
              const isBookmarked = p?.is_bookmarked ?? false;
              const isLearned = p?.status === 'learned';

              return (
                <div
                  key={w.id}
                  onClick={() => setSelectedWordForModal(w)}
                  className="p-5 sm:p-6 hover:bg-slate-50/70 transition flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">{w.word}</h4>
                      <span className="text-xs font-mono text-slate-400">{w.pronunciation}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {w.part_of_speech}
                      </span>
                      {isLearned && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1">{w.english_definition}</p>
                    <p className="font-hind-siliguri text-xs font-bold text-slate-800">
                      {w.bengali_meaning}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleAudioClick(e, w.word)}
                      className="p-2 rounded-full hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"
                      title="Pronounce"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleBookmarkClick(e, w.id)}
                      className={`p-2 rounded-full transition ${
                        isBookmarked
                          ? 'text-amber-500'
                          : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                      }`}
                      title="Bookmark"
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Word Detail Modal */}
        {selectedWordForModal && (
          <WordDetailModal
            word={selectedWordForModal}
            progress={progressMap[selectedWordForModal.id]}
            onClose={() => setSelectedWordForModal(null)}
            onUpdated={loadData}
          />
        )}
      </main>
    </div>
  );
}

export default function LevelPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <p className="text-slate-500 text-sm">Loading level...</p>
        </div>
      }
    >
      <LevelPageContent {...props} />
    </Suspense>
  );
}
