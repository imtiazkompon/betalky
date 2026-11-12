'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { PageHeader, It } from '@/components/ui/Editorial';

type ScenarioCategory = 'All' | 'Everyday & Social' | 'Professional & Career' | 'Skill Drills';

interface Scenario {
  id: string;
  category: 'Everyday & Social' | 'Professional & Career' | 'Skill Drills';
  title: string;
  description: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: '1',
    category: 'Everyday & Social',
    title: 'Meeting a new person',
    description: 'Break the ice, introduce yourself with confidence, and practice casual conversation starters.',
  },
  {
    id: '2',
    category: 'Professional & Career',
    title: 'Job Interview',
    description: 'Handle common behavioral and competency questions with structured, articulate responses.',
  },
  {
    id: '3',
    category: 'Everyday & Social',
    title: 'Ordering food at a restaurant',
    description: 'Ask questions about menus, make special requests, and practice polite dining exchanges.',
  },
  {
    id: '4',
    category: 'Everyday & Social',
    title: 'Asking for directions',
    description: 'Inquire about routes, clarify instructions, and navigate urban transit scenarios fluently.',
  },
  {
    id: '5',
    category: 'Professional & Career',
    title: 'Talking to a client',
    description: 'Pitch solutions, manage expectations, and maintain professional rapport under pressure.',
  },
  {
    id: '6',
    category: 'Professional & Career',
    title: 'Participating in a meeting',
    description: 'Jump into discussions, voice opinions constructively, and summarize action points.',
  },
  {
    id: '7',
    category: 'Skill Drills',
    title: 'Public Speaking',
    description: 'Users practice delivering speeches and presentations with pacing and rhetorical emphasis.',
  },
  {
    id: '8',
    category: 'Skill Drills',
    title: 'Picture Description',
    description: 'Users see an image and describe what they see to test observational vocabulary and fluid descriptors.',
  },
];

const CATEGORIES: ScenarioCategory[] = [
  'All',
  'Everyday & Social',
  'Professional & Career',
  'Skill Drills',
];

