export type AssessmentLanguage = 'en' | 'bn' | 'hi';

export interface AssessmentLanguageOption {
  code: AssessmentLanguage;
  name: string;
  nativeName: string;
  flag: string;
  fontClass: string;
}

export const ASSESSMENT_LANGUAGES: AssessmentLanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', fontClass: 'font-sans' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩', fontClass: 'font-hind-siliguri' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', fontClass: 'font-devanagari' },
];

export interface TranslatedReportExplanation {
  summary?: string;
  tip?: string;
  proficiency_feedback?: Array<{ metric: string; feedback: string }>;
  targeted_corrections?: Array<{ explanation: string }>;
  strengths?: string[];
  next_steps?: string[];
  focus_goals?: string[];
}
