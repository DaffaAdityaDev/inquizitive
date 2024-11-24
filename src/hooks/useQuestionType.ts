import { useState } from 'react'
import { QuestionType } from '../types'
import { PROMPT_TEMPLATES } from '../constants/prompts'

export function useQuestionType() {
  const [selectedQuestionType, setSelectedQuestionType] = useState<QuestionType>(QuestionType.OPEN_ENDED)

  const handleQuestionTypeChange = (type: QuestionType) => {
    setSelectedQuestionType(type)
  }

  const getPromptTemplate = (topic: string) => {
    return selectedQuestionType === QuestionType.MULTIPLE_CHOICE 
      ? PROMPT_TEMPLATES.MULTIPLE_CHOICE(topic)
      : PROMPT_TEMPLATES.OPEN_ENDED(topic)
  }

  return {
    selectedQuestionType,
    handleQuestionTypeChange,
    getPromptTemplate
  }
}