export default function PracticePage() {
  const [activeCategory, setActiveCategory] = useState<ScenarioCategory>('All');

  // Form states
  const [name, setName] = useState('');
  const [topicPreference, setTopicPreference] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const filteredScenarios =
    activeCategory === 'All'
      ? SCENARIOS
      : SCENARIOS.filter((s) => s.category === activeCategory);

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    // Simulate submission saving
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setName('');
      setTopicPreference('');
      setEmail('');
    }, 500);
  };

  return (
    <div className="min-h-screen text-slate-800 antialiased">
      <main className="mx-auto w-full max-w-3xl space-y-14 px-4 py-10 sm:px-6 sm:py-14">
        <PageHeader
          title={
            <>
              Rehearse the moments <It>that matter.</It>
            </>
          }
          lede="Real-world speaking scenarios with targeted AI feedback — plus a vocabulary builder you can use today."
        />

        {/* Vocabulary builder entry */}
        <section className="relative overflow-hidden rounded-[28px] bg-slate-950 p-7 text-[#FDFCF9] sm:p-10">
          <p className="eyebrow !text-white/50">Available now · Vocabulary builder</p>
          <h2 className="font-display mt-5 text-[34px] font-bold leading-[1] tracking-[-0.02em] sm:text-[44px]">
            Words you&apos;ll <It>actually use</It>, kept for good.
          </h2>
          <p className="mt-5 max-w-[480px] text-[15px] leading-[1.7] text-white/60">
            Practical words across Beginner, Intermediate and Advanced — with native audio, Bengali meanings and
            interactive quizzes.
          </p>
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2 text-[12px] text-white/70">
              {['Beginner', 'Intermediate', 'Advanced'].map((l) => (
                <span key={l} className="rounded-full border border-white/15 px-3 py-1">
                  {l}
                </span>
              ))}
            </div>
            <Link
              href="/practice/vocabulary"
              className="group inline-flex items-center gap-3 self-start rounded-full bg-[#FDFCF9] py-1.5 pl-6 pr-1.5 text-[14px] font-medium text-slate-950 transition hover:bg-white"
            >
              Learn vocabulary
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-[#FDFCF9] transition-transform duration-500 group-hover:-rotate-45">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </section>

        {/* Scenarios */}
        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-display text-[24px] font-bold leading-none tracking-[-0.015em] text-slate-950 sm:text-[28px]">
              Speaking <It>scenarios</It>
            </h2>
            <div className="relative inline-flex max-w-full items-center self-start overflow-x-auto rounded-full border border-[#E7E3DB] bg-white/70 p-1 sm:self-auto">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`relative z-10 select-none whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12px] transition-colors duration-200 ${
                      isActive ? 'font-medium text-[#FDFCF9]' : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="scenario-filter-pill"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        className="absolute inset-0 -z-10 rounded-full bg-slate-950"
                      />
                    )}
                    <span>{cat === 'All' ? 'All' : cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <ul className="border-t border-slate-950">
            <AnimatePresence mode="popLayout" initial={false}>
              {filteredScenarios.map((scenario) => (
                <motion.li
                  key={scenario.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="flex cursor-default select-none gap-4 border-b border-[#E7E3DB] py-6 sm:gap-6"
                >
                  <span className="w-6 shrink-0 pt-1 text-[12px] tabular-nums text-slate-400">
                    {scenario.id.padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h3 className="font-display text-[21px] font-bold tracking-[-0.02em] text-slate-950 sm:text-[24px]">
                        {scenario.title}
                      </h3>
                      <span className="font-serif-display text-[16px] italic text-slate-500">{scenario.category}</span>
                    </div>
                    <p className="mt-2 max-w-[560px] text-[14px] leading-[1.65] text-slate-600">{scenario.description}</p>
                  </div>
                  <span className="hidden shrink-0 self-start rounded-full border border-[#E7E3DB] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-500 sm:inline">
                    Soon
                  </span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </section>

        {/* Priority list */}
        <section className="rounded-[28px] border border-[#E7E3DB] bg-white p-7 shadow-[0_30px_60px_-45px_rgba(14,13,11,0.35)] sm:p-10">
          <div className="grid gap-8 sm:grid-cols-[1.1fr_1fr] sm:gap-10">
            <div>
              <p className="eyebrow">Early access</p>
              <h3 className="font-display mt-5 text-[30px] font-bold leading-[1.02] tracking-[-0.015em] text-slate-950 sm:text-[34px]">
                Tell us which scenario <It>comes first.</It>
              </h3>
              <p className="mt-4 text-[14px] leading-[1.7] text-slate-600">
                Have a situation you want to rehearse? Share it — we&apos;ll weigh every request when deciding what opens next.
              </p>
            </div>

            <form onSubmit={handleNotifySubmit} className="flex flex-col gap-3">
              {[
                { v: name, set: setName, ph: 'Your name', type: 'text' },
                { v: topicPreference, set: setTopicPreference, ph: 'Scenario you’d like', type: 'text' },
                { v: email, set: setEmail, ph: 'Your email', type: 'email' },
              ].map((f) => (
                <input
                  key={f.ph}
                  type={f.type}
                  value={f.v}
                  onChange={(e) => f.set(e.target.value)}
                  placeholder={f.ph}
                  required
                  className="w-full rounded-xl border border-[#E7E3DB] bg-[#FAF8F4] px-4 py-3 text-[14px] text-slate-900 placeholder:text-slate-400 transition focus:border-slate-950 focus:bg-white focus:outline-none"
                />
              ))}
              <button
                type="submit"
                disabled={isSubmitting || submitted}
                className="group mt-1 flex w-full items-center justify-between rounded-full bg-slate-950 py-1.5 pl-6 pr-1.5 text-[14px] font-medium text-[#FDFCF9] transition hover:bg-black disabled:opacity-80"
              >
                <span>{submitted ? 'Thank you — noted' : isSubmitting ? 'Sending…' : 'Submit request'}</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FDFCF9] text-slate-950 transition-transform duration-500 group-hover:-rotate-45">
                  {submitted ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                </span>
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
