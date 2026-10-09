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
  /** Short name of the concept the question tests, used to group what to study next. */
  key_concept?: string
  /** Deeper explanation of the concept behind the answer. */
  explanation?: string
  /** Learning references, ideally "[Type]: [Title](url)". */
  resources?: string[]
}

export type OpenEndedQuestion = BaseQuestion & {
  type: QuestionType.OPEN_ENDED
  expected_answer: string
  /** The points a complete answer must cover; used for grading and for review. */
  key_points?: string[]
}

export type MultipleChoiceQuestion = BaseQuestion & {
  type: QuestionType.MULTIPLE_CHOICE
  options: string[]
  correct_option: string
  explanations: Record<string, string>
}

export type Question = OpenEndedQuestion | MultipleChoiceQuestion

export type QuestionData = {
  /** Topic name the AI gives the question set; feeds the learner profile. */
  topic?: string
  questions: Question[]
}

/** How sure the learner was when answering; a correct guess is not treated as knowledge. */
export type Confidence = 'sure' | 'unsure' | 'guess'

/** Recorded as the answer when the learner skips with "I don't know". */
export const UNKNOWN_ANSWER = "I don't know"

export interface UserAnswer {
  number: number
  question: string
  provided_answer: string
  type: QuestionType
  questionType?: QuestionType
  isCodeMode?: boolean
  confidence?: Confidence
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
  /** Numeric 0-100 score; preferred over parsing `grade` when present. */
  score?: number
  resources?: string[]
  explanations?: Record<string, string>
  isCodeQuestion?: boolean
  key_concept?: string
  /** Deeper explanation of the concept (from the quiz JSON). */
  explanation?: string
  key_points?: string[]
  /** What the answer got right. */
  strengths?: string[]
  /** Key points the answer missed. */
  missing_points?: string[]
  /** Wrong ideas the answer revealed. */
  misconceptions?: string[]
  /** Concrete next step to close the gap. */
  how_to_improve?: string
}

export interface AIFeedbackResponse {
  verification: ParsedFeedback[]
}

export interface APIError extends Error {
  status: number
  code: string
  data: Record<string, unknown> | string
}
