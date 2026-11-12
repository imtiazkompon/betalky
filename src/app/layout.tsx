import type { Metadata } from 'next';
import { Inter, Anek_Bangla, Caveat, Instrument_Serif, Inter_Tight } from 'next/font/google';
import Navbar from '@/components/Navbar';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--nf-inter',
});

const anekBangla = Anek_Bangla({
  subsets: ['latin', 'bengali'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--nf-anek',
});

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--nf-caveat',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--nf-serif',
});

const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--nf-display',
});

export const metadata: Metadata = {
  title: 'beTalky — AI-Powered English Speaking Practice Platform',
  description: 'Practice English speaking with real-time AI transcription, acoustic feedback, and CEFR-aligned assessment.',
  icons: {
    icon: '/bTalky_logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${anekBangla.variable} ${caveat.variable} ${instrumentSerif.variable} ${interTight.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-[#FDFCF9] text-slate-800 antialiased min-h-screen selection:bg-slate-950 selection:text-[#FDFCF9]">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
