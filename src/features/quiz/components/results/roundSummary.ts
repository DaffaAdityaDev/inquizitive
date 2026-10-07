import { MASTERY_THRESHOLD, ParsedFeedback, Question, QuestionType, UserAnswer } from '../../../../shared/types'
import { resolveFeedbackScore } from '../../../mastery/utils/masteryUpdates'

export type RoundItemStatus = 'mastered' | 'needs-work' | 'awaiting'

export interface RoundItem {
  number: number
  question: string
  type: QuestionType
  answer: string
  score: number | null
  status: RoundItemStatus
  hasFeedback: boolean
}

export interface RoundSummary {
  items: RoundItem[]
  total: number
  mastered: number
  needsWork: number
  awaiting: number
  /** Mean score over graded items, or null when nothing is graded yet. */
  averageScore: number | null
}

/** Grades only this round's questions; feedback for questions outside the round is ignored. */
export function summarizeRound(
  questions: Question[],
  userAnswers: UserAnswer[],
  feedback: ParsedFeedback[]
): RoundSummary {
  const byNumber = new Map(feedback.map(f => [f.number, f]))

  const items: RoundItem[] = questions.map(q => {
    const fb = byNumber.get(q.number)
    const score = fb ? resolveFeedbackScore(fb) : null
    // MCQs are graded locally, so one without a grade was skipped and won't be graded by the AI
    const status: RoundItemStatus =
      score === null
        ? q.type === QuestionType.MULTIPLE_CHOICE ? 'needs-work' : 'awaiting'
        : score >= MASTERY_THRESHOLD ? 'mastered' : 'needs-work'
    return {
      number: q.number,
      question: q.question,
      type: q.type,
      answer: userAnswers.find(a => a.number === q.number)?.provided_answer ?? '',
      score,
      status,
      hasFeedback: !!fb
    }
  })

  const graded = items.filter(i => i.score !== null)
  const averageScore = graded.length
    ? Math.round(graded.reduce((sum, i) => sum + (i.score ?? 0), 0) / graded.length)
    : null

  return {
    items,
    total: items.length,
    mastered: items.filter(i => i.status === 'mastered').length,
    needsWork: items.filter(i => i.status === 'needs-work').length,
    awaiting: items.filter(i => i.status === 'awaiting').length,
    averageScore
  }
}
