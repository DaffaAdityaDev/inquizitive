import { 
  Question, 
  QuestionType, 
  MultipleChoiceQuestion, 
  UserAnswer, 
  ParsedFeedback, 
  QuestionMastery,
  MASTERY_THRESHOLD
} from '../../../shared/types'
import { toStringList } from '../../feedback/utils/parseFeedback'

/**
 * Checks whether a provided answer matches the correct MCQ option.
 * Handles single letters ('A'), prefixed options ('A) Option Text', 'A. Option Text'),
 * and full option text matches.
 */
export function isMCQAnswerCorrect(
  providedAnswer: string,
  correctOption: string,
  options?: string[]
): boolean {
  if (!providedAnswer || !correctOption) return false

  const cleanProvided = providedAnswer.trim()
  const cleanCorrect = correctOption.trim()

  // 1. Direct case-insensitive match
  if (cleanProvided.toLowerCase() === cleanCorrect.toLowerCase()) {
    return true
  }

  // 2. Extract leading letter/number from provided answer (e.g. "A) ...", "A. ...", "A - ...", "A ")
  const providedPrefixMatch = cleanProvided.match(/^([A-Z0-9])[\s.)-]/i)
  if (providedPrefixMatch && providedPrefixMatch[1].toUpperCase() === cleanCorrect.toUpperCase()) {
    return true
  }

  // 3. If correctOption itself has a prefix (e.g. "A)"), extract it
  const correctPrefixMatch = cleanCorrect.match(/^([A-Z0-9])[\s.)-]/i)
  const normalizedCorrectLetter = (correctPrefixMatch ? correctPrefixMatch[1] : cleanCorrect).toUpperCase()
  if (providedPrefixMatch && providedPrefixMatch[1].toUpperCase() === normalizedCorrectLetter) {
    return true
  }

  // 4. Match against the full options array if available
  if (options && options.length > 0) {
    // Find the option string that corresponds to correctOption
    const matchedOption = options.find(opt => {
      const optTrim = opt.trim()
      if (optTrim.toLowerCase() === cleanCorrect.toLowerCase()) return true
      const optPrefix = optTrim.match(/^([A-Z0-9])[\s.)-]/i)
      return optPrefix && optPrefix[1].toUpperCase() === normalizedCorrectLetter
    })

    if (matchedOption && matchedOption.trim().toLowerCase() === cleanProvided.toLowerCase()) {
      return true
    }
  }

  return false
}

/** The letter of the option the user picked ("B" for "B) ..."), or null if it can't be told. */
export function optionLetter(providedAnswer: string, options: string[] = []): string | null {
  const clean = providedAnswer.trim()
  const prefix = clean.match(/^([A-Z])(?:[\s.)-]|$)/i)
  if (prefix) return prefix[1].toUpperCase()
  const index = options.findIndex(opt => opt.trim().toLowerCase() === clean.toLowerCase())
  return index !== -1 ? String.fromCharCode(65 + index) : null
}

function explanationFor(explanations: Record<string, string> | undefined, letter: string | null): string | null {
  if (!letter || !explanations) return null
  const key = Object.keys(explanations).find(k => k.trim().toUpperCase().replace(/[^A-Z]/g, '') === letter)
  const text = key ? String(explanations[key] || '').trim() : ''
  return text || null
}

/** A correct guess scores below mastery, so the question comes back until it's actually known. */
export const GUESSED_CORRECT_SCORE = 60

function mcqEvaluation(mcq: MultipleChoiceQuestion, providedAnswer: string, isCorrect: boolean, guessed: boolean): string {
  const correctLetter = mcq.correct_option.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || mcq.correct_option
  const chosenLetter = optionLetter(providedAnswer, mcq.options)
  if (isCorrect) {
    const why = explanationFor(mcq.explanations, correctLetter)
    if (guessed) {
      const note = 'Correct, but you marked it as a guess, so it will come back until you know it.'
      return why ? `${note}\n\nWhy ${correctLetter} is right: ${why}` : note
    }
    return why ? `Correct. ${why}` : 'Your answer is correct! Excellent work.'
  }
  const parts = [`Your answer${chosenLetter ? ` (${chosenLetter})` : ''} is incorrect. The correct option is ${correctLetter}.`]
  const whyWrong = explanationFor(mcq.explanations, chosenLetter)
  if (whyWrong) parts.push(`Why ${chosenLetter} is wrong: ${whyWrong}`)
  const whyRight = explanationFor(mcq.explanations, correctLetter)
  if (whyRight) parts.push(`Why ${correctLetter} is right: ${whyRight}`)
  return parts.join('\n\n')
}

