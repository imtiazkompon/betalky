---
name: Acoustic Clarity
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf3'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d5e3fc'
  on-surface: '#0d1c2e'
  on-surface-variant: '#424656'
  inverse-surface: '#233144'
  inverse-on-surface: '#eaf1ff'
  outline: '#727687'
  outline-variant: '#c2c6d8'
  surface-tint: '#0054d6'
  primary: '#0050cb'
  on-primary: '#ffffff'
  primary-container: '#0066ff'
  on-primary-container: '#f8f7ff'
  inverse-primary: '#b3c5ff'
  secondary: '#4059aa'
  on-secondary: '#ffffff'
  secondary-container: '#8fa7fe'
  on-secondary-container: '#1d3989'
  tertiary: '#a33200'
  on-tertiary: '#ffffff'
  tertiary-container: '#cc4204'
  on-tertiary-container: '#fff6f4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae1ff'
  primary-fixed-dim: '#b3c5ff'
  on-primary-fixed: '#001849'
  on-primary-fixed-variant: '#003fa4'
  secondary-fixed: '#dce1ff'
  secondary-fixed-dim: '#b6c4ff'
  on-secondary-fixed: '#00164e'
  on-secondary-fixed-variant: '#264191'
  tertiary-fixed: '#ffdbd0'
  tertiary-fixed-dim: '#ffb59d'
  on-tertiary-fixed: '#390c00'
  on-tertiary-fixed-variant: '#832600'
  background: '#f8f9ff'
  on-background: '#0d1c2e'
  surface-variant: '#d5e3fc'
  surface-page: '#FBFBFD'
  surface-card: '#FFFFFF'
  brand-hover: '#0052CC'
  brand-subtle: '#EFF6FF'
  border-subtle: '#F1F5F9'
  border-default: '#E2E8F0'
  text-primary: '#0F172A'
  text-secondary: '#475569'
  text-muted: '#94A3B8'
  heatmap-l0: '#F1F5F9'
  heatmap-l1: '#DBEAFE'
  heatmap-l2: '#93C5FD'
  heatmap-l3: '#2563EB'
  heatmap-l4: '#1E40AF'
typography:
  display-question:
    fontFamily: Epilogue
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  display-question-mobile:
    fontFamily: Epilogue
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-section:
    fontFamily: Epilogue
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  metric-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
  metric-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  score-display:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 26px
  item-title:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 22px
  body-default:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  score-status:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-caps-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.5rem
  space-xl: 2rem
---

# beTalky Design System Specification (design.md)

> **Product**: beTalky — AI-Powered Spoken Language Practice Platform  
> **Source Screen**: Practice Dashboard (`{{DATA:SCREEN:SCREEN_3}}`)  
> **Target Experiences**: Dashboard, Practice, History, and Profile  

---

## 1. Visual Foundation & Philosophy

beTalky's design language is **minimal, focused, and acoustically responsive**. It balances high-clarity typography with clean whitespace and vibrant electric-blue accents to create an inviting, low-anxiety environment for speaking practice.

### Core Visual Principles
- **Clarity Over Clutter**: Generous whitespace, purposeful groupings, and subtle card borders (`border-slate-100` / `border-slate-200`) prevent cognitive overload during vocal exercises.
- **Vocal Energy (Acoustic Blue)**: The brand blue (`#0066FF` / `#2563EB`) draws attention strictly to primary interactions: active filters, microphone triggers, streak tallies, and performance scores.
- **Consistent Rhythm**: Content lives within a focused, centered column (`max-w-3xl`) ensuring optimal readability and seamless transitions between audio tasks and analytical reviews.

---

## 2. Color Palette & Token Hierarchy

### Primary Brand & Accents
| Token | Hex / Class | Description & Usage |
| :--- | :--- | :--- |
| `color-brand-primary` | `#0066FF` / `bg-blue-600` | Primary buttons, active pill indicator, mic halo glow |
| `color-brand-hover` | `#0052CC` / `bg-blue-700` | Hover state for primary interactive elements |
| `color-brand-subtle` | `#EFF6FF` / `bg-blue-50` | Active card borders, light tag backgrounds, streak highlights |
| `color-brand-dark` | `#1E3A8A` / `bg-blue-900` | Level 4 high-frequency activity heatmap cells |

