import { UserWordProgress } from './types';

const SRS_INTERVALS = [1, 3, 7, 14, 30, 60];

export function calculateNextSRSReview(
  current: Partial<UserWordProgress>,
  isCorrect: boolean
): {
  review_count: number;
  correct_count: number;
  incorrect_count: number;
  last_reviewed_at: string;
  next_review_at: string;
  interval_days: number;
  difficulty_status: 'normal' | 'difficult';
  status: 'learning' | 'learned';
} {
  const now = new Date();
  const currentInterval = current.interval_days || 1;
  const reviewCount = (current.review_count || 0) + 1;
  const correctCount = (current.correct_count || 0) + (isCorrect ? 1 : 0);
  const incorrectCount = (current.incorrect_count || 0) + (isCorrect ? 0 : 1);

  let nextInterval: number;
  let difficulty: 'normal' | 'difficult' = current.difficulty_status || 'normal';

  if (isCorrect) {
    // Find next interval in the ladder
    const currentIndex = SRS_INTERVALS.indexOf(currentInterval);
    if (currentIndex === -1 || currentIndex >= SRS_INTERVALS.length - 1) {
      nextInterval = Math.round(currentInterval * 1.8);
    } else {
      nextInterval = SRS_INTERVALS[currentIndex + 1];
    }

    // If previously difficult and answered correctly multiple times, normalize
    if (correctCount >= 2 && incorrectCount <= 1) {
      difficulty = 'normal';
    }
  } else {
    // Drop back to 1 day on mistake and flag difficult
    nextInterval = 1;
    difficulty = 'difficult';
  }

  const nextDate = new Date(now.getTime() + nextInterval * 24 * 60 * 60 * 1000);

  // Consider "learned" once reviewed correctly at least 2 times with an interval >= 3 days
  const isLearned = correctCount >= 2 && nextInterval >= 3;

  return {
    review_count: reviewCount,
    correct_count: correctCount,
    incorrect_count: incorrectCount,
    last_reviewed_at: now.toISOString(),
    next_review_at: nextDate.toISOString(),
    interval_days: nextInterval,
    difficulty_status: difficulty,
    status: isLearned ? 'learned' : 'learning',
  };
}

export function isWordDueForReview(item: UserWordProgress): boolean {
  if (!item.next_review_at) return false;
  return new Date(item.next_review_at).getTime() <= Date.now();
}

