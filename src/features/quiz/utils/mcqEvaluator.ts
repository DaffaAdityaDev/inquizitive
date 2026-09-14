import { 
  Question, 
  QuestionType, 
  MultipleChoiceQuestion, 
  UserAnswer, 
  ParsedFeedback, 
  QuestionMastery 
} from '../../../shared/types'

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
  const providedPrefixMatch = cleanProvided.match(/^([A-Z0-9])[\s.)\-]/i)
  if (providedPrefixMatch && providedPrefixMatch[1].toUpperCase() === cleanCorrect.toUpperCase()) {
    return true
  }

  // 3. If correctOption itself has a prefix (e.g. "A)"), extract it
  const correctPrefixMatch = cleanCorrect.match(/^([A-Z0-9])[\s.)\-]/i)
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
      const optPrefix = optTrim.match(/^([A-Z0-9])[\s.)\-]/i)
      return optPrefix && optPrefix[1].toUpperCase() === normalizedCorrectLetter
    })

    if (matchedOption && matchedOption.trim().toLowerCase() === cleanProvided.toLowerCase()) {
      return true
    }
  }

  return false
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

      const score = isCorrect ? 100 : 0
      const existing = existingMasteryMap[question.number]
      const bestScore = Math.max(score, existing?.bestScore ?? 0)
      const attempts = (existing?.attempts ?? 0) + 1

      masteryMapUpdates[question.number] = {
        questionNumber: question.number,
        bestScore,
        attempts,
        isMastered: bestScore >= 85
      }

      // Resolve full expected answer text
      let resolvedExpected = mcq.correct_option
      if (mcq.options && mcq.options.length > 0) {
        const matchingOpt = mcq.options.find(opt => {
          const optTrim = opt.trim()
          const optPrefix = optTrim.match(/^([A-Z0-9])[\s.)\-]/i)
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
        evaluation: isCorrect 
          ? "Your answer is correct! Excellent work."
          : `Your answer is incorrect. The correct option is ${mcq.correct_option}.`,
        grade: isCorrect ? "Grade 100/100 🟢" : "Grade 0/100 🔴",
        explanations: mcq.explanations || {},
        resources: (mcq as unknown as { resources?: string[] }).resources || []
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