### Neutrals & Backgrounds
| Token | Hex / Class | Description & Usage |
| :--- | :--- | :--- |
| `color-surface-page` | `#FBFBFD` / `#FFFFFF` | Global app background, crisp and distraction-free |
| `color-surface-card` | `#FFFFFF` | Elevated cards, feedback items, modal surfaces |
| `color-border-subtle`| `#F1F5F9` / `border-slate-100` | Subtle internal card boundaries, metric card outlines |
| `color-border-default`| `#E2E8F0` / `border-slate-200` | Card borders, level switch outlines, header divider |
| `color-border-divider`| `#F1F5F9` / `border-b border-slate-100` | Global navbar bottom border divider |

### Typography Colors
| Token | Hex / Class | Description & Usage |
| :--- | :--- | :--- |
| `color-text-primary` | `#0F172A` / `text-slate-900` | Main headline questions, section titles, scores |
| `color-text-secondary`| `#475569` / `text-slate-600` | Instructions, task prompts, active labels |
| `color-text-muted` | `#94A3B8` / `text-slate-400` | Timestamps, uppercase metadata tags, legends |

### Activity Heatmap Gradient (GitHub Blue Style)
| Level | Hex / Tailwind | Meaning |
| :--- | :--- | :--- |
| **0 (Empty)** | `#F1F5F9` (`bg-slate-100`) | 0 recordings completed |
| **1 (Low)** | `#DBEAFE` (`bg-blue-100`) | 1 recording |
| **2 (Medium)** | `#93C5FD` (`bg-blue-300`) | 2 recordings |
| **3 (High)** | `#2563EB` (`bg-blue-600`) | 3–4 recordings |
| **4 (Peak)** | `#1E40AF` (`bg-blue-800`) | 5+ recordings |

---

## 3. Typography Rules & Scale

### Typefaces
- **Headlines & Topic Titles**: `'Anek Bangla', -apple-system, BlinkMacSystemFont, sans-serif`  
  *Characteristics*: Warm, modern geometric sans with expressive human touches. Used for topic headline questions and major section titles (`Your practice`, `Recent feedback`).
- **Body & Interface**: `'Inter', system-ui, -apple-system, sans-serif`  
  *Characteristics*: Neutral, highly legible at small sizes, optimal for metadata, buttons, numbers, and navigation.

### Typographic Hierarchy
| Style | Size / Weight | Font Family | Example Usage |
| :--- | :--- | :--- | :--- |
| **Display Question** | `26px`–`28px` (`text-[26px]`), `font-bold` (700) | Anek Bangla | Main topic prompt question |
| **Section Heading** | `20px` (`text-[20px]`), `font-semibold` (600) | Anek Bangla | `"Your practice"`, `"Recent feedback"` |
| **Topic Subheader / Pill**| `11px`–`12px` (`text-[11px]`), `font-semibold` (600), `tracking-wider uppercase` | Inter | `"INTERMEDIATE · TODAY'S TOPIC"` |
| **Body Prompt** | `14px` (`text-[14px]`), `font-normal` (400) | Inter | Topic instructions & guidelines |
| **Item Title** | `15px` (`text-[15px]`), `font-medium` (500) | Inter | Feedback question titles |
| **Metric Large** | `30px` (`text-3xl`), `font-bold` (700) | Inter | Metric numbers (`1`, `2`, `4`) |
| **Metric Caption** | `11px` (`text-[11px]`), `font-semibold` (600), `tracking-wider uppercase` | Inter | `"DAY STREAK"`, `"PRACTICE DAYS"` |
| **Score Number** | `20px` (`text-xl`), `font-bold` (700) | Inter | Feedback scores (`5.2`, `6.0`) |
| **Score Status** | `12px` (`text-[12px]`), `font-normal` (400) | Inter | `"Understandable but needs work"` |

---

## 4. Layout & Spacing Architecture

### Global Canvas & Grid Limits
- **Container Constraint**: `max-w-3xl mx-auto px-6`  
  *Rule*: All page bodies across Dashboard, Practice, History, and Profile must sit inside this identical `max-w-3xl` constraint for continuity.
- **Vertical Spacing Rhythm**:
  - `pt-8 pb-16` for overall page canvas padding.
  - `space-y-8` (32px) between major sections (Level Selector → Active Prompt Card → Practice Stats → Feedback List).
  - `space-y-3` (12px) between list elements (Feedback items).

