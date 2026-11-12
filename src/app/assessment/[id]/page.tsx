'use client';

import React, { useState, useEffect, use, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import confetti from 'canvas-confetti';
import ScoreGauge from '@/components/ScoreGauge';
import AudioPlayer from '@/components/AudioPlayer';
import TargetedCorrections from '@/components/TargetedCorrections';
import AssessmentLanguageSelector from '@/components/AssessmentLanguageSelector';
import { AssessmentReport, PracticeSession } from '@/types/betalky';
import {
  AssessmentLanguage,
  TranslatedReportExplanation,
} from '@/types/assessment-language';
import {
  getLanguageFontClass,
  getTranslatingNotice,
} from '@/lib/assessment-i18n';
import { formatDateTime } from '@/lib/utils';
import { getAudioPlaybackUrl } from '@/lib/audio-storage';
import { getStoredSessionById } from '@/lib/session-store';

interface PageProps {
  params: Promise<{ id: string }>;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

function AssessmentContent({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedAnswer, setCopiedAnswer] = useState(false);

  // Multilingual explanation state (only explanations are translated; all UI/titles stay in English)
  const [selectedLang, setSelectedLang] = useState<AssessmentLanguage>('en');
  const [translations, setTranslations] = useState<
    Record<string, TranslatedReportExplanation>
  >({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationNotice, setTranslationNotice] = useState<string | null>(null);

  // 1. Fire confetti on load and restore language preference
  useEffect(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#0E0D0B', '#8E887D', '#CDC7BB', '#0066FF'],
      });
    } catch (e) {}

    // Reports always open in English; explanations are translated only when
    // the user picks another language on this report.
    try {
      localStorage.removeItem('betalky_assessment_lang');
    } catch (e) {}

    // Restore any existing session translation cache
    try {
      const cached = sessionStorage.getItem(`betalky_report_translations_${id}`);
      if (cached) {
        setTranslations(JSON.parse(cached));
      }
    } catch (e) {}

    async function loadReportAndAudio() {
      // 1. Check local persistent session store first
      const stored = getStoredSessionById(id);
      let sessionData: PracticeSession | null = stored
        ? {
            id: stored.id,
            user_id: 'current_user',
            topic_title: stored.topic_title,
            level: (stored.level as any) || 'Intermediate',
            audio_duration_seconds: stored.audio_duration_seconds || 30,
            audio_url: stored.audio_url,
            status: 'completed',
            created_at: stored.created_at,
            transcript: stored.transcript || stored.report?.original_transcript,
          }
        : null;

      let reportData: AssessmentReport | null = stored?.report || null;

      // Check sessionStorage as additional backup
      if (!reportData) {
        try {
          const cached = sessionStorage.getItem(`betalky_report_${id}`);
          if (cached) {
            reportData = JSON.parse(cached);
          }
        } catch (e) {}
      }

      // 2. Fetch from Supabase API if available
      try {
        const res = await fetch(`/api/sessions/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.session) {
            sessionData = data.session;
          }
          if (data.assessment) {
            reportData = data.assessment;
          }
        }
      } catch (err) {
        console.warn('Session API fetch note:', err);
      }

      // 3. Resolve audio playback URL (IndexedDB local audio or remote URL)
      try {
        const playbackUrl = await getAudioPlaybackUrl(id, sessionData?.audio_url);
        if (playbackUrl && sessionData) {
          sessionData.audio_url = playbackUrl;
        } else if (playbackUrl && !sessionData) {
          sessionData = {
            id: id,
            user_id: 'current_user',
            topic_title: reportData?.original_transcript
              ? 'Recent Speaking Practice'
              : 'How could your city become friendlier for pedestrians?',
            level: 'Intermediate',
            audio_duration_seconds: reportData?.speaking_dynamics?.output_words
              ? 58
              : 30,
            status: 'completed',
            audio_url: playbackUrl,
            created_at: reportData?.created_at || new Date().toISOString(),
            transcript: reportData?.original_transcript,
          };
        }
      } catch (audioErr) {
        console.warn('Audio URL resolution note:', audioErr);
      }

      if (reportData) {
        setReport(reportData);
        if (sessionData) setSession(sessionData);
        setLoading(false);

        return;
      }

      // No report found for this session ID
      setReport(null);
      setLoading(false);
    }

    loadReportAndAudio();
  }, [id]);

  // Translate ONLY specific explanatory sentences (Mistake reasons, tips, feedback)
  const triggerTranslation = async (
    targetLang: AssessmentLanguage,
    currentReport: AssessmentReport
  ) => {
    if (targetLang === 'en' || !currentReport) return;

    // Check if already in state
    if (translations[targetLang]) return;

    // Check sessionStorage
    try {
      const cached = sessionStorage.getItem(`betalky_report_translations_${id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed[targetLang]) {
          setTranslations(parsed);
          return;
        }
      }
    } catch (e) {}

    setIsTranslating(true);
    setTranslationNotice(getTranslatingNotice(targetLang));

    try {
      // ONLY send explanation fields (no titles, no UI labels, no rule names)
      const payload = {
        summary: currentReport.summary,
        tip: currentReport.pedagogical_tip,
        proficiency_feedback: currentReport.proficiency_breakdown.map((item) => ({
          metric: item.metric,
          feedback: item.feedback,
        })),
        targeted_corrections: currentReport.targeted_corrections.map((item) => ({
          explanation: item.explanation,
        })),
        strengths: currentReport.strengths,
        next_steps: currentReport.next_steps,
        focus_goals: currentReport.focus_goals,
      };

      const res = await fetch('/api/assess/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetLanguage: targetLang,
          reportId: id,
          payload,
        }),
      });

      const data = await res.json();
      if (res.ok && data.translation) {
        setTranslations((prev) => {
          const updated = {
            ...prev,
            [targetLang]: data.translation,
          };
          try {
            sessionStorage.setItem(
              `betalky_report_translations_${id}`,
              JSON.stringify(updated)
            );
          } catch (e) {}
          return updated;
        });
      } else {
        console.warn('Translation API error:', data.error);
      }
    } catch (err) {
      console.error('Translation network error:', err);
    } finally {
      setIsTranslating(false);
      setTranslationNotice(null);
    }
  };

  const handleLanguageChange = (newLang: AssessmentLanguage) => {
    setSelectedLang(newLang);

    if (newLang !== 'en' && report) {
      triggerTranslation(newLang, report);
    }
  };

  const handleCopyModelAnswer = () => {
    if (!report?.suggested_model_answer) return;
    navigator.clipboard.writeText(report.suggested_model_answer);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  const handleDownloadReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-medium text-slate-600 font-sans">
            Loading diagnostic assessment report...
          </p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
          <span className="material-symbols-outlined text-[32px]">find_in_page</span>
        </div>
        <h1 className="font-display text-[34px] font-bold tracking-[-0.02em] text-slate-950">Report <span className="font-serif-display font-normal italic">not found.</span></h1>
        <p className="text-sm text-slate-500 mt-2 max-w-md">
          We couldn&apos;t find an assessment report for this session. Complete a speaking practice session to generate a diagnostic report.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-full border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition font-sans"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/recording"
            className="px-5 py-2.5 rounded-full bg-slate-950 text-[#FDFCF9] text-[13px] font-medium hover:bg-black transition"
          >
            Start Practice
          </Link>
        </div>
      </div>
    );
  }

  // Active font class for explanation sentences
  const fontClass = getLanguageFontClass(selectedLang);
  const activeTranslation = selectedLang !== 'en' ? translations[selectedLang] : null;

  // ONLY specific explanatory sentences switch language; all titles/scores/verdict stay in English
  const displaySummary = activeTranslation?.summary || report.summary;
  const displayTip = activeTranslation?.tip || report.pedagogical_tip;
  const displayStrengths = activeTranslation?.strengths || report.strengths;
  const displayNextSteps = activeTranslation?.next_steps || report.next_steps;
  const displayFocusGoals = activeTranslation?.focus_goals || report.focus_goals;

  const displayProficiency = report.proficiency_breakdown.map((item, index) => {
    const translatedFeedback = activeTranslation?.proficiency_feedback?.[index]?.feedback;
    return {
      ...item,
      // Metric name stays in English (Grammar, Vocabulary, Fluency, etc.)
      feedback: translatedFeedback || item.feedback,
    };
  });

  const displayCorrections = report.targeted_corrections.map((item, index) => {
    const translatedCorr = activeTranslation?.targeted_corrections?.[index];
    return {
      ...item,
      // Rule name, you_said, and corrected_form stay in English
      explanation: translatedCorr?.explanation || item.explanation,
    };
  });

  const topicTitle = session?.topic_title || 'How could your city become friendlier for pedestrians?';
  const durationSecs = session?.audio_duration_seconds || 58;
  const recordedDateStr = formatDateTime(session?.created_at || report.created_at);

  return (
    <div className="min-h-screen text-slate-800 antialiased font-sans">
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full pt-10 sm:pt-14 pb-16 flex flex-col items-center"
      >
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 flex flex-col gap-6">
          {/* Section 1: Navigation & Header Area (All Interface & Titles in English) */}
          <motion.section variants={sectionVariants} className="space-y-6 pb-4">
            <div className="flex items-center justify-start flex-wrap gap-2 sm:gap-2.5">
              {/* Assessment Language Selector */}
              <AssessmentLanguageSelector
                currentLang={selectedLang}
                onSelectLang={handleLanguageChange}
                isLoading={isTranslating}
              />

              <Link
                href={`/recording?topic=${encodeURIComponent(topicTitle)}&level=${session?.level || 'Intermediate'}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E7E3DB] bg-white/80 hover:border-slate-950 text-slate-800 text-[12px] font-medium transition active:scale-95"
              >
                <span className="material-symbols-outlined text-[14px]">replay</span>
                <span>Practice Again</span>
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-950 hover:bg-black text-[#FDFCF9] text-[12px] font-medium transition active:scale-95"
              >
                <span>Dashboard</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>

            {/* In-progress translation indicator */}
            <AnimatePresence>
              {isTranslating && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="inline-flex items-center gap-2 py-1 px-3.5 bg-blue-50/90 border border-blue-200/70 rounded-full text-xs text-blue-800 shadow-2xs font-sans">
                    <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span className={fontClass}>{translationNotice}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-1">
              <p className="eyebrow border-b border-[#E7E3DB] pb-4">Assessment report</p>
              <h1 className="font-display mt-6 text-[34px] sm:text-[44px] font-bold leading-[1.02] tracking-[-0.02em] text-slate-950">
                {topicTitle}
              </h1>
              <div className="flex items-center flex-wrap gap-2 text-slate-500 text-[12px] mt-4">
                <span className="material-symbols-outlined text-[14px] text-slate-400">
                  calendar_today
                </span>
                <span>Recorded on {recordedDateStr}</span>
                <span className="text-slate-300">•</span>
                <span>Duration: {durationSecs}s</span>
              </div>
            </div>
          </motion.section>

          {/* Section 2: Overall Score Card */}
          <motion.section
            variants={sectionVariants}
            className="bg-white border border-[#E7E3DB] rounded-[24px] shadow-[0_30px_60px_-45px_rgba(14,13,11,0.35)] p-6 sm:p-8"
          >
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 sm:gap-8 text-center sm:text-left">
              {/* Score Gauge (Original numerical score unchanged) */}
              <div className="shrink-0 flex items-center justify-center self-center sm:self-auto">
                <ScoreGauge score={report.overall_score} size={120} />
              </div>

              <div className="flex-1 space-y-2">
                {/* Verdict: Always in English */}
                <h2
                  className="font-script text-slate-950 leading-[1.1] text-[30px] sm:text-[36px]"
                >
                  {report.assessment_verdict}
                </h2>
                {/* Summary: Short diagnostic explanation */}
                <p
                  className={`text-[14px] sm:text-[15px] leading-[1.7] text-slate-600 ${
                    selectedLang !== 'en' ? fontClass : 'font-sans'
                  }`}
                >
                  {displaySummary}
                </p>
              </div>
            </div>
          </motion.section>

          {/* Section 3: Audio & Transcript Card (Always English) */}
          <motion.div variants={sectionVariants}>
            <AudioPlayer
              audioUrl={session?.audio_url}
              durationSeconds={durationSecs}
              originalTranscript={report.original_transcript || session?.transcript || ''}
              correctedTranscript={report.corrected_transcript}
              corrections={report.targeted_corrections}
            />
          </motion.div>

          {/* Section 4: Targeted Corrections Section (Only explanation is translated) */}
          <motion.div variants={sectionVariants}>
            <TargetedCorrections
              corrections={displayCorrections}
              lang={selectedLang}
            />
          </motion.div>

          {/* Section 5: Proficiency Breakdown Section (Title & Metric names in English) */}
          <motion.section
            variants={sectionVariants}
            className="bg-white border border-[#E7E3DB] rounded-[24px] shadow-[0_30px_60px_-45px_rgba(14,13,11,0.35)] p-6 sm:p-8 space-y-4"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">
                  bar_chart
                </span>
                <h2 className="font-display text-[22px] font-bold tracking-[-0.015em] text-slate-950">
                  Proficiency Breakdown
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {displayProficiency.map((item, index) => {
                const percentage = Math.min(100, Math.round(item.score * 10));
                return (
                  <div
                    key={index}
                    className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#EFECE6] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      {/* Metric Name: Always in English */}
                      <span className="text-[13px] font-medium text-slate-950">
                        {item.metric}
                      </span>
                      {/* Score: Always in English */}
                      <span className="font-serif-display text-[24px] leading-none text-slate-950">
                        {item.score.toFixed(1)}{' '}
                        <span className="text-xs font-normal text-slate-400 font-sans">
                          /10
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-[#EFECE6] h-[3px] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: index * 0.08, ease: 'easeOut' }}
                        className="bg-slate-950 h-[3px] rounded-full"
                      />
                    </div>
                    {/* Feedback: Short explanatory sentence switches language */}
                    <p
                      className={`text-[11px] text-slate-500 leading-normal ${
                        selectedLang !== 'en' ? fontClass : 'font-sans'
                      }`}
                    >
                      {item.feedback}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.section>

          {/* Section 6: Filler-word Distribution Section */}
          <motion.section
            variants={sectionVariants}
            className="bg-white border border-[#E7E3DB] rounded-[24px] shadow-[0_30px_60px_-45px_rgba(14,13,11,0.35)] p-6 sm:p-8 space-y-4"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">
                  equalizer
                </span>
                <h2 className="font-display text-[22px] font-bold tracking-[-0.015em] text-slate-950">
                  Filler-word Distribution
                </h2>
              </div>
            </div>

            {report.filler_distribution && report.filler_distribution.length > 0 ? (
              <div className="space-y-3.5">
                {report.filler_distribution.map((filler, index) => (
                  <div key={index} className="space-y-1.5 font-sans">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-800 font-medium font-sans">
                        &ldquo;{filler.word}&rdquo;
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {filler.count} times ({filler.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#EFECE6] h-[3px] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${filler.percentage}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
                        className={`h-[3px] rounded-full ${
                          index === 0 ? 'bg-blue-600' : 'bg-blue-400'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-800 text-xs font-sans">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">
                  check_circle
                </span>
                <div>
                  <p className="font-semibold text-emerald-900">Zero filler words detected!</p>
                  <p className="text-emerald-700 mt-0.5 font-sans">Your speech was fluent, deliberate, and free of hesitation fillers.</p>
                </div>
              </div>
            )}

            {/* Pedagogical Tip: Title in English, only explanation text translates */}
            <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-[#FAF8F4] border border-[#EFECE6] text-slate-600 text-[13px] leading-relaxed">
              <p>
                <strong className="text-slate-900 font-semibold font-sans">Pedagogical Tip:</strong>{' '}
                <span className={selectedLang !== 'en' ? fontClass : 'font-sans'}>
                  {displayTip}
                </span>
              </p>
            </div>
          </motion.section>

          {/* Section 7: Suggested Model Answer Section (Always in English) */}
          <motion.section
            variants={sectionVariants}
            className="bg-white border border-[#E7E3DB] rounded-[24px] shadow-[0_30px_60px_-45px_rgba(14,13,11,0.35)] p-6 sm:p-8 space-y-4"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">
                  auto_awesome
                </span>
                <h2 className="font-display text-[22px] font-bold tracking-[-0.015em] text-slate-950">
                  Suggested Model Answer
                </h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopyModelAnswer}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#E7E3DB] hover:border-slate-950 text-slate-800 text-[12px] font-medium transition cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[14px]">content_copy</span>
                <span>{copiedAnswer ? 'Copied!' : 'Copy Answer'}</span>
              </motion.button>
            </div>

            {/* Model answer remains in authentic C1 English */}
            <blockquote className="font-serif-display border-l-2 border-slate-950 pl-5 py-1 text-[22px] sm:text-[24px] text-slate-800 italic leading-[1.35]">
              &ldquo;{report.suggested_model_answer}&rdquo;
            </blockquote>

            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 font-sans">
              <span className="material-symbols-outlined text-[16px] text-blue-600">
                verified
              </span>
              <span>Native CEFR C1 alignment • Synthesized from your speaking points</span>
            </div>
          </motion.section>

          {/* Section 8: Speaking Dynamics Section (Always in English) */}
          <motion.section
            variants={sectionVariants}
            className="bg-white border border-[#E7E3DB] rounded-[24px] shadow-[0_30px_60px_-45px_rgba(14,13,11,0.35)] p-6 sm:p-8 space-y-4"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">
                  graphic_eq
                </span>
                <h2 className="font-display text-[22px] font-bold tracking-[-0.015em] text-slate-950">
                  Speaking Dynamics
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 font-sans">
              {/* Pace */}
              <motion.div
                whileHover={{ y: -2 }}
                className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#EFECE6] flex flex-col justify-between transition-shadow hover:shadow-xs"
              >
                <span className="eyebrow">
                  Pace
                </span>
                <div className="py-1.5">
                  <span className="font-serif-display text-[40px] leading-none text-slate-950">
                    {report.speaking_dynamics.pace_wpm}
                  </span>
                  <span className="text-xs text-slate-500 font-medium"> WPM</span>
                </div>
              </motion.div>

              {/* Fillers */}
              <motion.div
                whileHover={{ y: -2 }}
                className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#EFECE6] flex flex-col justify-between transition-shadow hover:shadow-xs"
              >
                <span className="eyebrow">
                  Fillers
                </span>
                <div className="py-1.5">
                  <span className="font-serif-display text-[40px] leading-none text-slate-950">
                    {report.speaking_dynamics.fillers_total}
                  </span>
                  <span className="text-xs text-slate-500 font-medium"> total</span>
                </div>
              </motion.div>

              {/* Pauses */}
              <motion.div
                whileHover={{ y: -2 }}
                className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#EFECE6] flex flex-col justify-between transition-shadow hover:shadow-xs"
              >
                <span className="eyebrow">
                  Pauses
                </span>
                <div className="py-1.5">
                  <span className="font-serif-display text-[40px] leading-none text-slate-950">
                    {report.speaking_dynamics.pauses_count}
                  </span>
                  <span className="text-xs text-slate-500 font-medium"> pauses</span>
                </div>
              </motion.div>

              {/* Output */}
              <motion.div
                whileHover={{ y: -2 }}
                className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#EFECE6] flex flex-col justify-between transition-shadow hover:shadow-xs"
              >
                <span className="eyebrow">
                  Output
                </span>
                <div className="py-1.5">
                  <span className="font-serif-display text-[40px] leading-none text-slate-950">
                    {report.speaking_dynamics.output_words}
                  </span>
                  <span className="text-xs text-slate-500 font-medium"> words</span>
                </div>
              </motion.div>
            </div>
          </motion.section>

          {/* Section 9: Strengths & Next Steps (Titles in English, only bullet explanations translate) */}
          <motion.section
            variants={sectionVariants}
            className="bg-white border border-[#E7E3DB] rounded-[24px] shadow-[0_30px_60px_-45px_rgba(14,13,11,0.35)] p-6 sm:p-8 space-y-4"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">
                  checklist
                </span>
                <h2 className="font-display text-[22px] font-bold tracking-[-0.015em] text-slate-950">
                  Strengths &amp; Next Steps
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* What Worked Well */}
              <div className="p-5 rounded-2xl bg-[#FAF8F4] border border-[#EFECE6] space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/60 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </span>
                  <h3 className="font-display text-[16px] font-bold tracking-[-0.01em] text-slate-950">
                    What Worked Well
                  </h3>
                </div>
                <ul
                  className={`space-y-3 text-[13px] leading-relaxed text-slate-700 ${
                    selectedLang !== 'en' ? fontClass : 'font-sans'
                  }`}
                >
                  {displayStrengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-emerald-600 text-[15px] shrink-0 mt-0.5">
                        check_circle
                      </span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What to Try Next */}
              <div className="p-5 rounded-2xl bg-[#FAF8F4] border border-[#EFECE6] space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 border border-blue-100/60 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                  <h3 className="font-display text-[16px] font-bold tracking-[-0.01em] text-slate-950">
                    What to Try Next
                  </h3>
                </div>
                <ul
                  className={`space-y-3 text-[13px] leading-relaxed text-slate-700 ${
                    selectedLang !== 'en' ? fontClass : 'font-sans'
                  }`}
                >
                  {displayNextSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-blue-600 text-[15px] shrink-0 mt-0.5">
                        arrow_right_alt
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.section>

          {/* Section 10: Focus Goals for Next Session (Title & Subtitle in English, only goal bullets translate) */}
          <motion.section
            variants={sectionVariants}
            className="bg-white border border-[#E7E3DB] rounded-[24px] shadow-[0_30px_60px_-45px_rgba(14,13,11,0.35)] p-6 sm:p-8 space-y-5"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
              <div className="space-y-0.5">
                <h2 className="font-display text-[22px] font-bold tracking-[-0.015em] text-slate-950">
                  Focus Goals for Next Session
                </h2>
                <p className="text-xs text-slate-500 font-sans">
                  Keep these 3 targets in mind during your upcoming speaking practice.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {displayFocusGoals.map((goal, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-[#FAF8F4] border border-[#EFECE6] transition"
                >
                  <span className="font-serif-display w-8 shrink-0 text-[26px] italic leading-none text-slate-400">
                    {idx + 1}
                  </span>
                  <span
                    className={`text-[14px] text-slate-900 ${
                      selectedLang !== 'en' ? fontClass : 'font-sans'
                    }`}
                  >
                    {goal}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Bottom Actions (Always in English) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-5 border-t border-[#EFECE6]">
              <Link
                href="/history"
                className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-center text-xs font-semibold transition order-2 sm:order-1 font-sans"
              >
                Back to History
              </Link>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto order-1 sm:order-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleDownloadReport}
                  className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-5 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition shadow-xs cursor-pointer font-sans"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Download Report</span>
                </motion.button>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  className="w-full sm:w-auto"
                >
                  <Link
                    href={`/recording?topic=${encodeURIComponent(topicTitle)}&level=${encodeURIComponent(session?.level || 'Intermediate')}&t=${Date.now()}`}
                    className="w-full sm:w-auto block px-6 py-2.5 rounded-full bg-slate-950 hover:bg-black text-[#FDFCF9] text-center text-[13px] font-medium transition"
                  >
                    Retry This Topic
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.section>
        </div>
      </motion.main>
    </div>
  );
}

export default function AssessmentReportPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-medium text-slate-600 font-sans">
            Loading diagnostic assessment report...
          </p>
        </div>
      }
    >
      <AssessmentContent {...props} />
    </Suspense>
  );
}
