import { QuestionData, Question, UserAnswer } from '../types'

export const questionService = {
  parsePrompt: async (prompt: string): Promise<QuestionData | null> => {
    try {
      const parsedData = JSON.parse(prompt)
      return parsedData as QuestionData
    } catch (error) {
      console.error('Failed to parse prompt:', error)
      return null
    }
  },

  validateQuestions: (questions: Question[]): boolean => {
    return questions.every(question => {
      return (
        question.number &&
        question.question &&
        question.type &&
        (question.type === 'MULTIPLE_CHOICE' ? 
          question.options && question.correct_option :
          question.expected_answer)
      )
    })
  },

  generateAIPrompt: (answers: UserAnswer[], output: QuestionData): string => {
    
    const topic = "the given topic" // You can make this dynamic if needed
    console.log(topic)
    const promptTemplate = {
      answers,
      expectedAnswers: output.questions
    }

    return `### AI Evaluation Prompt ###
    Please evaluate the following answers:
    ${JSON.stringify(promptTemplate, null, 2)}
    `
  }
}
