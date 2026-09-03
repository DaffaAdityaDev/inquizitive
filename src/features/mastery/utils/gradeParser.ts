/**
 * Parses a grade string returned by the AI (e.g. "Grade 75/100 🟡" or "Grade 1/1 🟢")
 * and normalizes it to a 0–100 integer.
 *
 * Why normalize? The mastery algorithm needs a single numeric scale to compare scores.
 * Multiple Choice grades are 0/1, Open Ended are 0/100 — we need one common language.
 */
export function parseGradeToScore(grade: string): number {
  if (!grade) return 0

  // 1. Match format "Grade X/Y" or "X / Y"
  const fractionMatch = grade.match(/(\d+)\s*\/\s*(\d+)/)
  if (fractionMatch) {
    const numerator = parseInt(fractionMatch[1], 10)
    const denominator = parseInt(fractionMatch[2], 10)
    if (denominator > 0) {
      return Math.min(100, Math.round((numerator / denominator) * 100))
    }
  }

  // 2. Match format "XX%"
  const percentMatch = grade.match(/(\d+)\s*%/)
  if (percentMatch) {
    return Math.min(100, Math.max(0, parseInt(percentMatch[1], 10)))
  }

  // 3. Match format "Grade: XX" or "Score XX"
  const numMatch = grade.match(/(?:grade|score)?\s*[:#-]?\s*(\d{1,3})\b/i)
  if (numMatch) {
    const val = parseInt(numMatch[1], 10)
    if (val <= 100) return val
  }

  return 0
}
