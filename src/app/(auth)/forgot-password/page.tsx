'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setMessage(null);

    try {
      document.cookie = `betalky_next=${encodeURIComponent('/profile')}; path=/; max-age=600; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      });

      if (error) {
        throw error;
      }

      setMessage('Password reset link sent! Please check your email inbox.');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setErrorMessage(err.message || 'Could not send reset link. Please check the email entered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col justify-center items-center px-4 py-10 antialiased">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 transition hover:text-slate-950">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <Image src="/bTalky_logo.png" alt="beTalky" width={22} height={22} className="object-contain" />
            <span className="font-display text-[17px] font-bold tracking-[-0.015em] text-slate-950">beTalky</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_40px_80px_-50px_rgba(14,13,11,0.35)] sm:p-10"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Account recovery</p>
          <h1 className="font-display mt-5 text-[40px] font-bold leading-[0.98] tracking-[-0.02em] text-slate-950">
            Reset your <span className="font-serif-display font-normal italic tracking-[-0.01em]">password.</span>
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-slate-500">
            Enter your email and we&apos;ll send a secure link to choose a new password.
          </p>

          <AnimatePresence mode="wait">
            {(errorMessage || message) && (
              <motion.div
                key={errorMessage ? 'err' : 'ok'}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={`mt-6 rounded-xl border px-4 py-3 text-[13px] leading-relaxed ${
                  errorMessage ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                }`}
              >
                {errorMessage || message}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleReset} className="mt-8 space-y-5">
            <div>
              <label htmlFor="reset-email" className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                Email address
              </label>
              <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 placeholder:text-slate-400 transition focus:border-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-950/5"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-between rounded-full bg-slate-950 py-1.5 pl-6 pr-1.5 text-[14px] font-medium text-white transition hover:bg-black disabled:opacity-60"
            >
              <span>{loading ? 'Sending link…' : 'Send reset link'}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-950 transition-transform duration-500 group-hover:-rotate-45">
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          </form>

          <p className="mt-8 border-t border-slate-200 pt-6 text-center text-[13px] text-slate-500">
            Remembered it?{' '}
            <Link href="/login" className="border-b border-slate-950/30 font-medium text-slate-950 hover:border-slate-950">
              Back to sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
