import {
  VocabularyWord,
  VocabularyUnit,
  UserWordProgress,
  LearningSessionState,
  VocabularyStats,
  QuizAttemptRecord,
  VocabularyLevel,
} from './types';
import { INITIAL_WORDS, INITIAL_UNITS } from './initial-data';
import { calculateNextSRSReview, isWordDueForReview } from './srs';

const WORDS_STORAGE_KEY = 'betalky_vocab_words_v1';
const UNITS_STORAGE_KEY = 'betalky_vocab_units_v1';
const USER_PROGRESS_STORAGE_KEY = 'betalky_vocab_user_progress_v1';
const SESSIONS_STORAGE_KEY = 'betalky_vocab_sessions_v1';
const ATTEMPTS_STORAGE_KEY = 'betalky_vocab_quiz_attempts_v1';

// In-memory cache
let wordsCache: VocabularyWord[] | null = null;
let unitsCache: VocabularyUnit[] | null = null;
let progressCache: Record<string, UserWordProgress> | null = null;
let sessionsCache: LearningSessionState[] | null = null;
let attemptsCache: QuizAttemptRecord[] | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Initialize / Get all available vocabulary words.
 */
export function getAllVocabularyWords(): VocabularyWord[] {
  if (wordsCache) return wordsCache;

  if (isBrowser()) {
    try {
      const stored = localStorage.getItem(WORDS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          wordsCache = parsed;
          return wordsCache;
        }
      }
    } catch (e) {
      console.warn('[VocabStore] Error loading words from localStorage:', e);
    }
  }

  wordsCache = [...INITIAL_WORDS];
  return wordsCache;
}

/**
 * Save words array to storage and update cache.
 */
export function saveVocabularyWords(words: VocabularyWord[]): void {
  wordsCache = words;
  if (isBrowser()) {
    try {
      localStorage.setItem(WORDS_STORAGE_KEY, JSON.stringify(words));
      window.dispatchEvent(new Event('betalky_vocab_updated'));
    } catch (e) {
      console.warn('[VocabStore] Error saving words:', e);
    }
  }
}

/**
 * Get all vocabulary units.
 */
export function getAllVocabularyUnits(): VocabularyUnit[] {
  if (unitsCache) return unitsCache;

  if (isBrowser()) {
    try {
      const stored = localStorage.getItem(UNITS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          unitsCache = parsed;
          return unitsCache;
        }
      }
    } catch (e) {
      console.warn('[VocabStore] Error loading units:', e);
    }
  }

  unitsCache = [...INITIAL_UNITS];
  return unitsCache;
}

/**
 * Get user progress mapping (wordId -> progress).
 */
export function getUserProgressMap(): Record<string, UserWordProgress> {
  if (progressCache) return progressCache;

  if (isBrowser()) {
    try {
      const stored = localStorage.getItem(USER_PROGRESS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          progressCache = parsed as Record<string, UserWordProgress>;
          return progressCache;
        }
      }
    } catch (e) {
      console.warn('[VocabStore] Error loading progress:', e);
    }
  }

  progressCache = {};
  return progressCache;
}

function saveUserProgressMap(map: Record<string, UserWordProgress>): void {
  progressCache = map;
  if (isBrowser()) {
    try {
      localStorage.setItem(USER_PROGRESS_STORAGE_KEY, JSON.stringify(map));
      window.dispatchEvent(new Event('betalky_vocab_progress_updated'));
    } catch (e) {
      console.warn('[VocabStore] Error saving progress:', e);
    }
  }
}

/**
 * Get progress for a specific word.
 */