### Header & Shell Structure
- **Persistent Header**: Sticky or top static bar spanning `w-full border-b border-slate-100 bg-white/95 backdrop-blur-sm`.
- **Inner Header Container**: Matches `max-w-5xl` or `max-w-3xl` with flex-between alignment.
- **Brand Logo**: Soundwave icon bars (`4 vertical bars`) + bold wordmark `"beTalky"`.
- **Navigation Capsule**: Pill container (`bg-black text-white rounded-full p-1 flex items-center space-x-1`) housing:
  - Active Tab: `bg-white text-black font-medium text-xs px-3.5 py-1.5 rounded-full shadow-sm`
  - Inactive Tabs: `text-white/80 hover:text-white text-xs px-3.5 py-1.5 transition`
- **Profile Action**: Pill button `border border-slate-200 bg-black text-white hover:bg-slate-900 rounded-full text-xs font-medium px-4 py-2.5 flex items-center space-x-2`.

---

## 5. Standard Component Patterns

### A. Level Selector (Difficulty Switch)
- **Container**: Flex row with label `"YOUR LEVEL"` (`text-xs font-semibold text-slate-400 tracking-wider uppercase`).
- **Segmented Control**: Rounded pill border container (`border border-slate-200 rounded-full p-1 bg-white inline-flex`).
- **Options**: `Beginner`, `Intermediate`, `Advanced`.
  - Active: `bg-blue-600 text-white rounded-full px-4 py-1 text-xs font-medium shadow-sm`.
  - Inactive: `text-slate-600 hover:text-slate-900 px-4 py-1 text-xs font-medium`.

### B. Practice Prompt Card
- **Frame**: `bg-white border border-slate-200/80 rounded-2xl p-7 shadow-sm`.
- **Action Header**: Flex justify-between with eyebrow label and reload trigger (`"Another one"` with rotate icon button, `text-xs text-slate-600 hover:text-slate-900 rounded-full border border-slate-200 px-3 py-1`).
- **Question Headline**: Font `Anek Bangla`, `text-[26px] font-bold text-slate-900 leading-snug mt-3`.
- **Instruction**: `text-sm text-slate-500 mt-2`.
- **Dashed Divider**: `border-t border-dashed border-slate-200 my-6`.
- **Voice Record Interactive**:
  - Soundwave indicators flanking microphone button.
  - Microphone button: circular `w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-500/25 flex items-center justify-center hover:scale-105 transition`.
  - Timer: `00:00 / 1:00 max` (`font-mono text-xs font-semibold text-slate-800`).
  - Progress Scrubber: subtle track `h-1.5 bg-slate-100 rounded-full` with active blue segment and knob.

### C. Streak & Summary Metric Cards
- **Grid**: `grid grid-cols-3 gap-4`.
- **Card**: `bg-white border border-slate-200/80 rounded-xl p-4 text-center shadow-xs`.
- **Value**: `text-2xl font-bold text-blue-600`.
- **Label**: `text-[10px] font-semibold tracking-wider text-slate-400 uppercase mt-1`.

### D. 52-Week Practice Heatmap (GitHub Blue)
- **Card**: `bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm overflow-hidden`.
- **Layout**: Fits full 12 months (52 columns × 7 day rows) with **no horizontal scrollbar**.
- **Dimensions**: `w-2 h-2` (8px) cells with `2.5px` gap.
- **Labels**: Month indicators across top (`Jan`–`Dec`), weekday markers on left (`Mon`, `Wed`, `Fri`), and `Less` ➔ `More` legend at bottom-right.

### E. Feedback List Items
- **Container**: `bg-white border border-slate-200/80 hover:border-slate-300 rounded-xl p-4 flex items-center justify-between transition-all`.
- **Left Column**:
  - Prompt Title: `text-[15px] font-medium text-slate-800`.
  - Timestamp: `text-xs text-slate-400 mt-0.5`.
- **Right Column (Score)**:
  - Score: `text-xl font-bold text-blue-600 text-right`.
  - Descriptor: `text-xs text-slate-500 mt-0.5 text-right`.

---

## 6. Guidelines for Upcoming Screens

### 1. Dashboard (`/dashboard`)
- Primary home view displaying current streak, daily challenge card, quick practice launcher, and aggregated weekly metrics.

### 2. Practice Screen (`/practice`)
- Dedicated focus mode: minimal UI, expanded audio waveform visualizer, real-time transcription drawer, and pronunciation feedback card.

### 3. History Screen (`/history`)
- Paginated or categorized archive of recordings, filterable by date and level, search bar, and audio playback controls.

### 4. Profile Screen (`/profile`)
- User stats, target fluency goals, CEFR level badge (B1/B2/C1), audio device input settings, and subscription status.
