'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  Search,
  RotateCcw,
  BarChart3,
  Settings,
} from 'lucide-react';

export default function VocabSubNav() {
  const pathname = usePathname();

  const links = [
    { label: 'Overview', href: '/practice/vocabulary', icon: BookOpen },
    { label: 'My Vocabulary', href: '/practice/vocabulary/my-words', icon: Bookmark },
    { label: 'Search Words', href: '/practice/vocabulary/search', icon: Search },
    { label: 'Daily Review', href: '/practice/vocabulary/review', icon: RotateCcw },
    { label: 'Progress', href: '/practice/vocabulary/progress', icon: BarChart3 },
    { label: 'Admin', href: '/practice/vocabulary/admin', icon: Settings },
  ];

  return (
    <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
      {/* Back to practice button */}
      <Link
        href="/practice"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition shrink-0 group"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-transform group-hover:-translate-x-0.5" />
        Back to Practice
      </Link>

      {/* Internal Navigation Pills */}
      <div className="bg-white p-1 rounded-full shadow-2xs border border-slate-200/80 inline-flex items-center gap-1 overflow-x-auto scrollbar-none max-w-full">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition inline-flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