export interface EvaluationResult {
  masteryMapUpdates: Record<number, QuestionMastery>
  localFeedback: ParsedFeedback[]
  hasEvaluatedItems: boolean
  totalMCQCount: number
  correctMCQCount: number
}

/**
 * Evaluates quiz answers locally for supported question types (e.g. Multiple Choice).
 * Generates mastery updates and ready-to-display feedback items.
 */
export function evaluateQuizAnswers(
  questions: Question[],
  answers: UserAnswer[],
  existingMasteryMap: Record<number, QuestionMastery> = {}
): EvaluationResult {
  const masteryMapUpdates: Record<number, QuestionMastery> = {}
  const localFeedback: ParsedFeedback[] = []
  let totalMCQCount = 0
  let correctMCQCount = 0

  for (const question of questions) {
    if (question.type === QuestionType.MULTIPLE_CHOICE || ('options' in question && Array.isArray((question as unknown as MultipleChoiceQuestion).options))) {
      totalMCQCount++
      const mcq = question as unknown as MultipleChoiceQuestion
      const userAnswer = answers.find(a => a.number === question.number) ||
                          answers.find(a => a.question === question.question)

      if (!userAnswer) {
        // If question wasn't answered in this round, preserve existing mastery if available
        if (existingMasteryMap[question.number]) {
          masteryMapUpdates[question.number] = existingMasteryMap[question.number]
          if (existingMasteryMap[question.number].isMastered) {
            correctMCQCount++
          }
        }
        continue
      }

      const providedAnswer = userAnswer.provided_answer || ''
      const isCorrect = isMCQAnswerCorrect(providedAnswer, mcq.correct_option, mcq.options)

      if (isCorrect) {
        correctMCQCount++
      }

      const guessed = isCorrect && userAnswer.confidence === 'guess'
      const score = isCorrect ? (guessed ? GUESSED_CORRECT_SCORE : 100) : 0
      const existing = existingMasteryMap[question.number]
      const bestScore = Math.max(score, existing?.bestScore ?? 0)
      const attempts = (existing?.attempts ?? 0) + 1

      masteryMapUpdates[question.number] = {
        questionNumber: question.number,
        bestScore,
        attempts,
        isMastered: bestScore >= MASTERY_THRESHOLD
      }

      // Resolve full expected answer text
      let resolvedExpected = mcq.correct_option
      if (mcq.options && mcq.options.length > 0) {
        const matchingOpt = mcq.options.find(opt => {
          const optTrim = opt.trim()
          const optPrefix = optTrim.match(/^([A-Z0-9])[\s.)-]/i)
          return (
            optTrim.toLowerCase() === mcq.correct_option.trim().toLowerCase() ||
            (optPrefix && optPrefix[1].toUpperCase() === mcq.correct_option.trim().toUpperCase())
          )
        })
        if (matchingOpt) {
          resolvedExpected = matchingOpt
        }
      }

      localFeedback.push({
        number: question.number,
        question: question.question,
        provided_answer: providedAnswer,
        type: QuestionType.MULTIPLE_CHOICE,
        expected_answer: resolvedExpected,
        correct_option: mcq.correct_option,
        options: mcq.options,
        evaluation: mcqEvaluation(mcq, providedAnswer, isCorrect, guessed),
        grade: guessed ? `Grade ${GUESSED_CORRECT_SCORE}/100 🟡` : isCorrect ? "Grade 100/100 🟢" : "Grade 0/100 🔴",
        score,
        explanations: mcq.explanations || {},
        resources: toStringList(mcq.resources),
        key_concept: mcq.key_concept,
        explanation: mcq.explanation
      })
    }
  }

  return {
    masteryMapUpdates,
    localFeedback,
    hasEvaluatedItems: totalMCQCount > 0,
    totalMCQCount,
    correctMCQCount
  }
}
