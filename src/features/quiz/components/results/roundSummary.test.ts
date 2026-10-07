import { describe, it, expect } from 'vitest'
import { ParsedFeedback, Question, QuestionType, UserAnswer } from '../../../../shared/types'
import { summarizeRound } from './roundSummary'

const mcq = (number: number): Question => ({
  number,
  question: `MCQ ${number}`,
  type: QuestionType.MULTIPLE_CHOICE,
  options: ['A) a', 'B) b'],
  correct_option: 'A',
  explanations: {}
})

const open = (number: number): Question => ({
  number,
  question: `Open ${number}`,
  type: QuestionType.OPEN_ENDED,
  expected_answer: 'x'
})

const answer = (number: number, provided_answer: string): UserAnswer => ({
  number,
  question: '',
  provided_answer,
  type: QuestionType.OPEN_ENDED
})

const fb = (number: number, grade: string, score?: number): ParsedFeedback => ({
  number,
  question: '',
  provided_answer: '',
  evaluation: '',
  grade,
  score
})

describe('summarizeRound', () => {
  it('counts mastered, needs-work and awaiting items', () => {
    const summary = summarizeRound(
      [mcq(1), mcq(2), open(3)],
      [answer(1, 'A'), answer(2, 'B'), answer(3, 'my answer')],
      [fb(1, 'Grade 100/100'), fb(2, 'Grade 0/100')]
    )
    expect(summary.mastered).toBe(1)
    expect(summary.needsWork).toBe(1)
    expect(summary.awaiting).toBe(1)
    expect(summary.averageScore).toBe(50)
    expect(summary.items[2]).toMatchObject({ status: 'awaiting', score: null, answer: 'my answer' })
  })

  it('prefers the numeric score and ignores feedback outside the round', () => {
    const summary = summarizeRound([open(4)], [], [fb(4, 'Grade 10/100', 90), fb(1, 'Grade 0/100')])
    expect(summary.total).toBe(1)
    expect(summary.items[0]).toMatchObject({ status: 'mastered', score: 90 })
    expect(summary.averageScore).toBe(90)
  })

  it('returns a null average when nothing is graded', () => {
    expect(summarizeRound([open(1)], [], []).averageScore).toBeNull()
  })
})
