import { useSyncExternalStore } from 'react'
import { Confidence, MASTERY_THRESHOLD } from '../../shared/types'

/**
 * The learner profile is the system's memory of the learner across quizzes:
 * per-concept attempts, scores, confidence and the gaps the AI found. It is
 * summarised into every prompt so the AI can adapt what it generates next.
 */

export const LEARNER_STORAGE_KEY = 'inquizitive_learner_v1'

const DAY = 24 * 60 * 60 * 1000
/** Days until the next review after 1, 2, 3... successful attempts in a row. */
export const REVIEW_INTERVALS = [1, 3, 7, 16, 35]
const MAX_ATTEMPTS = 20
const MAX_NOTES = 5
const MAX_CONCEPTS = 300

export interface ConceptAttempt {
  /** sessionId:round:questionNumber, so re-recording the same answer replaces it. */
  id: string
  at: number
  score: number
  confidence?: Confidence
}

export interface ConceptRecord {
  key: string
  concept: string
  topic?: string
  /** Oldest first, capped at MAX_ATTEMPTS. */
  attempts: ConceptAttempt[]
  misconceptions: string[]
  missingPoints: string[]
}

export interface LearnerProfile {
  version: 1
  concepts: Record<string, ConceptRecord>
}

export interface AttemptInput {
  id: string
  concept: string
  topic?: string
  score: number
  confidence?: Confidence
  misconceptions?: string[]
  missingPoints?: string[]
}

export type ConceptStatus = 'weak' | 'learning' | 'strong'

export interface ConceptSummary {
  record: ConceptRecord
  lastScore: number
  /** Successful attempts in a row at the end of the history. */
  streak: number
  nextReviewAt: number
  isDue: boolean
  status: ConceptStatus
  /** Attempts answered "sure" that scored below 50. */
  overconfidentCount: number
}

export function emptyProfile(): LearnerProfile {
  return { version: 1, concepts: {} }
}

