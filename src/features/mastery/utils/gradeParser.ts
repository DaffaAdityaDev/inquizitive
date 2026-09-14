/**
 * Parses a grade string returned by the AI (e.g. "Grade 75/100 🟡", "Grade 1/1 🟢", "Correct", "Salah")
 * and normalizes it to a 0–100 integer.
 *
 * Why normalize? The mastery algorithm needs a single numeric scale to compare scores.
 * Multiple Choice grades can be 0/1 or qualitative, Open Ended are 0/100 — we need one common scale.
 */
export function parseGradeToScore(grade: string): number {
  if (!grade || typeof grade !== 'string') return 0

  const trimmed = grade.trim()

  // 1. Match format "Grade X/Y" or "X / Y" or "X/Y"
  const fractionMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/)
  if (fractionMatch) {
    const numerator = parseFloat(fractionMatch[1])
    const denominator = parseFloat(fractionMatch[2])
    if (denominator > 0) {
      return Math.min(100, Math.max(0, Math.round((numerator / denominator) * 100)))
    }
  }

  // 2. Match format "XX%"
  const percentMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*%/)
  if (percentMatch) {
    return Math.min(100, Math.max(0, Math.round(parseFloat(percentMatch[1]))))
  }

  // 3. Match explicit affirmative/negative keywords
  if (/\b(incorrect|wrong|fail|failed|salah|false)\b/i.test(trimmed)) {
    return 0
  }
  if (/\b(correct|pass|passed|benar|tepat|true)\b/i.test(trimmed)) {
    return 100
  }

  // 4. Match format "Grade: XX" or "Score XX" or isolated numbers <= 100
  const numMatch = trimmed.match(/(?:grade|score)?\s*[:#-]?\s*(\d{1,3})\b/i)
  if (numMatch) {
    const val = parseInt(numMatch[1], 10)
    if (val <= 100) return val
  }

  // 5. Fallback for standalone emoji indicators
  if (trimmed.includes('🟢')) return 100
  if (trimmed.includes('🔴')) return 0
  if (trimmed.includes('🟡')) return 70

  return 0
}
