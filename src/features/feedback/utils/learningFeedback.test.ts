import { describe, it, expect } from 'vitest'
import { parseAIFeedback, toStringList } from './parseFeedback'
import { generateAIPrompt } from './evalPrompt'
import { buildStudyPrompt, selectWeakItems } from './studyPrompt'
import { evaluateQuizAnswers, optionLetter } from '../../quiz/utils/mcqEvaluator'
import { buildQuizPrompt, DEFAULT_PROMPT_OPTIONS } from '../../prompts/constants/promptTemplates'
import { MultipleChoiceQuestion, OpenEndedQuestion, ParsedFeedback, QuestionType, UserAnswer } from '../../../shared/types'

const OPEN: OpenEndedQuestion = {
  number: 1,
  type: QuestionType.OPEN_ENDED,
  key_concept: 'Closures',
  question: 'Explain closures',
  expected_answer: 'Functions that capture their lexical scope',
  key_points: ['Captures variables', 'Lexical scope'],
  explanation: 'A function keeps access to variables of the scope it was created in.',
  resources: ['[Official Docs]: [Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures)']
}

const MCQ: MultipleChoiceQuestion = {
  number: 2,
  type: QuestionType.MULTIPLE_CHOICE,
  key_concept: 'Fruit colours',
  question: 'Which fruit is yellow?',
  options: ['A) apple', 'B) banana', 'C) cherry'],
  correct_option: 'B',
  explanations: { A: 'Apples are usually red or green', B: 'Bananas are yellow when ripe', C: 'Cherries are red' },
  explanation: 'Colour comes from pigments.',
  resources: ['[Article]: [Fruit](https://example.com/fruit)']
}

const ANSWERS: UserAnswer[] = [
  { number: 1, question: OPEN.question, provided_answer: 'They remember things', type: QuestionType.OPEN_ENDED },
  { number: 2, question: MCQ.question, provided_answer: 'A) apple', type: QuestionType.MULTIPLE_CHOICE }
]

describe('quiz prompt asks for learning material', () => {
  it('requests key concept, explanation and references for every question', () => {
    const prompt = buildQuizPrompt({ ...DEFAULT_PROMPT_OPTIONS, topic: 'JS', questionType: 'MIXED' })
    expect(prompt).toContain('"key_concept"')
    expect(prompt).toContain('"explanation"')
    expect(prompt).toContain('"resources"')
    expect(prompt).toContain('"key_points"')
  })

  it('points references at the source material when it is provided', () => {
    const prompt = buildQuizPrompt({ ...DEFAULT_PROMPT_OPTIONS, topic: 'JS', sourceMaterial: 'notes' })
    expect(prompt).toContain('[Source]:')
    expect(buildQuizPrompt({ ...DEFAULT_PROMPT_OPTIONS, topic: 'JS' })).not.toContain('[Source]:')
  })
})

describe('evaluation prompt', () => {
  it('sends key points and asks for actionable feedback', () => {
    const prompt = generateAIPrompt(ANSWERS, { questions: [OPEN, MCQ] })
    expect(prompt).toContain('"key_points"')
    expect(prompt).toContain('"missing_points"')
    expect(prompt).toContain('"how_to_improve"')
    // MCQs are still graded locally only
    expect(prompt).not.toContain('Which fruit is yellow?')
  })
})

describe('parseAIFeedback learning fields', () => {
  it('reads the AI gap analysis and normalizes single strings to lists', () => {
    const text = JSON.stringify({
      verification: [{
        number: 1,
        question: OPEN.question,
        score: 40,
        grade: 'Grade 40/100 🔴',
        evaluation: 'Too vague',
        strengths: 'Mentions remembering',
        missing_points: ['Lexical scope'],
        misconceptions: [],
        how_to_improve: 'Re-read the MDN page'
      }]
    })
    const [item] = parseAIFeedback(text, ANSWERS, [OPEN, MCQ])
    expect(item.strengths).toEqual(['Mentions remembering'])
    expect(item.missing_points).toEqual(['Lexical scope'])
    expect(item.misconceptions).toEqual([])
    expect(item.how_to_improve).toBe('Re-read the MDN page')
  })

  it('fills concept, explanation, key points and references from the quiz question', () => {
    const text = JSON.stringify({ verification: [{ number: 1, grade: 'Grade 90/100', evaluation: 'Good' }] })
    const [item] = parseAIFeedback(text, ANSWERS, [OPEN])
    expect(item.key_concept).toBe('Closures')
    expect(item.explanation).toBe(OPEN.explanation)
    expect(item.key_points).toEqual(OPEN.key_points)
    expect(item.resources).toEqual(OPEN.resources)
  })

  it('toStringList drops empty and non-text entries', () => {
    expect(toStringList([' a ', '', null, 3, {}])).toEqual(['a', '3'])
    expect(toStringList(undefined)).toEqual([])
  })
})

describe('local MCQ feedback teaches', () => {
  it('explains why the picked option is wrong and why the correct one is right', () => {
    const { localFeedback } = evaluateQuizAnswers([MCQ], ANSWERS)
    const [item] = localFeedback
    expect(item.evaluation).toContain('Your answer (A) is incorrect')
    expect(item.evaluation).toContain('Why A is wrong: Apples are usually red or green')
    expect(item.evaluation).toContain('Why B is right: Bananas are yellow when ripe')
    expect(item.key_concept).toBe('Fruit colours')
    expect(item.explanation).toBe('Colour comes from pigments.')
    expect(item.resources).toEqual(MCQ.resources)
  })

  it('optionLetter reads a prefix or matches the full option text', () => {
    expect(optionLetter('C) cherry', MCQ.options)).toBe('C')
    expect(optionLetter('b', MCQ.options)).toBe('B')
    expect(optionLetter('banana', ['apple', 'banana'])).toBe('B')
    expect(optionLetter('kiwi', MCQ.options)).toBeNull()
  })
})

describe('study prompt', () => {
  const feedback: ParsedFeedback[] = [
    { number: 1, question: 'Q1', provided_answer: 'x', evaluation: '', grade: '', score: 40, key_concept: 'Closures', missing_points: ['Lexical scope'] },
    { number: 2, question: 'Q2', provided_answer: 'y', evaluation: '', grade: '', score: 100 }
  ]

  it('selects only items below mastery', () => {
    expect(selectWeakItems(feedback).map(i => i.number)).toEqual([1])
  })

  it('includes the learner gaps and asks for references and practice', () => {
    const prompt = buildStudyPrompt(selectWeakItems(feedback))
    expect(prompt).toContain('"concept": "Closures"')
    expect(prompt).toContain('Lexical scope')
    expect(prompt).not.toContain('"question": "Q2"')
    expect(prompt).toContain('References')
    expect(prompt).toContain('Check yourself')
  })
})
