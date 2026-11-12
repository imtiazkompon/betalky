'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  PenTool,
  RotateCcw,
  Sparkles,
  Award,
} from 'lucide-react';
import { QuizQuestion, VocabularyWord } from '@/lib/vocabulary/types';
import { recordQuizAttempt, saveUserSentence } from '@/lib/vocabulary/vocabulary-store';

interface PracticeQuizProps {
  questions: QuizQuestion[];
  studiedWords: VocabularyWord[];
  sessionId?: string;
  onFinish: (results: {
    totalQuestions: number;
    correctCount: number;
    incorrectCount: number;
    accuracy: number;
    difficultWordIds: string[];
  }) => void;
}

export default function PracticeQuiz({
  questions,
  studiedWords,
  sessionId,
  onFinish,
}: PracticeQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Score tracking
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [difficultWordIds, setDifficultWordIds] = useState<string[]>([]);

  // Matching game state (Exercise 3)
  const currentQ = questions[currentIndex];
  const [matchingSelectedWord, setMatchingSelectedWord] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [matchingError, setMatchingError] = useState(false);

  // Sentence builder state (Exercise 4)
  const [userSentenceText, setUserSentenceText] = useState('');
  const [sentenceSaved, setSentenceSaved] = useState(false);

  if (!currentQ) {
    return null;
  }

  // Handle Multiple Choice / Fill In Blanks
  const handleSelectOption = (option: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(option);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || isAnswerSubmitted) return;

    const correct = selectedOption.trim() === currentQ.correct_answer.trim();
    setIsAnswerSubmitted(true);
    setIsCorrect(correct);

    if (correct) {
      setCorrectCount((prev) => prev + 1);
    } else {
      setIncorrectCount((prev) => prev + 1);
      if (currentQ.word_id && !difficultWordIds.includes(currentQ.word_id)) {
        setDifficultWordIds((prev) => [...prev, currentQ.word_id]);
      }
    }

    recordQuizAttempt({
      wordId: currentQ.word_id,
      sessionId,
      questionType: currentQ.type,
      selectedAnswer: selectedOption,
      isCorrect: correct,
    });
  };

  // Handle Matching Exercise
  const handleMatchWordClick = (word: string) => {
    if (matchedPairs.includes(word)) return;
    setMatchingSelectedWord(word);
    setMatchingError(false);
  };

  const handleMatchMeaningClick = (meaning: string) => {
    if (!matchingSelectedWord) return;

    const pair = currentQ.matching_pairs?.find((p) => p.word === matchingSelectedWord);
    if (pair && pair.meaning === meaning) {
      const nextMatched = [...matchedPairs, matchingSelectedWord];
      setMatchedPairs(nextMatched);
      setMatchingSelectedWord(null);
      setMatchingError(false);

      // Check if all pairs are matched
      if (currentQ.matching_pairs && nextMatched.length === currentQ.matching_pairs.length) {
        setIsAnswerSubmitted(true);
        setIsCorrect(true);
        setCorrectCount((prev) => prev + 1);
        recordQuizAttempt({
          wordId: currentQ.word_id,
          sessionId,
          questionType: 'matching',
          selectedAnswer: 'all_matched',
          isCorrect: true,
        });
      }
    } else {
      setMatchingError(true);
      setTimeout(() => {
        setMatchingError(false);
        setMatchingSelectedWord(null);
      }, 700);
    }
  };

  // Handle Sentence Builder Submit
  const handleSaveSentence = () => {
    if (!userSentenceText.trim()) return;

    saveUserSentence(currentQ.word_id, userSentenceText);
    setSentenceSaved(true);
    setIsAnswerSubmitted(true);
    setIsCorrect(true);
    setCorrectCount((prev) => prev + 1);

    recordQuizAttempt({
      wordId: currentQ.word_id,
      sessionId,
      questionType: 'sentence_builder',
      selectedAnswer: userSentenceText,
      isCorrect: true,
    });
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setIsCorrect(false);
      setMatchingSelectedWord(null);
      setMatchedPairs([]);
      setUserSentenceText('');
      setSentenceSaved(false);
    } else {
      // Quiz complete!
      const total = correctCount + (isCorrect ? 0 : 0) + (isAnswerSubmitted ? 0 : 1);
      const finalCorrect = correctCount;
      const finalIncorrect = incorrectCount;
      const accuracy =
        finalCorrect + finalIncorrect > 0
          ? Math.round((finalCorrect / (finalCorrect + finalIncorrect)) * 100)
          : 100;

      onFinish({
        totalQuestions: questions.length,
        correctCount: finalCorrect,
        incorrectCount: finalIncorrect,
        accuracy,
        difficultWordIds,
      });
    }
  };

  // Exercise badge label
  const exerciseBadge =
    currentQ.type === 'meaning'
      ? 'Exercise 1: Meaning Recognition'
      : currentQ.type === 'fill_in_blank'
      ? 'Exercise 2: Context & Blank Fill'
      : currentQ.type === 'matching'
      ? 'Exercise 3: Word-Meaning Matching'
      : 'Exercise 4: Sentence Builder';

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-4">
      {/* Quiz Progress Header */}
      <div className="flex items-center justify-between text-xs font-medium text-slate-500 px-1">
        <span className="flex items-center gap-1.5 text-blue-600 font-bold uppercase tracking-wider text-[11px]">
          {exerciseBadge}
        </span>
        <div className="flex items-center gap-2">
          <span>
            {currentIndex + 1} / {questions.length}
          </span>
          <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/90 relative">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
          {currentQ.prompt}
        </h3>

        {currentQ.bengali_hint && currentQ.type !== 'matching' && (
          <p className="font-hind-siliguri text-xs text-amber-700 mt-2 bg-amber-50/80 p-2 rounded-xl inline-block border border-amber-100">
            {currentQ.bengali_hint}
          </p>
        )}

        {/* ---------------- TYPE 1 & 2: MULTIPLE CHOICE & BLANK FILL ---------------- */}
        {(currentQ.type === 'meaning' || currentQ.type === 'fill_in_blank') && (
          <div className="mt-6 flex flex-col gap-2.5">
            {currentQ.options?.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isTheCorrect = option.trim() === currentQ.correct_answer.trim();

              let btnClass = 'border-slate-200/90 hover:border-slate-300 bg-white text-slate-800';
              if (isSelected && !isAnswerSubmitted) {
                btnClass = 'border-blue-600 bg-blue-50/60 text-blue-950 font-semibold ring-2 ring-blue-500/20';
              } else if (isAnswerSubmitted) {
                if (isTheCorrect) {
                  btnClass = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20';
                } else if (isSelected && !isTheCorrect) {
                  btnClass = 'border-rose-400 bg-rose-50 text-rose-950 font-medium';
                } else {
                  btnClass = 'border-slate-100 bg-slate-50/50 text-slate-400 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  disabled={isAnswerSubmitted}
                  className={`w-full text-left p-4 rounded-2xl border text-sm sm:text-[15px] transition-all flex items-start justify-between gap-3 active:scale-[0.99] ${btnClass}`}
                >
                  <span>{option}</span>
                  {isAnswerSubmitted && isTheCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  {isAnswerSubmitted && isSelected && !isTheCorrect && (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ---------------- TYPE 3: WORD-MEANING MATCHING ---------------- */}
        {currentQ.type === 'matching' && currentQ.matching_pairs && (
          <div className="mt-6 space-y-4">
            <p className="text-xs text-slate-500">
              1. Tap an English word. 2. Tap its matching Bengali meaning.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Left Column: English Words */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  English Words
                </span>
                {currentQ.matching_pairs.map((pair, idx) => {
                  const isMatched = matchedPairs.includes(pair.word);
                  const isSelected = matchingSelectedWord === pair.word;

                  return (
                    <button
                      key={`word-${idx}`}
                      type="button"
                      onClick={() => handleMatchWordClick(pair.word)}
                      disabled={isMatched}
                      className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold transition text-left ${
                        isMatched
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 line-through opacity-70'
                          : isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      {pair.word}
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Bengali Meanings */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-hind-siliguri">
                  বাংলা অর্থ
                </span>
                {currentQ.matching_pairs
                  .slice()
                  .reverse()
                  .map((pair, idx) => {
                    const isMatched = matchedPairs.includes(pair.word);

                    return (
                      <button
                        key={`meaning-${idx}`}
                        type="button"
                        onClick={() => handleMatchMeaningClick(pair.meaning)}
                        disabled={isMatched || !matchingSelectedWord}
                        className={`p-3 rounded-xl border font-hind-siliguri text-xs sm:text-sm font-bold transition text-left ${
                          isMatched
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 line-through opacity-70'
                            : matchingSelectedWord
                            ? 'bg-white hover:bg-blue-50 border-blue-200 text-slate-900 cursor-pointer shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-400 cursor-default'
                        }`}
                      >
                        {pair.meaning}
                      </button>
                    );
                  })}
              </div>
            </div>

            {matchingError && (
              <p className="text-xs text-rose-500 font-semibold animate-shake">
                Not a match, try again!
              </p>
            )}
          </div>
        )}

        {/* ---------------- TYPE 4: SENTENCE BUILDER ---------------- */}
        {currentQ.type === 'sentence_builder' && (
          <div className="mt-5 space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
              <span className="font-bold text-slate-900">Predefined Tip: </span>
              {currentQ.explanation}
            </div>

            <textarea
              rows={3}
              value={userSentenceText}
              onChange={(e) => setUserSentenceText(e.target.value)}
              placeholder="e.g. I didn't hesitate to take the opportunity."
              disabled={sentenceSaved}
              className="w-full p-3.5 rounded-2xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />

            {!sentenceSaved ? (
              <button
                type="button"
                onClick={handleSaveSentence}
                disabled={!userSentenceText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition disabled:opacity-40 active:scale-95"
              >
                <PenTool className="w-3.5 h-3.5" />
                Save My Sentence
              </button>
            ) : (
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Your sentence has been saved to your vocabulary notebook!
              </p>
            )}
          </div>
        )}

        {/* Feedback Section (Shown after submission) */}
        {isAnswerSubmitted && currentQ.type !== 'sentence_builder' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 p-4 rounded-2xl text-xs sm:text-sm border ${
              isCorrect
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/80 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold mb-1">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span>Incorrect</span>
                </>
              )}
            </div>
            <p className="leading-relaxed font-normal">{currentQ.explanation}</p>
          </motion.div>
        )}

        {/* Action Button at bottom of card */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end">
          {!isAnswerSubmitted && (currentQ.type === 'meaning' || currentQ.type === 'fill_in_blank') && (
            <button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={!selectedOption}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition disabled:opacity-40 active:scale-95 shadow-xs"
            >
              Submit Answer
            </button>
          )}

          {isAnswerSubmitted && (
            <button
              type="button"
              onClick={handleNextQuestion}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition active:scale-95 shadow-xs"
            >
              {currentIndex + 1 < questions.length ? (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Complete Quiz
                  <Award className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

