import { QuestionData, UserAnswer, QuestionType } from '../../../shared/types'

/** Builds the evaluation prompt the user copies into the web AI chat. */
export function generateAIPrompt(answers: UserAnswer[], output: QuestionData): string {
  // Multiple choice is graded locally, so only open-ended items need the AI
  const items = output.questions
    .filter(q => q.type === QuestionType.OPEN_ENDED)
    .map(q => ({
      number: q.number,
      question: q.question,
      expected_answer: (q as { expected_answer?: string }).expected_answer || '',
      provided_answer: answers.find(a => a.number === q.number)?.provided_answer || ''
    }))

  return `### AI Evaluation Prompt ###
Evaluate each provided_answer against the question and expected_answer.
Judge understanding, not wording: a correct answer phrased differently deserves full credit,
while missing key points or factual errors lower the score.
Keep the original question numbers.

${JSON.stringify({ answers: items }, null, 2)}

Return ONLY the evaluation in this JSON format inside <output> tags:
<output>
{
  "verification": [
    {
      "number": 1,
      "question": "...",
      "provided_answer": "...",
      "expected_answer": "...",
      "evaluation": "What was right, what was missing or wrong, and how to improve",
      "score": 75,
      "grade": "Grade 75/100 🟡"
    }
  ]
}
</output>

"score" must be an integer from 0 to 100. Use 🟢 for 85+, 🟡 for 50-84, 🔴 below 50.
`
}
