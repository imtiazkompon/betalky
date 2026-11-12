'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TargetedCorrection } from '@/types/betalky';
import { AssessmentLanguage } from '@/types/assessment-language';
import { getLanguageFontClass } from '@/lib/assessment-i18n';

interface TargetedCorrectionsProps {
  corrections: TargetedCorrection[];
  lang?: AssessmentLanguage;
}

export default function TargetedCorrections({
  corrections,
  lang = 'en',
}: TargetedCorrectionsProps) {
  const fontClass = getLanguageFontClass(lang);

  if (!corrections || corrections.length === 0) {
    return (
      <section
        className="bg-white border border-[#E7E3DB] rounded-[24px] shadow-[0_30px_60px_-45px_rgba(14,13,11,0.35)] p-6 sm:p-8 space-y-5"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[20px]">
              spellcheck
            </span>
            <h2 className="font-display text-[22px] font-bold tracking-[-0.015em] text-slate-950">
              Targeted Corrections
            </h2>
          </div>
          <span className="eyebrow">
            0 Items Identified
          </span>
        </div>
        <div className="p-4 bg-white rounded-xl text-center text-xs text-slate-600 font-sans">
          <p className="font-semibold text-slate-800">Excellent grammatical precision!</p>
          <p className="mt-0.5 text-slate-500">No major grammar or syntax slips were detected in your response.</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="bg-white border border-[#E7E3DB] rounded-[24px] shadow-[0_30px_60px_-45px_rgba(14,13,11,0.35)] p-6 sm:p-8 space-y-5"
    >
      {/* Section Header: Always in English */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600 text-[20px]">
            spellcheck
          </span>
          <h2 className="font-display text-[22px] font-bold tracking-[-0.015em] text-slate-950">
            Targeted Corrections
          </h2>
        </div>
        <span className="eyebrow">
          {corrections.length} Item{corrections.length === 1 ? '' : 's'} Identified
        </span>
      </div>

      <div className="space-y-4">
        {corrections.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.08, ease: 'easeOut' }}
            whileHover={{ y: -2 }}
            className="p-4 sm:p-5 rounded-2xl border space-y-4 border-[#E7E3DB] bg-[#FAF8F4]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs font-mono">
                  Timestamp: {item.timestamp || `00:${String((index + 1) * 15).padStart(2, '0')}`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {/* You Said: Always in English */}
              <div className="p-4 rounded-xl bg-white border border-[#EFECE6] space-y-1.5">
                <span className="eyebrow block">
                  You Said
                </span>
                <span className="text-rose-700 line-through decoration-rose-400 block text-[15px]">
                  &ldquo;{item.you_said}&rdquo;
                </span>
              </div>

              {/* Corrected Form: Always in English */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-950 space-y-1.5">
                <span className="eyebrow !text-white/50 block">
                  Corrected Form
                </span>
                <span className="font-serif-display text-[#FDFCF9] italic block text-[20px] leading-snug">
                  &ldquo;{item.corrected_form}&rdquo;
                </span>
              </div>
            </div>

            {/* Explanation: ONLY the explanation text switches language */}
            <p className="text-[13px] text-slate-600 leading-relaxed">
              <strong className="text-slate-800 font-semibold font-sans">
                {item.rule_name}:
              </strong>{' '}
              <span className={lang !== 'en' ? fontClass : 'font-sans'}>
                {item.explanation}
              </span>
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
