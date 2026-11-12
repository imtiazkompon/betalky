export type VocabularyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type PartOfSpeech =
  | 'Verb'
  | 'Noun'
  | 'Adjective'
  | 'Adverb'
  | 'Phrase'
  | 'Idiom'
  | 'Preposition';

export type UserWordStatus = 'unseen' | 'learning' | 'learned';
export type DifficultyStatus = 'normal' | 'difficult';

export interface VocabularyWord {
  id: string;
  word: string;
  pronunciation: string;
  part_of_speech: PartOfSpeech;
  english_definition: string;
  bengali_meaning: string;
  example_sentence: string;
  example_translation: string;
  synonyms: string[];
  antonyms: string[];
  collocations: string[];
  level: VocabularyLevel;
  unit_id: string;
  unit_title?: string;
  status?: 'published' | 'draft' | 'archived';
  created_at?: string;
  updated_at?: string;
}

export interface VocabularyUnit {
  id: string;
  title: string;
  description: string;
  level: VocabularyLevel;
  display_order: number;
  word_count?: number;
  status?: 'published' | 'draft';
}

export interface UserWordProgress {
  word_id: string;
  status: UserWordStatus;
  is_bookmarked: boolean;
  learned_at?: string | null;
  difficulty_status: DifficultyStatus;
  user_sentence?: string | null;
  // SRS properties
  review_count: number;
  correct_count: number;
  incorrect_count: number;
  last_reviewed_at?: string | null;
  next_review_at?: string | null;
  interval_days: number;
  updated_at: string;
}

export interface LearningSessionState {
  id: string;
  level: VocabularyLevel;
  unit_id: string;
  unit_title: string;
  session_status: 'in_progress' | 'completed';
  words_studied: string[]; // word IDs
  started_at: string;
  completed_at?: string;
  accuracy?: number;
  correct_count?: number;
  incorrect_count?: number;
  difficult_words?: string[]; // word IDs
}

export interface QuizQuestion {
  id: string;
  word_id: string;
  type: 'meaning' | 'fill_in_blank' | 'matching' | 'sentence_builder';
  prompt: string;
  options?: string[];
  correct_answer: string;
  explanation: string;
  bengali_hint?: string;
  matching_pairs?: { word: string; meaning: string }[];
}

export interface QuizAttemptRecord {
  id: string;
  word_id: string;
  session_id?: string;
  question_type: 'meaning' | 'fill_in_blank' | 'matching' | 'sentence_builder';
  selected_answer: string;
  is_correct: boolean;
  attempted_at: string;
}

export interface VocabularyStats {
  totalWordsLearned: number;
  wordsCurrentlyLearning: number;
  wordsDueForReview: number;
  learningStreak: number;
  totalQuizAttempts: number;
  averageAccuracy: number;
  levelProgress: {
    Beginner: { total: number; learned: number; percentage: number };
    Intermediate: { total: number; learned: number; percentage: number };
    Advanced: { total: number; learned: number; percentage: number };
  };
  weeklyActivity: { day: string; count: number }[];
  lastSession?: LearningSessionState | null;
}

