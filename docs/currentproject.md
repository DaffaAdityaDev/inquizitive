# Inquizitive - Question Converter & Quiz Application

## Overview

**Inquizitive** is a React-based web application designed to help users create, manage, and take interactive quizzes. The application integrates with Google's Gemini AI API to generate educational questions and provide intelligent feedback on user answers. It supports both open-ended and multiple-choice question types, making it suitable for various learning scenarios.

## Core Functionality

### 1. Question Generation
- **AI-Powered Question Creation**: Uses Google Gemini API to generate questions based on user-provided topics
- **Question Types**: Supports two question formats:
  - **Open-Ended Questions**: Require detailed written responses with expected answers
  - **Multiple Choice Questions**: Provide 4 options (A, B, C, D) with detailed explanations for each option
- **Template System**: Includes structured prompt templates that guide AI to generate high-quality educational questions

### 2. Quiz Mode
- **Interactive Quiz Interface**: Users can answer questions one at a time
- **Progress Tracking**: Visual progress bar shows completion status
- **Navigation**: Users can move between questions (Previous/Next buttons)
- **Code Mode**: Special mode for open-ended questions that allows code input with syntax highlighting
- **Answer Collection**: Stores all user answers for later evaluation

### 3. AI Feedback System
- **Answer Evaluation**: Generates detailed feedback on user answers using AI
- **Grading**: Provides grades and evaluations for each answer
- **Learning Resources**: Includes relevant documentation links, tutorials, and practice exercises
- **Detailed Explanations**: For multiple-choice questions, explains why each option is correct or incorrect

### 4. Model Management
- **Dynamic Model Selection**: Fetches available Gemini models from the API
- **Model Switching**: Users can select different AI models for question generation and feedback
- **Default Configuration**: Uses `gemini-2.0-flash` as default, configurable via environment variables

## Technical Architecture

### Technology Stack
- **Frontend Framework**: React 18.3 with TypeScript
- **Build Tool**: Vite 5.4
- **UI Library**: NextUI 2.4 (React component library)
- **Styling**: Tailwind CSS 3.4
- **State Management**: React Context API + Custom Hooks
- **Data Fetching**: SWR 2.3 for data fetching and caching
- **API Integration**: Google Gemini Generative AI API (`@google/genai`)
- **Notifications**: Sonner (toast notifications)
- **Animations**: Framer Motion 11.11
- **Validation**: Zod 3.23 for schema validation

### Project Structure

```
src/
├── components/          # React components
│   ├── QuestionConverter.tsx    # Main application component
│   ├── Navbar.tsx               # Navigation bar with theme toggle
│   ├── QuestionInput.tsx        # Question input interface
│   ├── MultipleChoiceInput.tsx  # Multiple choice question UI
│   ├── AIFeedbackDisplay.tsx    # Feedback visualization
│   └── ErrorDisplay.tsx         # Error handling UI
├── context/            # React Context providers
│   └── ModelContext.tsx         # Model selection state management
├── hooks/              # Custom React hooks
│   ├── useQuestionConverter.ts  # Main business logic hook
│   ├── useQuizState.ts          # Quiz state management
│   ├── useAIFeedback.ts         # AI feedback handling
│   ├── useQuestionType.ts       # Question type management
│   └── usePromptInput.ts        # Prompt input handling
├── services/           # API services
│   ├── api.ts                   # Base API service
│   ├── geminiService.ts         # Gemini API integration
│   └── questionService.ts       # Question processing
├── types/              # TypeScript type definitions
│   ├── index.ts                 # Core types (Question, UserAnswer, etc.)
│   └── api.ts                   # API response types
├── constants/           # Application constants
│   └── prompts.ts               # AI prompt templates
└── utils/              # Utility functions
    ├── extractJsonFromPrompt.ts # JSON extraction from AI responses
    ├── parseAIFeedback.ts       # Feedback parsing
    └── errorUtils.ts            # Error handling utilities
```

### Key Features Implementation

#### 1. Question Type System
- Enum-based type system (`OPEN_ENDED`, `MULTIPLE_CHOICE`)
- Type-safe question structures with TypeScript discriminated unions
- Dynamic prompt templates based on question type

#### 2. State Management
- Custom hooks pattern for separation of concerns
- Context API for global state (model selection)
- Local state for component-specific data

#### 3. API Integration
- RESTful API service wrapper
- Environment variable configuration for API keys
- Error handling and retry logic
- Response parsing and validation

#### 4. User Experience
- Dark/Light theme toggle (persisted in localStorage)
- Keyboard shortcuts (Enter to submit, navigate)
- Loading states and progress indicators
- Toast notifications for user feedback
- Modal dialogs for tutorials and topic input

## Environment Configuration

The application requires the following environment variables:

- `VITE_GEMINI_API_KEY`: Google Gemini API key (required)
- `VITE_GEMINI_MODEL`: Default Gemini model to use (optional, defaults to `gemini-2.0-flash`)

## Usage Workflow

1. **Generate Questions**:
   - Select question type (Open-Ended or Multiple Choice)
   - Click "Copy Base Prompt Template" to get a template
   - Enter a topic in the modal
   - Either copy the template to use with an external AI assistant, or generate questions directly using the "Generate Questions" button

2. **Answer Questions**:
   - Paste the AI-generated prompt (with `<output>` tags containing JSON) into the input field
   - Click "Start Answering Questions"
   - Answer each question in sequence
   - Navigate between questions using Previous/Next buttons
   - Complete the quiz

3. **Get Feedback**:
   - After completing the quiz, switch to the "AI Feedback" tab
   - Generate feedback using the "Generate" button, or paste pre-generated feedback
   - Review detailed evaluations, grades, and learning resources

## Development

### Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint
- `npm test`: Run tests with Vitest

### Code Quality
- TypeScript for type safety
- ESLint for code linting
- React Hooks linting rules
- Error boundaries for graceful error handling

## Design Philosophy

The application follows these principles:

1. **Type Safety**: Extensive use of TypeScript for compile-time error checking
2. **Component Composition**: Modular, reusable components
3. **Separation of Concerns**: Business logic in custom hooks, UI in components
4. **User-Centric Design**: Intuitive interface with helpful tutorials and feedback
5. **Accessibility**: ARIA labels and keyboard navigation support
6. **Responsive Design**: Works across different screen sizes

## Future Enhancements

Potential areas for expansion:
- Support for additional question types (True/False, Fill-in-the-blank)
- Question bank and history management
- Export/import functionality for quizzes
- Collaborative features (sharing quizzes)
- Analytics and progress tracking
- Customizable themes and branding

