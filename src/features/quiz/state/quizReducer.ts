import {
  Confidence,
  ErrorType,
  ParsedFeedback,
  Question,
  QuestionData,
  QuestionMastery,
  QuestionType,
  UNKNOWN_ANSWER,
  UserAnswer
} from '../../../shared/types'
import { evaluateQuizAnswers } from '../utils/mcqEvaluator'
import { parseQuestions, ParseQuestionsResult } from '../utils/parseQuestions'
import { parseAIFeedback } from '../../feedback/utils/parseFeedback'
import { applyFeedbackToMastery } from '../../mastery/utils/masteryUpdates'

export type QuizView = 'home' | 'quiz' | 'completed'
export type ResultsTab = 'prompt' | 'feedback' | 'study'

export interface QuizSessionState {
  /** Questions of the current round (a subset of originalOutput after Retry Failed). */
  output: QuestionData | null
  /** Full question set from the last successful paste; mastery is tracked against it. */
  originalOutput: QuestionData | null
  userAnswers: UserAnswer[]
  currentQuestionIndex: number
  currentAnswer: string
  /** How sure the learner is about the current answer (optional). */
  currentConfidence: Confidence | null
  /** Identifies the pasted question set; attempts are recorded as sessionId:round:number. */
  sessionId: string
  view: QuizView
  isCodeMode: boolean
  promptInput: string
  /** Raw AI feedback text pasted for the current round. */
  aiFeedback: string
  /** Mastery before this round's first AI paste, so a corrected paste replaces it instead of stacking. */
  aiMasteryBase: Record<number, QuestionMastery> | null
  /** Trimmed AI feedback texts applied in earlier rounds, to reject a stale clipboard paste. */
  pastAIFeedback: string[]
  /** Locally graded MCQ feedback, accumulated across rounds. */
  localFeedback: ParsedFeedback[]
  masteryMap: Record<number, QuestionMastery>
  currentRound: number
  activeTab: ResultsTab
  error: ErrorType | null
}

export type QuizAction =
  | { type: 'PROMPT_INPUT_CHANGED'; value: string; result: ParseQuestionsResult | null; sessionId: string }
  | { type: 'START_QUIZ' }
  | { type: 'SET_CURRENT_ANSWER'; answer: string }
  | { type: 'SET_CONFIDENCE'; confidence: Confidence | null }
  | { type: 'ANSWER_UNKNOWN' }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREVIOUS_QUESTION' }
  | { type: 'JUMP_TO_QUESTION'; index: number }
  | { type: 'TOGGLE_CODE_MODE' }
  | { type: 'SET_ACTIVE_TAB'; tab: ResultsTab }
  | { type: 'APPLY_AI_FEEDBACK'; text: string; items: ParsedFeedback[] }
  | { type: 'RETRY_FAILED' }
  | { type: 'SET_ERROR'; error: ErrorType | null }
  | { type: 'RESET' }

export function createInitialState(overrides: Partial<QuizSessionState> = {}): QuizSessionState {
  return {
    output: null,
    originalOutput: null,
    userAnswers: [],
    currentQuestionIndex: 0,
    currentAnswer: '',
    currentConfidence: null,
    sessionId: '',
    view: 'home',
    isCodeMode: false,
    promptInput: '',
    aiFeedback: '',
    aiMasteryBase: null,
    pastAIFeedback: [],
    localFeedback: [],
    masteryMap: {},
    currentRound: 1,
    activeTab: 'prompt',
    error: null,
    ...overrides
  }
}

/** Action creator: parses once so callers can inspect the result (e.g. for a toast). */
export function newSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function promptInputChanged(value: string): Extract<QuizAction, { type: 'PROMPT_INPUT_CHANGED' }> {
  return {
    type: 'PROMPT_INPUT_CHANGED',
    value,
    result: value.trim() ? parseQuestions(value) : null,
    sessionId: newSessionId()
  }
}

/** The saved answer text and confidence for a question, to load when navigating to it. */
function answerFields(answers: UserAnswer[], question: Question | undefined) {
  const answer = question ? answers.find(a => a.number === question.number) : undefined
  return {
    currentAnswer: answer?.provided_answer || '',
    currentConfidence: answer?.confidence ?? null
  }
}

function upsertAnswer(
  answers: UserAnswer[],
  question: Question,
  providedAnswer: string,
  confidence: Confidence | null
): UserAnswer[] {
  return [
    ...answers.filter(a => a.number !== question.number),
    {
      number: question.number,
      question: question.question,
      provided_answer: providedAnswer,
      type: question.type,
      questionType: question.type,
      ...(confidence ? { confidence } : {})
    }
  ]
}

/** Saves the in-progress answer (if any) before navigating away from the current question. */
function saveCurrentAnswerIfPresent(state: QuizSessionState): QuizSessionState {
  const question = state.output?.questions[state.currentQuestionIndex]
  if (!question || !state.currentAnswer.trim()) return state
  return {
    ...state,
    userAnswers: upsertAnswer(state.userAnswers, question, state.currentAnswer, state.currentConfidence),
    error: null
  }
}

