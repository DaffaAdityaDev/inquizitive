/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserAnswer, ParsedFeedback, Question } from '../../../shared/types'
import { repairJson } from '../../quiz/utils/parseQuestions'

/** Cuts the outermost JSON value out of surrounding prose; a bare array starts with '[' before any '{'. */
function sliceJson(text: string): string | null {
  const firstBrace = text.indexOf('{')
  const firstBracket = text.indexOf('[')
  const isArray = firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)
  const start = isArray ? firstBracket : firstBrace
  const end = text.lastIndexOf(isArray ? ']' : '}')
  return start !== -1 && end > start ? text.slice(start, end + 1) : null
}

function parseFeedbackJson(text: string): unknown {
  const sources: string[] = []
  const outputMatch = text.match(/<output>([\s\S]*?)<\/output>/)
  if (outputMatch) sources.push(outputMatch[1].trim())
  const codeBlockMatch = text.match(/```(?:json)?([\s\S]*?)```/)
  if (codeBlockMatch) sources.push(codeBlockMatch[1].trim())
  sources.push(text.trim())

  let firstError: unknown
  for (const source of sources) {
    const sliced = sliceJson(source)
    const variants = sliced && sliced !== source ? [source, sliced] : [source]
    for (const variant of variants) {
      for (const candidate of [variant, repairJson(variant)]) {
        try {
          return JSON.parse(candidate)
        } catch (err) {
          firstError ??= err
        }
      }
    }
  }
  throw firstError
}

/** AI chats sometimes send "number": "2"; numbers must match the questions exactly. */
function toQuestionNumber(value: unknown): unknown {
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value)
  }
  return value
}

/**
 * Parses the evaluation JSON pasted back from the web AI and enriches each item
 * with the user's answer and data from the original question. Returns [] when unparseable.
 */
export function parseAIFeedback(
  text: string,
  userAnswers: UserAnswer[],
  originalQuestions: Question[] = []
): ParsedFeedback[] {
  if (!text || typeof text !== 'string') return []

  try {
    const data = parseFeedbackJson(text) as any
    const feedbackItems = Array.isArray(data)
      ? data
      : data?.verification || data?.questions || data?.feedback || data?.answers || []
    if (!Array.isArray(feedbackItems)) return []

    return feedbackItems.filter((raw: any) => raw && typeof raw === 'object').map((raw: any) => {
      const item = { ...raw, number: toQuestionNumber(raw.number) }
      const matchingAnswer = userAnswers.find(a => a.number === item.number) ||
                            userAnswers.find(a => a.question === item.question)
      const orig = originalQuestions.find(q => q.number === item.number) ||
                   originalQuestions.find(q => q.question === item.question)

      let resolvedExpectedAnswer = item.expected_answer || item.correct_answer || ''
      let resolvedExplanations = item.explanations || {}
      let resolvedResources = item.resources || []

      if (orig) {
        if (orig.type === 'MULTIPLE_CHOICE' || ('options' in orig && Array.isArray((orig as any).options))) {
          const mcq = orig as any
          if (!resolvedExpectedAnswer && mcq.correct_option) {
            const matchedOption = mcq.options?.find((opt: string) =>
              opt.trim().startsWith(mcq.correct_option) ||
              opt.trim().startsWith(`${mcq.correct_option})`) ||
              opt.trim().startsWith(`${mcq.correct_option}.`)
            )
            resolvedExpectedAnswer = matchedOption || mcq.correct_option
          }
          if (!resolvedExplanations || Object.keys(resolvedExplanations).length === 0) {
            resolvedExplanations = mcq.explanations || {}
          }
        } else if (orig.type === 'OPEN_ENDED' && !resolvedExpectedAnswer) {
          resolvedExpectedAnswer = (orig as any).expected_answer || ''
        }

        if (Array.isArray((orig as any).resources) && resolvedResources.length === 0) {
          resolvedResources = (orig as any).resources
        }
      }

      // Regex fallback: check if evaluation explicitly states "The correct answer is X"
      if (!resolvedExpectedAnswer && typeof item.evaluation === 'string') {
        const evalMatch = item.evaluation.match(/The correct answer is\s+([^.]+)/i)
        if (evalMatch) {
          resolvedExpectedAnswer = evalMatch[1].trim()
        }
      }

      return {
        ...item,
        number: item.number || matchingAnswer?.number || 0,
        // The user's own answer is the source of truth; AI chats often paraphrase it
        provided_answer: matchingAnswer?.provided_answer || item.provided_answer || '',
        expected_answer: resolvedExpectedAnswer,
        explanations: resolvedExplanations,
        resources: resolvedResources
      }
    })
  } catch (e) {
    console.error('Failed to parse AI feedback JSON:', e)
    return []
  }
}
