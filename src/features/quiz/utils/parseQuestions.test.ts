import { describe, it, expect } from 'vitest'
import { parseQuestions, repairJson, validateQuestion, ParseQuestionsResult } from './parseQuestions'
import { MultipleChoiceQuestion, Question, QuestionType } from '../../../shared/types'

function questionsOf(result: ParseQuestionsResult): Question[] {
  if (!('data' in result)) throw new Error(`expected data, got error: ${result.error.message}`)
  return result.data.questions
}

function errorOf(result: ParseQuestionsResult) {
  if (!('error' in result)) throw new Error('expected an error')
  return result.error
}

const OPEN = { number: 1, question: 'What is a closure?', expected_answer: 'A function with its scope' }
const MCQ = { number: 2, question: 'Pick A', options: ['A) yes', 'B) no'], correct_option: 'A' }
const BODY = JSON.stringify({ questions: [OPEN, MCQ] })

describe('parseQuestions: extraction', () => {
  it('extracts questions from <output> tags and renumbers them', () => {
    const input = `Some preamble
<output>
{"questions": [
  {"type": "open_ended", "number": 7, "question": "Q1?", "expected_answer": "A1"},
  {"number": 7, "question": "Q2?", "options": ["A) x", "B) y"], "correct_option": "A"}
]}
</output>`
    const questions = questionsOf(parseQuestions(input))
    expect(questions.map(q => q.number)).toEqual([1, 2])
    expect(questions[0].type).toBe(QuestionType.OPEN_ENDED)
    expect(questions[1].type).toBe(QuestionType.MULTIPLE_CHOICE)
  })

  it('extracts from <json> tags', () => {
    expect(questionsOf(parseQuestions(`<json>${BODY}</json>`))).toHaveLength(2)
  })

  it('extracts from a ```json code block surrounded by prose', () => {
    const input = `Sure! Here are your questions:\n\n\`\`\`json\n${BODY}\n\`\`\`\n\nGood luck!`
    expect(questionsOf(parseQuestions(input))).toHaveLength(2)
  })

  it('extracts raw JSON with prose before and after', () => {
    const input = `Here you go:\n${BODY}\nLet me know if you need more.`
    const questions = questionsOf(parseQuestions(input))
    expect(questions.map(q => q.question)).toEqual(['What is a closure?', 'Pick A'])
  })

  it('handles raw JSON pasted alone', () => {
    expect(questionsOf(parseQuestions(BODY))).toHaveLength(2)
  })

  it('strips control characters but keeps newlines in strings', () => {
    const input = '{"questions": [{"number": 1, "question": "Line\\nbreak\u0007"}]}'
    expect(questionsOf(parseQuestions(input))[0].question).toBe('Line\nbreak')
  })

  it('extracts JSON from <output> tags that also contain prose', () => {
    expect(questionsOf(parseQuestions(`<output>Here are your questions:\n${BODY}</output>`))).toHaveLength(2)
  })

  it('extracts a ```json fence nested in <output> tags', () => {
    expect(questionsOf(parseQuestions(`<output>\n\`\`\`json\n${BODY}\n\`\`\`\n</output>`))).toHaveLength(2)
  })

  it('reports when no JSON is found', () => {
    expect(parseQuestions('hello world')).toEqual({
      error: { message: 'No valid JSON structure found', type: 'format' }
    })
  })

  it('reports no JSON for an object without "questions"', () => {
    expect(errorOf(parseQuestions('{"items": []}')).type).toBe('format')
  })
})

describe('parseQuestions: repairs', () => {
  it('tolerates trailing commas and smart quotes', () => {
    const input = '{“questions”: [{“number”: 1, “question”: “What is it?”,},],}'
    expect(questionsOf(parseQuestions(input))[0].question).toBe('What is it?')
  })

  it('tolerates trailing commas inside a code block', () => {
    const input = '```json\n{"questions": [\n  {"number": 1, "question": "Q?",},\n],\n}\n```'
    expect(questionsOf(parseQuestions(input))).toHaveLength(1)
  })

  it('keeps smart quotes inside otherwise valid JSON strings', () => {
    const questions = questionsOf(parseQuestions('{"questions": [{"number": 1, "question": "Explain “closures”"}]}'))
    expect(questions[0].question).toBe('Explain “closures”')
  })

  it('reports the JSON.parse error with a location', () => {
    const error = errorOf(parseQuestions('{"questions": [\n  {"number": 1 "question": "Q?"}\n]}'))
    expect(error.type).toBe('parse')
    expect(error.message).toMatch(/^Failed to parse JSON content: /)
    expect(error.message).toMatch(/line \d+/)
  })
})

