'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTime } from '@/lib/utils';
import { TargetedCorrection } from '@/types/betalky';
interface AudioPlayerProps {
  audioUrl?: string;
  durationSeconds?: number;
  originalTranscript: string;
  correctedTranscript: string;
  corrections?: TargetedCorrection[];
}

export default function AudioPlayer({
  audioUrl,
  durationSeconds = 58,
  originalTranscript,
  correctedTranscript,
  corrections = [],
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(durationSeconds > 0 ? durationSeconds : 58);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<'original' | 'corrected'>('original');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const simulatedTimerRef = useRef<NodeJS.Timeout | null>(null);

  const duration = audioDuration > 0 ? audioDuration : (durationSeconds > 0 ? durationSeconds : 58);

  useEffect(() => {
    if (durationSeconds && durationSeconds > 0) {
      setAudioDuration(durationSeconds);
    }
  }, [durationSeconds]);

  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.warn('[AudioPlayer] Audio play failed, starting simulated timer:', err);
          startSimulatedPlayback();
        });
      }
    } else {
      // Simulated playback for review if no audio file
      if (isPlaying) {
        if (simulatedTimerRef.current) clearInterval(simulatedTimerRef.current);
        setIsPlaying(false);
      } else {
        startSimulatedPlayback();
      }
    }
  };

  const startSimulatedPlayback = () => {
    setIsPlaying(true);
    if (simulatedTimerRef.current) clearInterval(simulatedTimerRef.current);

    simulatedTimerRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev + 1 >= duration) {
          if (simulatedTimerRef.current) clearInterval(simulatedTimerRef.current);
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1000 / playbackRate);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(Math.floor(audioRef.current.currentTime));
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && Number.isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
      setAudioDuration(Math.round(audioRef.current.duration));
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const cyclePlaybackRate = () => {
    const rates = [1.0, 1.25, 1.5, 0.75];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const handleScrubberClick = (fraction: number) => {
    const targetTime = Math.floor(fraction * duration);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  useEffect(() => {
    return () => {
      if (simulatedTimerRef.current) clearInterval(simulatedTimerRef.current);
    };
  }, []);

  // Highlight mistakes in original transcript
  const renderOriginalText = () => {
    if (!corrections || corrections.length === 0) {
      return <span>&ldquo;{originalTranscript}&rdquo;</span>;
    }

    let text = originalTranscript;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Search for substrings from corrections
    corrections.forEach((c, idx) => {
      const cleanSnippet = c.you_said.replace(/^\.\.\.|\.\.\.$/g, '').trim();
      if (!cleanSnippet) return;

      const foundIndex = text.toLowerCase().indexOf(cleanSnippet.toLowerCase(), lastIndex);
      if (foundIndex !== -1) {
        if (foundIndex > lastIndex) {
          parts.push(text.slice(lastIndex, foundIndex));
        }
        parts.push(
          <span
            key={idx}
            className="bg-rose-50 text-rose-600 border-b-2 border-rose-400 px-1 py-0.5 rounded font-medium mx-0.5"
            title={`Correction: ${c.corrected_form}`}
          >
            {text.slice(foundIndex, foundIndex + cleanSnippet.length)}
          </span>
        );
        lastIndex = foundIndex + cleanSnippet.length;
      }
    });

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return <span>&ldquo;{parts.length > 0 ? parts : text}&rdquo;</span>;
  };

  // Highlight corrections in corrected transcript
  const renderCorrectedText = () => {
    if (!corrections || corrections.length === 0) {
      return <span>&ldquo;{correctedTranscript}&rdquo;</span>;
    }

    let text = correctedTranscript;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    corrections.forEach((c, idx) => {
      const cleanSnippet = c.corrected_form.replace(/^\.\.\.|\.\.\.$/g, '').trim();
      if (!cleanSnippet) return;

      const foundIndex = text.toLowerCase().indexOf(cleanSnippet.toLowerCase(), lastIndex);
      if (foundIndex !== -1) {
        if (foundIndex > lastIndex) {
          parts.push(text.slice(lastIndex, foundIndex));
        }
        parts.push(
          <span
            key={idx}
            className="bg-blue-50 text-blue-600 border-b-2 border-blue-400 px-1 py-0.5 rounded font-medium mx-0.5"
            title={c.rule_name}
          >
            {text.slice(foundIndex, foundIndex + cleanSnippet.length)}
          </span>
        );
        lastIndex = foundIndex + cleanSnippet.length;
      }
    });

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return <span>&ldquo;{parts.length > 0 ? parts : text}&rdquo;</span>;
  };

  // 16 waveform bars
  const totalBars = 16;
  const progressRatio = Math.min(1, currentTime / duration);
  const activeBarsCount = Math.floor(progressRatio * totalBars);

  const barHeights = [12, 20, 8, 24, 16, 20, 12, 16, 8, 20, 12, 24, 16, 8, 20, 12];

  return (
    <section className="bg-white border border-[#E7E3DB] rounded-[24px] shadow-[0_30px_60px_-45px_rgba(14,13,11,0.35)] p-6 sm:p-8 space-y-5">
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600 text-[20px]">
            hearing
          </span>
          <h2 className="font-display text-[22px] font-bold tracking-[-0.015em] text-slate-950">
            Audio &amp; Transcript
          </h2>
        </div>
      </div>

      {/* Audio Player Bar */}
      <div className="bg-[#FAF8F4] border border-[#EFECE6] rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Play/Pause Button */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors shrink-0"
            type="button"
            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            <span className="material-symbols-outlined text-[22px]">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </motion.button>

          {/* Mobile Speed & Volume Shortcut */}
          <div className="flex items-center gap-1.5 sm:hidden ml-auto">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={cyclePlaybackRate}
              className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold shadow-xs"
              type="button"
            >
              {playbackRate.toFixed(1)}x
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleMute}
              className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isMuted ? 'volume_off' : 'volume_up'}
              </span>
            </motion.button>
          </div>
        </div>

        {/* Scrubber & Waveform */}
        <div className="flex-1 w-full space-y-1.5">
          <div
            className="h-6 flex items-center gap-1 cursor-pointer select-none"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              handleScrubberClick(ratio);
            }}
          >
            {Array.from({ length: totalBars }).map((_, i) => {
              const isActive = i <= activeBarsCount;
              return (
                <span
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isActive ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                  style={{ height: `${barHeights[i % barHeights.length]}px` }}
                />
              );
            })}
          </div>

          <div className="flex justify-between text-[10px] font-semibold text-slate-400 tracking-wider font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Desktop Speed & Volume Controls */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={cyclePlaybackRate}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs hover:bg-slate-50 transition"
            type="button"
            title="Cycle playback speed"
          >
            {playbackRate.toFixed(1)}x
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleMute}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 transition"
            type="button"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isMuted ? 'volume_off' : 'volume_up'}
            </span>
          </motion.button>
        </div>
      </div>

      {/* Transcript Tabs & Content */}
      <div className="space-y-3">
        <div className="inline-flex max-w-full overflow-x-auto p-1 bg-slate-100 rounded-full relative">
          <button
            onClick={() => setActiveTab('original')}
            className={`relative px-3 sm:px-3.5 py-1 rounded-full text-[11px] sm:text-xs transition-colors z-10 whitespace-nowrap ${
              activeTab === 'original'
                ? 'font-semibold text-slate-900'
                : 'font-medium text-slate-500 hover:text-slate-900'
            }`}
            type="button"
          >
            {activeTab === 'original' && (
              <motion.div
                layoutId="audio-tab-indicator"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute inset-0 bg-white rounded-full shadow-xs -z-10"
              />
            )}
            Original Transcript
          </button>
          <button
            onClick={() => setActiveTab('corrected')}
            className={`relative px-3 sm:px-3.5 py-1 rounded-full text-[11px] sm:text-xs transition-colors z-10 whitespace-nowrap ${
              activeTab === 'corrected'
                ? 'font-semibold text-slate-900'
                : 'font-medium text-slate-500 hover:text-slate-900'
            }`}
            type="button"
          >
            {activeTab === 'corrected' && (
              <motion.div
                layoutId="audio-tab-indicator"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute inset-0 bg-white rounded-full shadow-xs -z-10"
              />
            )}
            Corrected Version
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'original' ? (
            <motion.div
              key="original-box"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F4] border border-[#EFECE6] text-[15px] text-slate-800 leading-[1.75]"
            >
              {renderOriginalText()}
            </motion.div>
          ) : (
            <motion.div
              key="corrected-box"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F4] border border-[#EFECE6] text-[15px] text-slate-800 leading-[1.75]"
            >
              {renderCorrectedText()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
