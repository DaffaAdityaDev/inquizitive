import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseAIFeedback } from './parseFeedback'
import { Question, QuestionType, UserAnswer } from '../../../shared/types'

const QUESTIONS: Question[] = [
  { number: 1, type: QuestionType.OPEN_ENDED, question: 'Explain closures', expected_answer: 'Functions capturing scope' },
  {
    number: 2,
    type: QuestionType.MULTIPLE_CHOICE,
    question: 'Pick B',
    options: ['A) apple', 'B) banana', 'C) cherry'],
    correct_option: 'B',
    explanations: { B: 'Banana is right' }
  }
]

const ANSWERS: UserAnswer[] = [
  { number: 1, question: 'Explain closures', provided_answer: 'They remember scope', type: QuestionType.OPEN_ENDED },
  { number: 2, question: 'Pick B', provided_answer: 'A) apple', type: QuestionType.MULTIPLE_CHOICE }
]

function wrap(items: unknown[]) {
  return JSON.stringify({ verification: items })
}

const ITEM = { number: 1, question: 'Explain closures', evaluation: 'Solid', grade: 'Grade 90/100', score: 90 }

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('parseAIFeedback: extraction', () => {
  it('reads {verification: [...]} inside <output> tags', () => {
    const items = parseAIFeedback(`Here:\n<output>${JSON.stringify({ verification: [ITEM] })}</output>`, ANSWERS, QUESTIONS)
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ number: 1, evaluation: 'Solid', score: 90 })
  })

  it('reads an array inside <output> tags', () => {
    expect(parseAIFeedback(`<output>${JSON.stringify([ITEM])}</output>`, ANSWERS, QUESTIONS)).toHaveLength(1)
  })

  it('reads an array inside a ```json fence', () => {
    const text = `\`\`\`json
${JSON.stringify([ITEM, { ...ITEM, number: 2 }])}
\`\`\``
    expect(parseAIFeedback(text, ANSWERS, QUESTIONS)).toHaveLength(2)
  })

  it('reads a ```json fenced block with prose around it', () => {
    const text = `Evaluation done.
\`\`\`json
${JSON.stringify({ verification: [ITEM] })}
\`\`\`
Thanks!`
    expect(parseAIFeedback(text, ANSWERS, QUESTIONS)).toHaveLength(1)
  })

  it('reads an unlabelled ``` fence', () => {
    const text = `\`\`\`
${JSON.stringify([ITEM])}
\`\`\``
    expect(parseAIFeedback(text, ANSWERS, QUESTIONS)).toHaveLength(1)
  })

  it('reads raw JSON object with prose around it', () => {
    const text = `Sure, here is the result: ${JSON.stringify({ verification: [ITEM] })} Hope that helps.`
    expect(parseAIFeedback(text, ANSWERS, QUESTIONS)).toHaveLength(1)
  })

  it('reads a bare array without tags or fences', () => {
    expect(parseAIFeedback(JSON.stringify([ITEM, { ...ITEM, number: 2 }]), ANSWERS, QUESTIONS)).toHaveLength(2)
  })

  it('reads a bare array with prose around it', () => {
    const text = `Result: ${JSON.stringify([ITEM])} done`
    expect(parseAIFeedback(text, ANSWERS, QUESTIONS)).toHaveLength(1)
  })

  it.each(['questions', 'feedback', 'answers'])('accepts the alternative "%s" key', key => {
    expect(parseAIFeedback(JSON.stringify({ [key]: [ITEM] }), ANSWERS, QUESTIONS)).toHaveLength(1)
  })

  it('returns [] for an object without a known list key', () => {
    expect(parseAIFeedback('{"result": "ok"}', ANSWERS, QUESTIONS)).toEqual([])
  })

  it('returns [] for invalid or empty input', () => {
    expect(parseAIFeedback('', ANSWERS, QUESTIONS)).toEqual([])
    expect(parseAIFeedback('not json at all', ANSWERS, QUESTIONS)).toEqual([])
    expect(parseAIFeedback(undefined as unknown as string, ANSWERS, QUESTIONS)).toEqual([])
  })

  it('tolerates trailing commas and smart quotes like parseQuestions does', () => {
    const text = '{“verification”: [{“number”: 1, “evaluation”: “ok”, “score”: 90,},]}'
    expect(parseAIFeedback(text, ANSWERS, QUESTIONS)).toHaveLength(1)
  })
})

