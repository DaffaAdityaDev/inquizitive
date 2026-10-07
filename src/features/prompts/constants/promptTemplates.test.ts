import { describe, expect, it } from 'vitest'
import { buildQuizPrompt, DEFAULT_PROMPT_OPTIONS } from './promptTemplates'
import { parseQuestions } from '../../quiz/utils/parseQuestions'
import { QuestionType } from '../../../shared/types'

const base = { ...DEFAULT_PROMPT_OPTIONS, topic: 'React hooks' }

describe('buildQuizPrompt', () => {
  it('includes topic, count, difficulty and the <output> contract', () => {
    const prompt = buildQuizPrompt({ ...base, count: 15, difficulty: 'advanced' })
    expect(prompt).toContain('React hooks')
    expect(prompt).toContain('exactly 15 open-ended questions')
    expect(prompt).toContain('Advanced:')
    expect(prompt).toMatch(/<output>[\s\S]*"questions"[\s\S]*<\/output>/)
  })

  it('example JSON in every template parses with the quiz parser', () => {
    const cases = [
      ['OPEN_ENDED', [QuestionType.OPEN_ENDED]],
      ['MULTIPLE_CHOICE', [QuestionType.MULTIPLE_CHOICE]],
      ['MIXED', [QuestionType.MULTIPLE_CHOICE, QuestionType.OPEN_ENDED]]
    ] as const
    for (const [questionType, expected] of cases) {
      const prompt = buildQuizPrompt({ ...base, questionType })
      const output = prompt.slice(prompt.lastIndexOf('<output>'))
      const result = parseQuestions(output)
      expect('data' in result, questionType).toBe(true)
      if ('data' in result) expect(result.data.questions.map(q => q.type)).toEqual(expected)
    }
  })

  it('mixed splits the count between both types', () => {
    expect(buildQuizPrompt({ ...base, questionType: 'MIXED', count: 5 })).toContain('3 multiple choice and 2 open-ended')
  })

  it('asks for Bahasa Indonesia while keeping JSON keys in English', () => {
    const prompt = buildQuizPrompt({ ...base, language: 'id' })
    expect(prompt).toContain('Bahasa Indonesia')
    expect(prompt).toContain('"type" values exactly in English')
  })

  it('appends source material only when provided', () => {
    expect(buildQuizPrompt({ ...base, sourceMaterial: '   ' })).not.toContain('<source>')
    const prompt = buildQuizPrompt({ ...base, sourceMaterial: 'The useEffect hook runs after render.' })
    expect(prompt).toContain('ONLY on the material')
    expect(prompt).toContain('<source>\nThe useEffect hook runs after render.\n</source>')
  })
})
