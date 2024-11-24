import { useState } from 'react'
import { toast } from 'sonner'
import { QuestionType } from '../types'

interface Question {
  number: number
  question: string
  type: QuestionType
  expected_answer?: string
  options?: string[]
  correct_option?: string
  explanations?: Record<string, string>
  isCodeQuestion?: boolean
}

interface QuestionData {
  questions: Question[]
}

interface UserAnswer {
  number: number
  question: string
  provided_answer: string
  type: QuestionType
  isCodeMode?: boolean
}


interface ParsedFeedback {
  number: number
  question: string
  provided_answer: string
  expected_answer?: string
  correct_option?: string
  evaluation: string
  grade: string
  resources?: string[] 
  explanations?: Record<string, string>
}

type ErrorType = {
  message: string
  type: 'parse' | 'validation' | 'quiz'
}

export function useAIFeedback() {
  const [aiFeedback, setAIFeedback] = useState('')
  const [activeTab, setActiveTab] = useState('prompt')
  const [error, setError] = useState<ErrorType | null>(null)

  function parseAIFeedback(feedback: string): ParsedFeedback[] {
    try {
      const patterns = [
        /<json>([\s\S]*?)<\/json>/,
        /```json\s*([\s\S]*?)```/,
        /<output>[\s\S]*?<json>([\s\S]*?)<\/json>[\s\S]*?<\/output>/
      ]

      for (const pattern of patterns) {
        const match = feedback.match(pattern)
        if (match) {
          const jsonContent = JSON.parse(match[1].trim())
          return (jsonContent.verification || jsonContent.responses || []).map((item: any) => ({
            number: item.number,
            question: item.question,
            provided_answer: item.provided_answer,
            expected_answer: item.expected_answer,
            correct_option: item.correct_option,
            evaluation: item.evaluation,
            grade: item.grade,
            resources: item.resources,
            explanations: item.explanations,
            options: item.options,
            type: item.type
          }))
        }
      }

      const jsonMatch = feedback.match(/{[\s\S]*}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return (parsed.verification || parsed.responses || [])
      }

      return []
    } catch (error) {
      console.error('Error parsing AI feedback:', error)
      return []
    }
  }

  function generateAIPrompt(answers: UserAnswer[], output: QuestionData | null): string {
    if (!answers.length || !output?.questions.length) return ''

    const topic = answers[0]?.question.split(' ')[0] || "Topic"

    const promptTemplate = {
      topic,
      responses: answers.map(answer => {
        const question = output.questions.find(q => q.number === answer.number)
        if (!question) return null

        return {
          number: answer.number,
          type: question.type,
          question: answer.question,
          provided_answer: answer.provided_answer,
          isCodeAnswer: question.type === QuestionType.OPEN_ENDED && answer.isCodeMode,
          ...(question.type === QuestionType.MULTIPLE_CHOICE ? {
            correct_option: question.correct_option,
            options: question.options,
            explanations: question.explanations,
            grading_format: "0/1"
          } : {
            expected_answer: question.expected_answer,
            grading_format: "0/100"
          })
        }
      }).filter(Boolean)
    }

    // Create the template string based on the first question's type
    const firstQuestion = output.questions[0]
    const isMultipleChoice = firstQuestion.type === QuestionType.MULTIPLE_CHOICE

    return `### IMPORTANT: WRAP YOUR ENTIRE RESPONSE IN MARKDOWN TEXT FORMAT ###

# Self-Testing Answer Verification for ${topic}

You are an intelligent and meticulous AI assistant designed to verify and grade responses. Your goal is to evaluate answers against expected responses, ensuring accuracy, completeness, and clarity.

## Evaluation Instructions

1. **Analysis Process**
   - Compare provided answers against expected answers
   - Assess accuracy, completeness, and clarity
   - Provide detailed, constructive feedback
   - Include relevant learning resources when applicable

2. **Grading System**
   ${isMultipleChoice ? `
   For Multiple Choice Questions:
   - Grade Format: 0/1
   - 1: Correct answer selected
   - 0: Incorrect answer selected
   ` : `
   For Open Ended Questions:
   - Grade Format: 0/100
   - 🟢 Excellent (90-100%): Comprehensive and accurate
   - 🟡 Good (70-89%): Generally correct with minor gaps
   - 🔴 Needs Improvement (<70%): Significant gaps or misconceptions
   `}

Questions and Responses:
<json>
${JSON.stringify(promptTemplate, null, 2)}
</json>

## Required Response Format

\`\`\`markdown
<thinking>
[Your detailed evaluation process and reasoning]
</thinking>

<reflection>
[Your overall assessment and recommendations]
</reflection>

<output>
<json>
{
  "verification": [
    {
      "number": [question number],
      "question": [question text],
      "provided_answer": [user's answer],
      ${isMultipleChoice ? `
      "correct_option": [correct option letter],
      "options": [array of options],
      "evaluation": [explanation of correctness],
      "grade": "Grade 0/1 [emoji: 🟢 if correct, 🔴 if incorrect]",
      "explanations": {
        "A": "Why A is correct/incorrect...",
        "B": "Why B is correct/incorrect...",
        "C": "Why C is correct/incorrect...",
        "D": "Why D is correct/incorrect..."
      }` : `
      "evaluation": [detailed feedback],
      "grade": "Grade [0-100]/100 [emoji grade]",
      "expected_answer": [expected answer]`}
      "resources": [
        "Relevant documentation link",
        "Tutorial link",
        "Practice exercises"
      ]
    }
  ]
}
</json>
</output>
\`\`\`

${isMultipleChoice ? `
## Display Guidelines for Multiple Choice

1. Show all options with their explanations
2. Highlight the correct answer in green (🟢)
3. If incorrect, highlight user's answer in red (🔴)
4. Provide detailed explanation for why each option is correct/incorrect
5. Include specific resources for further learning

Example Multiple Choice Format:
\`\`\`
Question X: [Question text]

Options:
🔴 A) [Option text] - Selected (Incorrect)
🟢 B) [Option text] - Correct Answer
⚪ C) [Option text]
⚪ D) [Option text]

Explanations:
A) Why this option is incorrect...
B) Why this is the correct answer...
C) Why this option is incorrect...
D) Why this option is incorrect...
\`\`\`
` : ''}

### REMINDER: ENSURE YOUR ENTIRE RESPONSE IS IN MARKDOWN FORMAT ###`
  }

  function generateFinalOutput(userAnswers: UserAnswer[], output: QuestionData | null): string {
    if (!userAnswers?.length || !output?.questions?.length) {
      return generateAIPrompt([], null)
    }

    const simulatedAIEvaluation = {
      verification: userAnswers.map(answer => {
        const question = output.questions.find(q => q.number === answer.number)
        if (!question) return null
        
        const baseEvaluation = {
          number: answer.number,
          question: answer.question,
          provided_answer: answer.provided_answer,
          type: question.type,
          evaluation: "[AI will provide detailed feedback]",
          grade: question.type === QuestionType.MULTIPLE_CHOICE ? "Grade 0/1" : "Grade 0/100",
          resources: ["[AI will suggest relevant learning resources]"]
        }

        return question.type === QuestionType.MULTIPLE_CHOICE ? {
          ...baseEvaluation,
          correct_option: question.correct_option,
          options: question.options,
          explanations: question.explanations
        } : {
          ...baseEvaluation,
          expected_answer: question.expected_answer
        }
      }).filter(Boolean)
    }

    return `${generateAIPrompt(userAnswers, output)}

---

## Example Response Format

Here's how the AI should structure its response:

\`\`\`markdown
# Evaluation Results

<thinking>
I will analyze each answer by:
1. Comparing it with the expected answer
2. Identifying correct concepts and misconceptions
3. Evaluating completeness and accuracy
4. Determining appropriate resources for improvement
</thinking>

<reflection>
After analyzing all responses, I will:
1. Assess overall understanding
2. Identify common patterns
3. Suggest general improvements
4. Recommend learning strategies
</reflection>

<output>
<json>
${JSON.stringify(simulatedAIEvaluation, null, 2)}
</json>
</output>
\`\`\`

## Grading Criteria

- 🟢 Excellent (90-100%): Comprehensive understanding, accurate application
- 🟡 Good (70-89%): Basic understanding with minor gaps
- 🔴 Needs Improvement (<70%): Significant misconceptions or incomplete

## Resource Guidelines

When suggesting resources, consider:
1. Official documentation
2. Relevant tutorials
3. Practice exercises
4. Community discussions
5. Academic papers or books

### REMINDER: ENSURE YOUR ENTIRE RESPONSE FOLLOWS THIS MARKDOWN FORMAT ###`
  }

  async function handlePasteFeedback() {
    try {
      const text = await navigator.clipboard.readText()
      setAIFeedback(text)
      toast.success("Feedback pasted!", {
        description: "AI feedback has been successfully pasted.",
        duration: 2000,
      })
    } catch (error) {
      console.error("Error pasting from clipboard:", error)
      toast.error("Failed to paste", {
        description: "Please make sure you have content copied to your clipboard.",
        duration: 2000,
      })
      setError({
        message: "Failed to paste from clipboard",
        type: 'parse'
      })
    }
  }

  return {
    aiFeedback,
    setAIFeedback,
    activeTab,
    setActiveTab,
    error,
    setError,
    parseAIFeedback,
    generateAIPrompt,
    generateFinalOutput,
    handlePasteFeedback
  }
}
