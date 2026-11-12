'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { RecentFeedbackSummary } from '@/types/betalky';

interface RecentFeedbackListProps {
  items: RecentFeedbackSummary[];
}

export default function RecentFeedbackList({ items }: RecentFeedbackListProps) {
  const heading = (
    <div className="flex items-end justify-between gap-4">
      <h2 className="font-display text-[24px] font-bold leading-none tracking-[-0.015em] text-slate-950 sm:text-[28px]">
        Recent <span className="font-serif-display font-normal italic tracking-[-0.01em]">feedback</span>
      </h2>
      {items?.length > 0 && (
        <Link href="/history" className="border-b border-slate-950/30 text-[12px] text-slate-700 hover:border-slate-950">
          View all
        </Link>
      )}
    </div>
  );

  if (!items || items.length === 0) {
    return (
      <section className="space-y-5" data-purpose="recent-feedback-list">
        {heading}
        <div className="rounded-[24px] border border-dashed border-[#CDC7BB] px-6 py-12 text-center">
          <p className="font-serif-display text-[22px] italic text-slate-700">Nothing here yet.</p>
          <p className="mt-2 text-[13px] text-slate-500">Record your first session above — your report will appear here.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5" data-purpose="recent-feedback-list">
      {heading}
      <ul className="border-t border-slate-950">
        {items.map((item, index) => (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href={`/assessment/${item.session_id}`}
              className="group flex items-center gap-4 border-b border-[#E7E3DB] py-5 transition-colors hover:bg-white/60 sm:gap-6"
            >
              <span className="w-6 shrink-0 text-[12px] tabular-nums text-slate-400">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-display line-clamp-2 text-[16px] font-bold tracking-[-0.01em] text-slate-950 transition-transform duration-500 group-hover:translate-x-1 sm:line-clamp-1 sm:text-[18px]">
                  {item.topic_title}
                </h3>
                <p className="mt-1 text-[12px] text-slate-500">
                  {item.date_formatted}
                  <span className="mx-1.5 text-slate-300">·</span>
                  {item.descriptor}
                </p>
              </div>
              <span className="font-serif-display shrink-0 text-[32px] leading-none text-slate-950">
                {typeof item.score === 'number' ? item.score.toFixed(1) : item.score}
              </span>
            </Link>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