function sameQuestionSet(a: QuestionData | null, b: QuestionData | null): boolean {
  return !!a && !!b && JSON.stringify(a.questions) === JSON.stringify(b.questions)
}

export function mergeFeedbackByNumber(existing: ParsedFeedback[], updates: ParsedFeedback[]): ParsedFeedback[] {
  const merged = [...existing]
  for (const item of updates) {
    const idx = merged.findIndex(f => f.number === item.number)
    if (idx !== -1) {
      merged[idx] = item
    } else {
      merged.push(item)
    }
  }
  return merged.sort((a, b) => a.number - b.number)
}

/**
 * Transition into 'completed'. MCQs are graded locally here, and only here, so
 * restoring a completed session never counts the same attempt twice.
 */
export function completeQuiz(state: QuizSessionState, userAnswers: UserAnswer[]): QuizSessionState {
  const completed: QuizSessionState = { ...state, userAnswers, view: 'completed' }
  const questions = (state.originalOutput ?? state.output)?.questions
  if (!questions || userAnswers.length === 0) return completed

  const evaluation = evaluateQuizAnswers(questions, userAnswers, state.masteryMap)
  if (!evaluation.hasEvaluatedItems) return completed

  return {
    ...completed,
    localFeedback: mergeFeedbackByNumber(state.localFeedback, evaluation.localFeedback),
    masteryMap: { ...state.masteryMap, ...evaluation.masteryMapUpdates }
  }
}

export type RetryPlan =
  | { kind: 'unavailable' }
  | { kind: 'needs-evaluation' }
  | { kind: 'all-mastered' }
  | { kind: 'retry'; questions: Question[] }

export function planRetry(state: QuizSessionState): RetryPlan {
  if (!state.originalOutput) return { kind: 'unavailable' }

  // Open-ended answers in this round must be graded by the AI first
  const roundHasOpenEnded = !!state.output?.questions.some(q => q.type === QuestionType.OPEN_ENDED)
  if (roundHasOpenEnded && !state.aiFeedback) return { kind: 'needs-evaluation' }

  const failed = state.originalOutput.questions.filter(q => !state.masteryMap[q.number]?.isMastered)
  if (failed.length === 0) return { kind: 'all-mastered' }

  return { kind: 'retry', questions: failed }
}

export type FeedbackPasteResult =
  | { status: 'duplicate' }
  | { status: 'stale' }
  | { status: 'invalid' }
  | { status: 'ok'; items: ParsedFeedback[] }

export function roundOpenEndedNumbers(state: QuizSessionState): Set<number> {
  return new Set(
    (state.output?.questions || [])
      .filter(q => q.type === QuestionType.OPEN_ENDED)
      .map(q => q.number)
  )
}

/**
 * Validates pasted AI feedback against the session. Only open-ended questions of the
 * current round are kept: MCQs are graded locally, and any other number is a stray.
 */
export function prepareAIFeedback(state: QuizSessionState, text: string): FeedbackPasteResult {
  const trimmed = text.trim()
  if (!trimmed) return { status: 'invalid' }
  // Re-pasting the same feedback is a no-op
  if (trimmed === state.aiFeedback.trim()) return { status: 'duplicate' }
  // The clipboard often still holds the previous round's reply
  if (state.pastAIFeedback.includes(trimmed)) return { status: 'stale' }

  const roundNumbers = roundOpenEndedNumbers(state)
  const questions = state.originalOutput?.questions || state.output?.questions || []
  const items = parseAIFeedback(text, state.userAnswers, questions)
    .filter(item => roundNumbers.has(item.number))

  if (items.length === 0) return { status: 'invalid' }
  return { status: 'ok', items }
}

