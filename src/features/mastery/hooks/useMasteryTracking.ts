import { useState } from 'react'
import { Question, QuestionMastery, ParsedFeedback, MASTERY_THRESHOLD } from '../../../shared/types'
import { parseGradeToScore } from '../utils/gradeParser'

/**
 * Manages the on-demand mastery loop: stateless, no DB, no localStorage.
 */
export function useMasteryTracking() {
  const [masteryMap, setMasteryMap] = useState<Record<number, QuestionMastery>>({})
  const [currentRound, setCurrentRound] = useState(1)
  const [isFullyMastered, setIsFullyMastered] = useState(false)

  const updateMastery = (
    feedback: ParsedFeedback[],
    allQuestions: Question[]
  ): { failedQuestions: Question[] } => {
    const newMap: Record<number, QuestionMastery> = { ...masteryMap }

    for (const item of feedback) {
      const score = parseGradeToScore(item.grade)
      const existing = masteryMap[item.number]
      const bestScore = Math.max(score, existing?.bestScore ?? 0)

      newMap[item.number] = {
        questionNumber: item.number,
        bestScore,
        attempts: (existing?.attempts ?? 0) + 1,
        isMastered: bestScore >= MASTERY_THRESHOLD,
      }
    }

    const failedQuestions = allQuestions.filter(q => !newMap[q.number]?.isMastered)
    const mastered = allQuestions.length > 0 && failedQuestions.length === 0

    setMasteryMap(newMap)
    if (!mastered) {
        setCurrentRound(prev => prev + 1)
    }
    setIsFullyMastered(mastered)

    return { failedQuestions }
  }

  const masteredCount = Object.values(masteryMap).filter(m => m.isMastered).length

  const resetMastery = () => {
    setMasteryMap({})
    setCurrentRound(1)
    setIsFullyMastered(false)
  }

  return {
    masteryMap,
    currentRound,
    masteredCount,
    isFullyMastered,
    updateMastery,
    resetMastery,
  }
}
