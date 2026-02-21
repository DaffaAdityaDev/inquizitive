/**
 * Parses a grade string returned by the AI (e.g. "Grade 75/100 🟡" or "Grade 1/1 🟢")
 * and normalizes it to a 0–100 integer.
 *
 * Why normalize? The mastery algorithm needs a single numeric scale to compare scores.
 * Multiple Choice grades are 0/1, Open Ended are 0/100 — we need one common language.
 */
export function parseGradeToScore(grade: string): number {
  const match = grade.match(/(\d+)\s*\/\s*(\d+)/)
  if (!match) return 0

  const numerator = parseInt(match[1], 10)
  const denominator = parseInt(match[2], 10)

  if (denominator === 0) return 0

  return Math.round((numerator / denominator) * 100)
}
