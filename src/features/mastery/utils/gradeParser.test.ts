import { describe, it, expect } from 'vitest'
import { parseGradeToScore } from './gradeParser'

describe('gradeParser - parseGradeToScore', () => {
  it('parses standard fractions', () => {
    expect(parseGradeToScore('Grade 100/100 🟢')).toBe(100)
    expect(parseGradeToScore('Grade 85/100 🟡')).toBe(85)
    expect(parseGradeToScore('Grade 1/1 🟢')).toBe(100)
    expect(parseGradeToScore('Grade 0/1 🔴')).toBe(0)
    expect(parseGradeToScore('3 / 4')).toBe(75)
  })

  it('parses percentages', () => {
    expect(parseGradeToScore('90%')).toBe(90)
    expect(parseGradeToScore('Score: 100%')).toBe(100)
    expect(parseGradeToScore('45%')).toBe(45)
  })

  it('parses textual feedback', () => {
    expect(parseGradeToScore('Correct')).toBe(100)
    expect(parseGradeToScore('Benar')).toBe(100)
    expect(parseGradeToScore('Pass')).toBe(100)
    expect(parseGradeToScore('Incorrect')).toBe(0)
    expect(parseGradeToScore('Salah')).toBe(0)
    expect(parseGradeToScore('Failed')).toBe(0)
  })

  it('handles empty or malformed strings gracefully', () => {
    expect(parseGradeToScore('')).toBe(0)
    expect(parseGradeToScore('Unknown content')).toBe(0)
  })
})
