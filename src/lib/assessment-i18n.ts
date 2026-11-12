import { AssessmentLanguage } from '@/types/assessment-language';

export function getLanguageFontClass(lang: AssessmentLanguage): string {
  if (lang === 'bn') return 'font-hind-siliguri';
  if (lang === 'hi') return 'font-devanagari';
  return 'font-sans';
}

export function getTranslatingNotice(lang: AssessmentLanguage): string {
  if (lang === 'bn') return 'ব্যাখ্যা বাংলায় রূপান্তর করা হচ্ছে...';
  if (lang === 'hi') return 'व्याख्या हिन्दी में अनुवाद हो रही है...';
  return 'Translating explanations...';
}
