'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AssessmentLanguage,
  ASSESSMENT_LANGUAGES,
  AssessmentLanguageOption,
} from '@/types/assessment-language';

interface AssessmentLanguageSelectorProps {
  currentLang: AssessmentLanguage;
  onSelectLang: (lang: AssessmentLanguage) => void;
  isLoading?: boolean;
}

export default function AssessmentLanguageSelector({
  currentLang,
  onSelectLang,
  isLoading = false,
}: AssessmentLanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOption =
    ASSESSMENT_LANGUAGES.find((opt) => opt.code === currentLang) ||
    ASSESSMENT_LANGUAGES[0];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option: AssessmentLanguageOption) => {
    setIsOpen(false);
    if (option.code !== currentLang) {
      onSelectLang(option.code);
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left select-none">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <label
          htmlFor="assessment-lang-btn"
          className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
        >
          <span className="material-symbols-outlined text-[15px] text-slate-400">
            translate
          </span>
          <span>Assessment Language:</span>
        </label>

        {/* Dropdown Trigger Pill */}
        <button
          id="assessment-lang-btn"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={`Assessment Language: ${currentOption.name}`}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-white text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
            isOpen
              ? 'border-blue-500 ring-2 ring-blue-100 text-slate-900'
              : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {isLoading ? (
            <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
          ) : (
            <span className="text-sm leading-none shrink-0" role="img" aria-hidden="true">
              {currentOption.flag}
            </span>
          )}

          <span className={`${currentOption.fontClass} font-semibold text-xs`}>
            {currentOption.nativeName}
          </span>

          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="material-symbols-outlined text-[16px] text-slate-400 shrink-0"
          >
            expand_more
          </motion.span>
        </button>
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="listbox"
            aria-label="Assessment Language"
            className="absolute right-0 sm:left-auto mt-1.5 w-44 rounded-2xl bg-white border border-slate-200/90 shadow-lg p-1.5 z-50 focus:outline-none"
          >
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1 flex items-center justify-between">
              <span>Assessment Language</span>
              {isLoading && (
                <span className="w-2.5 h-2.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            <div className="space-y-0.5">
              {ASSESSMENT_LANGUAGES.map((option) => {
                const isSelected = option.code === currentLang;
                return (
                  <button
                    key={option.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm leading-none" role="img" aria-hidden="true">
                        {option.flag}
                      </span>
                      <span className={option.fontClass}>
                        {option.nativeName}
                      </span>
                      {option.code !== 'en' && (
                        <span className="text-[10px] text-slate-400 font-normal font-sans">
                          ({option.name})
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <span className="material-symbols-outlined text-blue-600 text-[16px] shrink-0">
                        check
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
