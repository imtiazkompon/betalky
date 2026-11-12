'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DifficultyLevel } from '@/types/betalky';

interface LevelSelectorProps {
  currentLevel: DifficultyLevel;
  onSelectLevel: (level: DifficultyLevel) => void;
}

export default function LevelSelector({ currentLevel, onSelectLevel }: LevelSelectorProps) {
  const levels: DifficultyLevel[] = ['Beginner', 'Intermediate', 'Advanced'];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" data-purpose="level-selector">
      <span className="eyebrow">Choose your level</span>
      <div className="relative inline-flex max-w-full self-start overflow-x-auto rounded-full border border-[#E7E3DB] bg-white/70 p-1 sm:self-auto">
        {levels.map((level) => {
          const isActive = currentLevel.toLowerCase() === level.toLowerCase();
          return (
            <button
              key={level}
              type="button"
              onClick={() => onSelectLevel(level)}
              className={`relative z-10 whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] transition-colors sm:px-5 ${
                isActive ? 'font-medium text-[#FDFCF9]' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-level-pill"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="absolute inset-0 -z-10 rounded-full bg-slate-950"
                />
              )}
              <span>{level}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
