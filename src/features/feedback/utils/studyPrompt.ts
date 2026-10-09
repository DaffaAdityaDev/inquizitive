import { MASTERY_THRESHOLD, ParsedFeedback } from '../../../shared/types'
import { resolveFeedbackScore } from '../../mastery/utils/masteryUpdates'
import { conceptKey, LearnerProfile } from '../../learner/learnerProfile'

/** Graded items still below the mastery threshold, i.e. what to study next. */
export function selectWeakItems(feedback: ParsedFeedback[]): ParsedFeedback[] {
  return feedback.filter(item => resolveFeedbackScore(item) < MASTERY_THRESHOLD)
}

function gapSummary(item: ParsedFeedback, profile?: LearnerProfile) {
  const record = item.key_concept ? profile?.concepts[conceptKey(item.key_concept)] : undefined
  const pastScores = record?.attempts.map(a => a.score) ?? []
  return {
    number: item.number,
    ...(item.key_concept ? { concept: item.key_concept } : {}),
    question: item.question,
    my_answer: item.provided_answer || '(no answer)',
    correct_answer: item.expected_answer || '',
    ...(item.missing_points?.length ? { missing_points: item.missing_points } : {}),
    ...(item.misconceptions?.length ? { misconceptions: item.misconceptions } : {}),
    // Earlier quizzes show whether this is a one-off slip or a recurring gap
    ...(pastScores.length > 1 ? { my_score_history: pastScores } : {}),
    ...(record?.misconceptions.length ? { recurring_misconceptions: record.misconceptions } : {})
  }
}

/**
 * Builds a tutoring prompt for the user's free AI chat that teaches the concepts
 * behind the questions they got wrong, aimed at their specific gaps.
 */
export function buildStudyPrompt(weakItems: ParsedFeedback[], profile?: LearnerProfile): string {
  return `### Study Session ###
I just took a quiz and got the questions below wrong or only partly right.
Teach me the concepts behind them so I understand them properly, not just the answers.
Write in the same language as the questions.

${JSON.stringify({ gaps: weakItems.map(item => gapSummary(item, profile)) }, null, 2)}

For each concept (group questions that test the same concept):
1. **Core idea**: explain it simply in 2-3 sentences, then go one level deeper.
2. **Where I went wrong**: address my specific answer, missing points and misconceptions. If my score history or recurring misconceptions show I keep getting this wrong, explain it from a different angle than the usual textbook one.
3. **Example**: one concrete example (a short code snippet if it is a programming topic) or an analogy.
4. **Common mistakes**: 1-2 traps people fall into.
5. **Remember it**: a one-line rule of thumb or mnemonic.
6. **Check yourself**: 2 short practice questions. Put their answers at the very end under "Answers", not next to the questions.
7. **References**: 1-3 sources to read next, as markdown links. Prefer official documentation and well-known, stable sources; if unsure of an exact URL, link the main documentation page instead of guessing a deep link.

Finish with a short study plan: the order to review these concepts in and what to practise first.
`
}
