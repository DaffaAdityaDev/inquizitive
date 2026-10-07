import { describe, expect, it } from 'vitest'
import { loadPromptOptions, savePromptOptions, PROMPT_OPTIONS_STORAGE_KEY } from './promptOptionsStore'
import { DEFAULT_PROMPT_OPTIONS } from '../constants/promptTemplates'

function fakeStorage(initial: Record<string, string> = {}): Storage {
  const data = { ...initial }
  return {
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => { data[k] = v },
    removeItem: (k: string) => { delete data[k] },
    clear: () => {},
    key: () => null,
    length: 0
  }
}

describe('prompt options persistence', () => {
  it('round-trips saved options', () => {
    const storage = fakeStorage()
    const options = { questionType: 'MIXED', count: 20, difficulty: 'advanced', language: 'id' } as const
    savePromptOptions(options, storage)
    expect(loadPromptOptions(storage)).toEqual(options)
  })

  it('falls back to defaults for missing, corrupt or invalid values', () => {
    expect(loadPromptOptions(fakeStorage())).toEqual(DEFAULT_PROMPT_OPTIONS)
    expect(loadPromptOptions(fakeStorage({ [PROMPT_OPTIONS_STORAGE_KEY]: '{oops' }))).toEqual(DEFAULT_PROMPT_OPTIONS)
    const partial = JSON.stringify({ count: 7, language: 'fr', difficulty: 'beginner' })
    expect(loadPromptOptions(fakeStorage({ [PROMPT_OPTIONS_STORAGE_KEY]: partial })))
      .toEqual({ ...DEFAULT_PROMPT_OPTIONS, difficulty: 'beginner' })
  })

  it('does not throw when storage throws', () => {
    const broken = { ...fakeStorage(), getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('denied') } }
    expect(loadPromptOptions(broken)).toEqual(DEFAULT_PROMPT_OPTIONS)
    expect(() => savePromptOptions(DEFAULT_PROMPT_OPTIONS, broken)).not.toThrow()
  })
})