describe('parseQuestions: validation', () => {
  it('rejects a non-array questions field', () => {
    expect(parseQuestions('<json>{"questions": "nope"}</json>')).toEqual({
      error: { message: "Invalid JSON structure. Must contain a 'questions' array", type: 'structure' }
    })
  })

  it('rejects a missing questions array inside tags', () => {
    expect(errorOf(parseQuestions('<output>{"quiz": []}</output>')).type).toBe('structure')
  })

  it('rejects an MCQ with empty options', () => {
    const result = parseQuestions('{"questions": [{"number": 1, "question": "Q?", "type": "MULTIPLE_CHOICE", "options": []}]}')
    expect(errorOf(result).type).toBe('structure')
  })

  it('rejects an MCQ typed question without options', () => {
    const result = parseQuestions('{"questions": [{"number": 1, "question": "Q?", "type": "multiple_choice"}]}')
    expect(errorOf(result).type).toBe('structure')
  })

  it('rejects a question with blank text', () => {
    expect(errorOf(parseQuestions('{"questions": [{"number": 1, "question": "   "}]}')).type).toBe('structure')
  })

  it('rejects a question without a number', () => {
    expect(errorOf(parseQuestions('{"questions": [{"question": "Q?"}]}')).type).toBe('structure')
  })

  it('accepts string numbers and renumbers them', () => {
    const questions = questionsOf(parseQuestions('{"questions": [{"number": "a", "question": "Q?"}, {"number": "a", "question": "R?"}]}'))
    expect(questions.map(q => q.number)).toEqual([1, 2])
  })
})

describe('parseQuestions: normalisation', () => {
  it('renumbers duplicate and out-of-order numbers sequentially', () => {
    const input = JSON.stringify({
      questions: [
        { number: 5, question: 'A?' },
        { number: 5, question: 'B?' },
        { number: 1, question: 'C?' }
      ]
    })
    expect(questionsOf(parseQuestions(input)).map(q => q.number)).toEqual([1, 2, 3])
  })

  it('infers MULTIPLE_CHOICE from an options array when type is missing', () => {
    const [, mcq] = questionsOf(parseQuestions(BODY))
    expect(mcq.type).toBe(QuestionType.MULTIPLE_CHOICE)
  })

  it('normalises a lower-case MCQ type', () => {
    const input = '{"questions": [{"number": 1, "type": "multiple_choice", "question": "Q?", "options": ["A) x"], "correct_option": "A"}]}'
    expect(questionsOf(parseQuestions(input))[0].type).toBe(QuestionType.MULTIPLE_CHOICE)
  })

  it('defaults to OPEN_ENDED for unknown or missing types', () => {
    const input = '{"questions": [{"number": 1, "type": "essay", "question": "Q?"}, {"number": 2, "question": "R?"}]}'
    expect(questionsOf(parseQuestions(input)).map(q => q.type)).toEqual([QuestionType.OPEN_ENDED, QuestionType.OPEN_ENDED])
  })

  it('defaults explanations to an empty object and keeps provided ones', () => {
    const input = JSON.stringify({
      questions: [
        { number: 1, question: 'Q?', options: ['A) x'], correct_option: 'A' },
        { number: 2, question: 'R?', options: ['A) x'], correct_option: 'A', explanations: { A: 'because' } }
      ]
    })
    const [first, second] = questionsOf(parseQuestions(input)) as MultipleChoiceQuestion[]
    expect(first.explanations).toEqual({})
    expect(second.explanations).toEqual({ A: 'because' })
  })

  it('preserves extra fields such as correct_option and expected_answer', () => {
    const [open, mcq] = questionsOf(parseQuestions(BODY))
    expect(open).toMatchObject({ expected_answer: 'A function with its scope' })
    expect(mcq).toMatchObject({ correct_option: 'A', options: ['A) yes', 'B) no'] })
  })
})

describe('validateQuestion', () => {
  it('rejects non-objects', () => {
    expect(validateQuestion(null as unknown as Question)).toBe(false)
    expect(validateQuestion('q' as unknown as Question)).toBe(false)
  })

  it('accepts a minimal open-ended question', () => {
    expect(validateQuestion({ number: 1, question: 'Q?' } as Question)).toBe(true)
  })
})

describe('repairJson', () => {
  it('removes trailing commas before closing brackets', () => {
    expect(repairJson('[1, 2, ]')).toBe('[1, 2 ]')
    expect(repairJson('{"a": 1,\n}')).toBe('{"a": 1\n}')
  })

  it('straightens double and single smart quotes', () => {
    expect(repairJson('{“a”: „b‟}')).toBe('{"a": "b"}')
    expect(repairJson('‘x’')).toBe("'x'")
  })
})
