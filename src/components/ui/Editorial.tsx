import React from 'react';

/**
 * Editorial UI primitives shared across beTalky pages.
 * Bold display (Inter Tight) paired with condensed serif italic (Instrument Serif),
 * ivory paper, ink and hairline rules.
 */

/** Serif-italic accent inside a bold display heading. */
export function It({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`font-serif-display font-normal italic tracking-[-0.01em] ${className}`}>{children}</span>
  );
}

/** Small uppercase tracked label. */
export function Eyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`eyebrow ${className}`}>{children}</p>;
}

/** Page-level header: eyebrow, big display title, optional lede and right-side slot. */
export function PageHeader({
  eyebrow,
  title,
  lede,
  right,
  className = '',
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lede?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={`space-y-4 ${className}`}>
      {(eyebrow || right) && (
        <div className="flex items-center justify-between gap-4 border-b border-[#E7E3DB] pb-4">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : <span />}
          {right}
        </div>
      )}
      <h1 className="font-display pt-2 text-[40px] font-bold leading-[0.98] tracking-[-0.02em] text-slate-950 sm:text-[52px]">
        {title}
      </h1>
      {lede && <p className="max-w-[540px] text-[15px] leading-[1.7] text-slate-600">{lede}</p>}
    </header>
  );
}

/** Section heading with optional meta on the right. */
export function SectionHeading({
  title,
  meta,
  className = '',
}: {
  title: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-end justify-between gap-4 ${className}`}>
      <h2 className="font-display text-[24px] font-bold leading-none tracking-[-0.015em] text-slate-950 sm:text-[28px]">
        {title}
      </h2>
      {meta && <span className="shrink-0 text-[12px] text-slate-500">{meta}</span>}
    </div>
  );
}

/** Standard raised card. */
export const cardCls =
  'rounded-[24px] border border-[#E7E3DB] bg-white shadow-[0_30px_60px_-45px_rgba(14,13,11,0.35)]';

/** Primary ink pill button with a rotating arrow disc. */
export const primaryPill =
  'group inline-flex items-center justify-center gap-3 rounded-full bg-slate-950 py-1.5 pl-6 pr-1.5 text-[14px] font-medium text-[#FDFCF9] transition hover:bg-black disabled:opacity-50';
export const primaryPillDisc =
  'flex h-9 w-9 items-center justify-center rounded-full bg-[#FDFCF9] text-slate-950 transition-transform duration-500 group-hover:-rotate-45';

/** Quiet outline pill. */
export const ghostPill =
  'inline-flex items-center justify-center gap-2 rounded-full border border-[#E7E3DB] bg-white/70 px-4 py-2 text-[13px] font-medium text-slate-800 transition hover:border-slate-950 hover:text-slate-950 disabled:opacity-50';
