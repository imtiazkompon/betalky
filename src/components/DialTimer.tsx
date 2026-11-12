'use client';

import React from 'react';

interface DialTimerProps {
  elapsedSeconds: number;
  maxSeconds?: number;
}

export default function DialTimer({ elapsedSeconds, maxSeconds = 60 }: DialTimerProps) {
  // Generate 60 ticks (6 degrees each = 360 degrees)
  const ticks = Array.from({ length: 60 }, (_, index) => {
    const isElapsed = index <= elapsedSeconds;
    const isQuarter = index % 15 === 0;
    const angle = index * 6;

    return {
      index,
      angle,
      isElapsed,
      isQuarter,
    };
  });

  const displaySeconds = Math.min(elapsedSeconds, maxSeconds);
  const formattedSeconds = String(displaySeconds).padStart(2, '0');

  return (
    <div className="relative z-10 my-4 sm:my-8 flex flex-col items-center select-none">
      <div className="relative w-[210px] h-[210px] sm:w-[260px] sm:h-[260px] flex items-center justify-center">
        {/* SVG Radial Gauge (60 ticks) */}
        <svg
          className="w-full h-full transform select-none"
          viewBox="0 0 260 260"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="activeGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Inner subtle boundary guide */}
          <circle cx="130" cy="130" r="94" fill="none" stroke="#EFECE6" strokeWidth="1" />

          {/* Radial Ticks: 60 notch ticks around circumference */}
          <g id="ticks-container" transform="translate(130, 130)">
            {ticks.map((tick) => {
              if (tick.isElapsed) {
                return (
                  <line
                    key={tick.index}
                    stroke="#0E0D0B"
                    strokeLinecap="round"
                    strokeWidth={tick.isQuarter ? '4' : '3.5'}
                    transform={`rotate(${tick.angle})`}
                    x1="0"
                    x2="0"
                    y1="-118"
                    y2={tick.isQuarter ? '-100' : '-102'}
                  />
                );
              }
              return (
                <line
                  key={tick.index}
                  stroke="#D6D0C4"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                  transform={`rotate(${tick.angle})`}
                  x1="0"
                  x2="0"
                  y1="-118"
                  y2="-104"
                />
              );
            })}
          </g>
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="flex items-baseline justify-center leading-none">
            <span className="font-serif-display text-[44px] text-slate-300 sm:text-[56px]">0:</span>
            <span className="font-serif-display text-[64px] text-slate-950 sm:text-[80px]">{formattedSeconds}</span>
          </div>
          <div className="eyebrow mt-2">of {maxSeconds} seconds</div>
        </div>
      </div>
    </div>
  );
}

