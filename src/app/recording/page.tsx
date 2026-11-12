'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import DialTimer from '@/components/DialTimer';
import AudioVisualizer from '@/components/AudioVisualizer';
import { DifficultyLevel } from '@/types/betalky';
import { saveAudioBlob } from '@/lib/audio-storage';
import { saveCompletedSession } from '@/lib/session-store';
import { WavRecorder } from '@/lib/wav-recorder';

function RecordingScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const topicTitle = searchParams.get('topic') || 'How could your city become friendlier for pedestrians?';
  const topicId = searchParams.get('topicId') || '';
  const level = (searchParams.get('level') as DifficultyLevel) || 'Intermediate';
  const instructions =
    searchParams.get('instructions') ||
    'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.';

  const [seconds, setSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<'transcribing' | 'assessing' | ''>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const wavRecorderRef = useRef<WavRecorder | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const secondsRef = useRef<number>(0);
  const maxSeconds = 60;

  // Always keep secondsRef synchronized with latest seconds to prevent stale closure during auto-submission
  useEffect(() => {
    secondsRef.current = seconds;
  }, [seconds]);

  // Cleanup helper to guarantee all hardware tracks and audio contexts are released
  const stopAllAudioTracks = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (wavRecorderRef.current) {
      try {
        wavRecorderRef.current.cleanup();
      } catch (e) {}
      wavRecorderRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      streamRef.current = null;
    }
    setAudioStream(null);
  };

  // Initialize Microphone & High-Precision Audio Capture
  const startMicrophone = async () => {
    try {
      stopAllAudioTracks();
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setAudioStream(stream);
      setMicPermissionGranted(true);

      // 1. Initialize WavRecorder (generates standard 16-bit PCM WAV for 100% ElevenLabs compatibility)
      try {
        const wavRecorder = new WavRecorder();
        wavRecorder.start(stream);
        wavRecorderRef.current = wavRecorder;
      } catch (wavErr) {
        console.warn('WavRecorder init note:', wavErr);
      }

      // 2. Initialize MediaRecorder as complementary recorder
      try {
        let options: MediaRecorderOptions | undefined = undefined;
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            options = { mimeType: 'audio/webm;codecs=opus' };
          } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            options = { mimeType: 'audio/webm' };
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            options = { mimeType: 'audio/mp4' };
          }
        }

        const mediaRecorder = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start(250);
      } catch (mrErr) {
        console.warn('MediaRecorder init note:', mrErr);
      }

      setIsRecording(true);
      setIsPaused(false);
      setSeconds(0);
      secondsRef.current = 0;
    } catch (err: any) {
      console.error('Microphone error:', err);
      setIsRecording(false);
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Microphone access was denied. Please allow microphone permissions in your browser to record your spoken response.'
          : 'Could not access your microphone. Please check your audio input device.'
      );
    }
  };

  // Start recording on component mount or whenever searchParams change (e.g. retrying topic)
  useEffect(() => {
    startMicrophone();

    return () => {
      stopAllAudioTracks();
    };
  }, [searchParams.toString()]);

  // Timer loop
  useEffect(() => {
    if (isRecording && !isPaused && !isProcessing) {
      timerIntervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          if (next >= maxSeconds) {
            return maxSeconds;
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isRecording, isPaused, isProcessing]);

  // Automatically start transcribing when timer reaches 60 seconds
  useEffect(() => {
    if (seconds >= maxSeconds && isRecording && !isProcessing) {
      handleFinishRecording();
    }
  }, [seconds, isRecording, isProcessing]);

  // Pause / Resume Toggle
  const handleTogglePause = () => {
    if (isPaused) {
      if (wavRecorderRef.current) wavRecorderRef.current.resume();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
      }
      setIsPaused(false);
    } else {
      if (wavRecorderRef.current) wavRecorderRef.current.pause();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
      }
      setIsPaused(true);
    }
  };

  // Restart Recording
  const handleRestart = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (wavRecorderRef.current) {
      wavRecorderRef.current.cleanup();
      wavRecorderRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    audioChunksRef.current = [];
    setSeconds(0);
    secondsRef.current = 0;
    setIsPaused(false);
    setIsRecording(false);
    setErrorMessage(null);

    setTimeout(() => {
      startMicrophone();
    }, 200);
  };

  // Finish Recording & Submit to Server
  const handleFinishRecording = async () => {
    if (isProcessing) return;
    const finalDuration = secondsRef.current > 0 ? secondsRef.current : seconds;
    if (finalDuration < 3) {
      setErrorMessage('Please speak for at least 3 seconds before submitting your response.');
      return;
    }

    setIsProcessing(true);
    setIsRecording(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Step A: Extract pristine audio blob
    let audioBlob: Blob | null = null;

    // Primary: Export 16-bit PCM WAV (clean RIFF header, zero container corruption)
    if (wavRecorderRef.current) {
      try {
        const wav = wavRecorderRef.current.stop();
        if (wav && wav.size > 2000) {
          audioBlob = wav;
        }
      } catch (wErr) {
        console.warn('WavRecorder stop note:', wErr);
      }
    }

    // Secondary fallback: MediaRecorder
    if (!audioBlob) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        await new Promise<void>((resolve) => {
          if (!mediaRecorderRef.current) return resolve();
          mediaRecorderRef.current.onstop = () => resolve();
          try {
            mediaRecorderRef.current.stop();
          } catch (e) {
            resolve();
          }
          setTimeout(resolve, 400);
        });
      }
      const mimeType = mediaRecorderRef.current?.mimeType?.split(';')[0] || 'audio/webm';
      audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
    }

    if (!audioBlob || audioBlob.size === 0) {
      setIsProcessing(false);
      setErrorMessage('No audio data captured. Please check your microphone and try again.');
      return;
    }

    // Step 1: Transcribe
    setProcessingStage('transcribing');
    setStatusMessage('Transcribing your speech...');

    let transcript = '';
    let serverSessionId = '';
    let audioUrl = '';

    const isWav = audioBlob.type.includes('wav');
    const uploadFileName = isWav ? 'speech_recording.wav' : 'speech_recording.webm';

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, uploadFileName);
      formData.append('topicTitle', topicTitle);
      formData.append('level', level);
      formData.append('durationSeconds', String(finalDuration));

      const transcribeRes = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const transcribeData = await transcribeRes.json();

      if (!transcribeRes.ok) {
        throw new Error(transcribeData.error || 'Failed to transcribe spoken audio.');
      }

      transcript = transcribeData.transcript;
      serverSessionId = transcribeData.sessionId;
      audioUrl = transcribeData.audioUrl;

      // Save binary audio to browser IndexedDB for guaranteed client-side playback
      try {
        await saveAudioBlob(serverSessionId, audioBlob);
      } catch (blobErr) {
        console.warn('Audio local storage note:', blobErr);
      }
    } catch (transcribeErr: any) {
      setIsProcessing(false);
      setProcessingStage('');
      setErrorMessage(transcribeErr.message || 'Transcription failed.');
      return;
    }

    // Step 2: AI Speech Assessment
    setProcessingStage('assessing');
    setStatusMessage('Evaluating grammar, vocabulary, and pacing...');

    try {
      const assessRes = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: serverSessionId,
          topicTitle: topicTitle,
          level: level,
          transcript: transcript,
          durationSeconds: finalDuration,
          audioUrl: audioUrl,
        }),
      });

      const assessData = await assessRes.json();

      if (!assessRes.ok) {
        throw new Error(assessData.error || 'Failed to generate speech assessment report.');
      }

      // Save complete session & report to persistent history store & sessionStorage
      try {
        saveCompletedSession({
          sessionId: serverSessionId,
          topicTitle,
          level,
          durationSeconds: finalDuration,
          transcript,
          audioUrl,
          report: assessData.report,
        });
      } catch (e) {
        console.warn('Session persistence note:', e);
      }

      // Navigate to Assessment Report
      router.push(`/assessment/${serverSessionId}`);
    } catch (assessErr: any) {
      setIsProcessing(false);
      setProcessingStage('');
      setErrorMessage(assessErr.message || 'AI assessment failed.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between font-sans antialiased text-slate-800">
      {/* Main Content Container */}
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full pt-10 sm:pt-14 pb-16 flex-1 flex flex-col items-center"
      >
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6">
          {/* Breadcrumb / Header Status Row */}
          <div className="flex items-center justify-between gap-4 mb-8 border-b border-[#E7E3DB] pb-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-[13px] text-slate-600 hover:text-slate-950 transition-colors group"
            >
              <span className="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-0.5">
                arrow_back
              </span>
              <span>Dashboard</span>
            </Link>

            <div className="flex items-center gap-2.5">
              <span className="eyebrow hidden sm:inline-block">
                {level} • Today&apos;s Topic
              </span>
              <div className="inline-flex items-center gap-2 bg-white/80 border border-[#E7E3DB] px-3.5 py-1.5 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span
                    className={`absolute inline-flex h-full w-full rounded-full bg-[#0066FF] ${
                      isRecording && !isPaused ? 'animate-ping opacity-75' : 'opacity-0'
                    }`}
                  ></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0066FF]"></span>
                </span>
                <span className="text-[10px] font-medium text-slate-950 uppercase tracking-[0.16em]">
                  {isProcessing
                    ? 'Processing speech...'
                    : isPaused
                    ? 'Recording paused'
                    : isRecording
                    ? 'Recording in progress'
                    : 'Ready to record'}
                </span>
              </div>
            </div>
          </div>

          {/* Recording Card */}
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="relative bg-white border border-[#E7E3DB] rounded-[28px] p-6 sm:p-10 md:p-12 shadow-[0_30px_60px_-45px_rgba(14,13,11,0.35)] text-center overflow-hidden flex flex-col items-center w-full"
          >
            {/* Subtle radial ambient background light */}
            

            {/* Topic Question & Subtitle */}
            <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
              <h1
                className="font-display text-[28px] sm:text-[36px] font-bold text-slate-950 leading-[1.05] tracking-[-0.015em]"
              >
                {topicTitle}
              </h1>
              <p className="font-serif-display text-[19px] sm:text-[21px] italic text-slate-600 mt-4 max-w-md leading-snug">
                {instructions}
              </p>
            </div>

            {/* Error Message Alert */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="relative z-20 my-4 max-w-md p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs text-left space-y-2"
                >
                  <div className="font-semibold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    <span>Action Required</span>
                  </div>
                  <p className="leading-relaxed">{errorMessage}</p>
                  <div className="pt-1 flex gap-2">
                    <button
                      onClick={startMicrophone}
                      className="px-3 py-1 bg-rose-600 text-white rounded-full font-medium hover:bg-rose-700 transition"
                    >
                      Retry Recording
                    </button>
                    <Link
                      href="/dashboard"
                      className="px-3 py-1 bg-white border border-rose-200 text-slate-700 rounded-full font-medium hover:bg-slate-50 transition"
                    >
                      Back to Dashboard
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dial Timer Gauge */}
            <DialTimer elapsedSeconds={seconds} maxSeconds={maxSeconds} />

            {/* Animated Soundwave Visualizer */}
            <AudioVisualizer
              isRecording={isRecording}
              isPaused={isPaused}
              audioStream={audioStream}
            />

            {/* Processing Overlay State */}
            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="relative z-20 mt-6 flex flex-col items-center space-y-3"
                >
                  <div className="flex items-center gap-3 px-5 py-2.5 bg-[#FDFCF9] border border-[#E7E3DB] rounded-full text-slate-950 text-[13px] font-medium">
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    <span>{statusMessage}</span>
                  </div>
                  <p className="font-serif-display text-[16px] italic text-slate-500">
                    {processingStage === 'transcribing'
                      ? 'Converting your spoken words into text...'
                      : 'Synthesizing your CEFR diagnostic report...'}
                  </p>
                </motion.div>
              ) : !isRecording ? (
                /* Ready / Start Recording State */
                <motion.div
                  key="start-controls"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative z-10 flex items-center justify-center gap-4 mt-4 sm:mt-8 w-full max-w-md"
                >
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={startMicrophone}
                    className="bg-slate-950 hover:bg-black text-[#FDFCF9] font-medium px-7 sm:px-9 py-3.5 rounded-full shadow-[0_18px_30px_-14px_rgba(14,13,11,0.55)] flex items-center space-x-2 transition-colors text-[14px]"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px] sm:text-[20px]">mic</span>
                    <span>Start recording</span>
                  </motion.button>
                </motion.div>
              ) : (
                /* Active Recording Controls Row */
                <motion.div
                  key="controls"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative z-10 flex items-center justify-center gap-3 sm:gap-6 mt-4 sm:mt-8 w-full max-w-md"
                >
                  {/* Pause Button */}
                  <div className="flex flex-col items-center">
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={handleTogglePause}
                      aria-label={isPaused ? 'Resume recording' : 'Pause recording'}
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-[#E7E3DB] bg-white hover:border-slate-950 text-slate-800 flex items-center justify-center transition-colors"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                        {isPaused ? 'play_arrow' : 'pause'}
                      </span>
                    </motion.button>
                    <span className="text-[11px] sm:text-xs font-normal text-slate-500 mt-1 sm:mt-1.5">
                      {isPaused ? 'Resume' : 'Pause'}
                    </span>
                  </div>

                  {/* Finish Recording Button */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleFinishRecording}
                    disabled={seconds < 2}
                    className="bg-slate-950 hover:bg-black text-[#FDFCF9] font-medium px-6 sm:px-9 py-3.5 rounded-full shadow-[0_18px_30px_-14px_rgba(14,13,11,0.55)] flex items-center space-x-1.5 sm:space-x-2 transition-colors disabled:opacity-50 disabled:pointer-events-none text-[13px] sm:text-[14px]"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px] sm:text-[20px]">check_circle</span>
                    <span>Finish recording</span>
                  </motion.button>

                  {/* Restart Button */}
                  <div className="flex flex-col items-center">
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={handleRestart}
                      aria-label="Restart recording"
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-[#E7E3DB] bg-white hover:border-slate-950 text-slate-800 flex items-center justify-center transition-colors"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px] sm:text-[20px]">restart_alt</span>
                    </motion.button>
                    <span className="text-[11px] sm:text-xs font-normal text-slate-500 mt-1 sm:mt-1.5">Restart</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}

export default function RecordingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <RecordingScreen />
    </Suspense>
  );
}
