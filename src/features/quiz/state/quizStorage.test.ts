import { describe, it, expect } from 'vitest'
import { loadSession, saveSession, clearSession, migrateV1, hydrateState, toPersisted, STORAGE_KEY, LEGACY_STORAGE_KEY } from './quizStorage'
import { createInitialState } from './quizReducer'
import { QuestionType, QuestionData } from '../../../shared/types'

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key)
  }
}

const QUESTIONS: QuestionData = {
  questions: [
    { number: 1, type: QuestionType.OPEN_ENDED, question: 'Q1', expected_answer: 'A1' },
    { number: 2, type: QuestionType.OPEN_ENDED, question: 'Q2', expected_answer: 'A2' }
  ]
}

describe('quizStorage', () => {
  it('returns null when nothing is stored', () => {
    expect(loadSession(memoryStorage())).toBeNull()
  })

  it('migrates a v1 session', () => {
    const v1 = {
      output: { questions: [QUESTIONS.questions[1]] },
      originalOutput: QUESTIONS,
      userAnswers: [{ number: 2, question: 'Q2', provided_answer: 'x', type: QuestionType.OPEN_ENDED }],
      currentQuestionIndex: 0,
      currentAnswer: '',
      isQuizMode: false,
      isCompleted: true,
      isCodeMode: true,
      promptInput: 'raw',
      aiFeedback: 'feedback text',
      localFeedback: [],
      masteryMap: { 1: { questionNumber: 1, bestScore: 90, attempts: 1, isMastered: true } },
      currentRound: 2,
      updatedAt: 1
    }
    const storage = memoryStorage({ [LEGACY_STORAGE_KEY]: JSON.stringify(v1) })
    const state = loadSession(storage)
    expect(state).toMatchObject({
      view: 'completed',
      isCodeMode: true,
      currentRound: 2,
      activeTab: 'feedback',
      originalOutput: QUESTIONS,
      promptInput: 'raw'
    })
    expect(state?.masteryMap[1].isMastered).toBe(true)

    saveSession(state!, storage)
    expect(storage.data.has(LEGACY_STORAGE_KEY)).toBe(false)
    expect(JSON.parse(storage.data.get(STORAGE_KEY)!).version).toBe(2)
  })

  it('migrates an in-progress v1 quiz without originalOutput', () => {
    const storage = memoryStorage({
      [LEGACY_STORAGE_KEY]: JSON.stringify({ output: QUESTIONS, isQuizMode: true, isCompleted: false, currentQuestionIndex: 1 })
    })
    const state = loadSession(storage)
    expect(state).toMatchObject({ view: 'quiz', currentQuestionIndex: 1, originalOutput: QUESTIONS, currentRound: 1, userAnswers: [] })
  })

  it('round-trips a v2 session', () => {
    const storage = memoryStorage()
    const state = createInitialState({ output: QUESTIONS, originalOutput: QUESTIONS, view: 'quiz', currentAnswer: 'draft' })
    saveSession(state, storage)
    expect(loadSession(storage)).toEqual(state)
  })

  it('prefers v2 over v1 and clears both', () => {
    const storage = memoryStorage({ [LEGACY_STORAGE_KEY]: JSON.stringify({ promptInput: 'old' }) })
    saveSession(createInitialState({ promptInput: 'new' }), storage)
    storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({ promptInput: 'old' }))
    expect(loadSession(storage)?.promptInput).toBe('new')
    clearSession(storage)
    expect(storage.data.size).toBe(0)
  })

  it('ignores corrupt data', () => {
    expect(loadSession(memoryStorage({ [STORAGE_KEY]: '{not json' }))).toBeNull()
  })
})

describe('migrateV1', () => {
  it.each([
    [{ isQuizMode: false, isCompleted: false }, 'home'],
    [{ isQuizMode: true, isCompleted: false }, 'quiz'],
    [{ isQuizMode: true, isCompleted: true }, 'completed'],
    [{ isCompleted: true }, 'completed'],
    [{}, 'home']
  ])('maps %j to view %s', (flags, view) => {
    const migrated = migrateV1(flags)
    expect(migrated.view).toBe(view)
    expect(migrated).not.toHaveProperty('isQuizMode')
    expect(migrated).not.toHaveProperty('isCompleted')
  })

  it('keeps the other fields', () => {
    expect(migrateV1({ promptInput: 'p', currentRound: 3 })).toMatchObject({ promptInput: 'p', currentRound: 3 })
  })
})

describe('hydrateState', () => {
  it('falls back to defaults for malformed fields', () => {
    const state = hydrateState({
      output: { questions: 'nope' },
      userAnswers: 'x',
      currentRound: -1,
      masteryMap: [],
      view: 'quiz',
      aiFeedback: 42
    })
    expect(state).toEqual(createInitialState())
  })

  it('clamps the question index into range', () => {
    expect(hydrateState({ output: QUESTIONS, currentQuestionIndex: 9 }).currentQuestionIndex).toBe(1)
    expect(hydrateState({ output: QUESTIONS, currentQuestionIndex: -3 }).currentQuestionIndex).toBe(0)
  })

  it('forces the home view without questions', () => {
    expect(hydrateState({ view: 'completed' }).view).toBe('home')
  })

  it('opens the feedback tab when AI feedback was saved', () => {
    expect(hydrateState({ output: QUESTIONS, aiFeedback: 'x' }).activeTab).toBe('feedback')
  })

  it('does not persist transient UI fields', () => {
    const persisted = toPersisted(createInitialState({ error: { message: 'x', type: 'y' }, activeTab: 'feedback' }))
    expect(persisted).not.toHaveProperty('error')
    expect(persisted).not.toHaveProperty('activeTab')
    expect(persisted.version).toBe(2)
  })
})
