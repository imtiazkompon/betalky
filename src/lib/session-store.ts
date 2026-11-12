import { AssessmentReport, RecentFeedbackSummary } from '@/types/betalky';

export interface StoredSession {
  id: string;
  session_id: string;
  topic_title: string;
  level: string;
  score: number;
  descriptor: string;
  date_formatted: string;
  created_at: string;
  audio_duration_seconds: number;
  audio_url?: string;
  transcript?: string;
  report?: AssessmentReport;
}

const STORAGE_KEY = 'betalky_history_sessions';

/**
 * Get all locally recorded sessions from localStorage
 */
export function getStoredSessions(): StoredSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list: StoredSession[] = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.warn('[SessionStore] Error reading local history:', err);
    return [];
  }
}

/**
 * Save a newly completed practice session to localStorage
 */
export function saveCompletedSession(params: {
  sessionId: string;
  topicTitle: string;
  level: string;
  durationSeconds: number;
  transcript: string;
  audioUrl?: string;
  report: AssessmentReport;
}): StoredSession {
  const { sessionId, topicTitle, level, durationSeconds, transcript, audioUrl, report } = params;

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const newEntry: StoredSession = {
    id: sessionId,
    session_id: sessionId,
    topic_title: topicTitle,
    level,
    score: report.overall_score,
    descriptor: report.assessment_verdict,
    date_formatted: dateFormatted,
    created_at: now.toISOString(),
    audio_duration_seconds: durationSeconds,
    audio_url: audioUrl,
    transcript,
    report,
  };

  if (typeof window !== 'undefined') {
    try {
      const existing = getStoredSessions();
      // Remove any duplicate with same ID
      const filtered = existing.filter((s) => s.id !== sessionId && s.session_id !== sessionId);
      // Prepend newest session to top
      const updated = [newEntry, ...filtered].slice(0, 50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Also set in sessionStorage for instant retrieval on assessment page
      sessionStorage.setItem(`betalky_report_${sessionId}`, JSON.stringify(report));
      sessionStorage.setItem(`betalky_session_${sessionId}`, JSON.stringify(newEntry));
    } catch (err) {
      console.warn('[SessionStore] Could not save session to localStorage:', err);
    }
  }

  return newEntry;
}

/**
 * Retrieve a specific session by ID from localStorage or sessionStorage
 */
export function getStoredSessionById(id: string): StoredSession | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Check sessionStorage
    const sessionRaw = sessionStorage.getItem(`betalky_session_${id}`);
    if (sessionRaw) {
      return JSON.parse(sessionRaw);
    }

    // 2. Check localStorage history list
    const sessions = getStoredSessions();
    const found = sessions.find((s) => s.id === id || s.session_id === id);
    if (found) return found;
  } catch (err) {
    console.warn('[SessionStore] Error finding stored session:', err);
  }

  return null;
}

/**
 * Merge server sessions with local sessions for History and Dashboard views
 */
export function mergeHistorySessions(
  serverSessions: RecentFeedbackSummary[] = []
): RecentFeedbackSummary[] {
  const local = getStoredSessions();
  const seenIds = new Set<string>();
  const combined: RecentFeedbackSummary[] = [];

  // Local sessions take precedence as they contain the latest user practice
  for (const item of local) {
    if (!seenIds.has(item.session_id)) {
      seenIds.add(item.session_id);
      combined.push({
        id: item.id,
        session_id: item.session_id,
        topic_title: item.topic_title,
        date_formatted: item.date_formatted,
        score: item.score,
        descriptor: item.descriptor,
      });
    }
  }

  // Then add server sessions not already present
  for (const item of serverSessions) {
    if (!seenIds.has(item.session_id)) {
      seenIds.add(item.session_id);
      combined.push(item);
    }
  }

  return combined;
}

export interface UserActivityStats {
  totalRecordings: number;
  dayStreak: number;
  longestStreak: number;
  practiceDays: number;
  activityData: Array<{ activity_date: string; recording_count: number }>;
}

/**
 * Calculates authentic user statistics and activity counts from real recorded sessions
 */
export function calculateUserActivityStats(): UserActivityStats {
  const sessions = getStoredSessions();
  const totalRecordings = sessions.length;

  if (totalRecordings === 0) {
    return {
      totalRecordings: 0,
      dayStreak: 0,
      longestStreak: 0,
      practiceDays: 0,
      activityData: [],
    };
  }

  // Count recordings per date (YYYY-MM-DD)
  const dateCounts = new Map<string, number>();
  for (const s of sessions) {
    if (!s.created_at) continue;
    const dStr = s.created_at.split('T')[0];
    dateCounts.set(dStr, (dateCounts.get(dStr) || 0) + 1);
  }

  const practiceDays = dateCounts.size;
  const activityData: Array<{ activity_date: string; recording_count: number }> = [];
  dateCounts.forEach((count, date) => {
    activityData.push({ activity_date: date, recording_count: count });
  });

  // Calculate streaks
  const sortedDates = Array.from(dateCounts.keys()).sort().reverse();
  let dayStreak = 0;
  let longestStreak = 0;

  if (sortedDates.length > 0) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if streak is active (practiced today or yesterday)
    const hasPracticedRecently = dateCounts.has(todayStr) || dateCounts.has(yesterdayStr);

    if (hasPracticedRecently) {
      let checkDate = dateCounts.has(todayStr) ? new Date(today) : new Date(yesterday);
      while (true) {
        const dStr = checkDate.toISOString().split('T')[0];
        if (dateCounts.has(dStr)) {
          dayStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Calculate longest consecutive streak
    const ascendingDates = Array.from(dateCounts.keys()).sort();
    let currentStreak = 0;
    let prevTime: number | null = null;

    for (const dStr of ascendingDates) {
      const currentTime = new Date(dStr + 'T00:00:00Z').getTime();
      if (prevTime === null) {
        currentStreak = 1;
      } else {
        const diffDays = Math.round((currentTime - prevTime) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }
      prevTime = currentTime;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    }
    if (dayStreak > longestStreak) {
      longestStreak = dayStreak;
    }
  }

  return {
    totalRecordings,
    dayStreak,
    longestStreak,
    practiceDays,
    activityData,
  };
}

