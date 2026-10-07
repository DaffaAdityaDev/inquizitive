import { ErrorType, MultipleChoiceQuestion, Question, QuestionData, QuestionType } from '../../../shared/types'

export type ParseQuestionsResult = { data: QuestionData } | { error: ErrorType }

const JSON_PATTERNS = [
  /<json>([\s\S]*?)<\/json>/,
  /<output>[\s\S]*?{[\s\S]*?}[\s\S]*?<\/output>/,
  /```json\s*([\s\S]*?)```/,
  /{[\s\S]*["“”]questions["“”][\s\S]*}/
]

function isMultipleChoice(q: Question): boolean {
  const rawType = q.type ? String(q.type).toUpperCase() : ''
  return rawType === QuestionType.MULTIPLE_CHOICE ||
    ('options' in q && Array.isArray((q as MultipleChoiceQuestion).options))
}

export function validateQuestion(q: Question): boolean {
  if (!q || typeof q !== 'object') return false

  const baseValid =
    (typeof q.number === 'number' || typeof q.number === 'string') &&
    typeof q.question === 'string' &&
    q.question.trim().length > 0

  if (isMultipleChoice(q)) {
    return baseValid &&
      Array.isArray((q as MultipleChoiceQuestion).options) &&
      (q as MultipleChoiceQuestion).options.length > 0
  }

  return baseValid
}

/** Fixes the most common ways web AI chats mangle JSON: smart quotes and trailing commas. */
export function repairJson(json: string): string {
  return json
    .replace(/[“”„‟″]/g, '"')
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/,(\s*[}\]])/g, '$1')
}

function describeJsonError(err: unknown, json: string): string {
  const message = err instanceof Error ? err.message : String(err)
  const positionMatch = message.match(/position (\d+)/)
  if (!positionMatch || /line \d+/i.test(message)) return message

  const position = Number(positionMatch[1])
  const before = json.slice(0, position)
  const line = before.split('\n').length
  const column = position - before.lastIndexOf('\n')
  return `${message} (line ${line}, column ${column})`
}

function parseLenientJson(json: string): { value: unknown } | { error: string } {
  try {
    return { value: JSON.parse(json) }
  } catch (originalError) {
    try {
      return { value: JSON.parse(repairJson(json)) }
    } catch {
      // Report the original error so positions match what the user pasted
      return { error: describeJsonError(originalError, json) }
    }
  }
}

function normalizeQuestions(questions: Question[]): Question[] {
  return questions.map((q, idx) => ({
    ...q,
    // Always renumber: mastery is keyed by number, so AI-generated duplicates would collide
    number: idx + 1,
    type: isMultipleChoice(q) ? QuestionType.MULTIPLE_CHOICE : QuestionType.OPEN_ENDED,
    explanations: (q as MultipleChoiceQuestion).explanations || {}
  }) as Question)
}

/**
 * Extracts and validates the questions JSON from an AI chat response
 * (wrapped in <json>/<output> tags, a ```json block, or bare).
 */
export function parseQuestions(input: string): ParseQuestionsResult {
  try {
    // Prose inside <output> breaks that match, but a later, tighter pattern may still succeed
    let firstParseError: ErrorType | null = null
    for (const pattern of JSON_PATTERNS) {
      const match = input.match(pattern)
      if (!match) continue

      const jsonString = match[0]
        .replace(/<\/?json>|<\/?output>|```json|```/g, '')
        .trim()
        // Strip unprintable control characters but preserve \t, \n, \r
        // eslint-disable-next-line no-control-regex
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')

      const result = parseLenientJson(jsonString)
      if ('error' in result) {
        firstParseError ??= {
          message: `Failed to parse JSON content: ${result.error}`,
          type: 'parse'
        }
        continue
      }

      const parsed = result.value as { questions?: unknown }
      if (!parsed || !Array.isArray(parsed.questions)) {
        return {
          error: {
            message: "Invalid JSON structure. Must contain a 'questions' array",
            type: 'structure'
          }
        }
      }

      if (!parsed.questions.every((q: Question) => validateQuestion(q))) {
        return {
          error: {
            message: 'Invalid question format. Check the structure matches the selected question type.',
            type: 'structure'
          }
        }
      }

      return { data: { questions: normalizeQuestions(parsed.questions) } }
    }

    return { error: firstParseError ?? { message: 'No valid JSON structure found', type: 'format' } }
  } catch (err) {
    console.error('Error in parseQuestions:', err)
    return { error: { message: 'Failed to process input', type: 'parse' } }
  }
}
