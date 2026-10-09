import { describe, it, expect } from 'vitest'
import {
  AttemptInput,
  emptyProfile,
  recordAttempts,
  REVIEW_INTERVALS,
  selectDueConcepts,
  summarizeConcept,
  summarizeProfile
} from './learnerProfile'
import { buildAdaptiveRoundPrompt, buildReviewPrompt, learnerContextForNewQuiz } from './learnerPrompts'
import { DEFAULT_PROMPT_OPTIONS } from '../prompts/constants/promptTemplates'
import { parseQuestions } from '../quiz/utils/parseQuestions'

const DAY = 24 * 60 * 60 * 1000
const T0 = Date.UTC(2026, 0, 1)

function attempt(overrides: Partial<AttemptInput> = {}): AttemptInput {
  return { id: 's:1:1', concept: 'Closures', topic: 'JavaScript', score: 100, ...overrides }
}

describe('recordAttempts', () => {
  it('upserts by id, so recording the same grade twice is a no-op', () => {
    const once = recordAttempts(emptyProfile(), [attempt()], T0)
    expect(recordAttempts(once, [attempt()], T0 + DAY)).toBe(once)
    expect(once.concepts.closures.attempts).toHaveLength(1)
  })

  it('an updated grade for the same answer replaces it and keeps its time', () => {
    const once = recordAttempts(emptyProfile(), [attempt({ score: 40 })], T0)
    const updated = recordAttempts(once, [attempt({ score: 90 })], T0 + DAY)
    expect(updated.concepts.closures.attempts).toEqual([{ id: 's:1:1', at: T0, score: 90 }])
  })

  it('groups concepts case-insensitively and keeps the latest unique notes', () => {
    const profile = recordAttempts(emptyProfile(), [
      attempt({ id: 'a', concept: 'Closures', misconceptions: ['copies values'] }),
      attempt({ id: 'b', concept: ' closures ', misconceptions: ['Copies values', 'is a class'] })
    ], T0)
    expect(Object.keys(profile.concepts)).toEqual(['closures'])
    expect(profile.concepts.closures.misconceptions).toEqual(['Copies values', 'is a class'])
  })
})

describe('spaced repetition', () => {
  it('a failed concept is weak and due now', () => {
    const profile = recordAttempts(emptyProfile(), [attempt({ score: 30 })], T0)
    const summary = summarizeConcept(profile.concepts.closures, T0)
    expect(summary.status).toBe('weak')
    expect(summary.isDue).toBe(true)
  })

  it('successes in a row push the next review further out', () => {
    let profile = emptyProfile()
    profile = recordAttempts(profile, [attempt({ id: '1' })], T0)
    expect(summarizeConcept(profile.concepts.closures, T0).nextReviewAt).toBe(T0 + REVIEW_INTERVALS[0] * DAY)
    profile = recordAttempts(profile, [attempt({ id: '2' })], T0 + 2 * DAY)
    const summary = summarizeConcept(profile.concepts.closures, T0 + 2 * DAY)
    expect(summary.status).toBe('strong')
    expect(summary.nextReviewAt).toBe(T0 + 2 * DAY + REVIEW_INTERVALS[1] * DAY)
    expect(summary.isDue).toBe(false)
  })

  it('a correct guess does not count as a success', () => {
    const profile = recordAttempts(emptyProfile(), [attempt({ confidence: 'guess' })], T0)
    expect(summarizeConcept(profile.concepts.closures, T0).status).toBe('weak')
  })

  it('flags confident mistakes', () => {
    const profile = recordAttempts(emptyProfile(), [attempt({ score: 10, confidence: 'sure' })], T0)
    expect(summarizeProfile(profile, T0)[0].overconfidentCount).toBe(1)
  })

  it('lists due concepts, most overdue first', () => {
    let profile = recordAttempts(emptyProfile(), [attempt({ id: 'a', concept: 'A' })], T0)
    profile = recordAttempts(profile, [attempt({ id: 'b', concept: 'B', score: 0 })], T0 + 2 * DAY)
    profile = recordAttempts(profile, [attempt({ id: 'c', concept: 'C' })], T0 + 5 * DAY)
    expect(selectDueConcepts(profile, T0 + 5 * DAY).map(s => s.record.concept)).toEqual(['A', 'B'])
  })
})

describe('learner prompts', () => {
  const profile = recordAttempts(emptyProfile(), [
    attempt({ id: 'a', concept: 'Closures', score: 20, confidence: 'sure', misconceptions: ['closures copy values'] }),
    attempt({ id: 'b', concept: 'Hoisting', score: 100 }),
    attempt({ id: 'c', concept: 'Hoisting', score: 100 })
  ], T0)

  it('a new quiz carries weak concepts with their misconceptions, and strong ones', () => {
    const context = learnerContextForNewQuiz(profile, T0)
    expect(context).toContain('## Learner Profile')
    expect(context).toContain('closures copy values')
    expect(context).toContain('"confidently_wrong_times": 1')
    expect(context).toContain('"strong": [\n    "Hoisting"')
    expect(learnerContextForNewQuiz(emptyProfile(), T0)).toBe('')
  })

  it('the adaptive round prompt includes this round and asks for new questions in the quiz format', () => {
    const prompt = buildAdaptiveRoundPrompt(
      'JavaScript',
      {
        feedback: [{ number: 1, question: 'What is a closure?', provided_answer: 'a copy', evaluation: '', grade: '', score: 20, key_concept: 'Closures', misconceptions: ['closures copy values'] }],
        confidence: { 1: 'sure' }
      },
      profile,
      DEFAULT_PROMPT_OPTIONS
    )
    expect(prompt).toContain('## Adaptive Round')
    expect(prompt).toContain('"confidence": "sure"')
    expect(prompt).toContain('Never reuse')
    const output = prompt.slice(prompt.lastIndexOf('<output>'))
    expect('data' in parseQuestions(output)).toBe(true)
  })

  it('the review prompt covers the due concepts', () => {
    const prompt = buildReviewPrompt(profile, DEFAULT_PROMPT_OPTIONS, T0 + DAY)
    expect(prompt).toContain('## Spaced Review')
    expect(prompt).toContain('Closures')
    expect(prompt).not.toContain('"concept": "Hoisting"')
  })
})
