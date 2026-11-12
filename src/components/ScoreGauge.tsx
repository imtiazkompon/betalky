'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ScoreGaugeProps {
  score: number; // 0 to 10
  size?: number;
}

export default function ScoreGauge({ score, size = 120 }: ScoreGaugeProps) {
  const normalizedScore = Math.max(0, Math.min(10, score));
  const radius = 48;
  const circumference = 2 * Math.PI * radius; // 301.59
  const strokeDashoffset = circumference - (circumference * normalizedScore) / 10;

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <svg
        className="-rotate-90 transform"
        width={size}
        height={size}
        viewBox="0 0 120 120"
      >
        {/* Background track */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#EFECE6"
          strokeWidth="7"
        />
        {/* Animated active score stroke */}
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#0E0D0B"
          strokeWidth="7"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.15 }}
          strokeLinecap="round"
        />
      </svg>
      {/* Center score readout */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
        className="absolute inset-0 flex flex-col items-center justify-center text-center"
      >
        <span className="font-serif-display text-[44px] sm:text-[48px] text-slate-950 leading-none">
          {normalizedScore.toFixed(1)}
        </span>
        <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mt-1 leading-none">
          / 10
        </span>
      </motion.div>
    </div>
  );
}
