export type QuestionData = {
  questions: Question[]
}

export type Question = {
  number: number
  question: string
  expected_answer: string
  isCodeQuestion?: boolean
}

export type UserAnswer = {
  number: number
  question: string
  provided_answer: string
}

export type ErrorType = {
  message: string
  type: string
}

