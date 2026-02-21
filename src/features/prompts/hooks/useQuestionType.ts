import { useState } from 'react'
import { QuestionType } from '../../../shared/types'
import { PROMPT_TEMPLATES } from '../constants/promptTemplates'

export function useQuestionType() {
  const [selectedQuestionType, setSelectedQuestionType] = useState<QuestionType>(QuestionType.OPEN_ENDED)

  const handleQuestionTypeChange = (key: string | number) => {
    setSelectedQuestionType(key as QuestionType)
  }

  const getPromptTemplate = (topic: string) => {
    return selectedQuestionType === QuestionType.MULTIPLE_CHOICE
      ? PROMPT_TEMPLATES.MULTIPLE_CHOICE(topic)
      : PROMPT_TEMPLATES.OPEN_ENDED(topic)
  }

  const handleCopyBasePrompt = async (topic: string) => {
    const template = getPromptTemplate(topic)
    await navigator.clipboard.writeText(template)
  }

  return {
    selectedQuestionType,
    setSelectedQuestionType,
    handleQuestionTypeChange,
    getPromptTemplate,
    handleCopyBasePrompt
  }
}
