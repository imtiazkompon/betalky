'use client';

import React, { useState, useEffect } from 'react';
import { Search, Volume2, Bookmark } from 'lucide-react';
import VocabSubNav from '@/components/vocabulary/VocabSubNav';
import WordDetailModal from '@/components/vocabulary/WordDetailModal';
import {
  getAllVocabularyWords,
  getUserProgressMap,
  toggleBookmarkWord,
} from '@/lib/vocabulary/vocabulary-store';
import { speakEnglishWord } from '@/lib/vocabulary/speech';
import { VocabularyWord, UserWordProgress } from '@/lib/vocabulary/types';

export default function SearchDiscoveryPage() {
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');
  const [posFilter, setPosFilter] = useState('All');

  const [allWords, setAllWords] = useState<VocabularyWord[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, UserWordProgress>>({});
  const [selectedWordForModal, setSelectedWordForModal] = useState<VocabularyWord | null>(null);

  const loadData = () => {
    setAllWords(getAllVocabularyWords());
    setProgressMap(getUserProgressMap());
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
  }, []);

  const filteredWords = allWords.filter((w) => {
    if (levelFilter !== 'All' && w.level !== levelFilter) return false;
    if (posFilter !== 'All' && w.part_of_speech !== posFilter) return false;

    if (!query.trim()) return true;

    const q = query.toLowerCase().trim();
    const matchEng = w.word.toLowerCase().includes(q);
    const matchDef = w.english_definition.toLowerCase().includes(q);
    const matchBen = w.bengali_meaning.toLowerCase().includes(q);
    const matchEx = w.example_sentence.toLowerCase().includes(q);

    return matchEng || matchDef || matchBen || matchEx;
  });

  const handleAudio = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    speakEnglishWord(word);
  };

  const handleToggleBookmark = (e: React.MouseEvent, wordId: string) => {
    e.stopPropagation();
    toggleBookmarkWord(wordId);
    loadData();
  };

  return (
    <div className="min-h-screen text-slate-800 antialiased font-sans">
      <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        <VocabSubNav />

        {/* Header */}
        <div className="space-y-1">
          <h1 className="font-display text-[40px] sm:text-[52px] font-bold leading-[0.98] tracking-[-0.02em] text-slate-950">
            Search the <span className="font-serif-display font-normal italic tracking-[-0.01em]">library.</span>
          </h1>
          <p className="text-[15px] leading-[1.7] text-slate-600 max-w-[540px]">
            Search by English word, definition, or Bengali meaning.
          </p>
        </div>

        {/* Search Bar & Filters */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-3.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search words or Bengali meaning (e.g. hesitate, দ্বিধা করা)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 text-xs pt-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400">Level:</span>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:outline-none"
              >
                <option value="All">All</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>

              <span className="text-[11px] font-semibold text-slate-400 ml-2">Type:</span>
              <select
                value={posFilter}
                onChange={(e) => setPosFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:outline-none"
              >
                <option value="All">All</option>
                <option value="Verb">Verb</option>
                <option value="Noun">Noun</option>
                <option value="Adjective">Adjective</option>
                <option value="Adverb">Adverb</option>
              </select>
            </div>

            <span className="text-[11px] font-semibold text-slate-400">
              {filteredWords.length} words found
            </span>
          </div>
        </div>

        {/* Results List */}
        {filteredWords.length > 0 ? (
          <div className="bg-white border border-[#E7E3DB] rounded-[24px] shadow-[0_30px_60px_-45px_rgba(14,13,11,0.35)] divide-y divide-slate-100 overflow-hidden">
            {filteredWords.map((w) => {
              const p = progressMap[w.id];
              const isBookmarked = p?.is_bookmarked ?? false;

              return (
                <div
                  key={w.id}
                  onClick={() => setSelectedWordForModal(w)}
                  className="p-5 sm:p-6 hover:bg-slate-50/70 transition flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{w.word}</h3>
                      <span className="text-xs font-mono text-slate-400">{w.pronunciation}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {w.part_of_speech}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                        {w.level}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1">{w.english_definition}</p>
                    <p className="font-hind-siliguri text-xs font-bold text-slate-800">
                      {w.bengali_meaning}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleAudio(e, w.word)}
                      className="p-2 rounded-full hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"
                      title="Pronounce"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleToggleBookmark(e, w.id)}
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
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-2xs text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700">No matching words found</p>
            <p className="text-xs text-slate-400">
              Try searching with another spelling or in Bengali (e.g. &ldquo;দ্বিধা&rdquo;).
            </p>
          </div>
        )}

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
