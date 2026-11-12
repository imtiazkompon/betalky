'use client';

import React, { useState, useEffect } from 'react';
import LevelSelector from '@/components/LevelSelector';
import PracticePromptCard from '@/components/PracticePromptCard';
import MetricCards from '@/components/MetricCards';
import Heatmap from '@/components/Heatmap';
import RecentFeedbackList from '@/components/RecentFeedbackList';
import { DifficultyLevel, Topic, RecentFeedbackSummary } from '@/types/betalky';
import { getTopicsByLevel, getNextShuffledTopic, DEFAULT_TOPICS } from '@/lib/default-topics';
import { createClient } from '@/lib/supabase/client';
import { motion, type Variants } from 'framer-motion';
import { PageHeader, It } from '@/components/ui/Editorial';
import { mergeHistorySessions, getStoredSessions, calculateUserActivityStats } from '@/lib/session-store';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export default function DashboardPage() {
  const [level, setLevel] = useState<DifficultyLevel>('Intermediate');
  const [currentTopic, setCurrentTopic] = useState<Topic>(() => getTopicsByLevel('Intermediate')[0] || DEFAULT_TOPICS[0]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [totalRecordings, setTotalRecordings] = useState<number>(0);
  const [streakStats, setStreakStats] = useState({
    dayStreak: 0,
    longestStreak: 0,
    practiceDays: 0,
  });
  const [activityData, setActivityData] = useState<Array<{ activity_date: string; recording_count: number }>>([]);
  const [feedbackList, setFeedbackList] = useState<RecentFeedbackSummary[]>([]);

  // Load real user data & sessions from local storage & Supabase
  useEffect(() => {
    // 1. Calculate and apply real stats from user's actual practice sessions
    const stats = calculateUserActivityStats();
    setStreakStats({
      dayStreak: stats.dayStreak,
      longestStreak: stats.longestStreak,
      practiceDays: stats.practiceDays,
    });
    setTotalRecordings(stats.totalRecordings);
    setActivityData(stats.activityData);

    // Load real feedback history without any fake default sessions
    const realHistory = mergeHistorySessions([]);
    setFeedbackList(realHistory.slice(0, 5));

    async function loadUserData() {
      try {
        const res = await fetch('/api/sessions');
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setStreakStats((prev) => ({
              dayStreak: Math.max(prev.dayStreak, data.profile.day_streak || 0),
              longestStreak: Math.max(prev.longestStreak, data.profile.longest_streak || 0),
              practiceDays: Math.max(prev.practiceDays, data.profile.total_practice_days || 0),
            }));
            if (data.profile.level) {
              setLevel(data.profile.level);
              setCurrentTopic(getNextShuffledTopic(data.profile.level));
            }
          }

          let serverFormatted: RecentFeedbackSummary[] = [];
          if (data.sessions && data.sessions.length > 0) {
            serverFormatted = data.sessions.map((s: any) => {
              const assessment = Array.isArray(s.assessment_reports)
                ? s.assessment_reports[0]
                : s.assessment_reports;
              return {
                id: s.id,
                session_id: s.id,
                topic_title: s.topic_title,
                date_formatted: new Date(s.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }),
                score: assessment?.overall_score || 6.0,
                descriptor: assessment?.assessment_verdict || 'Completed practice',
              };
            });
          }

          const combined = mergeHistorySessions(serverFormatted);
          setFeedbackList(combined.slice(0, 5));
          if (combined.length > 0) {
            setTotalRecordings((prev) => Math.max(prev, combined.length));
          }

          if (data.activity && data.activity.length > 0) {
            setActivityData(data.activity);
          }
        }
      } catch (err) {
        console.warn('Dashboard data fetch note:', err);
      }
    }
    loadUserData();
  }, []);

  const handleSelectLevel = (newLevel: DifficultyLevel) => {
    setLevel(newLevel);
    setCurrentTopic(getNextShuffledTopic(newLevel));
  };

  const handleShuffle = () => {
    setIsShuffling(true);
    setTimeout(() => {
      setCurrentTopic(getNextShuffledTopic(level, currentTopic.id));
      setIsShuffling(false);
    }, 200);
  };

  return (
    <div className="min-h-screen">
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-3xl space-y-12 px-4 py-10 sm:px-6 sm:py-14"
      >
        <motion.div variants={itemVariants}>
          <PageHeader
            title={
              <>
                One minute. <It>One topic.</It>
              </>
            }
            lede="Pick your level, read the prompt, and speak. Your report is ready the moment you stop."
          />
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-5">
          <LevelSelector currentLevel={level} onSelectLevel={handleSelectLevel} />
          <PracticePromptCard topic={currentTopic} level={level} onShuffle={handleShuffle} isShuffling={isShuffling} />
        </motion.div>

        <motion.section variants={itemVariants} className="space-y-5" data-purpose="user-practice-analytics">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-[24px] font-bold leading-none tracking-[-0.015em] text-slate-950 sm:text-[28px]">
              Your <It>practice</It>
            </h2>
            <span className="text-[12px] text-slate-500">
              {totalRecordings} recording{totalRecordings === 1 ? '' : 's'} so far
            </span>
          </div>

          {/* 3 Metric Cards */}
          <MetricCards
            dayStreak={streakStats.dayStreak}
            longestStreak={streakStats.longestStreak}
            practiceDays={streakStats.practiceDays}
          />

          {/* 52-Week Practice Heatmap Matrix */}
          <Heatmap activityData={activityData} />
        </motion.section>

        {/* Recent Feedback Section */}
        <motion.div variants={itemVariants}>
          <RecentFeedbackList items={feedbackList} />
        </motion.div>
      </motion.main>
    </div>
  );
}

