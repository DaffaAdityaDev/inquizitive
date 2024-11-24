export enum QuestionType {
  OPEN_ENDED = 'OPEN_ENDED',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE'
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

