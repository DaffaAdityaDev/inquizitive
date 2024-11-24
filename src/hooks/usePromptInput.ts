import { useState } from 'react'
import { QuestionData, ErrorType, Question, QuestionType, MultipleChoiceQuestion, OpenEndedQuestion } from '../types'

export function usePromptInput() {
  const [promptInput, setPromptInput] = useState('')
  const [error, setError] = useState<ErrorType | null>(null)
  const [output, setOutput] = useState<QuestionData | null>(null)

  const validateQuestion = (q: Question): boolean => {
    const baseValid = 
      typeof q.number === 'number' &&
      typeof q.question === 'string'

    if (q.type === QuestionType.MULTIPLE_CHOICE) {
      return baseValid &&
        Array.isArray((q as MultipleChoiceQuestion).options) &&
        typeof (q as MultipleChoiceQuestion).correct_option === 'string' &&
        typeof (q as MultipleChoiceQuestion).explanations === 'object'
    }

    return baseValid && typeof (q as OpenEndedQuestion).expected_answer === 'string'
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
          
          // Additional cleaning steps
          jsonString = jsonString
            .replace(/\\n/g, '\\n')
            .replace(/\\'/g, "\\'")
            .replace(/\\"/g, '\\"')
            .replace(/\\&/g, '\\&')
            .replace(/\\r/g, '\\r')
            .replace(/\\t/g, '\\t')
            .replace(/\\b/g, '\\b')
            .replace(/\\f/g, '\\f')
            .replace(/[\u0000-\u0019]+/g, '')
          
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

            // Return validated question data
            return {
              questions: parsed.questions.map((q: Question) => ({
                ...q,
                type: q.type || QuestionType.OPEN_ENDED // Default to open-ended if not specified
              }))
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
