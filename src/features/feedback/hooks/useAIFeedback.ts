/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { QuestionData, UserAnswer, ParsedFeedback } from '../../../shared/types'

export function useAIFeedback() {
  const [aiFeedback, setAIFeedback] = useState('')
  const [activeTab, setActiveTab] = useState('prompt')
  const [isLoading, setIsLoading] = useState(false)

  const parseAIFeedback = (text: string, userAnswers: UserAnswer[]): ParsedFeedback[] => {
    // Basic resilient parsing logic based on previous implementations
    try {
      // Find JSON block in text
      const jsonMatch = text.match(/<output>([\s\S]*?)<\/output>/) || text.match(/```json([\s\S]*?)```/)
      const jsonContent = jsonMatch ? jsonMatch[1] : text
      
      const data = JSON.parse(jsonContent)
      const feedbackItems = data.verification || data.questions || []
      
      return feedbackItems.map((item: any) => {
        // Attempt to match with user answer if number is missing or wrong
        const matchingAnswer = userAnswers.find(a => a.number === item.number) ||
                              userAnswers.find(a => a.question === item.question)
        
        return {
          ...item,
          number: item.number || matchingAnswer?.number || 0,
          provided_answer: item.provided_answer || matchingAnswer?.provided_answer || ''
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
