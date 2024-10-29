import { useState } from 'react'
import { QuestionData, ErrorType, Question } from '../types'

export function usePromptInput() {
  const [promptInput, setPromptInput] = useState('')
  const [error, setError] = useState<ErrorType | null>(null)
  const [output, setOutput] = useState<QuestionData | null>(null)

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
            const isValid = parsed.questions.every((q: any) => 
              typeof q.number === 'number' &&
              typeof q.question === 'string' &&
              typeof q.expected_answer === 'string'
            )

            if (!isValid) {
              setError({
                message: "Each question must have 'number', 'question', and 'expected_answer' fields",
                type: 'structure'
              })
              return null
            }

            // Return validated question data
            return {
              questions: parsed.questions.map((q: Question) => ({
                number: q.number,
                question: q.question,
                expected_answer: q.expected_answer,
                isCodeQuestion: q.isCodeQuestion
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
