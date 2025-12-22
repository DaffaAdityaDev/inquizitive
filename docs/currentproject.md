# Inquizitive v2 - Learning & Quiz Application

## Overview

**Inquizitive v2** is a Next.js-based web application currently in early development. The project is designed to be a comprehensive learning and quiz application that will help users create, manage, and take interactive quizzes with AI-powered features. This documentation reflects the current state of the project as a fresh Next.js setup.

## Current Project Status

**Status**: Initial Setup Phase  
**Version**: 0.1.0  
**Last Updated**: Project initialization

The project is currently a minimal Next.js starter template and is being prepared for development of the full Inquizitive application.

## Technical Architecture

### Technology Stack

- **Framework**: Next.js 16.1.0 (App Router)
- **React Version**: 19.2.3
- **TypeScript**: ^5
- **Styling**: Tailwind CSS ^4
- **PostCSS**: @tailwindcss/postcss ^4
- **Linting**: ESLint ^9 with eslint-config-next

### Current Project Structure

```
inquizitive-v2/
├── app/                    # Next.js App Router directory
│   ├── favicon.ico         # Site favicon
│   ├── globals.css         # Global styles with Tailwind
│   ├── layout.tsx          # Root layout component
│   └── page.tsx            # Home page component
├── docs/                   # Project documentation
│   ├── currentproject.md   # This file
│   └── newfeature.md       # Future features & architecture plans
├── public/                 # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── .gitignore             # Git ignore rules
├── eslint.config.mjs      # ESLint configuration
├── next.config.ts         # Next.js configuration
├── package.json           # Dependencies and scripts
├── postcss.config.mjs     # PostCSS configuration
├── README.md              # Default Next.js README
└── tsconfig.json          # TypeScript configuration
```

### Key Configuration Details

#### TypeScript Configuration
- **Target**: ES2017
- **Module Resolution**: bundler (Next.js optimized)
- **JSX**: react-jsx
- **Path Aliases**: `@/*` maps to project root
- **Strict Mode**: Enabled

#### Next.js Configuration
- Using App Router (default in Next.js 16)
- TypeScript enabled
- Default configuration (can be extended as needed)

#### Tailwind CSS
- Version 4 (latest)
- Configured via PostCSS
- Global styles in `app/globals.css`

### Current Components

#### Root Layout (`app/layout.tsx`)
- Sets up HTML structure
- Configures Geist and Geist Mono fonts from Google Fonts
- Applies global styles
- Basic metadata configuration

#### Home Page (`app/page.tsx`)
- Default Next.js starter template
- Demonstrates basic Tailwind styling
- Dark mode support with dark: prefix classes
- Responsive design patterns

## Development

### Available Scripts

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

### Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Environment Variables

Currently no environment variables are required. Future features may require:
- API keys for AI services (e.g., Google Gemini)
- Database connection strings (e.g., Supabase)
- Authentication credentials

## Planned Features (See `docs/newfeature.md`)

The project has extensive planning documentation for future features including:

- **Neuro-Stack Architecture**: Spaced Repetition System (SRS) for optimal learning
- **AI-Powered Question Generation**: Integration with AI models for quiz creation
- **Hybrid Authentication**: Google OAuth and Email/Password support
- **The Learning Flywheel**: Acquire → Filter → Retain → Reinforce cycle
- **Advanced Learning Modes**: Feynman Technique, Generation Effect, Scenario-Based questions
- **Gamification**: XP system, streaks, heatmap tracking

## Next Steps

1. **Database Setup**: Configure Supabase for user data and quiz storage
2. **Authentication**: Implement hybrid auth (Google OAuth + Email/Password)
3. **Core Quiz Features**: Build question input, quiz interface, and feedback system
4. **SRS Implementation**: Add spaced repetition algorithm for review system
5. **UI Components**: Create reusable components for quiz interface

## Design Philosophy

The project aims to follow these principles:

1. **Type Safety**: Full TypeScript implementation
2. **Modern React Patterns**: Utilizing React 19 features and App Router
3. **Performance**: Optimized with Next.js built-in optimizations
4. **Accessibility**: ARIA labels and semantic HTML
5. **Responsive Design**: Mobile-first approach with Tailwind CSS
6. **Developer Experience**: Clear structure and maintainable code

## Notes

- This is an early-stage project
- The application structure will evolve as features are added
- Refer to `docs/newfeature.md` for detailed architecture and feature plans
- The codebase currently contains minimal implementation beyond the starter template

