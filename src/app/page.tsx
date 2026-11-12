'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Plus, Minus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/* ------------------------------------------------------------------ */
/*  Palette — ivory paper, warm ink, one electric accent from product  */
/* ------------------------------------------------------------------ */
// paper  #FDFCF9   ivory surface
// card   #FAF8F4   raised surface
// ink    #0E0D0B   primary text / dark panels
// mute   #6E6A61   secondary text
// line   #E7E3DB   hairlines
// accent #0066FF   brand blue (used sparingly)
//
// Content is held to the same max-w-3xl column as the rest of the app.

const ease = [0.22, 1, 0.36, 1] as const;

function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.9, ease, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p
      className={`text-[11px] font-medium uppercase tracking-[0.22em] ${
        light ? 'text-white/50' : 'text-[#6E6A61]'
      }`}
    >
      {children}
    </p>
  );
}

function Shot({
  src,
  alt,
  width,
  height,
  className = '',
  preload = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  preload?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[16px] bg-white ring-1 ring-black/[0.06] shadow-[0_40px_80px_-40px_rgba(14,13,11,0.35),0_14px_28px_-20px_rgba(14,13,11,0.25)] ${className}`}
    >
      <Image src={src} alt={alt} width={width} height={height} preload={preload} className="block h-auto w-full" />
    </div>
  );
}

function SectionTitle({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="font-display mt-5 text-[40px] font-bold leading-[0.98] tracking-[-0.02em] sm:text-[56px]">
        {children}
      </h2>
    </Reveal>
  );
}

function It({ children }: { children: React.ReactNode }) {
  return <span className="font-serif-display font-normal italic tracking-[-0.01em]">{children}</span>;
}

function DetailList({ rows }: { rows: [string, string][] }) {
  return (
    <ul className="divide-y divide-[#E7E3DB] border-y border-[#E7E3DB] text-[14px]">
      {rows.map(([a, b]) => (
        <li key={a} className="flex justify-between gap-4 py-3.5">
          <span>{a}</span>
          <span className="text-right text-[#6E6A61]">{b}</span>
        </li>
      ))}
    </ul>
  );
}

const primaryBtn =
  'group inline-flex items-center justify-center gap-3 rounded-full bg-[#0E0D0B] pl-6 pr-1.5 py-1.5 text-[14px] font-medium text-[#FDFCF9] transition hover:bg-black';
const primaryBtnIcon =
  'flex h-9 w-9 items-center justify-center rounded-full bg-[#FDFCF9] text-[#0E0D0B] transition-transform duration-500 group-hover:-rotate-45';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const SCENARIOS = [
  { title: 'Meeting a new person', category: 'Everyday & Social' },
  { title: 'Ordering at a restaurant', category: 'Everyday & Social' },
  { title: 'Asking for directions', category: 'Everyday & Social' },
  { title: 'The job interview', category: 'Professional & Career' },
  { title: 'Talking to a client', category: 'Professional & Career' },
  { title: 'Speaking up in a meeting', category: 'Professional & Career' },
  { title: 'Public speaking', category: 'Skill Drills' },
  { title: 'Picture description', category: 'Skill Drills' },
];

const METRICS = [
  { name: 'Grammar', score: 6.5 },
  { name: 'Vocabulary', score: 7.2 },
  { name: 'Fluency', score: 7.0 },
  { name: 'Repetition', score: 6.0 },
  { name: 'Filler words', score: 6.8 },
  { name: 'Clarity & coherence', score: 7.5 },
];

const FAQ = [
  {
    q: 'How long does a session take?',
    a: 'About a minute of speaking. Pick a topic, talk for up to 60 seconds, and your full report is ready moments after you stop.',
  },
  {
    q: 'What exactly gets scored?',
    a: 'Six dimensions — grammar, vocabulary, fluency, repetition, filler words, and clarity & coherence — plus an overall score out of ten, your pace in words per minute, pauses, and a filler-word breakdown.',
  },
  {
    q: 'Can I read the explanations in my own language?',
    a: 'Yes. Every correction and grammar rule can be explained in English, বাংলা (Bengali) or हिन्दी (Hindi), so you understand the why — not just the fix.',
  },
  {
    q: 'What do I need to get started?',
    a: 'A free account, a browser and a microphone. No downloads, no scheduling, no tutor. Choose your level — Beginner, Intermediate or Advanced — and start speaking.',
  },
  {
    q: 'Is my voice kept private?',
    a: 'Recordings are stored against your own account with row-level security, so only you can access your audio, transcripts and reports.',
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => setSignedIn(Boolean(data?.user)))
      .catch(() => setSignedIn(false));
  }, []);

  // Signed-out visitors go through account creation; members go straight in.
  const startHref = signedIn ? '/dashboard' : '/signup';
  const startLabel = signedIn ? 'Go to your dashboard' : 'Create your free account';

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-[#0E0D0B] antialiased selection:bg-[#0E0D0B] selection:text-[#FDFCF9]">
      <main className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* ============================= HERO ============================= */}
        <section className="pt-12 pb-24 sm:pt-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-between border-b border-[#E7E3DB] pb-4"
          >
            <Eyebrow>An AI speaking coach</Eyebrow>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#6E6A61]">English · বাংলা · हिन्दी</p>
          </motion.div>

          <h1 className="font-display mt-10 text-[15vw] font-extrabold leading-[0.88] tracking-[-0.025em] sm:mt-12 sm:text-[104px]">
            {['Speak English', 'the way you', 'mean it'].map((line, i) => (
              <motion.span
                key={line}
                className="block"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease, delay: 0.12 * i }}
              >
                {i === 1 ? (
                  <span className="font-serif-display font-normal italic tracking-[-0.015em]">{line}</span>
                ) : (
                  line
                )}
                {i === 2 && <span className="text-[#0066FF]">.</span>}
              </motion.span>
            ))}
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.35 }}
            className="mt-10 grid gap-8 sm:grid-cols-[1.15fr_1fr] sm:items-end"
          >
            <p className="text-[17px] leading-[1.65] text-[#0E0D0B]/75">
              Talk for sixty seconds. beTalky listens, transcribes, and returns the feedback a private tutor
              would — every slip named, every fix explained, a native model answer to learn from.
            </p>
            <div className="flex flex-col items-start gap-4 sm:items-end">
              <Link href={startHref} className={primaryBtn}>
                {startLabel}
                <span className={primaryBtnIcon}>
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
              {!signedIn && (
                <p className="text-[13px] text-[#6E6A61]">
                  Already a member?{' '}
                  <Link href="/login" className="border-b border-[#0E0D0B]/30 text-[#0E0D0B] hover:border-[#0E0D0B]">
                    Sign in
                  </Link>
                </p>
              )}
            </div>
          </motion.div>

          {/* Hero composition */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease, delay: 0.45 }}
            className="relative mt-14"
          >
            <div className="relative rounded-[24px] bg-[#F3F0EA] p-3 pb-16 sm:p-8 sm:pb-24">
              <Shot
                src="/landing/app-topic.png"
                alt="beTalky topic selection with level switcher and microphone"
                width={1504}
                height={1179}
                preload
              />
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease, delay: 0.9 }}
                className="absolute -bottom-8 left-3 w-[82%] sm:-left-4 sm:w-[64%]"
              >
                <Shot src="/landing/app-report-score.png" alt="Overall score of 6.8 out of 10 with written verdict" width={1504} height={495} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease, delay: 1.15 }}
                className="absolute -top-4 right-4 flex items-center gap-2.5 rounded-full bg-[#0E0D0B] px-4 py-2.5 text-[12px] text-[#FDFCF9] shadow-xl"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0066FF] opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0066FF]" />
                </span>
                Report ready in seconds
              </motion.div>
            </div>
          </motion.div>

          <dl className="mt-20 grid grid-cols-2 gap-y-8 border-t border-[#E7E3DB] pt-8 sm:grid-cols-4">
            {[
              ['60 sec', 'Per session'],
              ['Six', 'Skills scored'],
              ['Three', 'Feedback languages'],
              ['Three', 'CEFR levels'],
            ].map(([v, l]) => (
              <div key={l}>
                <dd className="font-serif-display text-[36px] leading-none">{v}</dd>
                <dt className="mt-2 text-[12px] text-[#6E6A61]">{l}</dt>
              </div>
            ))}
          </dl>
        </section>

        {/* =========================== MARQUEE =========================== */}
        <section
          aria-hidden
          className="relative overflow-hidden border-y border-[#E7E3DB] py-6 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]"
        >
          <div className="marquee-track flex w-max items-center gap-10 whitespace-nowrap">
            {Array.from({ length: 2 }).map((_, k) => (
              <div key={k} className="flex items-center gap-10">
                {['Pronunciation', 'Grammar', 'Fluency', 'Vocabulary', 'Filler words', 'Pacing', 'Clarity', 'Coherence'].map(
                  (w, i) => (
                    <span key={w} className="flex items-center gap-10">
                      <span
                        className={
                          i % 2
                            ? 'font-serif-display text-[28px] italic text-[#0E0D0B]/80'
                            : 'font-display text-[24px] font-bold tracking-[-0.015em]'
                        }
                      >
                        {w}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-[#0E0D0B]/25" />
                    </span>
                  )
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ============================ METHOD ============================ */}
        <section id="method" className="scroll-mt-20 py-24 sm:py-32">
          <SectionTitle eyebrow="The method">
            Three steps. <It>One minute.</It>
            <br />
            Measurable progress.
          </SectionTitle>

          <div className="mt-20 space-y-24 sm:space-y-32">
            {[
              {
                n: 'I.',
                title: (
                  <>
                    Choose a topic that <It>fits your level.</It>
                  </>
                ),
                copy: 'Beginner, Intermediate or Advanced. Each level draws from its own pool of real-world prompts — and if one doesn’t speak to you, ask for another.',
                rows: [
                  ['CEFR-aligned prompts', '3 levels'],
                  ['Shuffle on demand', '“Another one”'],
                  ['Guidance on length', '40+ words'],
                ] as [string, string][],
                visual: (
                  <div className="rounded-[24px] bg-[#F3F0EA] p-3 sm:p-8">
                    <Shot src="/landing/app-topic.png" alt="Choosing a level and a speaking topic" width={1504} height={1179} />
                  </div>
                ),
              },
              {
                n: 'II.',
                title: (
                  <>
                    Speak freely. <It>No script, no pressure.</It>
                  </>
                ),
                copy: 'A sixty-notch radial timer paces you while a live waveform responds to your voice. Pause, restart, or finish whenever you’re ready — it’s written down the moment you stop.',
                rows: [
                  ['Live voice waveform', 'Real time'],
                  ['Pause, resume, restart', 'Full control'],
                  ['Automatic transcript', 'Speech-to-text'],
                ] as [string, string][],
                visual: (
                  <div className="rounded-[24px] bg-[#0E0D0B] p-3 sm:p-8">
                    <Shot
                      src="/landing/app-recording.png"
                      alt="Recording screen with radial timer and live waveform"
                      width={1504}
                      height={1515}
                      className="mx-auto max-w-[440px]"
                    />
                  </div>
                ),
              },
              {
                n: 'III.',
                title: (
                  <>
                    Read a report that <It>tells you why.</It>
                  </>
                ),
                copy: 'An overall score, a plain-language verdict, and targeted corrections placed side by side with what you actually said — down to the timestamp.',
                rows: [
                  ['Overall score & verdict', 'Out of 10'],
                  ['Targeted corrections', 'Timestamped'],
                  ['Native model answer', 'CEFR C1'],
                ] as [string, string][],
                visual: (
                  <div className="space-y-4 rounded-[24px] bg-[#F3F0EA] p-3 sm:space-y-6 sm:p-8">
                    <Shot src="/landing/app-report-score.png" alt="Overall score and verdict" width={1504} height={495} className="sm:mr-16" />
                    <Shot
                      src="/landing/app-report-correction.png"
                      alt="Targeted correction comparing what you said with the corrected form"
                      width={1504}
                      height={822}
                      className="sm:ml-16"
                    />
                  </div>
                ),
              },
            ].map((c) => (
              <Reveal key={c.n}>
                <div className="grid gap-8 sm:grid-cols-[1fr_1.1fr] sm:gap-10">
                  <div>
                    <span className="font-serif-display text-[72px] italic leading-none text-[#0E0D0B]/15">{c.n}</span>
                    <h3 className="font-display mt-3 text-[30px] font-bold leading-[1.05] tracking-[-0.015em] sm:text-[34px]">
                      {c.title}
                    </h3>
                  </div>
                  <div className="space-y-7 sm:pt-[70px]">
                    <p className="text-[16px] leading-[1.7] text-[#0E0D0B]/70">{c.copy}</p>
                    <DetailList rows={c.rows} />
                  </div>
                </div>
                <div className="mt-10">{c.visual}</div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ============================ REPORT ============================ */}
        <section id="report" className="scroll-mt-20">
          <div className="rounded-[28px] bg-[#0E0D0B] px-6 py-14 text-[#FDFCF9] sm:px-12 sm:py-20">
            <Reveal>
              <Eyebrow light>The assessment report</Eyebrow>
              <h2 className="font-display mt-5 text-[38px] font-bold leading-[0.98] tracking-[-0.02em] sm:text-[54px]">
                The feedback a tutor would <It>take an hour</It> to write.
              </h2>
              <p className="mt-6 max-w-[520px] text-[16px] leading-[1.7] text-white/60">
                Every recording is scored across six dimensions, with written notes for each — plus your pace,
                pauses, filler words, strengths, next steps and a native-level model answer.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-12 sm:grid-cols-2 sm:gap-10">
              <Reveal delay={0.05}>
                <div className="flex items-end justify-between border-b border-white/15 pb-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">Sample report</p>
                  <p className="font-serif-display text-[26px] italic leading-none">
                    6.8<span className="text-white/40"> / 10</span>
                  </p>
                </div>
                <ul>
                  {METRICS.map((m, i) => (
                    <li key={m.name} className="border-b border-white/10 py-4">
                      <div className="flex items-baseline justify-between text-[15px]">
                        <span>{m.name}</span>
                        <span className="tabular-nums">{m.score.toFixed(1)}</span>
                      </div>
                      <span className="relative mt-3 block h-px w-full bg-white/15">
                        <motion.span
                          initial={{ width: 0 }}
                          whileInView={{ width: `${m.score * 10}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.4, ease, delay: 0.08 * i }}
                          className="absolute inset-y-0 left-0 bg-[#FDFCF9]"
                        />
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-10 grid grid-cols-3 gap-4">
                  <div>
                    <p className="font-display text-[18px] font-bold">English</p>
                    <p className="mt-1 text-[11px] text-white/40">Explanations</p>
                  </div>
                  <div>
                    <p className="font-hind-siliguri text-[18px] font-semibold">বাংলা</p>
                    <p className="mt-1 text-[11px] text-white/40">Bengali</p>
                  </div>
                  <div>
                    <p className="font-devanagari text-[18px] font-semibold">हिन्दी</p>
                    <p className="mt-1 text-[11px] text-white/40">Hindi</p>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <div className="rounded-[20px] bg-[#1A1916] p-3">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[14px] bg-white">
                    <Image
                      src="/landing/app-report-full.png"
                      alt="A complete beTalky assessment report"
                      width={1536}
                      height={7229}
                      className="report-scroll block h-auto w-full"
                      style={{ ['--scroll-to' as string]: '-73.4%' }}
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
                  </div>
                </div>
                <p className="mt-4 text-[11px] text-white/40">Score · Transcript · Corrections · Breakdown · Model answer</p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* =========================== SCENARIOS ========================== */}
        <section id="scenarios" className="scroll-mt-20 py-24 sm:py-32">
          <SectionTitle eyebrow="Scenarios · opening soon">
            Rehearse the moments <It>that matter.</It>
          </SectionTitle>
          <Reveal delay={0.05}>
            <p className="mt-6 max-w-[520px] text-[16px] leading-[1.7] text-[#0E0D0B]/70">
              From a first hello to a client pitch — guided scenario drills are on their way. Members can vote for
              the ones that open first.
            </p>
          </Reveal>

          <ul className="mt-14 border-t border-[#0E0D0B]">
            {SCENARIOS.map((s, i) => (
              <li key={s.title}>
                <Link
                  href={signedIn ? '/practice' : '/signup'}
                  className="group flex items-center gap-4 border-b border-[#E7E3DB] py-5 transition-colors hover:bg-[#FAF8F4] sm:gap-6 sm:py-6"
                >
                  <span className="w-7 shrink-0 text-[12px] tabular-nums text-[#6E6A61] sm:pl-1">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-display block text-[22px] font-bold tracking-[-0.02em] transition-transform duration-500 group-hover:translate-x-1.5 sm:text-[30px]">
                      {s.title}
                    </span>
                    <span className="font-serif-display mt-0.5 block text-[16px] italic text-[#6E6A61] sm:hidden">
                      {s.category}
                    </span>
                  </span>
                  <span className="font-serif-display hidden text-[17px] italic text-[#6E6A61] sm:block">{s.category}</span>
                  <span className="hidden rounded-full border border-[#E7E3DB] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[#6E6A61] sm:inline">Soon</span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#0E0D0B]/20 transition duration-500 group-hover:border-[#0E0D0B] group-hover:bg-[#0E0D0B] group-hover:text-[#FDFCF9]">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ========================== VOCABULARY ========================== */}
        <section id="vocabulary" className="scroll-mt-20 border-t border-[#E7E3DB] py-24 sm:py-32">
          <SectionTitle eyebrow="Vocabulary builder">
            Words you&apos;ll <It>actually use</It>, kept for good.
          </SectionTitle>

          <div className="mt-14 grid gap-12 sm:grid-cols-2 sm:gap-10">
            <Reveal>
              <p className="text-[16px] leading-[1.7] text-[#0E0D0B]/70">
                Practical words drawn from real conversation, with native pronunciation, Bengali meanings and
                examples — then reinforced with quizzes and spaced reviews until they stick.
              </p>
              <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8">
                {[
                  ['Native audio', 'Hear every word pronounced, as often as you need.'],
                  ['বাংলা অর্থ', 'Bengali meanings and example sentences.'],
                  ['Four quiz drills', 'Meaning, fill-the-blank, matching and more.'],
                  ['Spaced reviews', 'Daily revision timed to beat forgetting.'],
                ].map(([t, d]) => (
                  <div key={t} className="border-t border-[#0E0D0B] pt-4">
                    <dt
                      className={`${/[ঀ-৿]/.test(t) ? 'font-hind-siliguri' : 'font-display'} text-[16px] font-bold tracking-[-0.01em]`}
                    >
                      {t}
                    </dt>
                    <dd className="mt-1.5 text-[13px] leading-[1.6] text-[#6E6A61]">{d}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            {/* Word card — an editorial dictionary entry */}
            <Reveal delay={0.1}>
              <div className="relative">
                <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[24px] border border-[#E7E3DB] bg-[#F3F0EA]" />
                <div className="relative rounded-[24px] border border-[#E7E3DB] bg-white p-8 shadow-[0_40px_80px_-50px_rgba(14,13,11,0.4)]">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-[#6E6A61]">
                    <span>Word of the day</span>
                    <span>adj.</span>
                  </div>
                  <p className="font-serif-display mt-8 text-[60px] italic leading-none tracking-[-0.01em]">articulate</p>
                  <p className="mt-3 text-[14px] text-[#6E6A61]">/ɑːˈtɪk.jə.lət/</p>
                  <div className="mt-7 space-y-4 border-t border-[#E7E3DB] pt-6">
                    <p className="text-[15px] leading-[1.6]">Able to express thoughts and feelings clearly and effectively.</p>
                    <p className="font-hind-siliguri text-[17px] text-[#0E0D0B]/80">স্পষ্টভাষী; গুছিয়ে কথা বলতে পারে এমন</p>
                    <p className="font-serif-display text-[19px] italic text-[#0E0D0B]/70">
                      “She gave a calm, articulate answer to every question.”
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* =========================== PROGRESS =========================== */}
        <section className="border-t border-[#E7E3DB] py-24 sm:py-32">
          <div className="grid gap-8 sm:grid-cols-[1fr_1.1fr] sm:gap-10">
            <SectionTitle eyebrow="Your progress">
              Consistency, <It>made visible.</It>
            </SectionTitle>
            <Reveal delay={0.05} className="space-y-7 sm:pt-[44px]">
              <p className="text-[16px] leading-[1.7] text-[#0E0D0B]/70">
                A year-long practice heatmap, daily streaks, and every past report one tap away. Watch your scores
                climb — and know exactly what to work on next.
              </p>
              <DetailList
                rows={[
                  ['52-week activity heatmap', 'Dashboard'],
                  ['Streaks & practice days', 'Profile'],
                  ['Full report archive', 'History'],
                ]}
              />
            </Reveal>
          </div>
          <Reveal delay={0.1} className="mt-12">
            <div className="rounded-[24px] bg-[#F3F0EA] p-3 sm:p-8">
              <Shot src="/landing/app-progress.png" alt="Practice heatmap and recent feedback scores on the dashboard" width={1504} height={817} />
            </div>
          </Reveal>
        </section>

        {/* ============================== FAQ ============================== */}
        <section id="faq" className="scroll-mt-20 border-t border-[#E7E3DB] py-24 sm:py-32">
          <SectionTitle eyebrow="Questions">
            Before you <It>begin.</It>
          </SectionTitle>
          <Reveal delay={0.05} className="mt-12">
            <ul className="border-t border-[#0E0D0B]">
              {FAQ.map((f, i) => {
                const open = openFaq === i;
                return (
                  <li key={f.q} className="border-b border-[#E7E3DB]">
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="flex w-full items-center justify-between gap-6 py-6 text-left"
                      aria-expanded={open}
                    >
                      <span className="font-display text-[19px] font-bold tracking-[-0.015em] sm:text-[22px]">{f.q}</span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#0E0D0B]/20">
                        {open ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.45, ease }}
                          className="overflow-hidden"
                        >
                          <p className="max-w-[600px] pb-7 text-[15px] leading-[1.7] text-[#0E0D0B]/70">{f.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </section>

        {/* =========================== FINAL CTA =========================== */}
        <section className="pb-16">
          <Reveal>
            <div className="rounded-[28px] bg-[#0E0D0B] px-6 py-20 text-center text-[#FDFCF9] sm:py-24">
              <Eyebrow light>Your first session takes a minute</Eyebrow>
              <h2 className="font-display mx-auto mt-8 text-[48px] font-extrabold leading-[0.92] tracking-[-0.025em] sm:text-[76px]">
                Your next sentence <span className="font-serif-display font-normal italic tracking-[-0.015em]">starts now.</span>
              </h2>
              <div className="mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row">
                <Link
                  href={startHref}
                  className="group inline-flex items-center gap-3 rounded-full bg-[#FDFCF9] py-1.5 pl-6 pr-1.5 text-[14px] font-medium text-[#0E0D0B] transition hover:bg-white"
                >
                  {signedIn ? 'Open your dashboard' : 'Create your free account'}
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0E0D0B] text-[#FDFCF9] transition-transform duration-500 group-hover:-rotate-45">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
                {!signedIn && (
                  <Link href="/login" className="border-b border-white/30 pb-0.5 text-[14px] text-white/80 transition hover:border-white">
                    I already have an account
                  </Link>
                )}
              </div>
            </div>
          </Reveal>
        </section>

        {/* ============================= FOOTER ============================ */}
        <footer className="border-t border-[#E7E3DB] pt-12 pb-10">
          <div className="grid gap-10 sm:grid-cols-[1.3fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <Image src="/bTalky_logo.png" alt="beTalky" width={24} height={24} className="object-contain" />
                <span className="font-display text-[20px] font-bold tracking-[-0.015em]">beTalky</span>
              </div>
              <p className="font-serif-display mt-4 max-w-[260px] text-[20px] italic leading-[1.3] text-[#0E0D0B]/60">
                A quieter, sharper way to practise speaking English.
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#6E6A61]">Explore</p>
              <ul className="mt-4 space-y-2.5 text-[14px] text-[#0E0D0B]/75">
                <li><a href="#method" className="hover:text-[#0E0D0B]">Method</a></li>
                <li><a href="#report" className="hover:text-[#0E0D0B]">The report</a></li>
                <li><a href="#scenarios" className="hover:text-[#0E0D0B]">Scenarios</a></li>
                <li><a href="#faq" className="hover:text-[#0E0D0B]">FAQ</a></li>
              </ul>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#6E6A61]">Account</p>
              <ul className="mt-4 space-y-2.5 text-[14px] text-[#0E0D0B]/75">
                {signedIn ? (
                  <>
                    <li><Link href="/dashboard" className="hover:text-[#0E0D0B]">Dashboard</Link></li>
                    <li><Link href="/history" className="hover:text-[#0E0D0B]">History</Link></li>
                    <li><Link href="/profile" className="hover:text-[#0E0D0B]">Profile</Link></li>
                  </>
                ) : (
                  <>
                    <li><Link href="/signup" className="hover:text-[#0E0D0B]">Create account</Link></li>
                    <li><Link href="/login" className="hover:text-[#0E0D0B]">Sign in</Link></li>
                  </>
                )}
              </ul>
            </div>
          </div>
          <div className="font-display mt-14 select-none text-center text-[22vw] font-extrabold leading-[0.78] tracking-[-0.05em] text-[#0E0D0B]/[0.05] sm:text-[170px]">
            beTalky
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-[#E7E3DB] pt-6 text-[12px] text-[#6E6A61]">
            <span>© 2026 beTalky</span>
            <span>English · বাংলা · हिन्दी</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
