import { QuestionData, UserAnswer, QuestionMastery, ParsedFeedback } from '../../../shared/types'

const STORAGE_KEY = 'inquizitive_session_v1'

export interface PersistedQuizSession {
  output: QuestionData | null
  originalOutput?: QuestionData | null
  userAnswers: UserAnswer[]
  currentQuestionIndex: number
  currentAnswer: string
  isQuizMode: boolean
  isCompleted: boolean
  isCodeMode: boolean
  promptInput: string
  aiFeedback: string
  localFeedback?: ParsedFeedback[]
  masteryMap: Record<number, QuestionMastery>
  currentRound: number
  updatedAt: number
}

export function loadSavedSession(): PersistedQuizSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedQuizSession
    return parsed
  } catch (err) {
    console.error('Failed to load saved quiz session:', err)
    return null
  }
}

export function saveSession(session: Partial<PersistedQuizSession>) {
  try {
    const existing = loadSavedSession() || {}
    const updated = {
      ...existing,
      ...session,
      updatedAt: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save quiz session:', err)
  }
}

export function clearSavedSession() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.error('Failed to clear quiz session:', err)
  }
}
