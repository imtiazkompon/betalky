'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Eye, EyeOff, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { saveLocalProfile } from '@/lib/profile-store';
import authShowcaseImg from '../../public/auth_showcase.jpg';

interface AuthCardProps {
  initialMode?: 'signin' | 'signup';
}

/** Only allow same-site relative paths as post-auth destinations. */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/dashboard';
  if (['/login', '/signup', '/forgot-password'].some((p) => raw.startsWith(p))) return '/dashboard';
  return raw;
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-400 transition focus:border-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-950/5';
const labelCls = 'mb-1 block text-[10.5px] font-medium uppercase tracking-[0.16em] text-slate-500';

export default function AuthCard({ initialMode = 'signup' }: AuthCardProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [nextPath, setNextPath] = useState('/dashboard');

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Status states
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Read ?error (from OAuth / callback) and ?next (from the auth gate)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of URL params on mount
    if (err) setErrorMessage(decodeURIComponent(err));
    setNextPath(safeNext(params.get('next')));
  }, []);

  const handleModeChange = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    const qs = nextPath !== '/dashboard' ? `?next=${encodeURIComponent(nextPath)}` : '';
    window.history.replaceState(null, '', (newMode === 'signin' ? '/login' : '/signup') + qs);
  };

  const callbackUrl = () =>
    `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`;

  // Google OAuth
  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);
    try {
      // Check the project actually has Google enabled; otherwise Supabase shows a raw JSON error page.
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (url && key) {
        const settings = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);
        if (settings && settings.external?.google === false) {
          setErrorMessage('Google sign-in isn’t available yet. Please use your email and password for now.');
          setGoogleLoading(false);
          return;
        }
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl(),
          // Always show Google's account chooser so people can pick the right account.
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) throw error;
    } catch (e) {
      const err = e as { message?: string };
      console.error('Google auth error:', err);
      setErrorMessage(err.message || 'Could not authenticate with Google. Please try email.');
      setGoogleLoading(false);
    }
  };

  // Email sign in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      if (data?.session) {
        const authUser = data.user;
        const name =
          authUser?.user_metadata?.full_name ||
          authUser?.user_metadata?.first_name ||
          authUser?.email?.split('@')[0] ||
          '';
        saveLocalProfile({
          full_name: name,
          email: authUser?.email || email.trim(),
          avatar_url: authUser?.user_metadata?.avatar_url || null,
        });
        // Hard redirect so the auth gate sees the fresh session cookie.
        window.location.href = nextPath;
      } else {
        setErrorMessage('Could not establish a session. Please verify your credentials or confirm your email first.');
        setLoading(false);
      }
    } catch (e) {
      const err = e as { message?: string };
      console.error('Sign in error:', err);
      const msg: string = err.message || '';
      setErrorMessage(
        msg.includes('Invalid login credentials')
          ? 'Invalid email or password. Please try again.'
          : msg.includes('Email not confirmed')
            ? 'Please confirm your email address first — check your inbox for the confirmation link.'
            : msg || 'Failed to sign in. Please try again.'
      );
      setLoading(false);
    }
  };

  // Email sign up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!agreeTerms) {
      setErrorMessage('Please agree to the Terms & Conditions to create your account.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: callbackUrl(),
          data: {
            full_name: fullName || undefined,
            first_name: firstName.trim() || undefined,
            last_name: lastName.trim() || undefined,
          },
        },
      });
      if (error) throw error;

      // Supabase returns a user with no identities when the email is already registered.
      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        setErrorMessage('An account with this email already exists. Please sign in instead.');
        setLoading(false);
        return;
      }

      if (data?.session) {
        saveLocalProfile({
          full_name: fullName || email.trim().split('@')[0],
          email: email.trim(),
          avatar_url: null,
        });
        window.location.href = nextPath;
      } else {
        setSuccessMessage(
          `Almost there — we sent a confirmation link to ${email.trim()}. Open it to activate your account and you'll land on your dashboard.`
        );
        setPassword('');
        setLoading(false);
      }
    } catch (e) {
      const err = e as { message?: string };
      console.error('Sign up error:', err);
      setErrorMessage(err.message || 'Failed to create your account. Please try again.');
      setLoading(false);
    }
  };

  const isSignup = mode === 'signup';

  return (
    <div className="mx-auto w-full max-w-[860px]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-stretch gap-4 overflow-hidden rounded-[26px] border border-slate-200 bg-white p-2.5 shadow-[0_40px_80px_-50px_rgba(14,13,11,0.35)] sm:p-3 lg:h-[620px] lg:flex-row lg:gap-3"
      >
        {/* Left: editorial image panel */}
        <div className="relative h-[190px] w-full shrink-0 overflow-hidden rounded-[20px] bg-slate-950 sm:h-[260px] lg:h-full lg:w-[44%]">
          <Image
            src={authShowcaseImg}
            alt="Speaking practice with beTalky"
            fill
            preload
            placeholder="blur"
            sizes="(max-width: 1024px) 100vw, 460px"
            className="object-cover object-top opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

          <Link
            href="/"
            className="absolute left-5 top-5 z-10 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-white backdrop-blur-md transition hover:bg-white/20"
            aria-label="beTalky home"
          >
            <Image src="/bTalky_logo.png" alt="" width={18} height={18} className="object-contain" />
            <span className="font-display text-[14px] font-bold tracking-[-0.015em]">beTalky</span>
          </Link>

          <div className="absolute inset-x-0 bottom-0 z-10 p-6 text-white sm:p-8">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/50">An AI speaking coach</p>
            <p className="font-display mt-4 text-[30px] font-bold leading-[1] tracking-[-0.02em] sm:text-[38px]">
              Speak English{' '}
              <span className="font-serif-display font-normal italic tracking-[-0.01em]">the way you mean it.</span>
            </p>
          </div>
        </div>

        {/* Right: form */}
        <div className="flex min-h-[620px] w-full flex-col px-3 py-4 sm:px-8 sm:py-7 lg:min-h-0 lg:w-[56%] lg:overflow-y-auto lg:px-10">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 transition hover:text-slate-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>

            <div className="relative inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
              {(['signin', 'signup'] as const).map((tabMode) => {
                const isActive = mode === tabMode;
                return (
                  <button
                    key={tabMode}
                    type="button"
                    onClick={() => handleModeChange(tabMode)}
                    className={`relative z-10 rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors sm:px-5 ${
                      isActive ? 'text-white' : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-auth-toggle-pill"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        className="absolute inset-0 -z-10 rounded-full bg-slate-950"
                      />
                    )}
                    {tabMode === 'signin' ? 'Sign in' : 'Sign up'}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="my-auto w-full pt-8 lg:pt-4">
          <div>
            <h1 className="font-display text-[36px] font-bold leading-[1] tracking-[-0.02em] text-slate-950 sm:text-[42px]">
              {isSignup ? (
                <>
                  Begin <span className="font-serif-display font-normal italic tracking-[-0.01em]">speaking.</span>
                </>
              ) : (
                <>
                  Welcome <span className="font-serif-display font-normal italic tracking-[-0.01em]">back.</span>
                </>
              )}
            </h1>
            <p className="mt-3 text-[14px] text-slate-500">
              {isSignup ? 'Already have an account? ' : 'New to beTalky? '}
              <button
                type="button"
                onClick={() => handleModeChange(isSignup ? 'signin' : 'signup')}
                className="border-b border-slate-950/30 font-medium text-slate-950 transition hover:border-slate-950"
              >
                {isSignup ? 'Sign in' : 'Create an account'}
              </button>
            </p>
          </div>

          {/* Alerts */}
          <AnimatePresence mode="wait">
            {(errorMessage || successMessage) && (
              <motion.div
                key={errorMessage ? 'err' : 'ok'}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-2.5 text-[13px] leading-relaxed ${
                  errorMessage
                    ? 'border-rose-200 bg-rose-50 text-rose-800'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                }`}
              >
                <div className="flex-1">{errorMessage || successMessage}</div>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="opacity-50 transition hover:opacity-100"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={isSignup ? handleSignUp : handleSignIn} className="mt-6 space-y-3.5">
            {isSignup && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="auth-first">First name</label>
                  <input
                    id="auth-first"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ayesha"
                    required
                    autoComplete="given-name"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor="auth-last">Last name</label>
                  <input
                    id="auth-last"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Rahman"
                    autoComplete="family-name"
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            <div>
              <label className={labelCls} htmlFor="auth-email">Email address</label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className={inputCls}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className={labelCls} htmlFor="auth-password">Password</label>
                {!isSignup && (
                  <Link href="/forgot-password" className="mb-1.5 text-[12px] text-slate-500 transition hover:text-slate-950">
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
                  required
                  minLength={6}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  className={`${inputCls} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isSignup && (
              <label className="flex cursor-pointer select-none items-center gap-2.5 text-[13px] text-slate-600">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-slate-950"
                />
                I agree to the Terms &amp; Conditions
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-between rounded-full bg-slate-950 py-1.5 pl-6 pr-1.5 text-[14px] font-medium text-white transition hover:bg-black disabled:opacity-60"
            >
              <span>{loading ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-950 transition-transform duration-500 group-hover:-rotate-45">
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </span>
            </button>
          </form>

          <div className="relative my-5 flex items-center justify-center">
            <div className="w-full border-t border-slate-200" />
            <span className="absolute bg-white px-3 text-[11px] uppercase tracking-[0.18em] text-slate-400">or</span>
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-2.5 rounded-full border border-slate-200 px-5 py-3 text-[14px] font-medium text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          >
            {googleLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
            ) : (
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
            )}
            Continue with Google
          </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
