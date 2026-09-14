import { describe, it, expect } from 'vitest'
import { isMCQAnswerCorrect, evaluateQuizAnswers } from './mcqEvaluator'
import { QuestionType, MultipleChoiceQuestion, UserAnswer } from '../../../shared/types'

describe('mcqEvaluator - isMCQAnswerCorrect', () => {
  it('correctly matches single letter options', () => {
    expect(isMCQAnswerCorrect('A', 'A')).toBe(true)
    expect(isMCQAnswerCorrect('B', 'a')).toBe(false)
    expect(isMCQAnswerCorrect('C', 'C')).toBe(true)
  })

  it('correctly matches prefixed answers like "A) Option text"', () => {
    const options = [
      'A) React is a JavaScript library',
      'B) React is a database',
      'C) React is an operating system'
    ]
    expect(isMCQAnswerCorrect('A) React is a JavaScript library', 'A', options)).toBe(true)
    expect(isMCQAnswerCorrect('B) React is a database', 'A', options)).toBe(false)
  })

  it('matches when correctOption has prefix and providedAnswer is just letter or full text', () => {
    const options = ['A. Paris', 'B. London', 'C. Rome']
    expect(isMCQAnswerCorrect('A. Paris', 'A.', options)).toBe(true)
    expect(isMCQAnswerCorrect('A. Paris', 'A', options)).toBe(true)
  })
})

describe('mcqEvaluator - evaluateQuizAnswers', () => {
  const sampleQuestions: MultipleChoiceQuestion[] = [
    {
      number: 1,
      question: 'What is 2+2?',
      type: QuestionType.MULTIPLE_CHOICE,
      options: ['A) 3', 'B) 4', 'C) 5'],
      correct_option: 'B',
      explanations: { 'B': '2+2 equals 4' }
    },
    {
      number: 2,
      question: 'What is the capital of France?',
      type: QuestionType.MULTIPLE_CHOICE,
      options: ['A) Berlin', 'B) Madrid', 'C) Paris'],
      correct_option: 'C',
      explanations: { 'C': 'Paris is the capital of France' }
    }
  ]

  it('evaluates answers correctly and updates mastery', () => {
    const userAnswers: UserAnswer[] = [
      {
        number: 1,
        question: 'What is 2+2?',
        provided_answer: 'B) 4',
        type: QuestionType.MULTIPLE_CHOICE
      },
      {
        number: 2,
        question: 'What is the capital of France?',
        provided_answer: 'A) Berlin',
        type: QuestionType.MULTIPLE_CHOICE
      }
    ]

    const result = evaluateQuizAnswers(sampleQuestions, userAnswers)

    expect(result.totalMCQCount).toBe(2)
    expect(result.correctMCQCount).toBe(1)
    expect(result.masteryMapUpdates[1]?.isMastered).toBe(true)
    expect(result.masteryMapUpdates[1]?.bestScore).toBe(100)
    expect(result.masteryMapUpdates[2]?.isMastered).toBe(false)
    expect(result.masteryMapUpdates[2]?.bestScore).toBe(0)

    expect(result.localFeedback).toHaveLength(2)
    expect(result.localFeedback[0].grade).toContain('100/100')
    expect(result.localFeedback[1].grade).toContain('0/100')
  })
})
