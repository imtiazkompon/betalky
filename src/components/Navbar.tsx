'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Clock3, LayoutGrid, Mic } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getLocalProfile } from '@/lib/profile-store';

function NavbarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  // Sync profile details helper
  const syncProfileState = async (currentUser: any) => {
    const local = getLocalProfile();

    if (currentUser) {
      setUser(currentUser);

      // Determine display name: metadata full_name -> email prefix -> local -> 'Profile'
      const name =
        currentUser.user_metadata?.full_name?.trim() ||
        currentUser.email?.split('@')[0] ||
        local?.full_name?.trim() ||
        'Profile';
      setDisplayName(name);

      // Determine avatar: metadata -> local
      let photo = currentUser.user_metadata?.avatar_url || local?.avatar_url || null;

      // Also check profiles table for latest avatar if metadata didn't have it
      try {
        const supabase = createClient();
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (profile?.avatar_url) {
          photo = profile.avatar_url;
        }
        if (profile?.full_name && !currentUser.user_metadata?.full_name) {
          setDisplayName(profile.full_name.trim());
        }
      } catch (err) {
        console.warn('Navbar profile query note:', err);
      }

      setAvatarUrl(photo);
    } else {
      setUser(null);
      setDisplayName('');
      setAvatarUrl(null);
    }
    setAuthChecked(true);
  };

  useEffect(() => {
    // 1. Initial check from local profile cache if user had one
    const initialLocal = getLocalProfile();
    if (initialLocal?.full_name) {
      setDisplayName(initialLocal.full_name);
    }
    if (initialLocal?.avatar_url) {
      setAvatarUrl(initialLocal.avatar_url);
    }

    // 2. Query Supabase auth
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      syncProfileState(data?.user ?? null);
    }).catch(() => {
      setAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncProfileState(session?.user ?? null);
    });

    // 3. Listen for immediate local profile updates from Profile page or logout
    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const updated = customEvent.detail;
      if (updated) {
        if (updated.full_name) {
          setDisplayName(updated.full_name.trim());
        }
        if (updated.avatar_url !== undefined) {
          setAvatarUrl(updated.avatar_url);
        }
      } else {
        // null means logged out / cleared
        setUser(null);
        setDisplayName('');
        setAvatarUrl(null);
      }
    };

    window.addEventListener('betalky_profile_updated', handleProfileUpdated);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('betalky_profile_updated', handleProfileUpdated);
    };
  }, []);

  const isLanding = pathname === '/';
  const isDashboard = pathname === '/dashboard';
  const isPractice = pathname.startsWith('/practice') || pathname.startsWith('/recording');
  const isHistory = pathname === '/history' || pathname.startsWith('/assessment');
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password';

  // Local demo mode (no Supabase project): the app is open, so show member navigation.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const demoMode = !supabaseUrl || supabaseUrl.includes('your-project') || supabaseUrl.includes('placeholder');
  const signedOut = authChecked && !user && !demoMode;
  const showVisitorNav = signedOut || (isLanding && !user);
  const showBottomNav = !isAuthPage && !showVisitorNav;

  // Reserve space under page content for the fixed mobile tab bar.
  useEffect(() => {
    document.body.classList.toggle('has-bottom-nav', showBottomNav);
    return () => document.body.classList.remove('has-bottom-nav');
  }, [showBottomNav]);

  if (isAuthPage) {
    return null;
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', active: isDashboard, Icon: LayoutGrid },
    { name: 'Practice', href: '/practice', active: isPractice, Icon: Mic },
    { name: 'History', href: '/history', active: isHistory, Icon: Clock3 },
  ];

  const initials = (displayName || 'P')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const avatar = (size: string) => (
    <span
      className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E7E3DB] bg-white text-[11px] font-semibold text-slate-950`}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- user-uploaded avatar from arbitrary storage URL
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="font-display">{initials}</span>
      )}
    </span>
  );

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#E7E3DB]/80 bg-[#FDFCF9]/85 backdrop-blur-md">
        <div
          className={`mx-auto flex h-14 items-center justify-between gap-2 px-4 sm:h-16 sm:px-6 ${
            isLanding ? 'max-w-4xl' : 'max-w-3xl'
          }`}
        >
          {/* Logo — icon only on phones, wordmark from sm up */}
          <Link href={user ? '/dashboard' : '/'} className="flex shrink-0 items-center gap-2" aria-label="beTalky home">
            <Image src="/bTalky_logo.png" alt="beTalky" width={28} height={28} className="object-contain" preload />
            <span
              className={`font-display text-[20px] font-bold tracking-[-0.02em] text-slate-950 sm:text-[22px] ${
                showVisitorNav ? '' : 'hidden sm:inline'
              }`}
            >
              beTalky
            </span>
          </Link>

          {showVisitorNav ? (
            /* Visitor: sign in / create account */
            <div className="flex items-center gap-4 sm:gap-6">
              <Link href="/login" className="text-[13px] text-slate-600 transition hover:text-slate-950">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-[13px] font-medium text-[#FDFCF9] transition hover:bg-black sm:px-5"
              >
                Get started
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </Link>
            </div>
          ) : (
            <>
              {/* Phones: transparent Profile link */}
              <Link
                href="/profile"
                className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-1 text-[13px] font-medium transition sm:hidden ${
                  pathname === '/profile' ? 'text-slate-950' : 'text-slate-700'
                }`}
              >
                <span>Profile</span>
                {avatar('h-8 w-8')}
              </Link>

              {/* Tablet & desktop: section nav + avatar */}
              <div className="hidden shrink-0 items-center gap-3 sm:flex">
                <nav className="relative flex items-center rounded-full border border-[#E7E3DB] bg-white/60 p-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`relative z-10 select-none rounded-full px-4 py-1.5 text-[13px] transition-colors duration-200 ${
                        item.active ? 'font-medium text-[#FDFCF9]' : 'text-slate-600 hover:text-slate-950'
                      }`}
                    >
                      {item.active && (
                        <motion.div
                          layoutId="navbar-active-pill"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                          className="absolute inset-0 -z-10 rounded-full bg-slate-950"
                        />
                      )}
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </nav>

                <Link
                  href="/profile"
                  aria-label="Your profile"
                  title={displayName || 'Profile'}
                  className={`rounded-full transition hover:ring-2 hover:ring-slate-950/10 ${
                    pathname === '/profile' ? 'ring-2 ring-slate-950/15' : ''
                  }`}
                >
                  {avatar('h-9 w-9')}
                </Link>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Phones: bottom tab bar */}
      {showBottomNav && (
        <nav
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E7E3DB] bg-[#FDFCF9]/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
        >
          <div className="mx-auto grid h-16 max-w-md grid-cols-3 px-3">
            {navItems.map(({ name, href, active, Icon }) => (
              <Link
                key={name}
                href={href}
                aria-current={active ? 'page' : undefined}
                className="relative flex flex-col items-center justify-center gap-1"
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-indicator"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                    className="absolute top-0 h-[2px] w-10 rounded-full bg-slate-950"
                  />
                )}
                <Icon className={`h-[20px] w-[20px] ${active ? 'text-slate-950' : 'text-slate-400'}`} strokeWidth={active ? 2 : 1.6} />
                <span className={`text-[11px] ${active ? 'font-medium text-slate-950' : 'text-slate-500'}`}>{name}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<div className="sticky top-0 z-40 h-16 w-full border-b border-[#E7E3DB]/80 bg-[#FDFCF9]/85" />}>
      <NavbarContent />
    </Suspense>
  );
}