describe('parseAIFeedback: enrichment', () => {
  it('keeps the numeric score field', () => {
    const [item] = parseAIFeedback(JSON.stringify({ verification: [{ ...ITEM, score: 42 }] }), ANSWERS, QUESTIONS)
    expect(item.score).toBe(42)
  })

  it('fills provided_answer from the matching user answer', () => {
    const [item] = parseAIFeedback(wrap([ITEM]), ANSWERS, QUESTIONS)
    expect(item.provided_answer).toBe('They remember scope')
  })

  it('matches by question text when number is missing', () => {
    const [item] = parseAIFeedback(wrap([{ question: 'Explain closures', evaluation: 'ok', grade: '' }]), ANSWERS, QUESTIONS)
    expect(item.number).toBe(1)
    expect(item.provided_answer).toBe('They remember scope')
    expect(item.expected_answer).toBe('Functions capturing scope')
  })

  it("prefers the user's own answer over the AI's paraphrase, but keeps the AI expected_answer", () => {
    const [item] = parseAIFeedback(
      wrap([{ ...ITEM, provided_answer: 'AI copy', expected_answer: 'AI expected' }]),
      ANSWERS,
      QUESTIONS
    )
    expect(item.provided_answer).toBe(ANSWERS.find(a => a.number === ITEM.number)?.provided_answer)
    expect(item.expected_answer).toBe('AI expected')
  })

  it('falls back to the AI provided_answer when the user answer is unknown', () => {
    const [item] = parseAIFeedback(wrap([{ ...ITEM, provided_answer: 'AI copy' }]), [], QUESTIONS)
    expect(item.provided_answer).toBe('AI copy')
  })

  it('uses correct_answer as expected_answer', () => {
    const [item] = parseAIFeedback(wrap([{ ...ITEM, correct_answer: 'From AI' }]), ANSWERS, QUESTIONS)
    expect(item.expected_answer).toBe('From AI')
  })

  it('falls back to the open-ended expected_answer from the original question', () => {
    const [item] = parseAIFeedback(wrap([ITEM]), ANSWERS, QUESTIONS)
    expect(item.expected_answer).toBe('Functions capturing scope')
  })

  it('resolves an MCQ expected answer to the full correct option text', () => {
    const [item] = parseAIFeedback(wrap([{ number: 2, evaluation: 'wrong', grade: '0/100' }]), ANSWERS, QUESTIONS)
    expect(item.expected_answer).toBe('B) banana')
    expect(item.explanations).toEqual({ B: 'Banana is right' })
  })

  it('falls back to the bare correct_option when no option text matches', () => {
    const questions: Question[] = [{ ...QUESTIONS[1], options: ['apple', 'banana'] } as Question]
    const [item] = parseAIFeedback(wrap([{ number: 2, evaluation: 'x', grade: '' }]), ANSWERS, questions)
    expect(item.expected_answer).toBe('B')
  })

  it('takes the expected answer from "The correct answer is X" in the evaluation', () => {
    const [item] = parseAIFeedback(
      wrap([{ number: 9, evaluation: 'Not quite. The correct answer is 42. Try again.', grade: '' }]),
      [],
      []
    )
    expect(item.expected_answer).toBe('42')
  })

  it('copies resources from the original question when the AI gives none', () => {
    const questions = [{ ...QUESTIONS[0], resources: ['https://example.com'] } as unknown as Question]
    const [item] = parseAIFeedback(wrap([ITEM]), ANSWERS, questions)
    expect(item.resources).toEqual(['https://example.com'])
  })

  it('defaults number to 0 and arrays/objects to empty when nothing matches', () => {
    const [item] = parseAIFeedback(wrap([{ evaluation: 'x', grade: '' }]), [], [])
    expect(item).toMatchObject({ number: 0, provided_answer: '', expected_answer: '', explanations: {}, resources: [] })
  })

  it('reads JSON inside <output> even with prose before it', () => {
    const text = `<output>Here is the evaluation:\n${JSON.stringify({ verification: [ITEM] })}</output>`
    expect(parseAIFeedback(text, ANSWERS, QUESTIONS)).toHaveLength(1)
  })

  it('coerces string numbers so they match the original question', () => {
    const [item] = parseAIFeedback(wrap([{ number: '1', evaluation: 'ok', grade: '' }]), ANSWERS, QUESTIONS)
    expect(item.number).toBe(1)
  })
})
