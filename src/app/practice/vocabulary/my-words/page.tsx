'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Search,
  Volume2,
} from 'lucide-react';
import VocabSubNav from '@/components/vocabulary/VocabSubNav';
import WordDetailModal from '@/components/vocabulary/WordDetailModal';
import {
  getAllVocabularyWords,
  getUserProgressMap,
  toggleBookmarkWord,
} from '@/lib/vocabulary/vocabulary-store';
import { speakEnglishWord } from '@/lib/vocabulary/speech';
import { VocabularyWord, UserWordProgress } from '@/lib/vocabulary/types';

type TabKey = 'saved' | 'learning' | 'learned' | 'difficult';

export default function MyVocabularyPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('saved');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [selectedPos, setSelectedPos] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical'>('recent');

  const [allWords, setAllWords] = useState<VocabularyWord[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, UserWordProgress>>({});
  const [selectedWordForModal, setSelectedWordForModal] = useState<VocabularyWord | null>(null);

  const loadData = () => {
    const words = getAllVocabularyWords();
    const pMap = getUserProgressMap();
    setAllWords(words);
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
  }, []);

  // Filter words by tab
  const tabWords = allWords.filter((w) => {
    const p = progressMap[w.id];
    if (activeTab === 'saved') return p?.is_bookmarked;
    if (activeTab === 'learning') return p?.status === 'learning';
    if (activeTab === 'learned') return p?.status === 'learned';
    if (activeTab === 'difficult') return p?.difficulty_status === 'difficult';
    return false;
  });

  // Apply search and filters
  let filteredWords = tabWords.filter((w) => {
    if (selectedLevel !== 'All' && w.level !== selectedLevel) return false;
    if (selectedPos !== 'All' && w.part_of_speech !== selectedPos) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchWord = w.word.toLowerCase().includes(q);
      const matchDef = w.english_definition.toLowerCase().includes(q);
      const matchBen = w.bengali_meaning.toLowerCase().includes(q);
      if (!matchWord && !matchDef && !matchBen) return false;
    }
    return true;
  });

  // Sort
  if (sortBy === 'alphabetical') {
    filteredWords.sort((a, b) => a.word.localeCompare(b.word));
  } else {
    filteredWords.sort((a, b) => {
      const dateA = progressMap[a.id]?.updated_at || '';
      const dateB = progressMap[b.id]?.updated_at || '';
      return dateB.localeCompare(dateA);
    });
  }

  const handleAudio = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    speakEnglishWord(word);
  };

  const handleToggleBookmark = (e: React.MouseEvent, wordId: string) => {
    e.stopPropagation();
    toggleBookmarkWord(wordId);
    loadData();
  };

  const tabs: { key: TabKey; label: string; icon: any; count: number }[] = [
    {
      key: 'saved',
      label: 'Saved',
      icon: Bookmark,
      count: allWords.filter((w) => progressMap[w.id]?.is_bookmarked).length,
    },
    {
      key: 'learning',
      label: 'Learning',
      icon: BookOpen,
      count: allWords.filter((w) => progressMap[w.id]?.status === 'learning').length,
    },
    {
      key: 'learned',
      label: 'Learned',
      icon: CheckCircle2,
      count: allWords.filter((w) => progressMap[w.id]?.status === 'learned').length,
    },
    {
      key: 'difficult',
      label: 'Difficult',
      icon: AlertCircle,
      count: allWords.filter((w) => progressMap[w.id]?.difficulty_status === 'difficult').length,
    },
  ];

  return (
    <div className="min-h-screen text-slate-800 antialiased font-sans">
      <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        <VocabSubNav />

        {/* Header */}
        <div className="space-y-1">
          <h1 className="font-display text-[40px] sm:text-[52px] font-bold leading-[0.98] tracking-[-0.02em] text-slate-950">
            My <span className="font-serif-display font-normal italic tracking-[-0.01em]">words.</span>
          </h1>
          <p className="text-[15px] leading-[1.7] text-slate-600 max-w-[540px]">
            Personal collection of saved, in-progress, and mastered words.
          </p>
        </div>

        {/* Tabs Bar */}
        <div className="bg-white p-1 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 min-w-[5rem] py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by word or meaning..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 text-xs pt-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400">Level:</span>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:outline-none"
              >
                <option value="All">All</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>

              <span className="text-[11px] font-semibold text-slate-400 ml-2">Type:</span>
              <select
                value={selectedPos}
                onChange={(e) => setSelectedPos(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:outline-none"
              >
                <option value="All">All</option>
                <option value="Verb">Verb</option>
                <option value="Noun">Noun</option>
                <option value="Adjective">Adjective</option>
                <option value="Adverb">Adverb</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:outline-none"
              >
                <option value="recent">Recent</option>
                <option value="alphabetical">A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Word List */}
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
                      <h4 className="text-base font-bold text-slate-900">{w.word}</h4>
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

                    {p?.user_sentence && (
                      <p className="text-[11px] text-blue-700 font-medium italic pt-1">
                        &ldquo;{p.user_sentence}&rdquo;
                      </p>
                    )}
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
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-2xs text-center space-y-3">
            <p className="text-sm font-semibold text-slate-700">No words found in this section</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Start learning a unit and bookmark words or mark them as learned to build your collection.
            </p>
            <Link
              href="/practice/vocabulary/level/Beginner"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              Learn Words Now
            </Link>
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