export function getWordProgress(wordId: string): UserWordProgress {
  const map = getUserProgressMap();
  if (map[wordId]) return map[wordId];

  return {
    word_id: wordId,
    status: 'unseen',
    is_bookmarked: false,
    difficulty_status: 'normal',
    review_count: 0,
    correct_count: 0,
    incorrect_count: 0,
    interval_days: 1,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Toggle bookmark on a word.
 */
export function toggleBookmarkWord(wordId: string): boolean {
  const map = { ...getUserProgressMap() };
  const current = map[wordId] || getWordProgress(wordId);
  const nextBookmark = !current.is_bookmarked;

  map[wordId] = {
    ...current,
    is_bookmarked: nextBookmark,
    updated_at: new Date().toISOString(),
  };

  saveUserProgressMap(map);
  return nextBookmark;
}

/**
 * Mark a word as studied / learned.
 */
export function markWordStatus(
  wordId: string,
  status: 'learning' | 'learned'
): UserWordProgress {
  const map = { ...getUserProgressMap() };
  const current = map[wordId] || getWordProgress(wordId);

  const updated: UserWordProgress = {
    ...current,
    status,
    learned_at: status === 'learned' ? new Date().toISOString() : current.learned_at,
    updated_at: new Date().toISOString(),
  };

  map[wordId] = updated;
  saveUserProgressMap(map);
  return updated;
}

/**
 * Save user created sentence for Sentence Builder exercise.
 */
export function saveUserSentence(wordId: string, sentence: string): void {
  const map = { ...getUserProgressMap() };
  const current = map[wordId] || getWordProgress(wordId);

  map[wordId] = {
    ...current,
    user_sentence: sentence.trim(),
    updated_at: new Date().toISOString(),
  };

  saveUserProgressMap(map);
}

/**
 * Record a quiz attempt and update SRS review dates.
 */
export function recordQuizAttempt(params: {
  wordId: string;
  questionType: 'meaning' | 'fill_in_blank' | 'matching' | 'sentence_builder';
  selectedAnswer: string;
  isCorrect: boolean;
  sessionId?: string;
}): void {
  const { wordId, questionType, selectedAnswer, isCorrect, sessionId } = params;

  // 1. Record attempt
  const attempts = getQuizAttempts();
  const attemptRecord: QuizAttemptRecord = {
    id: `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    word_id: wordId,
    session_id: sessionId,
    question_type: questionType,
    selected_answer: selectedAnswer,
    is_correct: isCorrect,
    attempted_at: new Date().toISOString(),
  };
  attempts.unshift(attemptRecord);
  saveQuizAttempts(attempts.slice(0, 500)); // keep last 500

  // 2. Update SRS intervals for the word
  if (wordId && wordId !== 'matching') {
    const map = { ...getUserProgressMap() };
    const current = map[wordId] || getWordProgress(wordId);
    const srsUpdate = calculateNextSRSReview(current, isCorrect);

    map[wordId] = {
      ...current,
      ...srsUpdate,
      updated_at: new Date().toISOString(),
    };

    saveUserProgressMap(map);
  }
}

/**
 * Get all recorded quiz attempts.
 */
export function getQuizAttempts(): QuizAttemptRecord[] {
  if (attemptsCache) return attemptsCache;

  if (isBrowser()) {
    try {
      const stored = localStorage.getItem(ATTEMPTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          attemptsCache = parsed;
          return attemptsCache;
        }
      }
    } catch (e) {
      console.warn('[VocabStore] Error loading attempts:', e);
    }
  }

  attemptsCache = [];
  return attemptsCache;
}

function saveQuizAttempts(list: QuizAttemptRecord[]): void {
  attemptsCache = list;
  if (isBrowser()) {
    try {
      localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('[VocabStore] Error saving attempts:', e);
    }
  }
}

/**
 * Get or save learning sessions.
 */
export function getLearningSessions(): LearningSessionState[] {
  if (sessionsCache) return sessionsCache;

  if (isBrowser()) {
    try {
      const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          sessionsCache = parsed;
          return sessionsCache;
        }
      }
    } catch (e) {
      console.warn('[VocabStore] Error loading sessions:', e);
    }
  }

  sessionsCache = [];
  return sessionsCache;
}

export function saveLearningSession(session: LearningSessionState): void {
  const sessions = getLearningSessions().filter((s) => s.id !== session.id);
  sessions.unshift(session);
  sessionsCache = sessions;

  if (isBrowser()) {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
      window.dispatchEvent(new Event('betalky_vocab_session_updated'));
    } catch (e) {
      console.warn('[VocabStore] Error saving session:', e);
    }
  }
}

/**
 * Get words ready for daily spaced repetition review.
 */
export function getWordsDueForReview(): VocabularyWord[] {
  const allWords = getAllVocabularyWords();
  const map = getUserProgressMap();

  return allWords.filter((word) => {
    const progress = map[word.id];
    if (!progress) return false;
    return isWordDueForReview(progress);
  });
}

/**
 * Calculate user vocabulary stats and analytics.
 */
export function getVocabularyStats(): VocabularyStats {
  const allWords = getAllVocabularyWords();
  const map = getUserProgressMap();
  const sessions = getLearningSessions();
  const attempts = getQuizAttempts();

  let learnedCount = 0;
  let learningCount = 0;
  let dueCount = 0;

  const levelStats: Record<VocabularyLevel, { total: number; learned: number }> = {
    Beginner: { total: 0, learned: 0 },
    Intermediate: { total: 0, learned: 0 },
    Advanced: { total: 0, learned: 0 },
  };

  allWords.forEach((word) => {
    levelStats[word.level].total += 1;
    const p = map[word.id];
    if (p) {
      if (p.status === 'learned') {
        learnedCount += 1;
        levelStats[word.level].learned += 1;
      } else if (p.status === 'learning') {
        learningCount += 1;
      }

      if (isWordDueForReview(p)) {
        dueCount += 1;
      }
    }
  });

  // Calculate quiz accuracy
  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((a) => a.is_correct).length;
  const averageAccuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  // Calculate streak from session dates
  const streak = calculateStreak(sessions, attempts);

  // Weekly activity (last 7 days)
  const weeklyActivity = calculateWeeklyActivity(attempts, sessions);

  // Last session
  const lastSession = sessions.find((s) => s.session_status === 'in_progress') || sessions[0] || null;

  return {
    totalWordsLearned: learnedCount,
    wordsCurrentlyLearning: learningCount,
    wordsDueForReview: dueCount,
    learningStreak: streak,
    totalQuizAttempts: totalAttempts,
    averageAccuracy,
    levelProgress: {
      Beginner: {
        total: levelStats.Beginner.total,
        learned: levelStats.Beginner.learned,
        percentage:
          levelStats.Beginner.total > 0
            ? Math.round((levelStats.Beginner.learned / levelStats.Beginner.total) * 100)
            : 0,
      },
      Intermediate: {
        total: levelStats.Intermediate.total,
        learned: levelStats.Intermediate.learned,
        percentage:
          levelStats.Intermediate.total > 0
            ? Math.round((levelStats.Intermediate.learned / levelStats.Intermediate.total) * 100)
            : 0,
      },
      Advanced: {
        total: levelStats.Advanced.total,
        learned: levelStats.Advanced.learned,
        percentage:
          levelStats.Advanced.total > 0
            ? Math.round((levelStats.Advanced.learned / levelStats.Advanced.total) * 100)
            : 0,
      },
    },
    weeklyActivity,
    lastSession,
  };
}

function calculateStreak(
  sessions: LearningSessionState[],
  attempts: QuizAttemptRecord[]
): number {
  const dates = new Set<string>();

  sessions.forEach((s) => {
    if (s.started_at) {
      dates.add(new Date(s.started_at).toISOString().split('T')[0]);
    }
  });

  attempts.forEach((a) => {
    if (a.attempted_at) {
      dates.add(new Date(a.attempted_at).toISOString().split('T')[0]);
    }
  });

  if (dates.size === 0) return 0;

  const sortedDates = Array.from(dates).sort().reverse();
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // If haven't practiced today or yesterday, streak is 0
  if (sortedDates[0] !== todayStr && sortedDates[0] !== yesterday) {
    return 0;
  }

  let streak = 1;
  let checkDate = new Date(sortedDates[0]);

  for (let i = 1; i < sortedDates.length; i++) {
    checkDate.setDate(checkDate.getDate() - 1);
    const expected = checkDate.toISOString().split('T')[0];
    if (sortedDates[i] === expected) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function calculateWeeklyActivity(
  attempts: QuizAttemptRecord[],
  sessions: LearningSessionState[]
): { day: string; count: number }[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const result: { day: string; count: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = days[d.getDay()];

    const attemptCount = attempts.filter((a) => a.attempted_at.startsWith(dateStr)).length;
    const sessionCount = sessions.filter((s) => s.started_at.startsWith(dateStr)).length;

    result.push({
      day: dayLabel,
      count: attemptCount + sessionCount,
    });
  }

  return result;
}

/**
 * Admin CRUD operations
 */
export function addVocabularyWord(word: Omit<VocabularyWord, 'id' | 'created_at'>): VocabularyWord {
  const words = getAllVocabularyWords();
  const newWord: VocabularyWord = {
    ...word,
    id: `word-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const updated = [newWord, ...words];
  saveVocabularyWords(updated);
  return newWord;
}

export function updateVocabularyWord(id: string, updates: Partial<VocabularyWord>): VocabularyWord | null {
  const words = getAllVocabularyWords();
  const index = words.findIndex((w) => w.id === id);
  if (index === -1) return null;

  words[index] = {
    ...words[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  saveVocabularyWords([...words]);
  return words[index];
}

export function deleteVocabularyWord(id: string): boolean {
  const words = getAllVocabularyWords();
  const filtered = words.filter((w) => w.id !== id);
  if (filtered.length === words.length) return false;

  saveVocabularyWords(filtered);
  return true;
}

/**
 * Bulk import from parsed CSV objects
 */
export function bulkImportVocabulary(parsedRows: any[]): { imported: number; errors: string[] } {
  const words = getAllVocabularyWords();
  let count = 0;
  const errors: string[] = [];

  parsedRows.forEach((row, idx) => {
    const wordText = row.word?.trim();
    if (!wordText) {
      errors.push(`Row ${idx + 1}: Word is missing`);
      return;
    }

    const level: VocabularyLevel = ['Beginner', 'Intermediate', 'Advanced'].includes(row.level)
      ? row.level
      : 'Beginner';

    const newWord: VocabularyWord = {
      id: `word-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
      word: wordText,
      pronunciation: row.pronunciation?.trim() || '',
      part_of_speech: row.part_of_speech?.trim() || 'Verb',
      english_definition: row.english_definition?.trim() || '',
      bengali_meaning: row.bengali_meaning?.trim() || '',
      example_sentence: row.example_sentence?.trim() || '',
      example_translation: row.example_translation?.trim() || '',
      synonyms: row.synonyms ? row.synonyms.split(',').map((s: string) => s.trim()) : [],
      antonyms: row.antonyms ? row.antonyms.split(',').map((s: string) => s.trim()) : [],
      collocations: row.collocations ? row.collocations.split(',').map((s: string) => s.trim()) : [],
      level,
      unit_id: row.unit_id?.trim() || (level === 'Beginner' ? 'unit-beg-1' : level === 'Intermediate' ? 'unit-int-1' : 'unit-adv-1'),
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    words.push(newWord);
    count++;
  });

  saveVocabularyWords([...words]);
  return { imported: count, errors };
}
