'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  X,
  Save,
} from 'lucide-react';
import VocabSubNav from '@/components/vocabulary/VocabSubNav';
import {
  getAllVocabularyWords,
  getAllVocabularyUnits,
  addVocabularyWord,
  updateVocabularyWord,
  deleteVocabularyWord,
  bulkImportVocabulary,
} from '@/lib/vocabulary/vocabulary-store';
import { VocabularyWord, VocabularyLevel, PartOfSpeech } from '@/lib/vocabulary/types';

export default function AdminVocabularyPage() {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [search, setSearch] = useState('');
  const [editingWord, setEditingWord] = useState<Partial<VocabularyWord> | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [showCsvModal, setShowCsvModal] = useState(false);

  const loadWords = () => {
    setWords(getAllVocabularyWords());
  };

  useEffect(() => {
    loadWords();
  }, []);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSaveWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWord?.word?.trim() || !editingWord?.english_definition?.trim() || !editingWord?.bengali_meaning?.trim()) {
      showNotification('Please fill in word, definition, and Bengali meaning.', 'error');
      return;
    }

    if (isAddingNew) {
      addVocabularyWord({
        word: editingWord.word.trim(),
        pronunciation: editingWord.pronunciation?.trim() || '',
        part_of_speech: (editingWord.part_of_speech || 'Verb') as PartOfSpeech,
        english_definition: editingWord.english_definition.trim(),
        bengali_meaning: editingWord.bengali_meaning.trim(),
        example_sentence: editingWord.example_sentence?.trim() || '',
        example_translation: editingWord.example_translation?.trim() || '',
        synonyms: typeof editingWord.synonyms === 'string'
          ? (editingWord.synonyms as string).split(',').map((s) => s.trim()).filter(Boolean)
          : editingWord.synonyms || [],
        antonyms: typeof editingWord.antonyms === 'string'
          ? (editingWord.antonyms as string).split(',').map((s) => s.trim()).filter(Boolean)
          : editingWord.antonyms || [],
        collocations: typeof editingWord.collocations === 'string'
          ? (editingWord.collocations as string).split(',').map((s) => s.trim()).filter(Boolean)
          : editingWord.collocations || [],
        level: (editingWord.level || 'Beginner') as VocabularyLevel,
        unit_id: editingWord.unit_id || 'unit-beg-1',
        status: 'published',
      });
      showNotification(`Word "${editingWord.word}" added successfully!`);
    } else if (editingWord.id) {
      updateVocabularyWord(editingWord.id, {
        ...editingWord,
        synonyms: typeof editingWord.synonyms === 'string'
          ? (editingWord.synonyms as string).split(',').map((s) => s.trim()).filter(Boolean)
          : editingWord.synonyms,
        antonyms: typeof editingWord.antonyms === 'string'
          ? (editingWord.antonyms as string).split(',').map((s) => s.trim()).filter(Boolean)
          : editingWord.antonyms,
        collocations: typeof editingWord.collocations === 'string'
          ? (editingWord.collocations as string).split(',').map((s) => s.trim()).filter(Boolean)
          : editingWord.collocations,
      });
      showNotification(`Word "${editingWord.word}" updated!`);
    }

    setEditingWord(null);
    setIsAddingNew(false);
    loadWords();
  };

  const handleDelete = (id: string, word: string) => {
    if (confirm(`Are you sure you want to delete "${word}"?`)) {
      deleteVocabularyWord(id);
      showNotification(`Deleted "${word}"`);
      loadWords();
    }
  };

  const handleCsvImport = () => {
    if (!csvText.trim()) return;

    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        showNotification('CSV must contain a header row and at least one word.', 'error');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
      const rows = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
        const obj: any = {};
        headers.forEach((h, idx) => {
          obj[h] = values[idx] || '';
        });
        return obj;
      });

      const res = bulkImportVocabulary(rows);
      showNotification(`Successfully imported ${res.imported} words!`);
      setShowCsvModal(false);
      setCsvText('');
      loadWords();
    } catch (err: any) {
      showNotification(`Import failed: ${err.message}`, 'error');
    }
  };

  const filtered = words.filter((w) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      w.word.toLowerCase().includes(q) ||
      w.english_definition.toLowerCase().includes(q) ||
      w.bengali_meaning.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen text-slate-800 antialiased font-sans">
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        <VocabSubNav />

        {/* Notifications */}
        {message && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-display text-[40px] sm:text-[52px] font-bold leading-[0.98] tracking-[-0.02em] text-slate-950">
              Vocabulary <span className="font-serif-display font-normal italic tracking-[-0.01em]">admin.</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Add, edit, delete, and bulk import vocabulary words with complete Bengali meanings and collocations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCsvModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              CSV Import
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(true);
                setEditingWord({
                  word: '',
                  pronunciation: '',
                  part_of_speech: 'Verb',
                  english_definition: '',
                  bengali_meaning: '',
                  example_sentence: '',
                  example_translation: '',
                  synonyms: [],
                  antonyms: [],
                  collocations: [],
                  level: 'Beginner',
                  unit_id: 'unit-beg-1',
                });
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Word
            </button>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {(isAddingNew || editingWord) && (
          <div className="bg-white rounded-3xl p-6 border border-blue-200 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-display text-[22px] sm:text-[24px] font-bold tracking-[-0.015em] text-slate-950">
                {isAddingNew ? 'Add New Vocabulary Word' : `Edit "${editingWord?.word}"`}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setEditingWord(null);
                  setIsAddingNew(false);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWord} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">English Word *</label>
                <input
                  type="text"
                  required
                  value={editingWord?.word || ''}
                  onChange={(e) => setEditingWord({ ...editingWord, word: e.target.value })}
                  placeholder="e.g. Hesitate"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Pronunciation (IPA)</label>
                <input
                  type="text"
                  value={editingWord?.pronunciation || ''}
                  onChange={(e) => setEditingWord({ ...editingWord, pronunciation: e.target.value })}
                  placeholder="e.g. /ˈhez.ɪ.teɪt/"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Part of Speech</label>
                <select
                  value={editingWord?.part_of_speech || 'Verb'}
                  onChange={(e) =>
                    setEditingWord({ ...editingWord, part_of_speech: e.target.value as any })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  <option value="Verb">Verb</option>
                  <option value="Noun">Noun</option>
                  <option value="Adjective">Adjective</option>
                  <option value="Adverb">Adverb</option>
                  <option value="Phrase">Phrase</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Proficiency Level</label>
                <select
                  value={editingWord?.level || 'Beginner'}
                  onChange={(e) =>
                    setEditingWord({ ...editingWord, level: e.target.value as any })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  <option value="Beginner">Beginner (Everyday English)</option>
                  <option value="Intermediate">Intermediate (Expressive English)</option>
                  <option value="Advanced">Advanced (Nuanced English)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">English Definition *</label>
                <input
                  type="text"
                  required
                  value={editingWord?.english_definition || ''}
                  onChange={(e) =>
                    setEditingWord({ ...editingWord, english_definition: e.target.value })
                  }
                  placeholder="Clear, learner-friendly definition"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-amber-800 block mb-1">বাংলা অর্থ (Bengali Meaning) *</label>
                <input
                  type="text"
                  required
                  value={editingWord?.bengali_meaning || ''}
                  onChange={(e) => setEditingWord({ ...editingWord, bengali_meaning: e.target.value })}
                  placeholder="দ্বিধা করা, ইতস্তত করা"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 font-hind-siliguri text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">Example Sentence</label>
                <input
                  type="text"
                  value={editingWord?.example_sentence || ''}
                  onChange={(e) =>
                    setEditingWord({ ...editingWord, example_sentence: e.target.value })
                  }
                  placeholder="Don't hesitate to ask if you need help."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">Example Translation (Bengali)</label>
                <input
                  type="text"
                  value={editingWord?.example_translation || ''}
                  onChange={(e) =>
                    setEditingWord({ ...editingWord, example_translation: e.target.value })
                  }
                  placeholder="আপনার সাহায্যের প্রয়োজন হলে জিজ্ঞেস করতে দ্বিধা করবেন না।"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-hind-siliguri text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Synonyms (comma separated)</label>
                <input
                  type="text"
                  value={
                    Array.isArray(editingWord?.synonyms)
                      ? editingWord.synonyms.join(', ')
                      : editingWord?.synonyms || ''
                  }
                  onChange={(e) => setEditingWord({ ...editingWord, synonyms: e.target.value as any })}
                  placeholder="Pause, Waver"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Collocations (comma separated)</label>
                <input
                  type="text"
                  value={
                    Array.isArray(editingWord?.collocations)
                      ? editingWord.collocations.join(', ')
                      : editingWord?.collocations || ''
                  }
                  onChange={(e) =>
                    setEditingWord({ ...editingWord, collocations: e.target.value as any })
                  }
                  placeholder="Hesitate to do something, Without hesitation"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="sm:col-span-2 pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingWord(null);
                    setIsAddingNew(false);
                  }}
                  className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Word
                </button>
              </div>
            </form>
          </div>
        )}

        {/* CSV Import Modal */}
        {showCsvModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Bulk Import Vocabulary from CSV</h3>
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Paste your CSV content below. Required columns: <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">word,pronunciation,part_of_speech,english_definition,bengali_meaning,example_sentence,example_translation,level</code>
              </p>

              <textarea
                rows={8}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="word,pronunciation,part_of_speech,english_definition,bengali_meaning,example_sentence,example_translation,level&#10;Hesitate,/ˈhez.ɪ.teɪt/,Verb,To pause before doing something,দ্বিধা করা,Don't hesitate to ask.,জিজ্ঞেস করতে দ্বিধা করবেন না।,Beginner"
                className="w-full p-3 font-mono text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCsvImport}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Import Words
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search & Word Table */}
        <div className="bg-white border border-[#E7E3DB] rounded-[24px] shadow-[0_30px_60px_-45px_rgba(14,13,11,0.35)] p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search words..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <span className="text-xs font-semibold text-slate-400">
              Total: {filtered.length} words
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Word</th>
                  <th className="py-2.5 px-3">Level</th>
                  <th className="py-2.5 px-3">POS</th>
                  <th className="py-2.5 px-3">English Definition</th>
                  <th className="py-2.5 px-3">বাংলা অর্থ</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-3 font-bold text-slate-900">{w.word}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">
                        {w.level}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{w.part_of_speech}</td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                      {w.english_definition}
                    </td>
                    <td className="py-3 px-3 font-hind-siliguri font-semibold text-slate-900 max-w-xs truncate">
                      {w.bengali_meaning}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingNew(false);
                            setEditingWord(w);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(w.id, w.word)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

