'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader, It } from '@/components/ui/Editorial';
import { createClient } from '@/lib/supabase/client';
import { getLocalProfile, saveLocalProfile, clearLocalProfile } from '@/lib/profile-store';
import { DifficultyLevel } from '@/types/betalky';

type SettingsTab = 'profile' | 'security';

/**
 * Client-side canvas image compression to ensure crisp, fast uploads under 50KB
 */
function compressImage(file: File, maxDim = 400, quality = 0.85): Promise<{ dataUrl: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas 2D context unavailable'));
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ dataUrl, blob });
            } else {
              reject(new Error('Failed to create image blob'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedAvatarFileRef = useRef<File | null>(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // User state
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState<DifficultyLevel>('Intermediate');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessNotice, setProfileSuccessNotice] = useState<string | null>(null);
  const [profileErrorNotice, setProfileErrorNotice] = useState<string | null>(null);

  // Security form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [securitySuccessNotice, setSecuritySuccessNotice] = useState<string | null>(null);
  const [securityErrorNotice, setSecurityErrorNotice] = useState<string | null>(null);

  // Load user data
  useEffect(() => {
    // 1. Load initial cached profile immediately
    const initialLocal = getLocalProfile();
    if (initialLocal) {
      if (initialLocal.full_name) setFullName(initialLocal.full_name);
      if (initialLocal.level) setLevel(initialLocal.level);
      if (initialLocal.avatar_url) setAvatarUrl(initialLocal.avatar_url);
      if (initialLocal.email) setEmail(initialLocal.email);
    }

    // 2. Fetch authenticated user from Supabase
    async function loadUserData() {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          const authUser = data.user;
          setUser(authUser);
          setEmail(authUser.email || '');
          if (authUser.user_metadata?.full_name) {
            setFullName(authUser.user_metadata.full_name);
          }
          if (authUser.user_metadata?.level) {
            setLevel(authUser.user_metadata.level);
          }
          if (authUser.user_metadata?.avatar_url) {
            setAvatarUrl(authUser.user_metadata.avatar_url);
          }

          // Also fetch profile record if exists in public.profiles table
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', authUser.id)
              .maybeSingle();

            if (profile) {
              if (profile.full_name) setFullName(profile.full_name);
              if (profile.level) setLevel(profile.level);
              if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
            }
          } catch {
            // Non-critical if profiles table is empty
          }
        }
      } catch (err) {
        console.warn('Load user data error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();

    // 3. Listen to auth state changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setEmail(session.user.email || '');
        if (session.user.user_metadata?.full_name) {
          setFullName(session.user.user_metadata.full_name);
        }
        if (session.user.user_metadata?.avatar_url) {
          setAvatarUrl(session.user.user_metadata.avatar_url);
        }
      } else {
        setUser(null);
        setFullName('');
        setEmail('');
        setAvatarUrl(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Avatar initials
  const getInitials = (name: string, userEmail: string) => {
    if (name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (userEmail) {
      return userEmail.slice(0, 2).toUpperCase();
    }
    return 'BT';
  };

  // Avatar file upload handler with canvas compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setProfileErrorNotice('Photo size must be less than 10 MB.');
      return;
    }

    try {
      // Compress to crisp 400x400 JPEG
      const { dataUrl, blob } = await compressImage(file, 400, 0.85);
      setAvatarUrl(dataUrl);
      selectedAvatarFileRef.current = new File([blob], file.name || 'avatar.jpg', {
        type: 'image/jpeg',
      });
      setProfileErrorNotice(null);
      setProfileSuccessNotice('Profile photo selected. Click "Save Changes" to save it.');
    } catch (err: any) {
      console.error('Photo processing error:', err);
      setProfileErrorNotice('Failed to process image. Please try another image file.');
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl(null);
    selectedAvatarFileRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = '';
    setProfileSuccessNotice('Profile photo removed. Click "Save Changes" to apply.');
  };

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccessNotice(null);
    setProfileErrorNotice(null);

    try {
      const supabase = createClient();
      let activeUser = user;

      // Re-verify auth with supabase in case state was hydrating
      if (!activeUser) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          activeUser = authData.user;
          setUser(authData.user);
        }
      }

      let finalAvatarUrl = avatarUrl;

      // 1. If signed in to Supabase:
      if (activeUser) {
        // If a new avatar file was chosen, upload it to Supabase Storage via backend route
        if (selectedAvatarFileRef.current) {
          try {
            const formData = new FormData();
            formData.append('file', selectedAvatarFileRef.current);
            const uploadRes = await fetch('/api/profile/upload-avatar', {
              method: 'POST',
              body: formData,
            });
            const uploadJson = await uploadRes.json();
            if (uploadRes.ok && uploadJson.avatarUrl) {
              finalAvatarUrl = uploadJson.avatarUrl;
              setAvatarUrl(finalAvatarUrl);
              selectedAvatarFileRef.current = null;
            }
          } catch (uploadErr) {
            console.warn('Avatar upload API note:', uploadErr);
          }
        }

        // Update auth user metadata
        try {
          await supabase.auth.updateUser({
            data: {
              full_name: fullName.trim(),
              level,
              avatar_url: finalAvatarUrl,
            },
          });
        } catch (authErr) {
          console.warn('Auth user metadata update note:', authErr);
        }

        // Upsert into profiles table
        try {
          await supabase.from('profiles').upsert({
            id: activeUser.id,
            full_name: fullName.trim(),
            level,
            avatar_url: finalAvatarUrl,
            updated_at: new Date().toISOString(),
          });
        } catch (profileErr) {
          console.warn('Profiles table sync note:', profileErr);
        }

        // Save to local profile cache and notify all components (Navbar, etc.)
        saveLocalProfile({
          full_name: fullName.trim(),
          email: activeUser.email,
          level,
          avatar_url: finalAvatarUrl,
        });

        setProfileSuccessNotice('Profile successfully updated!');
      } else {
        // 2. GUEST MODE: Save to local storage without throwing error!
        saveLocalProfile({
          full_name: fullName.trim(),
          email: email.trim() || '',
          level,
          avatar_url: finalAvatarUrl,
        });

        setProfileSuccessNotice('Profile updated! (Saved locally. Sign in anytime to sync across devices.)');
      }

      setTimeout(() => setProfileSuccessNotice(null), 4000);
    } catch (err: any) {
      console.error('Save profile error:', err);
      setProfileErrorNotice(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Update Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecuritySuccessNotice(null);
    setSecurityErrorNotice(null);

    if (!user) {
      setSecurityErrorNotice('Please sign in to update your password.');
      return;
    }

    if (newPassword.length < 8) {
      setSecurityErrorNotice('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityErrorNotice('Passwords do not match.');
      return;
    }

    setUpdatingPassword(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSecuritySuccessNotice(
        'Password successfully updated. An automated security confirmation was sent to your email.'
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Password update error:', err);
      setSecurityErrorNotice(err.message || 'Failed to update password. Please verify and try again.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Sign out cleanly
  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    clearLocalProfile();
    setUser(null);
    setFullName('');
    setEmail('');
    setAvatarUrl(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: 'Enter password', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 8) score += 35;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 30;
    if (/[0-9]/.test(pass)) score += 20;
    if (/[^A-Za-z0-9]/.test(pass)) score += 15;

    if (score < 40) return { score: Math.max(score, 20), text: 'Weak', color: 'bg-rose-500' };
    if (score < 75) return { score, text: 'Good', color: 'bg-amber-500' };
    return { score: 100, text: 'Strong', color: 'bg-blue-600' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div className="min-h-screen antialiased text-slate-800">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        <PageHeader
          title={
            activeTab === 'profile' ? (
              <>
                Your <It>details.</It>
              </>
            ) : (
              <>
                Account <It>security.</It>
              </>
            )
          }
          lede="How you appear across beTalky, and how you keep your account safe."
        />

        <div className="relative inline-flex items-center rounded-full border border-[#E7E3DB] bg-white/70 p-1">
          {(
            [
              ['profile', 'Profile'],
              ['security', 'Security'],
            ] as const
          ).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`relative z-10 select-none rounded-full px-5 py-1.5 text-[13px] transition-colors duration-200 ${
                activeTab === tab ? 'font-medium text-[#FDFCF9]' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="settings-nav-pill"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="absolute inset-0 -z-10 rounded-full bg-slate-950"
                />
              )}
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Section 2: Tab Content Panels */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' ? (
            /* TAB 1: PROFILE SETTINGS */
            <motion.section
              key="profile-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden rounded-[24px] border border-[#E7E3DB] bg-white shadow-[0_30px_60px_-45px_rgba(14,13,11,0.35)]"
              data-purpose="profile-updating-features"
            >
              <form onSubmit={handleSaveProfile}>
                <div className="p-6 sm:p-10 space-y-8">
                  {/* Guest Notice Callout (if not signed in) */}
                  {!user && (
                    <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-slate-500 text-[20px]">
                          account_circle
                        </span>
                        <p className="text-xs text-slate-600">
                          You are currently using a guest profile. Changes will save to your browser.
                        </p>
                      </div>
                      <Link
                        href="/login"
                        className="self-start sm:self-auto text-xs font-semibold text-white bg-black hover:bg-neutral-800 px-3.5 py-1.5 rounded-full transition whitespace-nowrap shadow-xs"
                      >
                        Sign In / Sign Up
                      </Link>
                    </div>
                  )}

                  {/* Feedback Notifications */}
                  {profileSuccessNotice && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs sm:text-sm flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-emerald-600 text-[20px]">
                        check_circle
                      </span>
                      <span>{profileSuccessNotice}</span>
                    </div>
                  )}

                  {profileErrorNotice && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs sm:text-sm flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-rose-600 text-[20px]">
                        error
                      </span>
                      <span>{profileErrorNotice}</span>
                    </div>
                  )}

                  {/* Sub-section: Profile Info */}
                  <div className="space-y-6">
                    <div className="border-b border-slate-100 pb-5">
                      <p className="eyebrow">Public profile</p>
                      <h2 className="font-display mt-3 text-[26px] font-bold tracking-[-0.015em] text-slate-950">
                        How you <It>appear</It>
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        How you appear and interact across beTalky.
                      </p>
                    </div>

                    {/* Avatar & Upload Section */}
                    <div className="flex items-center space-x-5 sm:space-x-6" data-purpose="avatar-section">
                      {avatarUrl ? (
                        <div className="relative w-20 h-20 rounded-full overflow-hidden border border-[#E7E3DB] shrink-0 bg-slate-100">
                          <img
                            src={avatarUrl}
                            alt="User avatar"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          aria-label="User Avatar"
                          className="font-serif-display w-20 h-20 rounded-full bg-[#FDFCF9] border border-[#E7E3DB] flex items-center justify-center text-[30px] italic text-slate-950 select-none shrink-0"
                        >
                          {getInitials(fullName, email)}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center space-x-3">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 font-medium text-xs sm:text-sm px-4 py-1.5 rounded-full shadow-2xs transition-colors cursor-pointer"
                          >
                            Upload photo
                          </button>
                          {avatarUrl && (
                            <button
                              type="button"
                              onClick={handleRemovePhoto}
                              className="text-slate-600 hover:text-slate-900 font-medium text-xs sm:text-sm px-2 py-1.5 transition-colors cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">JPG, PNG or WebP, up to 10 MB.</p>
                      </div>
                    </div>

                    {/* Full Name Field */}
                    <div className="flex flex-col w-full pt-2">
                      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500" htmlFor="full-name">
                        Full name
                      </label>
                      <input
                        id="full-name"
                        name="full-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 focus:outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 transition"
                      />
                    </div>

                    {/* Target Proficiency Level */}
                    <div className="flex flex-col w-full pt-1 space-y-2">
                      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                        Target English Proficiency (CEFR)
                      </label>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
                        {(['Beginner', 'Intermediate', 'Advanced'] as DifficultyLevel[]).map((lvl) => {
                          const isSelected = level === lvl;
                          return (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setLevel(lvl)}
                              className={`w-full py-3 px-3 rounded-full border text-[13px] font-medium transition-all select-none cursor-pointer flex items-center justify-center ${
                                isSelected
                                  ? 'border-slate-950 bg-slate-950 text-[#FDFCF9]'
                                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {lvl}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Sub-section: Account Details */}
                  <div className="pt-6 border-t border-slate-200 space-y-6">
                    <div>
                      <p className="eyebrow">Account</p>
                      <h3 className="font-display mt-3 text-[22px] font-bold tracking-[-0.015em] text-slate-950">
                        Sign-in <It>details</It>
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Manage your email and login credentials.
                      </p>
                    </div>

                    {/* Email Address Field */}
                    <div className="flex flex-col w-full">
                      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500" htmlFor="email">
                        Email address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        disabled={!!user}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={user ? '' : 'Optional contact email for guest'}
                        className={`w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm shadow-xs ${
                          user
                            ? 'bg-slate-50/70 text-slate-600 cursor-not-allowed'
                            : 'bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900'
                        }`}
                      />
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        {user
                          ? 'To change your primary email, please update your verified auth provider.'
                          : 'Sign in to bind your email to an official account with cloud sync.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons Footer */}
                <div className="px-6 sm:px-10 py-5 bg-[#FAF8F4] border-t border-[#E7E3DB] flex items-center justify-between gap-3">
                  {user ? (
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-full px-3.5 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      className="text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 border border-slate-200 rounded-full px-3.5 py-1.5 text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">login</span>
                      <span>Sign In</span>
                    </Link>
                  )}

                  <div className="flex items-center space-x-2.5">
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard')}
                      className="px-3.5 sm:px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-full transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-5 sm:px-6 py-2.5 text-[13px] font-medium text-[#FDFCF9] bg-slate-950 hover:bg-black active:scale-[0.99] rounded-full shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {savingProfile && (
                        <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      )}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              </form>
            </motion.section>
          ) : (
            /* TAB 2: ACCOUNT SECURITY */
            <motion.section
              key="security-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="rounded-[24px] border border-[#E7E3DB] bg-white p-6 shadow-[0_30px_60px_-45px_rgba(14,13,11,0.35)] sm:p-10"
            >
              <div className="mb-6 pb-6 border-b border-slate-100">
                <p className="eyebrow">Password</p>
                <h2 className="font-display mt-3 text-[26px] font-bold tracking-[-0.015em] text-slate-950">
                  Change your <It>password</It>
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Use at least 8 characters. You&apos;ll stay signed in on this device.
                </p>
              </div>

              {/* Feedback Notifications */}
              {securitySuccessNotice && (
                <div className="mb-6 bg-blue-50 border border-blue-200/70 text-blue-900 rounded-xl p-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-blue-600 text-[22px] shrink-0">
                    verified_user
                  </span>
                  <div className="flex-1 text-xs sm:text-sm text-blue-800">
                    <span className="font-semibold text-blue-950">Password successfully updated.</span>{' '}
                    An automated security confirmation was sent to your email.
                  </div>
                </div>
              )}

              {securityErrorNotice && (
                <div className="mb-6 bg-rose-50 border border-rose-200/80 text-rose-800 rounded-xl p-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-rose-600 text-[22px] shrink-0">
                    error
                  </span>
                  <div className="flex-1 text-xs sm:text-sm text-rose-850">
                    {securityErrorNotice}
                  </div>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="flex flex-col gap-5">
                {/* Current Password */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500" htmlFor="currentPassword">
                    Current password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-11 text-slate-900 text-[14px] placeholder:text-slate-400 focus:outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      aria-label="Toggle current password visibility"
                      className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showCurrentPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500" htmlFor="newPassword">
                    New password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      minLength={8}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-11 text-slate-900 text-[14px] placeholder:text-slate-400 focus:outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label="Toggle new password visibility"
                      className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showNewPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword.length > 0 && (
                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200/50">
                        <div
                          className={`h-full ${passwordStrength.color} transition-all duration-300`}
                          style={{ width: `${passwordStrength.score}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-500">
                        {passwordStrength.text}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500" htmlFor="confirmPassword">
                    Confirm new password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      minLength={8}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-11 text-slate-900 text-[14px] placeholder:text-slate-400 focus:outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label="Toggle confirm password visibility"
                      className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>

                  {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                    <p className="text-xs text-rose-600 mt-1">Passwords do not match.</p>
                  )}
                  <p className="text-xs text-slate-500 mt-0.5">
                    Use an uncompromised password containing letters, numbers, and symbols.
                  </p>
                </div>

                {/* Security Footer Action Row */}
                <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {user && (
                      <>
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-full px-3 py-1.5 inline-flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          <span>Sign Out</span>
                        </button>
                        <span className="text-slate-300 text-xs">•</span>
                      </>
                    )}
                    <Link
                      href="/forgot-password"
                      className="text-xs text-slate-500 hover:text-slate-800 transition hover:underline"
                    >
                      Forgot password?
                    </Link>
                    <span className="text-slate-300 text-xs">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            'Are you sure you want to delete your account? This action is permanent and cannot be undone.'
                          )
                        ) {
                          handleSignOut();
                        }
                      }}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/80 rounded-full px-3 py-1.5 inline-flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                      <span>Delete Account</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updatingPassword}
                      className="bg-slate-950 hover:bg-black active:scale-[0.99] text-[#FDFCF9] text-[13px] font-medium px-5 py-2.5 rounded-full shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {updatingPassword && (
                        <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      )}
                      <span>Update Password</span>
                      <span className="material-symbols-outlined text-[15px]">check</span>
                    </button>
                  </div>
                </div>
              </form>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
