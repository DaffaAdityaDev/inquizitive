import { Confidence, ParsedFeedback, QuestionData, QuestionMastery, UserAnswer } from '../../../shared/types'
import { createInitialState, newSessionId, QuizSessionState, QuizView } from './quizReducer'

export const STORAGE_KEY = 'inquizitive_session_v2'
export const LEGACY_STORAGE_KEY = 'inquizitive_session_v1'
const STORAGE_VERSION = 2

export interface PersistedSessionV2 {
  version: 2
  output: QuestionData | null
  originalOutput: QuestionData | null
  userAnswers: UserAnswer[]
  currentQuestionIndex: number
  currentAnswer: string
  currentConfidence?: Confidence | null
  sessionId?: string
  view: QuizView
  isCodeMode: boolean
  promptInput: string
  aiFeedback: string
  aiMasteryBase?: Record<number, QuestionMastery> | null
  pastAIFeedback?: string[]
  localFeedback: ParsedFeedback[]
  masteryMap: Record<number, QuestionMastery>
  currentRound: number
  updatedAt: number
}

/** Shape written by the pre-reducer hooks under LEGACY_STORAGE_KEY. */
export interface LegacySessionV1 {
  output?: QuestionData | null
  originalOutput?: QuestionData | null
  userAnswers?: UserAnswer[]
  currentQuestionIndex?: number
  currentAnswer?: string
  isQuizMode?: boolean
  isCompleted?: boolean
  isCodeMode?: boolean
  promptInput?: string
  aiFeedback?: string
  localFeedback?: ParsedFeedback[]
  masteryMap?: Record<number, QuestionMastery>
  currentRound?: number
  updatedAt?: number
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function getStorage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asQuestionData(value: unknown): QuestionData | null {
  return isRecord(value) && Array.isArray(value.questions) ? (value as unknown as QuestionData) : null
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function asConfidence(value: unknown): Confidence | null {
  return value === 'sure' || value === 'unsure' || value === 'guess' ? value : null
}

function asView(value: unknown): QuizView {
  return value === 'quiz' || value === 'completed' ? value : 'home'
}

/** Builds reducer state from stored data, tolerating missing or malformed fields. */
export function hydrateState(raw: Record<string, unknown>): QuizSessionState {
  const output = asQuestionData(raw.output)
  const originalOutput = asQuestionData(raw.originalOutput) ?? output
  const questionCount = output?.questions.length ?? 0
  const index = typeof raw.currentQuestionIndex === 'number' ? raw.currentQuestionIndex : 0
  const aiFeedback = asString(raw.aiFeedback)

  return createInitialState({
    output,
    originalOutput,
    userAnswers: asArray<UserAnswer>(raw.userAnswers),
    currentQuestionIndex: Math.min(Math.max(0, index), Math.max(0, questionCount - 1)),
    currentAnswer: asString(raw.currentAnswer),
    currentConfidence: asConfidence(raw.currentConfidence),
    // Sessions saved before session ids existed get one, so their attempts can still be recorded
    sessionId: typeof raw.sessionId === 'string' ? raw.sessionId : output ? newSessionId() : '',
    view: output ? asView(raw.view) : 'home',
    isCodeMode: !!raw.isCodeMode,
    promptInput: asString(raw.promptInput),
    aiFeedback,
    aiMasteryBase: aiFeedback && isRecord(raw.aiMasteryBase)
      ? (raw.aiMasteryBase as Record<number, QuestionMastery>)
      : null,
    pastAIFeedback: asArray<unknown>(raw.pastAIFeedback).filter((t): t is string => typeof t === 'string'),
    localFeedback: asArray<ParsedFeedback>(raw.localFeedback),
    masteryMap: isRecord(raw.masteryMap) ? (raw.masteryMap as Record<number, QuestionMastery>) : {},
    currentRound: typeof raw.currentRound === 'number' && raw.currentRound > 0 ? raw.currentRound : 1,
    activeTab: aiFeedback ? 'feedback' : 'prompt'
  })
}

export function migrateV1(legacy: LegacySessionV1): Record<string, unknown> {
  const { isQuizMode, isCompleted, ...rest } = legacy
  return {
    ...rest,
    view: isCompleted ? 'completed' : isQuizMode ? 'quiz' : 'home'
  }
}

export function toPersisted(state: QuizSessionState): PersistedSessionV2 {
  return {
    version: STORAGE_VERSION,
    output: state.output,
    originalOutput: state.originalOutput,
    userAnswers: state.userAnswers,
    currentQuestionIndex: state.currentQuestionIndex,
    currentAnswer: state.currentAnswer,
    currentConfidence: state.currentConfidence,
    sessionId: state.sessionId,
    view: state.view,
    isCodeMode: state.isCodeMode,
    promptInput: state.promptInput,
    aiFeedback: state.aiFeedback,
    aiMasteryBase: state.aiMasteryBase,
    pastAIFeedback: state.pastAIFeedback,
    localFeedback: state.localFeedback,
    masteryMap: state.masteryMap,
    currentRound: state.currentRound,
    updatedAt: Date.now()
  }
}

function readJson(storage: StorageLike, key: string): Record<string, unknown> | null {
  const raw = storage.getItem(key)
  if (!raw) return null
  const parsed: unknown = JSON.parse(raw)
  return isRecord(parsed) ? parsed : null
}

/** Loads the saved session, migrating the v1 format if that is all there is. */
export function loadSession(storage: StorageLike | null = getStorage()): QuizSessionState | null {
  if (!storage) return null
  try {
    const current = readJson(storage, STORAGE_KEY)
    if (current && current.version === STORAGE_VERSION) return hydrateState(current)

    const legacy = readJson(storage, LEGACY_STORAGE_KEY)
    if (legacy) return hydrateState(migrateV1(legacy as LegacySessionV1))
  } catch (err) {
    console.error('Failed to load saved quiz session:', err)
  }
  return null
}

export function saveSession(state: QuizSessionState, storage: StorageLike | null = getStorage()) {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(toPersisted(state)))
    // The legacy copy is only removed once the migrated session is safely written
    storage.removeItem(LEGACY_STORAGE_KEY)
  } catch (err) {
    console.error('Failed to save quiz session:', err)
  }
}

export function clearSession(storage: StorageLike | null = getStorage()) {
  if (!storage) return
  try {
    storage.removeItem(STORAGE_KEY)
    storage.removeItem(LEGACY_STORAGE_KEY)
  } catch (err) {
    console.error('Failed to clear quiz session:', err)
  }
}

/** Lazy initializer for useReducer: reads storage once on mount. */
export function initQuizState(): QuizSessionState {
  return loadSession() ?? createInitialState()
}
