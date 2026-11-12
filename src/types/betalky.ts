export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Topic {
  id: string;
  title: string;
  level: DifficultyLevel;
  instructions: string;
  category?: string;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  level: DifficultyLevel;
  day_streak: number;
  longest_streak: number;
  total_practice_days: number;
  created_at?: string;
}

export interface TargetedCorrection {
  timestamp: string; // e.g. "00:14"
  you_said: string;  // e.g. "...cars makes it dangerous..."
  corrected_form: string; // e.g. "...cars make it dangerous..."
  rule_name: string; // e.g. "Subject-Verb Agreement"
  explanation: string; // e.g. "The subject 'cars' is plural..."
}

export interface ProficiencyMetric {
  metric: string; // "Grammar" | "Vocabulary" | "Fluency" | "Repetition" | "Filler Words" | "Clarity & Coherence"
  score: number; // 0.0 - 10.0
  feedback: string;
}

export interface FillerDistributionItem {
  word: string; // e.g. "um / uh", "like", "you know"
  count: number;
  percentage: number;
}

export interface SpeakingDynamics {
  pace_wpm: number; // e.g. 118
  fillers_total: number; // e.g. 4
  pauses_count: number; // e.g. 2
  output_words: number; // e.g. 86
}

export interface AssessmentReport {
  id: string;
  session_id: string;
  user_id?: string;
  overall_score: number; // e.g. 6.8
  assessment_verdict: string; // e.g. "Understandable but needs work"
  summary: string;
  corrected_transcript: string;
  original_transcript?: string;
  grammar_score: number;
  vocabulary_score: number;
  fluency_score: number;
  repetition_score: number;
  filler_score: number;
  clarity_score: number;
  proficiency_breakdown: ProficiencyMetric[];
  targeted_corrections: TargetedCorrection[];
  filler_distribution: FillerDistributionItem[];
  pedagogical_tip: string;
  suggested_model_answer: string;
  speaking_dynamics: SpeakingDynamics;
  strengths: string[];
  next_steps: string[];
  focus_goals: string[];
  created_at: string;
}

export interface PracticeSession {
  id: string;
  user_id: string;
  topic_id?: string;
  topic_title: string;
  level: DifficultyLevel;
  audio_url?: string;
  audio_duration_seconds: number;
  transcript?: string;
  status: 'recorded' | 'transcribing' | 'assessing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  assessment?: AssessmentReport;
}

export interface RecentFeedbackSummary {
  id: string;
  session_id: string;
  topic_title: string;
  date_formatted: string;
  score: number;
  descriptor: string;
}

