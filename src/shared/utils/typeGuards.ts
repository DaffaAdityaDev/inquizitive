import { QuestionData, UserAnswer } from "../types"

export function isQuestionData(data: unknown): data is QuestionData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'questions' in data &&
    Array.isArray((data as QuestionData).questions)
  )
}

export function isUserAnswer(data: unknown): data is UserAnswer {
  return (
    typeof data === 'object' &&
    data !== null &&
    'number' in data &&
    'question' in data &&
    'provided_answer' in data
  )
}
