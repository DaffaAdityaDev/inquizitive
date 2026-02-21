export enum QuestionType {
  OPEN_ENDED = 'OPEN_ENDED',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE'
}

/**
 * The minimum score (0-100) a question must achieve to be considered "mastered".
 * Questions below this threshold are re-queued in the next round.
 */
export const MASTERY_THRESHOLD = 85

/**
 * Tracks the learning progress of a single question across all rounds.
 */
export interface QuestionMastery {
  questionNumber: number
  /** Best score achieved so far, normalized to 0-100. */
  bestScore: number
  /** How many times this question has been attempted. */
  attempts: number
  /** True when bestScore >= MASTERY_THRESHOLD. */
  isMastered: boolean
}

export type BaseQuestion = {
  number: number
  question: string
  type: QuestionType
}

export type OpenEndedQuestion = BaseQuestion & {
  type: QuestionType.OPEN_ENDED
  expected_answer: string
}

export type MultipleChoiceQuestion = BaseQuestion & {
  type: QuestionType.MULTIPLE_CHOICE
  options: string[]
  correct_option: string
  explanations: Record<string, string>
}

export type Question = OpenEndedQuestion | MultipleChoiceQuestion

export type QuestionData = {
  questions: Question[]
}

export interface UserAnswer {
  number: number
  question: string
  provided_answer: string
  type: QuestionType
  questionType?: QuestionType
  isCodeMode?: boolean
}

export type ErrorType = {
  message: string
  type: string
}

export interface ParsedFeedback {
  number: number
  question: string
  provided_answer: string
  type?: QuestionType
  expected_answer?: string
  correct_option?: string
  options?: string[]
  evaluation: string
  grade: string
  resources?: string[]
  explanations?: Record<string, string>
  isCodeQuestion?: boolean
}

export interface AIFeedbackResponse {
  verification: ParsedFeedback[]
}

export interface APIError extends Error {
  status: number
  code: string
  data: Record<string, unknown> | string
}
