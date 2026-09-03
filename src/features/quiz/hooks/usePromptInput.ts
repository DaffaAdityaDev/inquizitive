import { useState } from 'react'
import { QuestionData, ErrorType, Question, QuestionType, MultipleChoiceQuestion } from '../../../shared/types'
import { loadSavedSession } from './useQuizPersistence'

export function usePromptInput() {
  const [promptInput, setPromptInput] = useState(() => {
    const saved = loadSavedSession()
    return saved?.promptInput || ''
  })
  const [error, setError] = useState<ErrorType | null>(null)
  const [output, setOutput] = useState<QuestionData | null>(() => {
    const saved = loadSavedSession()
    return saved?.output || null
  })

  const validateQuestion = (q: Question): boolean => {
    const baseValid = 
      (typeof q.number === 'number' || typeof q.number === 'string') &&
      typeof q.question === 'string' &&
      q.question.trim().length > 0

    const rawType = q.type ? String(q.type).toUpperCase() : ''
    if (rawType === QuestionType.MULTIPLE_CHOICE || ('options' in q && Array.isArray((q as MultipleChoiceQuestion).options))) {
      return baseValid &&
        Array.isArray((q as MultipleChoiceQuestion).options) &&
        (q as MultipleChoiceQuestion).options.length > 0
    }

    return baseValid
  }

  const extractJsonFromPrompt = (prompt: string): QuestionData | null => {
    try {
      const patterns = [
        /<json>([\s\S]*?)<\/json>/,
        /<output>[\s\S]*?{[\s\S]*?}[\s\S]*?<\/output>/,
        /```json\s*([\s\S]*?)```/,
        /{[\s\S]*"questions"[\s\S]*}/
      ]

      for (const pattern of patterns) {
        const match = prompt.match(pattern)
        if (match) {
          let jsonString = match[0]
          // Remove any surrounding tags or code block markers
          jsonString = jsonString.replace(/<\/?json>|<\/?output>|```json|```/g, '').trim()
          
          // Additional cleaning steps: strip unprintable control characters, but PRESERVE \t, \n, \r
          jsonString = jsonString
            // eslint-disable-next-line no-control-regex
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
          
          try {
            const parsed = JSON.parse(jsonString)
            
            // Validate JSON structure
            if (!parsed.questions || !Array.isArray(parsed.questions)) {
              setError({
                message: "Invalid JSON structure. Must contain a 'questions' array",
                type: 'structure'
              })
              return null
            }
 
            // Validate each question
            const isValid = parsed.questions.every((q: Question) => validateQuestion(q))

            if (!isValid) {
              setError({
                message: "Invalid question format. Check the structure matches the selected question type.",
                type: 'structure'
              })
              return null
            }

            // Return validated question data with normalized types
            return {
              questions: parsed.questions.map((q: Question, idx: number) => {
                const rawType = q.type ? String(q.type).toUpperCase() : ''
                const inferredType = (rawType === QuestionType.MULTIPLE_CHOICE || ('options' in q && Array.isArray((q as MultipleChoiceQuestion).options)))
                  ? QuestionType.MULTIPLE_CHOICE
                  : QuestionType.OPEN_ENDED

                return {
                  ...q,
                  number: Number(q.number) || idx + 1,
                  type: inferredType,
                  explanations: (q as MultipleChoiceQuestion).explanations || {}
                }
              })
            }
          } catch (error) {
            console.error('Error parsing JSON content:', error)
            setError({
              message: "Failed to parse JSON content",
              type: 'parse'
            })
            return null
          }
        }
      }

      setError({
        message: "No valid JSON structure found",
        type: 'format'
      })
      return null
    } catch (error) {
      console.error('Error in extractJsonFromPrompt:', error)
      setError({
        message: "Failed to process input",
        type: 'parse'
      })
      return null
    }
  }

  const handlePromptInput = (value: string) => {
    setPromptInput(value)
    setError(null)
    
    if (!value.trim()) {
      setOutput(null)
      return
    }

    try {
      const parsed = extractJsonFromPrompt(value)
      setOutput(parsed) // Set the output state
      return parsed
    } catch (error) {
      console.error('Error in handlePromptInput:', error)
      setError({
        message: "Failed to process input",
        type: 'parse'
      })
      setOutput(null)
      return null
    }
  }

  return {
    promptInput,
    setPromptInput,
    error,
    setError,
    handlePromptInput,
    output,
    setOutput
  }
}
