import { DifficultyLevel } from '@/types/betalky';

export interface LocalUserProfile {
  full_name: string;
  email?: string;
  level: DifficultyLevel;
  avatar_url?: string | null;
  updated_at?: string;
}

const PROFILE_KEY = 'betalky_user_profile';

/**
 * Retrieve cached user profile from localStorage
 */
export function getLocalProfile(): LocalUserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Save user profile to localStorage and notify all components
 */
export function saveLocalProfile(data: Partial<LocalUserProfile>): LocalUserProfile {
  const existing = getLocalProfile() || {
    full_name: '',
    email: '',
    level: 'Intermediate' as DifficultyLevel,
    avatar_url: null,
  };

  const updated: LocalUserProfile = {
    ...existing,
    ...data,
    updated_at: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
      window.dispatchEvent(
        new CustomEvent('betalky_profile_updated', { detail: updated })
      );
    } catch (e) {
      console.warn('Could not save profile to localStorage:', e);
    }
  }

  return updated;
}

/**
 * Clear user profile cache on logout
 */
export function clearLocalProfile(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(PROFILE_KEY);
      window.dispatchEvent(
        new CustomEvent('betalky_profile_updated', { detail: null })
      );
    } catch (e) {
      console.warn('Could not clear profile from localStorage:', e);
    }
  }
}
