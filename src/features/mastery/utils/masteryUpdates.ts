import { ParsedFeedback, QuestionMastery, MASTERY_THRESHOLD } from '../../../shared/types'
import { parseGradeToScore } from './gradeParser'

export type MasteryMap = Record<number, QuestionMastery>

/** Resolves a feedback item's 0-100 score, preferring the numeric `score` over parsing `grade`. */
export function resolveFeedbackScore(item: ParsedFeedback): number {
  return typeof item.score === 'number' && Number.isFinite(item.score)
    ? Math.min(100, Math.max(0, Math.round(item.score)))
    : parseGradeToScore(item.grade)
}

/** Records one attempt per feedback item, keeping the best score seen so far. */
export function applyFeedbackToMastery(masteryMap: MasteryMap, feedback: ParsedFeedback[]): MasteryMap {
  const newMap: MasteryMap = { ...masteryMap }

  for (const item of feedback) {
    const existing = masteryMap[item.number]
    const bestScore = Math.max(resolveFeedbackScore(item), existing?.bestScore ?? 0)

    newMap[item.number] = {
      questionNumber: item.number,
      bestScore,
      attempts: (existing?.attempts ?? 0) + 1,
      isMastered: bestScore >= MASTERY_THRESHOLD,
    }
  }

  return newMap
}

export function countMastered(masteryMap: MasteryMap): number {
  return Object.values(masteryMap).filter(m => m.isMastered).length
}
