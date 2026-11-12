'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AudioVisualizerProps {
  isRecording: boolean;
  isPaused: boolean;
  audioStream?: MediaStream | null;
}

export default function AudioVisualizer({
  isRecording,
  isPaused,
  audioStream,
}: AudioVisualizerProps) {
  const [levels, setLevels] = useState<number[]>([12, 20, 32, 24, 36, 16, 28, 36, 24, 16, 8]);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!isRecording || isPaused || !audioStream) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(audioStream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevels = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Map to 11 frequency bands
        const newLevels = Array.from({ length: 11 }, (_, i) => {
          const index = Math.floor((i / 11) * bufferLength);
          const val = dataArray[index] || 0;
          // Scale to height in px (min 6px, max 36px)
          const scaled = 6 + Math.round((val / 255) * 30);
          return scaled;
        });

        setLevels(newLevels);
        animationFrameRef.current = requestAnimationFrame(updateLevels);
      };

      updateLevels();
    } catch (err) {
      console.warn('AudioContext visualizer initialization note:', err);
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isRecording, isPaused, audioStream]);

  const defaultHeights = [12, 20, 32, 24, 36, 16, 28, 36, 24, 16, 8];
  const opacities = [0.4, 0.65, 1, 1, 0.9, 1, 0.7, 1, 0.8, 0.5, 0.35];

  return (
    <div className="h-9 mt-4 flex items-center justify-center gap-1.5 px-4 py-1">
      {defaultHeights.map((h, i) => {
        const height = audioStream && isRecording && !isPaused ? levels[i] : h;
        return (
          <span
            key={i}
            className={`w-1 bg-slate-950 rounded-full transition-all duration-75 ${
              isRecording && !isPaused && !audioStream ? 'wave-bar' : ''
            }`}
            style={{
              height: `${height}px`,
              opacity: opacities[i],
              animationDelay: `${0.1 + (i % 6) * 0.1}s`,
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          />
        );
      })}
    </div>
  );
}

