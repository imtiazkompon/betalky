'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, Bookmark, CheckCircle2, Sparkles } from 'lucide-react';
import { VocabularyWord, UserWordProgress } from '@/lib/vocabulary/types';
import { speakEnglishWord } from '@/lib/vocabulary/speech';
import { toggleBookmarkWord, markWordStatus } from '@/lib/vocabulary/vocabulary-store';

interface WordDetailModalProps {
  word: VocabularyWord | null;
  progress?: UserWordProgress;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function WordDetailModal({
  word,
  progress,
  onClose,
  onUpdated,
}: WordDetailModalProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(progress?.is_bookmarked ?? false);
  const [status, setStatus] = useState(progress?.status ?? 'unseen');

  if (!word) return null;

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
    onUpdated?.();
  };

  const handleToggleLearned = () => {
    const nextStatus = status === 'learned' ? 'learning' : 'learned';
    markWordStatus(word.id, nextStatus);
    setStatus(nextStatus);
    onUpdated?.();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-200 relative overflow-hidden"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top Badges */}
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100">
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

          {/* Word & Pronunciation */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {word.word}
              </h3>
              <p className="text-sm font-mono text-slate-400 mt-0.5">{word.pronunciation}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePlayAudio}
                className={`p-3 rounded-2xl transition ${
                  isPlayingAudio
                    ? 'bg-blue-600 text-white animate-pulse'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                }`}
                title="Pronounce"
              >
                <Volume2 className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleToggleBookmark}
                className={`p-3 rounded-2xl transition ${
                  isBookmarked
                    ? 'bg-amber-50 text-amber-500 border border-amber-200'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-400'
                }`}
                title="Bookmark"
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-amber-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Meaning & Bengali */}
          <div className="mt-4 space-y-2">
            <p className="text-sm text-slate-700 font-medium">{word.english_definition}</p>
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100/90">
              <span className="text-[10px] uppercase font-bold text-amber-700/80 block mb-0.5">
                বাংলা অর্থ
              </span>
              <p className="font-hind-siliguri text-base font-bold text-slate-900">
                {word.bengali_meaning}
              </p>
            </div>
          </div>

          {/* Example */}
          <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <p className="text-xs sm:text-sm text-slate-800 font-medium italic">
              &ldquo;{word.example_sentence}&rdquo;
            </p>
            <p className="font-hind-siliguri text-xs text-slate-600">
              {word.example_translation}
            </p>
          </div>

          {/* User Sentence Note if written */}
          {progress?.user_sentence && (
            <div className="mt-3 p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900">
              <span className="font-bold block mb-0.5">Your Saved Sentence:</span>
              &ldquo;{progress.user_sentence}&rdquo;
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleToggleLearned}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition active:scale-95 ${
                status === 'learned'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'border border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {status === 'learned' ? 'Marked as Learned' : 'Mark as Learned'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

