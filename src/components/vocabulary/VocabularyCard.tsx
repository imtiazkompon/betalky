'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
  Layers,
} from 'lucide-react';
import { VocabularyWord, UserWordProgress } from '@/lib/vocabulary/types';
import { speakEnglishWord } from '@/lib/vocabulary/speech';
import { toggleBookmarkWord, markWordStatus } from '@/lib/vocabulary/vocabulary-store';

interface VocabularyCardProps {
  word: VocabularyWord;
  currentIndex: number;
  totalWords: number;
  userProgress?: UserWordProgress;
  onPrev?: () => void;
  onNext?: () => void;
  onCompleteSession?: () => void;
  onProgressUpdated?: () => void;
}

export default function VocabularyCard({
  word,
  currentIndex,
  totalWords,
  userProgress,
  onPrev,
  onNext,
  onCompleteSession,
  onProgressUpdated,
}: VocabularyCardProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(userProgress?.is_bookmarked ?? false);
  const [status, setStatus] = useState(userProgress?.status ?? 'unseen');

  const handlePlayAudio = () => {
    speakEnglishWord(
      word.word,
      0.9,
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false),
      () => setIsPlayingAudio(false)
    );
  };

  const handleToggleBookmark = () => {
    const next = toggleBookmarkWord(word.id);
    setIsBookmarked(next);
    onProgressUpdated?.();
  };

  const handleToggleLearned = () => {
    const nextStatus = status === 'learned' ? 'learning' : 'learned';
    markWordStatus(word.id, nextStatus);
    setStatus(nextStatus);
    onProgressUpdated?.();
  };

  const isLastWord = currentIndex === totalWords - 1;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-4">
      {/* Session Progress Header */}
      <div className="flex items-center justify-between text-xs font-medium text-slate-500 px-1">
        <span className="flex items-center gap-1.5 text-blue-600 font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          Word {currentIndex + 1} of {totalWords}
        </span>
        <div className="flex items-center gap-2">
          <div className="w-24 sm:w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / totalWords) * 100}%` }}
            />
          </div>
          <span className="text-[11px] font-mono font-semibold">
            {Math.round(((currentIndex + 1) / totalWords) * 100)}%
          </span>
        </div>
      </div>

      {/* Main Flashcard Container */}
      <motion.div
        key={word.id}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/90 relative overflow-hidden"
      >
        {/* Top Badges & Actions */}
        <div className="flex items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100">
              {word.part_of_speech}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600">
              {word.level}
            </span>
            {status === 'learned' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Learned
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleBookmark}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark word'}
              className={`p-2 rounded-full transition active:scale-90 ${
                isBookmarked
                  ? 'bg-amber-50 text-amber-500 border border-amber-200'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200/60'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Word, Phonetics & Native Audio Button */}
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h2 className="font-serif-display text-[48px] sm:text-[60px] italic font-normal leading-none tracking-[-0.01em] text-slate-950">
              {word.word}
            </h2>
            <p className="text-sm sm:text-base font-mono text-slate-400 mt-1">
              {word.pronunciation}
            </p>
          </div>

          <button
            type="button"
            onClick={handlePlayAudio}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition shadow-xs active:scale-95 shrink-0 ${
              isPlayingAudio
                ? 'bg-blue-600 text-white animate-pulse'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100'
            }`}
            title="Listen to pronunciation"
          >
            <Volume2 className={`w-6 h-6 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
          </button>
        </div>

        {/* English Definition */}
        <div className="mt-5 space-y-1">
          <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
            Definition
          </p>
          <p className="text-base sm:text-[17px] text-slate-800 leading-snug font-medium">
            {word.english_definition}
          </p>
        </div>

        {/* Bengali Meaning */}
        <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100/90">
          <p className="text-[11px] uppercase tracking-wider font-bold text-amber-700/80 mb-0.5">
            বাংলা অর্থ
          </p>
          <p className="font-hind-siliguri text-base sm:text-lg font-bold text-slate-900 leading-normal">
            {word.bengali_meaning}
          </p>
        </div>

        {/* Example Sentence with Bengali Translation */}
        <div className="mt-5 space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Example in context</span>
          </div>
          <p className="text-sm sm:text-[15px] text-slate-800 font-medium leading-relaxed italic">
            &ldquo;{word.example_sentence}&rdquo;
          </p>
          <p className="font-hind-siliguri text-xs sm:text-sm text-slate-600 leading-normal pt-1 border-t border-slate-200/60">
            {word.example_translation}
          </p>
        </div>

        {/* Collocations & Usage */}
        {word.collocations && word.collocations.length > 0 && (
          <div className="mt-4 space-y-1.5">
            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
              Common Usage / Collocations
            </p>
            <div className="flex flex-wrap gap-1.5">
              {word.collocations.map((col, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
                >
                  {col}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Synonyms & Antonyms */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-4 justify-between text-xs">
          {word.synonyms && word.synonyms.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Synonyms:
              </span>
              <p className="text-slate-700 font-medium">{word.synonyms.join(', ')}</p>
            </div>
          )}
          {word.antonyms && word.antonyms.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Antonyms:
              </span>
              <p className="text-slate-700 font-medium">{word.antonyms.join(', ')}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Card Controls & Navigation */}
      <div className="flex items-center justify-between gap-3 px-1 pt-1">
        <button
          type="button"
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <button
          type="button"
          onClick={handleToggleLearned}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition active:scale-95 ${
            status === 'learned'
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
              : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {status === 'learned' ? 'Marked as Learned' : 'Mark as Learned'}
        </button>

        {isLastWord ? (
          <button
            type="button"
            onClick={onCompleteSession}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
          >
            Start Practice Quiz
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

