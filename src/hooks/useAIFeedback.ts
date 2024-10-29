import { useState } from 'react'
import { toast } from 'sonner'

interface Question {
  number: number
  question: string
  expected_answer: string
  isCodeQuestion?: boolean
}

interface QuestionData {
  questions: Question[]
}

interface UserAnswer {
  number: number
  question: string
  provided_answer: string
}


interface ParsedFeedback {
  number: number
  question: string
  provided_answer: string
  expected_answer: string
  evaluation: string
  grade: string
  resources?: string[] 
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
        /```json\s*([\s\S]*?)```/
      ]

      for (const pattern of patterns) {
        const match = feedback.match(pattern)
        if (match) {
          const jsonContent = JSON.parse(match[1].trim())
          return jsonContent.verification || []
        }
      }

      const jsonMatch = feedback.match(/{[\s\S]*}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return parsed.verification || []
      }

      return []
    } catch (error) {
      console.error('Error parsing AI feedback:', error)
      return []
    }
  }

  function generateAIPrompt(answers: UserAnswer[], output: QuestionData | null): string {
    if (!answers.length || !output?.questions.length) return ''

    const topic = answers.length > 0 
      ? answers[0].question.split(' ')[0] 
      : "Topic"

    const promptTemplate = {
      topic,
      responses: answers.map(answer => {
        const question = output.questions.find(q => q.number === answer.number)
        return {
          number: answer.number,
          question: answer.question,
          provided_answer: answer.provided_answer,
          expected_answer: question?.expected_answer || ''
        }
      })
    }

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
   - 🟢 Excellent (90-100%): Comprehensive and accurate
   - 🟡 Good (70-89%): Generally correct with minor gaps
   - 🔴 Needs Improvement (<70%): Significant gaps or misconceptions

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
      "expected_answer": [expected answer],
      "evaluation": [detailed feedback with specific improvements],
      "grade": "Grade [SCORE/MAX_SCORE] [emoji grade]",
      "resources": [optional links to helpful resources]
    }
  ]
}
</json>
</output>
\`\`\`

### REMINDER: ENSURE YOUR ENTIRE RESPONSE IS IN MARKDOWN FORMAT ###`
  }

  function generateFinalOutput(userAnswers: UserAnswer[], output: QuestionData | null): string {
    if (!userAnswers?.length || !output?.questions?.length) {
      return generateAIPrompt([], null)
    }

    // Generate AI prompt with user answers
    const prompt = generateAIPrompt(userAnswers, output)

    // Create example evaluation combining user answers with expected answers
    const simulatedAIEvaluation = {
      verification: userAnswers.map(answer => {
        const question = output.questions.find(q => q.number === answer.number)
        if (!question) return null
        
        return {
          number: answer.number,
          question: answer.question,
          provided_answer: answer.provided_answer,
          expected_answer: question.expected_answer,
          evaluation: "[AI will provide detailed feedback based on comparing the provided answer with expected answer]",
          grade: "Grade [SCORE/MAX_SCORE][AI will assign a grade emoji: 🟢, 🟡, or 🔴]",
          resources: ["[AI will suggest relevant learning resources]"]
        }
      }).filter(Boolean)
    }

    return `${prompt}

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
