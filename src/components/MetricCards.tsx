'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface MetricCardsProps {
  dayStreak?: number;
  longestStreak?: number;
  practiceDays?: number;
}

export default function MetricCards({ dayStreak = 0, longestStreak = 0, practiceDays = 0 }: MetricCardsProps) {
  const metrics = [
    { value: dayStreak, label: 'Day streak' },
    { value: longestStreak, label: 'Longest streak' },
    { value: practiceDays, label: 'Practice days' },
  ];

  return (
    <div className="grid grid-cols-3 divide-x divide-[#E7E3DB] border-y border-[#E7E3DB]">
      {metrics.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="px-3 py-5 first:pl-0 sm:px-6"
        >
          <div className="font-serif-display text-[40px] leading-none text-slate-950 sm:text-[52px]">{item.value}</div>
          <div className="mt-2 truncate text-[11px] text-slate-500 sm:text-[12px]">{item.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
