# Inquizitive v2 - Neuro-Stack Learning Platform

## Overview

**Inquizitive** is a Next.js-based spaced repetition learning platform designed for engineers. It uses the **Neuro-Stack Architecture** to transform raw knowledge (from AI-generated quizzes) into long-term memory through scientifically-backed SRS (Spaced Repetition System) algorithms.

## Technology Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16.1 (App Router) |
| **Language** | TypeScript 5 |
| **UI Library** | React 19.2 |
| **Styling** | Tailwind CSS 4 |
| **Database** | Supabase (PostgreSQL + Auth) |
| **Animations** | Framer Motion 12 |
| **Notifications** | Sonner 2.0 |
| **Syntax Highlighting** | react-syntax-highlighter + Prism |
| **Markdown** | react-markdown 10 |
| **Icons** | Lucide React |
| **UI Components** | Radix UI + Custom shadcn/ui |

## Core Features

### 1. The Forge (Quiz Input)
- **JSON Input**: Paste AI-generated quiz JSON from ChatGPT/Gemini
- **Prompt Builder**: Generate AI-ready prompts (Scenario-Based, Concept Deep Dive)
- **Mistake Capture**: Wrong answers automatically saved to "The Vault" (SRS database)
- **Subject/Workspace Management**: Organize items by topic workspaces

### 2. The Gym (Daily Review)
- **SRS Algorithm**: Modified SM-2 (SuperMemo 2) for optimal review scheduling
- **Rating System**: Again (0) → Hard (3) → Good (4) → Easy (5)
- **Flashcard UI**: Interactive reveal-and-rate interface
- **Subject Filtering**: Review by specific workspace/subject

### 3. The Library (Browse)
- **Full Item List**: View all saved review items
- **Search & Filter**: Filter by topic, subject, SRS level
- **Mastery Tracking**: Visual indicators for item progress

### 4. Gamification
- **XP System**: Earn XP for reviews and learning from mistakes
- **Streak Counter**: Track consecutive days of activity
- **Heatmap**: GitHub-style activity visualization
- **Mastery Counter**: Track fully internalized items (Level 4+)

### 5. Cognitive Learning Modes
- **Hardcore Mode**: Hide answer options until ready (Generation Effect)
- **Feynman Mode**: Require explanation before answering

## Project Structure

```
inquizitive-v2/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Dashboard (Heatmap, Stats, Navigation)
│   ├── actions.ts                # getUserStats, createWorkspace, deleteWorkspace, getSubjects
│   ├── layout.tsx                # Root layout with providers
│   ├── globals.css               # Global styles + Tailwind
│   ├── login/
│   │   ├── page.tsx              # Login/Signup UI
│   │   └── actions.ts            # login, signup, loginWithGoogle
│   ├── auth/callback/
│   │   └── route.ts              # OAuth callback handler
│   ├── quiz/
│   │   ├── page.tsx              # The Forge (JSON input + Quiz)
│   │   └── actions.ts            # saveMistake()
│   ├── review/
│   │   ├── page.tsx              # The Gym (SRS review)
│   │   └── actions.ts            # getDueReviews(), submitReview()
│   ├── library/
│   │   ├── page.tsx              # Browse all items
│   │   └── actions.ts            # getAllReviews()
│   ├── profile/
│   │   ├── page.tsx              # User profile
│   │   └── actions.ts            # signOut()
│   └── gate/                     # Auth gate middleware
├── components/
│   ├── QuizRunner.tsx            # Quiz execution (Hardcore/Feynman modes)
│   ├── ReviewSession.tsx         # Flashcard SRS review
│   ├── PromptBuilder.tsx         # AI prompt generator
│   ├── SubjectSelector.tsx       # Workspace/Subject dropdown
│   ├── CodeBlock.tsx             # Syntax highlighting wrapper
│   ├── Heatmap.tsx               # Activity calendar (GitHub-style)
│   ├── Navbar.tsx                # Main navigation
│   ├── ConditionalNavbar.tsx     # Route-aware navbar
│   ├── Tutorial.tsx              # Onboarding overlay
│   └── ui/                       # shadcn/ui components
│       ├── bento-grid.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── hero-highlight.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── textarea.tsx
├── contexts/
│   └── SubjectContext.tsx        # Global subject/workspace state
├── constants/
│   └── prompts.ts                # AI prompt templates
├── utils/
│   ├── srsAlgorithm.ts           # SM-2 implementation
│   └── supabase/
│       ├── client.ts             # Browser Supabase client
│       ├── server.ts             # Server Supabase client
│       └── middleware.ts         # Auth middleware helper
├── types/
│   ├── index.ts                  # Core types (Question, ReviewItem)
│   └── database.ts               # Supabase database types
├── db/
│   ├── schema.sql                # Main database schema
│   ├── migration_01_add_subject.sql
│   └── migration_02_workspaces.sql
└── lib/
    └── utils.ts                  # cn() utility for class merging
```

## Environment Configuration

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGci... (your anon key)
```

## Development Scripts

```bash
# Install dependencies
bun install

# Start development server
bun dev

# Build for production
bun run build

# Start production server
bun start

# Run linting
bun run lint
```

## Authentication

Supports hybrid authentication via Supabase Auth:
- **Email/Password**: Traditional signup and login
- **Google OAuth**: One-click Google sign-in

## Database Schema

### Tables
1. **`review_items`** - The Vault (SRS items)
2. **`learning_stats`** - Gamification (XP, streak, mastered count)
3. **`workspaces`** - User-defined subject workspaces

### SRS Fields
- `srs_level`: 0 (New) → 4+ (Mastered)
- `ease_factor`: Difficulty multiplier (default 2.5)
- `interval_days`: Days until next review
- `next_review_at`: Scheduled review timestamp

## Usage Workflow

1. **Generate Questions**: Use external AI (ChatGPT/Gemini) with prompts from Prompt Builder
2. **Take Quiz**: Paste JSON into The Forge, answer questions
3. **Learn from Mistakes**: Wrong answers auto-save to The Vault
4. **Daily Review**: Visit The Gym to review due items via SRS
5. **Track Progress**: Dashboard shows streak, XP, heatmap, mastery stats
