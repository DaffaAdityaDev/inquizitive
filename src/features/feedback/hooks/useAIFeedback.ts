/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { QuestionData, UserAnswer, ParsedFeedback, Question } from '../../../shared/types'
import { loadSavedSession } from '../../quiz/hooks/useQuizPersistence'

export function useAIFeedback() {
  const [aiFeedback, setAIFeedback] = useState(() => {
    const saved = loadSavedSession()
    return saved?.aiFeedback || ''
  })
  const [activeTab, setActiveTab] = useState(() => {
    const saved = loadSavedSession()
    return saved?.aiFeedback ? 'feedback' : 'prompt'
  })
  const [isLoading, setIsLoading] = useState(false)

  const parseAIFeedback = (
    text: string, 
    userAnswers: UserAnswer[], 
    originalQuestions: Question[] = []
  ): ParsedFeedback[] => {
    if (!text || typeof text !== 'string') return []

    try {
      let jsonContent = ''
      const outputMatch = text.match(/<output>([\s\S]*?)<\/output>/)
      const codeBlockMatch = text.match(/```(?:json)?([\s\S]*?)```/)

      if (outputMatch) {
        jsonContent = outputMatch[1].trim()
      } else if (codeBlockMatch) {
        jsonContent = codeBlockMatch[1].trim()
      } else {
        const firstBrace = text.indexOf('{')
        const lastBrace = text.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonContent = text.slice(firstBrace, lastBrace + 1).trim()
        } else {
          const firstBracket = text.indexOf('[')
          const lastBracket = text.lastIndexOf(']')
          if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
            jsonContent = text.slice(firstBracket, lastBracket + 1).trim()
          } else {
            jsonContent = text.trim()
          }
        }
      }
      
      const data = JSON.parse(jsonContent)
      const feedbackItems = Array.isArray(data)
        ? data
        : data.verification || data.questions || data.feedback || data.answers || []
      
      return feedbackItems.map((item: any) => {
        // Match with user answer and original question
        const matchingAnswer = userAnswers.find(a => a.number === item.number) ||
                              userAnswers.find(a => a.question === item.question)
        const orig = originalQuestions.find(q => q.number === item.number) ||
                     originalQuestions.find(q => q.question === item.question)

        let resolvedExpectedAnswer = item.expected_answer || item.correct_answer || ''
        let resolvedExplanations = item.explanations || {}
        let resolvedResources = item.resources || []

        if (orig) {
          if (orig.type === 'MULTIPLE_CHOICE' || ('options' in orig && Array.isArray((orig as any).options))) {
            const mcq = orig as any
            if (!resolvedExpectedAnswer && mcq.correct_option) {
              const matchedOption = mcq.options?.find((opt: string) => 
                opt.trim().startsWith(mcq.correct_option) || 
                opt.trim().startsWith(`${mcq.correct_option})`) ||
                opt.trim().startsWith(`${mcq.correct_option}.`)
              )
              resolvedExpectedAnswer = matchedOption || mcq.correct_option
            }
            if (!resolvedExplanations || Object.keys(resolvedExplanations).length === 0) {
              resolvedExplanations = mcq.explanations || {}
            }
          } else if (orig.type === 'OPEN_ENDED' && !resolvedExpectedAnswer) {
            resolvedExpectedAnswer = (orig as any).expected_answer || ''
          }

          if (Array.isArray((orig as any).resources) && resolvedResources.length === 0) {
            resolvedResources = (orig as any).resources
          }
        }

        // Regex fallback: check if evaluation explicitly states "The correct answer is X"
        if (!resolvedExpectedAnswer && typeof item.evaluation === 'string') {
          const evalMatch = item.evaluation.match(/The correct answer is\s+([^.]+)/i)
          if (evalMatch) {
            resolvedExpectedAnswer = evalMatch[1].trim()
          }
        }
        
        return {
          ...item,
          number: item.number || matchingAnswer?.number || 0,
          provided_answer: item.provided_answer || matchingAnswer?.provided_answer || '',
          expected_answer: resolvedExpectedAnswer,
          explanations: resolvedExplanations,
          resources: resolvedResources
        }
      })
    } catch (e) {
      console.error("Failed to parse AI feedback JSON:", e)
      return []
    }
  }

  const generateAIPrompt = (answers: UserAnswer[], output: QuestionData): string => {
    const promptTemplate = {
      answers,
      expectedAnswers: output.questions
    }

    return `### AI Evaluation Prompt ###
Please evaluate the following answers accurately. 
Use the original question numbers provided.

${JSON.stringify(promptTemplate, null, 2)}

Return the evaluation in the following JSON format inside <output> tags:
{
  "verification": [
    {
      "number": 1,
      "question": "...",
      "provided_answer": "...",
      "expected_answer": "...",
      "evaluation": "...",
      "grade": "Grade X/100 🟡"
    }
  ]
}
`
  }

  return {
    aiFeedback,
    setAIFeedback,
    activeTab,
    setActiveTab,
    isLoading,
    setIsLoading,
    parseAIFeedback,
    generateAIPrompt
  }
}