export function conceptKey(concept: string): string {
  return concept.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** A correct guess is luck, not knowledge, so it doesn't count towards the review streak. */
export function isSuccessfulAttempt(attempt: ConceptAttempt): boolean {
  return attempt.score >= MASTERY_THRESHOLD && attempt.confidence !== 'guess'
}

function mergeNotes(existing: string[], incoming: string[] = []): string[] {
  const merged = [...existing]
  for (const note of incoming) {
    const clean = note.trim()
    if (!clean) continue
    const idx = merged.findIndex(n => n.toLowerCase() === clean.toLowerCase())
    if (idx !== -1) merged.splice(idx, 1)
    merged.push(clean)
  }
  return merged.slice(-MAX_NOTES)
}

function sameAttempt(a: ConceptAttempt, b: AttemptInput): boolean {
  return a.score === b.score && a.confidence === b.confidence
}

/** Upserts attempts by id. Returns the same object when nothing changed, so callers can skip saving. */
export function recordAttempts(profile: LearnerProfile, inputs: AttemptInput[], now: number = Date.now()): LearnerProfile {
  let concepts = profile.concepts
  let changed = false

  for (const input of inputs) {
    if (!input.concept.trim()) continue
    const key = conceptKey(input.concept)
    const existing = concepts[key]
    const attempts = existing?.attempts ?? []
    const prevIdx = attempts.findIndex(a => a.id === input.id)
    const prev = prevIdx !== -1 ? attempts[prevIdx] : undefined

    const notesUnchanged = !!existing &&
      mergeNotes(existing.misconceptions, input.misconceptions).join('\n') === existing.misconceptions.join('\n') &&
      mergeNotes(existing.missingPoints, input.missingPoints).join('\n') === existing.missingPoints.join('\n')
    if (prev && sameAttempt(prev, input) && notesUnchanged) continue

    const attempt: ConceptAttempt = {
      id: input.id,
      // An updated grade for the same answer keeps its original time, so reviews aren't pushed back
      at: prev?.at ?? now,
      score: Math.min(100, Math.max(0, Math.round(input.score))),
      ...(input.confidence ? { confidence: input.confidence } : {})
    }
    const nextAttempts = prev
      ? attempts.map((a, i) => (i === prevIdx ? attempt : a))
      : [...attempts, attempt].slice(-MAX_ATTEMPTS)

    concepts = {
      ...concepts,
      [key]: {
        key,
        concept: input.concept.trim(),
        topic: input.topic?.trim() || existing?.topic,
        attempts: nextAttempts,
        misconceptions: mergeNotes(existing?.misconceptions ?? [], input.misconceptions),
        missingPoints: mergeNotes(existing?.missingPoints ?? [], input.missingPoints)
      }
    }
    changed = true
  }

  if (!changed) return profile
  return { version: 1, concepts: pruneConcepts(concepts) }
}

function lastAttemptAt(record: ConceptRecord): number {
  return record.attempts[record.attempts.length - 1]?.at ?? 0
}

function pruneConcepts(concepts: Record<string, ConceptRecord>): Record<string, ConceptRecord> {
  const records = Object.values(concepts)
  if (records.length <= MAX_CONCEPTS) return concepts
  const kept = records.sort((a, b) => lastAttemptAt(b) - lastAttemptAt(a)).slice(0, MAX_CONCEPTS)
  return Object.fromEntries(kept.map(r => [r.key, r]))
}

export function summarizeConcept(record: ConceptRecord, now: number = Date.now()): ConceptSummary {
  const attempts = record.attempts
  const last = attempts[attempts.length - 1]
  let streak = 0
  for (let i = attempts.length - 1; i >= 0 && isSuccessfulAttempt(attempts[i]); i--) streak++

  const interval = streak === 0 ? 0 : REVIEW_INTERVALS[Math.min(streak, REVIEW_INTERVALS.length) - 1]
  const nextReviewAt = (last?.at ?? now) + interval * DAY

  return {
    record,
    lastScore: last?.score ?? 0,
    streak,
    nextReviewAt,
    isDue: nextReviewAt <= now,
    status: streak === 0 ? 'weak' : streak >= 2 ? 'strong' : 'learning',
    overconfidentCount: attempts.filter(a => a.confidence === 'sure' && a.score < 50).length
  }
}

export function summarizeProfile(profile: LearnerProfile, now: number = Date.now()): ConceptSummary[] {
  return Object.values(profile.concepts)
    .filter(r => r.attempts.length > 0)
    .map(r => summarizeConcept(r, now))
    .sort((a, b) => lastAttemptAt(b.record) - lastAttemptAt(a.record))
}

export function selectDueConcepts(profile: LearnerProfile, now: number = Date.now()): ConceptSummary[] {
  return summarizeProfile(profile, now)
    .filter(s => s.isDue)
    .sort((a, b) => a.nextReviewAt - b.nextReviewAt)
}

// --- Persistence and a shared store (same pattern as the prompt options store) ---

function sanitizeProfile(raw: unknown): LearnerProfile {
  if (!raw || typeof raw !== 'object' || (raw as LearnerProfile).version !== 1) return emptyProfile()
  const concepts = (raw as LearnerProfile).concepts
  if (!concepts || typeof concepts !== 'object') return emptyProfile()
  const valid = Object.values(concepts).filter(
    (r): r is ConceptRecord => !!r && typeof r.key === 'string' && typeof r.concept === 'string' && Array.isArray(r.attempts)
  )
  return {
    version: 1,
    concepts: Object.fromEntries(valid.map(r => [r.key, {
      ...r,
      misconceptions: Array.isArray(r.misconceptions) ? r.misconceptions : [],
      missingPoints: Array.isArray(r.missingPoints) ? r.missingPoints : []
    }]))
  }
}

export function loadProfile(storage: Storage | undefined = globalThis.localStorage): LearnerProfile {
  try {
    const raw = storage?.getItem(LEARNER_STORAGE_KEY)
    return sanitizeProfile(raw ? JSON.parse(raw) : null)
  } catch {
    return emptyProfile()
  }
}

function saveProfile(profile: LearnerProfile, storage: Storage | undefined = globalThis.localStorage) {
  try {
    storage?.setItem(LEARNER_STORAGE_KEY, JSON.stringify(profile))
  } catch {
    // Storage may be unavailable or full; the profile then only lives for this page load
  }
}

let state: LearnerProfile | null = null
const listeners = new Set<() => void>()

export function getLearnerProfile(): LearnerProfile {
  if (!state) state = loadProfile()
  return state
}

function setLearnerProfile(next: LearnerProfile) {
  if (next === state) return
  state = next
  saveProfile(next)
  listeners.forEach(listener => listener())
}

export function recordLearnerAttempts(inputs: AttemptInput[]) {
  if (inputs.length === 0) return
  setLearnerProfile(recordAttempts(getLearnerProfile(), inputs))
}

export function resetLearnerProfile() {
  setLearnerProfile(emptyProfile())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useLearnerProfile(): LearnerProfile {
  return useSyncExternalStore(subscribe, getLearnerProfile)
}