export function quizReducer(state: QuizSessionState, action: QuizAction): QuizSessionState {
  switch (action.type) {
    case 'PROMPT_INPUT_CHANGED': {
      const base = { ...state, promptInput: action.value, error: null }
      if (!action.result) return { ...base, output: null }
      if ('error' in action.result) return { ...base, output: null, error: action.result.error }
      // Re-parsing the same questions (e.g. editing whitespace) keeps the progress
      if (sameQuestionSet(action.result.data, state.originalOutput)) {
        return { ...base, output: state.output ?? action.result.data }
      }
      // A new question set starts a fresh mastery loop
      return {
        ...base,
        output: action.result.data,
        originalOutput: action.result.data,
        sessionId: action.sessionId,
        userAnswers: [],
        currentQuestionIndex: 0,
        currentAnswer: '',
        currentConfidence: null,
        aiFeedback: '',
        aiMasteryBase: null,
        pastAIFeedback: [],
        localFeedback: [],
        masteryMap: {},
        currentRound: 1
      }
    }

    case 'START_QUIZ': {
      const questions = state.output?.questions
      if (!questions || questions.length === 0) {
        return { ...state, error: { message: 'No questions available', type: 'quiz' } }
      }

      // Resume at the first unanswered question
      const firstUnanswered = questions.findIndex(q => !state.userAnswers.some(a => a.number === q.number))
      const startIndex = state.userAnswers.length > 0 && firstUnanswered !== -1 ? firstUnanswered : 0

      return {
        ...state,
        currentQuestionIndex: startIndex,
        ...answerFields(state.userAnswers, questions[startIndex]),
        view: 'quiz',
        error: null
      }
    }

    case 'SET_CURRENT_ANSWER':
      return { ...state, currentAnswer: action.answer }

    case 'SET_CONFIDENCE':
      return { ...state, currentConfidence: action.confidence }

    case 'ANSWER_UNKNOWN':
      if (state.view !== 'quiz') return state
      return quizReducer({ ...state, currentAnswer: UNKNOWN_ANSWER, currentConfidence: null }, { type: 'NEXT_QUESTION' })

    case 'NEXT_QUESTION': {
      // A double-click or key repeat after finishing must not grade the round again
      if (state.view !== 'quiz') return state
      const questions = state.output?.questions
      const question = questions?.[state.currentQuestionIndex]
      if (!questions || !question) return state

      if (!state.currentAnswer || !state.currentAnswer.trim()) {
        return {
          ...state,
          error: {
            message: question.type === QuestionType.MULTIPLE_CHOICE
              ? 'Please select an option to continue'
              : 'Please provide an answer before advancing',
            type: 'validation'
          }
        }
      }

      const userAnswers = upsertAnswer(state.userAnswers, question, state.currentAnswer, state.currentConfidence)

      if (state.currentQuestionIndex < questions.length - 1) {
        const nextIndex = state.currentQuestionIndex + 1
        return {
          ...state,
          userAnswers,
          currentQuestionIndex: nextIndex,
          ...answerFields(state.userAnswers, questions[nextIndex]),
          error: null
        }
      }

      // Questions skipped via the navigator or arrow keys must be answered before finishing
      const unansweredIndex = questions.findIndex(q => !userAnswers.some(a => a.number === q.number))
      if (unansweredIndex !== -1) {
        const unanswered = questions[unansweredIndex]
        return {
          ...state,
          userAnswers,
          currentQuestionIndex: unansweredIndex,
          ...answerFields(userAnswers, unanswered),
          error: { message: `Answer question ${unanswered.number} before finishing`, type: 'validation' }
        }
      }

      return completeQuiz(state, userAnswers)
    }

    case 'PREVIOUS_QUESTION': {
      if (state.currentQuestionIndex <= 0) return state
      const saved = saveCurrentAnswerIfPresent(state)
      const prevIndex = state.currentQuestionIndex - 1
      return {
        ...saved,
        currentQuestionIndex: prevIndex,
        ...answerFields(saved.userAnswers, state.output?.questions[prevIndex])
      }
    }

    case 'JUMP_TO_QUESTION': {
      const questions = state.output?.questions
      if (!questions || action.index < 0 || action.index >= questions.length) return state
      if (action.index === state.currentQuestionIndex) return state

      const saved = saveCurrentAnswerIfPresent(state)
      return {
        ...saved,
        currentQuestionIndex: action.index,
        ...answerFields(saved.userAnswers, questions[action.index]),
        error: null
      }
    }

    case 'TOGGLE_CODE_MODE':
      return { ...state, isCodeMode: !state.isCodeMode }

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.tab }

    case 'APPLY_AI_FEEDBACK': {
      // An updated paste in the same round replaces the earlier one rather than adding an attempt
      const base = state.aiMasteryBase ?? state.masteryMap
      return {
        ...state,
        masteryMap: applyFeedbackToMastery(base, action.items),
        aiMasteryBase: base,
        aiFeedback: action.text,
        activeTab: 'feedback'
      }
    }

    case 'RETRY_FAILED': {
      const plan = planRetry(state)
      if (plan.kind !== 'retry') return state
      // localFeedback is kept so earlier MCQ results stay visible in the analysis
      return {
        ...state,
        output: { ...state.originalOutput, questions: plan.questions },
        currentQuestionIndex: 0,
        userAnswers: [],
        currentAnswer: '',
        currentConfidence: null,
        view: 'quiz',
        currentRound: state.currentRound + 1,
        aiFeedback: '',
        aiMasteryBase: null,
        pastAIFeedback: state.aiFeedback.trim()
          ? [...state.pastAIFeedback, state.aiFeedback.trim()]
          : state.pastAIFeedback,
        activeTab: 'prompt'
      }
    }

    case 'SET_ERROR':
      return { ...state, error: action.error }

    case 'RESET':
      return createInitialState({ isCodeMode: state.isCodeMode })

    default:
      return state
  }
}
