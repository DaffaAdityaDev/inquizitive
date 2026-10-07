import { useSyncExternalStore } from 'react'
import {
  DEFAULT_PROMPT_OPTIONS,
  DIFFICULTY_LABELS,
  LANGUAGE_LABELS,
  PromptOptions,
  QUESTION_COUNTS,
  QUESTION_TYPE_LABELS
} from '../constants/promptTemplates'

export const PROMPT_OPTIONS_STORAGE_KEY = 'inquizitive_prompt_options_v1'

/** Persisted generator options plus the (deliberately not persisted, possibly large) source material. */
export interface PromptOptionsState extends PromptOptions {
  sourceMaterial: string
}

function sanitize(raw: unknown): PromptOptions {
  const value = (raw && typeof raw === 'object' ? raw : {}) as Partial<PromptOptions>
  return {
    questionType: value.questionType && value.questionType in QUESTION_TYPE_LABELS
      ? value.questionType
      : DEFAULT_PROMPT_OPTIONS.questionType,
    count: (QUESTION_COUNTS as readonly number[]).includes(Number(value.count))
      ? Number(value.count)
      : DEFAULT_PROMPT_OPTIONS.count,
    difficulty: value.difficulty && value.difficulty in DIFFICULTY_LABELS
      ? value.difficulty
      : DEFAULT_PROMPT_OPTIONS.difficulty,
    language: value.language && value.language in LANGUAGE_LABELS
      ? value.language
      : DEFAULT_PROMPT_OPTIONS.language
  }
}

export function loadPromptOptions(storage: Storage | undefined = globalThis.localStorage): PromptOptions {
  try {
    const raw = storage?.getItem(PROMPT_OPTIONS_STORAGE_KEY)
    return sanitize(raw ? JSON.parse(raw) : null)
  } catch {
    return { ...DEFAULT_PROMPT_OPTIONS }
  }
}

export function savePromptOptions(options: PromptOptions, storage: Storage | undefined = globalThis.localStorage) {
  try {
    storage?.setItem(PROMPT_OPTIONS_STORAGE_KEY, JSON.stringify(sanitize(options)))
  } catch {
    // Storage may be unavailable (private mode, quota); options just won't be remembered
  }
}

// Module-level store so the home stepper, the topic modal and the session hook share one copy
let state: PromptOptionsState | null = null
const listeners = new Set<() => void>()

export function getPromptOptions(): PromptOptionsState {
  if (!state) state = { ...loadPromptOptions(), sourceMaterial: '' }
  return state
}

export function updatePromptOptions(patch: Partial<PromptOptionsState>) {
  const next = { ...getPromptOptions(), ...patch }
  state = next
  // sanitize() inside savePromptOptions drops sourceMaterial
  savePromptOptions(next)
  listeners.forEach(listener => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function usePromptOptions() {
  const options = useSyncExternalStore(subscribe, getPromptOptions)
  return { options, updateOptions: updatePromptOptions }
}
