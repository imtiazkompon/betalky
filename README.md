# beTalky — AI-Powered English Speaking SaaS

A production-ready AI-powered English-speaking practice platform built with Next.js (App Router), TypeScript, Tailwind CSS, Supabase, and Puter.js (Speech-to-Text & AI Chat).

Reproduced with fidelity to the **beTalky Google Stitch UI Designs**:
1. **Dashboard** (`/dashboard`)
2. **Recording** (`/recording`)
3. **Assessment Report** (`/assessment/[id]`)

---

## 🚀 Key Features & Highlights

- **Apple-Inspired Design Language:** Minimal, focused, and acoustically responsive design system based on `beTalky UI Design` specifications (`Anek Bangla`, `Inter`, `Caveat` handwriting typography, `#0066FF` acoustic electric blue accents, pill navigation capsules, and GitHub-style blue 52-week activity heatmap).
- **Topic Selection & Level Switching:**
  - Beginner, Intermediate, and Advanced CEFR speaking prompts.
  - Interactive "Another one" topic shuffle.
  - Seamless handoff into focused recording session.
- **Real Browser Audio Recording:**
  - Web Audio API and `MediaRecorder` for authentic audio capture.
  - 60-notch radial timer gauge with illuminated active ticks and center readout.
  - Real-time vocal waveform visualizer driven by `AnalyserNode`.
  - Pause, Resume, Restart, and Finish controls with microphone permission handling.
- **Puter.js Speech-to-Text Integration:**
  - Direct server-side integration (`/api/transcribe`) using Puter AI STT API (`puter.ai.speech2txt`).
  - Audio storage in Supabase Storage (`betalky-recordings` bucket).
- **Puter.js AI Assessment Engine:**
  - Evaluates pronunciation, grammar, vocabulary, fluency, repetition, and filler words using Puter AI Chat (`puter.ai.chat`).
  - Strict JSON schema enforcement and validation.
  - Model configurable via `PUTER_CHAT_MODEL` (supports `gpt-4o-mini`, `gpt-4o`, `claude-3-5-sonnet`, `deepseek-chat`, etc.).
- **Diagnostic Assessment Report:**
  - Circular SVG score gauge (`6.8 / 10`).
  - Handwritten assessment verdict in Caveat script (`"Understandable but needs work"`).
  - Audio playback bar with speed toggle (0.75x–1.5x) and waveform scrubber.
  - Interactive tabs comparing Original Transcript (highlighted mistakes) and Corrected Version.
  - Targeted Corrections cards with timestamp, You Said vs Corrected Form, and grammar rules.
  - Proficiency Breakdown progress bars across 6 core metrics.
  - Filler-word distribution and pedagogical tip.
  - Native CEFR C1 model answer with one-click copy.
  - Speaking dynamics (Pace WPM, Fillers, Pauses, Word Output).
  - Strengths ("What Worked Well"), Next Steps ("What to Try Next"), and Focus Goals.
- **Supabase Authentication & Database:**
  - Email/password authentication, Google OAuth, and password recovery.
  - Profiles with automated streak and practice day tracking.
  - Row Level Security (RLS) on all tables and storage buckets.

---

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS, Google Fonts (`Anek Bangla`, `Inter`, `Caveat`, `Plus Jakarta Sans`, Material Symbols Outlined)
- **Database & Auth:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- **Audio Transcription:** Puter.js Speech-to-Text (`puter.ai.speech2txt`)
- **AI Assessment:** Puter.js AI Chat (`puter.ai.chat`)
- **Audio Storage:** Supabase Storage
- **Animations & Effects:** Framer Motion, Canvas Confetti

---

## ⚙️ Environment Configuration

Create a `.env.local` file in the root directory (refer to `.env.example`):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Puter.js AI Backend
PUTER_AUTH_TOKEN=your_puter_auth_token
PUTER_CHAT_MODEL=gpt-4o-mini
```

---

## 🗄️ Database Setup (Supabase)

1. Open your project in [Supabase](https://supabase.com).
2. Go to the **SQL Editor**.
3. Copy and run the entire SQL script from [`supabase/schema.sql`](./supabase/schema.sql).
4. This will create:
   - `profiles` table with auto-trigger on signup.
   - `topics` table pre-seeded with Beginner, Intermediate, and Advanced topics.
   - `practice_sessions` table.
   - `assessment_reports` table.
   - `practice_activity` table for heatmap analytics.
   - Row Level Security (RLS) policies.
   - `betalky-recordings` storage bucket and access policies.

---

## 💻 Development & Production

To run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

To build and run the production build:

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
├── public/
│   └── bTalky_logo.png           # Supplied beTalky brand logo
├── supabase/
│   └── schema.sql                # Complete database schema, RLS, triggers & seed topics
├── src/
│   ├── app/
│   │   ├── (auth)/               # Login, Signup, Forgot Password
│   │   ├── api/
│   │   │   ├── transcribe/       # Puter.js Speech-to-Text API route
│   │   │   ├── assess/           # Puter.js AI assessment API route
│   │   │   ├── sessions/         # User practice history & analytics
│   │   │   └── auth/callback/    # Supabase OAuth callback
│   │   ├── dashboard/            # Practice Dashboard (Screen 1)
│   │   ├── recording/            # Real Microphone Recording (Screen 2)
│   │   ├── assessment/[id]/      # AI Assessment Diagnostic Report (Screen 3)
│   │   ├── history/              # Past practice session archive
│   │   ├── profile/              # User profile & CEFR target level
│   │   ├── globals.css           # Tailwind CSS styles & animations
│   │   ├── layout.tsx            # Global fonts (Anek Bangla, Inter, Caveat, Material Icons)
│   │   └── page.tsx              # Root redirect to /dashboard
│   ├── components/
│   │   ├── Navbar.tsx            # Navigation capsule pill & profile menu
│   │   ├── LevelSelector.tsx     # Beginner / Intermediate / Advanced segmented switch
│   │   ├── PracticePromptCard.tsx# Topic prompt, shuffle, and mic launcher
│   │   ├── MetricCards.tsx       # Day Streak, Longest Streak, Practice Days
│   │   ├── Heatmap.tsx           # 52-week GitHub-style activity matrix
│   │   ├── RecentFeedbackList.tsx# Recent feedback cards
│   │   ├── DialTimer.tsx         # 60-notch radial timer gauge with glow
│   │   ├── AudioVisualizer.tsx   # Real Web Audio frequency waveform visualizer
│   │   ├── ScoreGauge.tsx        # Circular SVG overall score ring (/10)
│   │   ├── AudioPlayer.tsx       # Audio playback bar & transcript comparator
│   │   └── TargetedCorrections.tsx # Grammar & syntax correction cards
│   ├── lib/
│   │   ├── supabase/             # Client, Server, and Service role clients
│   │   ├── puter.ts              # Puter.js AI client (speech2txt + chat)
│   │   ├── assessment-schema.ts  # Structured JSON schema & sanitization
│   │   └── default-topics.ts     # Pre-seeded topics & level randomizer
│   └── types/
│       └── betalky.ts            # TypeScript definitions for beTalky
```
