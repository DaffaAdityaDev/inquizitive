import { QuestionData, UserAnswer, QuestionType, OpenEndedQuestion, UNKNOWN_ANSWER } from '../../../shared/types'

/** Builds the evaluation prompt the user copies into the web AI chat. */
export function generateAIPrompt(answers: UserAnswer[], output: QuestionData): string {
  // Multiple choice is graded locally, so only open-ended items need the AI
  const items = output.questions
    .filter((q): q is OpenEndedQuestion => q.type === QuestionType.OPEN_ENDED)
    .map(q => {
      const answer = answers.find(a => a.number === q.number)
      return {
        number: q.number,
        question: q.question,
        ...(q.key_concept ? { key_concept: q.key_concept } : {}),
        expected_answer: q.expected_answer || '',
        ...(q.key_points?.length ? { key_points: q.key_points } : {}),
        provided_answer: answer?.provided_answer || '',
        ...(answer?.confidence ? { confidence: answer.confidence } : {})
      }
    })

  return `### AI Evaluation Prompt ###
You are a supportive but rigorous tutor. Evaluate each provided_answer against the question,
expected_answer and key_points (when given). The goal is to help the learner improve fast,
so do not just say right or wrong: say exactly what is missing and how to fix it.

Grading:
- Judge understanding, not wording: a correct answer phrased differently deserves full credit.
- Missing key points, vague statements or factual errors lower the score.
- "confidence" (when given) is how sure the learner felt. If they were "sure" but wrong, say so
  plainly in the evaluation: confident mistakes are the most important ones to fix.
- An answer of "${UNKNOWN_ANSWER}" scores 0; use the evaluation to teach the core idea briefly instead.

Keep the original question numbers, and write all feedback in the same language as the questions.

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
      "score": 75,
      "grade": "Grade 75/100 🟡",
      "evaluation": "Two or three sentences: overall verdict and the most important thing to understand",
      "strengths": ["What the answer got right"],
      "missing_points": ["Key point that was missing or too vague"],
      "misconceptions": ["A wrong idea in the answer and the correct idea"],
      "how_to_improve": "One concrete next step, e.g. what to re-read, compare or practise",
      "resources": ["[Official Docs]: [Page title](https://...)"]
    }
  ]
}
</output>

Rules:
- "score" must be an integer from 0 to 100. Use 🟢 for 85+, 🟡 for 50-84, 🔴 below 50.
- Use an empty array when there is nothing to list (e.g. no misconceptions).
- "resources": 1-3 references that target this learner's gaps, formatted "[Type]: [Title](url)".
  Prefer official documentation and well-known, stable sources; if unsure of an exact URL,
  link the main documentation page instead of guessing a deep link.
`
}
