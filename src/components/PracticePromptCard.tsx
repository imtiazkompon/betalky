'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Topic, DifficultyLevel } from '@/types/betalky';

interface PracticePromptCardProps {
  topic: Topic;
  level: DifficultyLevel;
  onShuffle: () => void;
  isShuffling?: boolean;
}

export default function PracticePromptCard({
  topic,
  level,
  onShuffle,
  isShuffling = false,
}: PracticePromptCardProps) {
  const router = useRouter();

  const handleStartPractice = () => {
    const encodedTopic = encodeURIComponent(topic.title);
    const encodedInstructions = encodeURIComponent(topic.instructions);
    router.push(`/recording?topicId=${topic.id}&topic=${encodedTopic}&level=${level}&instructions=${encodedInstructions}`);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[24px] border border-[#E7E3DB] bg-white p-6 shadow-[0_30px_60px_-45px_rgba(14,13,11,0.35)] sm:p-10"
      data-purpose="prompt-card"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="eyebrow">
          {level}
          <span className="hidden sm:inline">
            <span className="mx-1.5">·</span> Today&apos;s topic
          </span>
        </p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onShuffle}
          disabled={isShuffling}
          className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#E7E3DB] px-3.5 py-1.5 text-[12px] font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950 disabled:opacity-50"
        >
          <motion.svg
            animate={isShuffling ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </motion.svg>
          <span>Another one</span>
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={topic.id + topic.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="mt-8"
        >
          <h1 className="font-display text-[30px] font-bold leading-[1.05] tracking-[-0.015em] text-slate-950 sm:text-[38px]">
            {topic.title}
          </h1>
          <p className="font-serif-display mt-4 text-[19px] italic leading-snug text-slate-600 sm:text-[21px]">
            {topic.instructions}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="mt-10 border-t border-[#E7E3DB] pt-10">
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center gap-5 sm:gap-10">
            <div className="flex items-center gap-1">
              {[3, 6, 8, 4, 6].map((h, i) => (
                <span
                  key={i}
                  className="wave-bar w-1 rounded-full bg-slate-300"
                  style={{ height: h * 4, animationDelay: `${0.12 * i}s` }}
                />
              ))}
            </div>

            <div className="relative flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.35, 1], opacity: [0.35, 0, 0.35] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none absolute h-24 w-24 rounded-full border border-slate-950/30"
              />
              <div className="absolute h-[88px] w-[88px] rounded-full bg-[#FDFCF9]" />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                onClick={handleStartPractice}
                type="button"
                className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-slate-950 text-[#FDFCF9] shadow-[0_18px_30px_-12px_rgba(14,13,11,0.5)] transition-colors hover:bg-black"
                aria-label="Start recording for this topic"
              >
                <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.button>
            </div>

            <div className="flex items-center gap-1">
              {[5, 8, 6, 3, 5].map((h, i) => (
                <span
                  key={i}
                  className="wave-bar w-1 rounded-full bg-slate-300"
                  style={{ height: h * 4, animationDelay: `${0.1 + 0.12 * i}s` }}
                />
              ))}
            </div>
          </div>

          <p className="mt-6 text-[13px] text-slate-500">
            Tap to begin <span className="mx-1.5 text-slate-300">·</span> up to{' '}
            <span className="font-medium text-slate-950">1:00</span>
          </p>
        </div>
      </div>
    </motion.section>
  );
}
