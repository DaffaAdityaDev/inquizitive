import { describe, it, expect } from 'vitest'
import {
  quizReducer,
  createInitialState,
  promptInputChanged,
  planRetry,
  prepareAIFeedback,
  QuizSessionState,
  QuizAction
} from './quizReducer'
import { selectMergedFeedback, selectView, selectNeedsAIEval, selectMasteredCount, selectIsMastered } from './quizSelectors'
import { QuestionType, QuestionData } from '../../../shared/types'

const MIXED_JSON = JSON.stringify({
  questions: [
    { number: 1, type: 'OPEN_ENDED', question: 'Explain X', expected_answer: 'X is...' },
    {
      number: 2,
      type: 'MULTIPLE_CHOICE',
      question: 'Pick A',
      options: ['A) yes', 'B) no'],
      correct_option: 'A',
      explanations: {}
    }
  ]
})

const MCQ_ONLY: QuestionData = {
  questions: [
    { number: 1, type: QuestionType.MULTIPLE_CHOICE, question: 'Pick A', options: ['A) yes', 'B) no'], correct_option: 'A', explanations: {} },
    { number: 2, type: QuestionType.MULTIPLE_CHOICE, question: 'Pick B', options: ['A) yes', 'B) no'], correct_option: 'B', explanations: {} }
  ]
}

function run(state: QuizSessionState, ...actions: QuizAction[]): QuizSessionState {
  return actions.reduce(quizReducer, state)
}

function answer(text: string): QuizAction {
  return { type: 'SET_CURRENT_ANSWER', answer: text }
}

const NEXT: QuizAction = { type: 'NEXT_QUESTION' }

function loaded(json: string = MIXED_JSON) {
  return run(createInitialState(), promptInputChanged(json))
}

function feedbackText(score: number) {
  return `<output>{"verification": [{"number": 1, "question": "Explain X", "evaluation": "ok", "score": ${score}, "grade": "Grade ${score}/100"}]}</output>`
}

function applyFeedback(state: QuizSessionState, text: string) {
  const result = prepareAIFeedback(state, text)
  if (result.status !== 'ok') throw new Error(`unexpected ${result.status}`)
  return quizReducer(state, { type: 'APPLY_AI_FEEDBACK', text, items: result.items })
}

describe('quizReducer', () => {
  it('loads questions from prompt input and resets the mastery loop', () => {
    const dirty = createInitialState({ masteryMap: { 1: { questionNumber: 1, bestScore: 90, attempts: 1, isMastered: true } }, currentRound: 3 })
    const state = run(dirty, promptInputChanged(MIXED_JSON))
    expect(state.output?.questions).toHaveLength(2)
    expect(state.originalOutput).toBe(state.output)
    expect(state.masteryMap).toEqual({})
    expect(state.currentRound).toBe(1)
    expect(selectView(state)).toBe('home')
  })

  it('stores parse errors and clears output on invalid input', () => {
    const state = run(loaded(), promptInputChanged('not json'))
    expect(state.output).toBeNull()
    expect(state.error?.type).toBe('format')
    expect(run(state, promptInputChanged('')).error).toBeNull()
  })

  it('blocks advancing without an answer', () => {
    const state = run(loaded(), { type: 'START_QUIZ' }, NEXT)
    expect(state.currentQuestionIndex).toBe(0)
    expect(state.error?.message).toBe('Please provide an answer before advancing')
  })

  it('evaluates MCQs locally on completion', () => {
    const state = run(loaded(), { type: 'START_QUIZ' }, answer('my answer'), NEXT, answer('A) yes'), NEXT)
    expect(state.view).toBe('completed')
    expect(state.userAnswers).toHaveLength(2)
    expect(state.localFeedback.map(f => f.number)).toEqual([2])
    expect(state.masteryMap[2]).toMatchObject({ bestScore: 100, attempts: 1, isMastered: true })
    expect(state.masteryMap[1]).toBeUndefined()
  })

  it('resumes at the first unanswered question', () => {
    const state = run(loaded(), { type: 'START_QUIZ' }, answer('first'), NEXT, { type: 'RESET' })
    const resumed = run(
      createInitialState({ ...loaded(), userAnswers: [{ number: 1, question: 'Explain X', provided_answer: 'first', type: QuestionType.OPEN_ENDED }] }),
      { type: 'START_QUIZ' }
    )
    expect(state.output).toBeNull()
    expect(resumed.currentQuestionIndex).toBe(1)
  })

  it('saves the in-progress answer when navigating', () => {
    const state = run(loaded(), { type: 'START_QUIZ' }, answer('draft'), { type: 'JUMP_TO_QUESTION', index: 1 })
    expect(state.userAnswers[0].provided_answer).toBe('draft')
    const back = run(state, { type: 'PREVIOUS_QUESTION' })
    expect(back.currentAnswer).toBe('draft')
  })

  it('applies AI feedback, ignores MCQ items and detects duplicates', () => {
    const completed = run(loaded(), { type: 'START_QUIZ' }, answer('x'), NEXT, answer('B) no'), NEXT)
    const text = `<output>{"verification": [
      {"number": 1, "evaluation": "good", "score": 90, "grade": "Grade 90/100"},
      {"number": 2, "evaluation": "AI says right", "score": 100, "grade": "Grade 100/100"}
    ]}</output>`
    const state = applyFeedback(completed, text)
    expect(state.masteryMap[1]).toMatchObject({ bestScore: 90, isMastered: true })
    // MCQ stays at the local grade
    expect(state.masteryMap[2]).toMatchObject({ bestScore: 0, isMastered: false })
    expect(state.activeTab).toBe('feedback')
    expect(prepareAIFeedback(state, text).status).toBe('duplicate')
    expect(prepareAIFeedback(state, 'garbage').status).toBe('invalid')

    const merged = selectMergedFeedback(state)
    expect(merged.map(f => f.number)).toEqual([1, 2])
    expect(merged[1].evaluation).toMatch(/incorrect/)
  })

  it('requires AI feedback before retrying a round with open-ended questions', () => {
    const completed = run(loaded(), { type: 'START_QUIZ' }, answer('x'), NEXT, answer('B) no'), NEXT)
    expect(planRetry(completed).kind).toBe('needs-evaluation')
    expect(run(completed, { type: 'RETRY_FAILED' })).toBe(completed)
  })

  it('retries only unmastered questions and increments the round', () => {
    const completed = run(loaded(), { type: 'START_QUIZ' }, answer('x'), NEXT, answer('A) yes'), NEXT)
    const evaluated = applyFeedback(completed, feedbackText(40))
    const retried = run(evaluated, { type: 'RETRY_FAILED' })
    expect(retried.currentRound).toBe(2)
    expect(retried.output?.questions.map(q => q.number)).toEqual([1])
    expect(retried.view).toBe('quiz')
    expect(retried.userAnswers).toEqual([])
    expect(retried.aiFeedback).toBe('')
    expect(retried.activeTab).toBe('prompt')
    expect(retried.localFeedback).toHaveLength(1)
  })

  it('reports all mastered when nothing is left to retry', () => {
    const state = run(
      createInitialState({ output: MCQ_ONLY, originalOutput: MCQ_ONLY }),
      { type: 'START_QUIZ' }, answer('A) yes'), NEXT, answer('B) no'), NEXT
    )
    expect(selectNeedsAIEval(state)).toBe(false)
    expect(planRetry(state).kind).toBe('all-mastered')
  })

  it('accumulates attempts across rounds for MCQs', () => {
    const round1 = run(
      createInitialState({ output: MCQ_ONLY, originalOutput: MCQ_ONLY }),
      { type: 'START_QUIZ' }, answer('A) yes'), NEXT, answer('A) yes'), NEXT
    )
    const round2 = run(round1, { type: 'RETRY_FAILED' }, answer('B) no'), NEXT)
    expect(round2.currentRound).toBe(2)
    expect(round2.masteryMap[1]).toMatchObject({ attempts: 1, isMastered: true })
    expect(round2.masteryMap[2]).toMatchObject({ attempts: 2, isMastered: true })
  })

  it('reset returns to the initial state but keeps code mode', () => {
    const state = run(loaded(), { type: 'TOGGLE_CODE_MODE' }, { type: 'START_QUIZ' }, { type: 'RESET' })
    expect(state).toEqual(createInitialState({ isCodeMode: true }))
  })
})

describe('quizReducer: navigation', () => {
  it('refuses to start without questions', () => {
    const state = run(createInitialState(), { type: 'START_QUIZ' })
    expect(state.view).toBe('home')
    expect(state.error).toEqual({ message: 'No questions available', type: 'quiz' })
  })

  it('starts at the first question with a clean answer', () => {
    const state = run(loaded(), { type: 'START_QUIZ' })
    expect(state).toMatchObject({ view: 'quiz', currentQuestionIndex: 0, currentAnswer: '', error: null })
  })

  it('asks for an option on an empty MCQ answer', () => {
    const state = run(loaded(), { type: 'START_QUIZ' }, answer('x'), NEXT, answer('   '), NEXT)
    expect(state.currentQuestionIndex).toBe(1)
    expect(state.view).toBe('quiz')
    expect(state.error?.message).toBe('Please select an option to continue')
  })

  it('advances, records the answer and clears the validation error', () => {
    const state = run(loaded(), { type: 'START_QUIZ' }, NEXT, answer('mine'), NEXT)
    expect(state.currentQuestionIndex).toBe(1)
    expect(state.currentAnswer).toBe('')
    expect(state.error).toBeNull()
    expect(state.userAnswers).toEqual([
      expect.objectContaining({ number: 1, question: 'Explain X', provided_answer: 'mine', type: QuestionType.OPEN_ENDED })
    ])
  })

  it('restores a saved answer when moving forward to an answered question', () => {
    const state = run(
      loaded(),
      { type: 'START_QUIZ' }, answer('one'), NEXT, answer('B) no'),
      { type: 'PREVIOUS_QUESTION' }
    )
    expect(state.currentAnswer).toBe('one')
    const forward = run(state, answer('one'), NEXT)
    expect(forward.currentQuestionIndex).toBe(1)
    expect(forward.currentAnswer).toBe('B) no')
  })

  it('overwrites an earlier answer instead of duplicating it', () => {
    const state = run(
      loaded(),
      { type: 'START_QUIZ' }, answer('one'), NEXT, { type: 'PREVIOUS_QUESTION' }, answer('two'), NEXT
    )
    expect(state.userAnswers.filter(a => a.number === 1)).toHaveLength(1)
    expect(state.userAnswers.find(a => a.number === 1)?.provided_answer).toBe('two')
  })

  it('ignores PREVIOUS_QUESTION on the first question', () => {
    const started = run(loaded(), { type: 'START_QUIZ' })
    expect(run(started, { type: 'PREVIOUS_QUESTION' })).toBe(started)
  })

  it('does not save a blank draft when navigating back', () => {
    const state = run(loaded(), { type: 'START_QUIZ' }, answer('one'), NEXT, answer('  '), { type: 'PREVIOUS_QUESTION' })
    expect(state.userAnswers.map(a => a.number)).toEqual([1])
  })

  it('ignores out-of-range and same-index jumps', () => {
    const started = run(loaded(), { type: 'START_QUIZ' })
    expect(run(started, { type: 'JUMP_TO_QUESTION', index: -1 })).toBe(started)
    expect(run(started, { type: 'JUMP_TO_QUESTION', index: 2 })).toBe(started)
    expect(run(started, { type: 'JUMP_TO_QUESTION', index: 0 })).toBe(started)
  })

  it('jumping clears a pending validation error', () => {
    const state = run(loaded(), { type: 'START_QUIZ' }, NEXT, { type: 'JUMP_TO_QUESTION', index: 1 })
    expect(state.error).toBeNull()
    expect(state.currentQuestionIndex).toBe(1)
  })

  it('toggles code mode and the results tab', () => {
    const state = run(loaded(), { type: 'TOGGLE_CODE_MODE' }, { type: 'SET_ACTIVE_TAB', tab: 'feedback' })
    expect(state.isCodeMode).toBe(true)
    expect(state.activeTab).toBe('feedback')
    expect(run(state, { type: 'TOGGLE_CODE_MODE' }).isCodeMode).toBe(false)
  })

  it('sets and clears errors', () => {
    const state = run(loaded(), { type: 'SET_ERROR', error: { message: 'boom', type: 'x' } })
    expect(state.error?.message).toBe('boom')
    expect(run(state, { type: 'SET_ERROR', error: null }).error).toBeNull()
  })
})

describe('quizReducer: local MCQ evaluation', () => {
  function completeMcqOnly(first: string, second: string) {
    return run(
      createInitialState({ output: MCQ_ONLY, originalOutput: MCQ_ONLY }),
      { type: 'START_QUIZ' }, answer(first), NEXT, answer(second), NEXT
    )
  }

  it('grades every MCQ once on completion', () => {
    const state = completeMcqOnly('A', 'A) yes')
    expect(state.view).toBe('completed')
    expect(state.masteryMap[1]).toMatchObject({ bestScore: 100, attempts: 1, isMastered: true })
    expect(state.masteryMap[2]).toMatchObject({ bestScore: 0, attempts: 1, isMastered: false })
    expect(state.localFeedback.map(f => f.number)).toEqual([1, 2])
  })

  it('does not grade before the last question is submitted', () => {
    const state = run(
      createInitialState({ output: MCQ_ONLY, originalOutput: MCQ_ONLY }),
      { type: 'START_QUIZ' }, answer('A'), NEXT
    )
    expect(state.masteryMap).toEqual({})
    expect(state.localFeedback).toEqual([])
  })

  it('does not grade again when a restored completed session is used', () => {
    const completed = completeMcqOnly('A', 'B')
    const restored = createInitialState({ ...completed })
    const after = run(restored, { type: 'SET_ACTIVE_TAB', tab: 'feedback' }, { type: 'TOGGLE_CODE_MODE' })
    expect(after.masteryMap).toEqual(completed.masteryMap)
  })

  it('leaves open-ended-only rounds ungraded locally', () => {
    const openOnly = JSON.stringify({ questions: [{ number: 1, type: 'OPEN_ENDED', question: 'Why?', expected_answer: 'Because' }] })
    const state = run(loaded(openOnly), { type: 'START_QUIZ' }, answer('dunno'), NEXT)
    expect(state.view).toBe('completed')
    expect(state.masteryMap).toEqual({})
    expect(state.localFeedback).toEqual([])
    expect(selectNeedsAIEval(state)).toBe(true)
  })

  it('ignores NEXT_QUESTION once the quiz is completed', () => {
    const completed = completeMcqOnly('A', 'B')
    const again = run(completed, NEXT)
    expect(again).toBe(completed)
    expect(again.masteryMap[1].attempts).toBe(1)
  })

  it('does not finish while a question skipped via the navigator is unanswered', () => {
    const state = run(
      createInitialState({ output: MCQ_ONLY, originalOutput: MCQ_ONLY }),
      { type: 'START_QUIZ' }, { type: 'JUMP_TO_QUESTION', index: 1 }, answer('B'), NEXT
    )
    expect(state.view).toBe('quiz')
    expect(state.currentQuestionIndex).toBe(0)
    expect(state.error?.message).toBe('Answer question 1 before finishing')
    expect(state.userAnswers.map(a => a.number)).toEqual([2])
    expect(state.masteryMap).toEqual({})

    const back = run(state, answer('A'), NEXT)
    expect(back.view).toBe('quiz')
    expect(back.currentQuestionIndex).toBe(1)
    expect(back.currentAnswer).toBe('B')
    const done = run(back, NEXT)
    expect(done.view).toBe('completed')
    expect(done.masteryMap[1].attempts).toBe(1)
  })
})

describe('quizReducer: AI feedback', () => {
  function completedMixed() {
    return run(loaded(), { type: 'START_QUIZ' }, answer('x'), NEXT, answer('A) yes'), NEXT)
  }

  it('rejects blank, unparseable and MCQ-only feedback', () => {
    const state = completedMixed()
    expect(prepareAIFeedback(state, '   ').status).toBe('invalid')
    expect(prepareAIFeedback(state, '{"verification": []}').status).toBe('invalid')
    const mcqOnly = '<output>{"verification": [{"number": 2, "evaluation": "x", "score": 0, "grade": "0/100"}]}</output>'
    expect(prepareAIFeedback(state, mcqOnly).status).toBe('invalid')
  })

  it('treats whitespace-only differences as a duplicate paste', () => {
    const state = applyFeedback(completedMixed(), feedbackText(70))
    expect(prepareAIFeedback(state, `  ${feedbackText(70)}\n`).status).toBe('duplicate')
  })

  it('accepts different feedback after a first paste', () => {
    const state = applyFeedback(completedMixed(), feedbackText(70))
    expect(prepareAIFeedback(state, feedbackText(95)).status).toBe('ok')
  })

  it('prefers the numeric score over the grade string', () => {
    const text = '<output>{"verification": [{"number": 1, "evaluation": "ok", "score": 88, "grade": "Grade 10/100"}]}</output>'
    const state = applyFeedback(completedMixed(), text)
    expect(state.masteryMap[1]).toMatchObject({ bestScore: 88, isMastered: true, attempts: 1 })
  })

  it('falls back to parsing the grade when score is missing', () => {
    const text = '<output>{"verification": [{"number": 1, "evaluation": "ok", "grade": "Grade 60/100"}]}</output>'
    const state = applyFeedback(completedMixed(), text)
    expect(state.masteryMap[1]).toMatchObject({ bestScore: 60, isMastered: false })
  })

  it('does not change the round or view', () => {
    const completed = completedMixed()
    const state = applyFeedback(completed, feedbackText(50))
    expect(state.currentRound).toBe(completed.currentRound)
    expect(state.view).toBe('completed')
    expect(state.aiFeedback).toBe(feedbackText(50))
  })

  it('keeps the local MCQ grade in the merged analysis', () => {
    const state = applyFeedback(completedMixed(), feedbackText(50))
    const merged = selectMergedFeedback(state)
    expect(merged.find(f => f.number === 2)?.grade).toBe('Grade 100/100 🟢')
    expect(merged.find(f => f.number === 1)?.score).toBe(50)
  })

  it('drops MCQ items even when the AI sends the number as a string', () => {
    const text = '<output>{"verification": [{"number": "2", "evaluation": "x", "score": 0, "grade": "0/100"}]}</output>'
    expect(prepareAIFeedback(completedMixed(), text).status).toBe('invalid')
  })
})

describe('quizReducer: AI feedback scoping', () => {
  function completedMixed() {
    return run(loaded(), { type: 'START_QUIZ' }, answer('x'), NEXT, answer('A) yes'), NEXT)
  }

  it('ignores items for numbers that are not open-ended questions of this round', () => {
    const text = `<output>{"verification": [
      {"number": 1, "evaluation": "weak", "score": 50},
      {"number": 7, "evaluation": "made up", "score": 100},
      {"evaluation": "no number", "score": 100}
    ]}</output>`
    const state = applyFeedback(completedMixed(), text)
    expect(Object.keys(state.masteryMap).sort()).toEqual(['1', '2'])
    expect(selectMasteredCount(state)).toBe(1)
    expect(selectIsMastered(state)).toBe(false)
    expect(selectMergedFeedback(state).map(f => f.number)).toEqual([1, 2])
    expect(prepareAIFeedback(completedMixed(), '<output>{"verification": [{"number": 7, "score": 100}]}</output>').status)
      .toBe('invalid')
  })

  it('does not count stray mastery entries outside the question set', () => {
    const state = createInitialState({
      ...completedMixed(),
      masteryMap: { 7: { questionNumber: 7, bestScore: 100, attempts: 1, isMastered: true } }
    })
    expect(selectMasteredCount(state)).toBe(0)
  })

  it('rejects the previous round\'s feedback pasted again in the next round', () => {
    const round1 = applyFeedback(completedMixed(), feedbackText(40))
    const round2 = run(round1, { type: 'RETRY_FAILED' }, answer('new answer'), NEXT)
    expect(round2.view).toBe('completed')
    expect(prepareAIFeedback(round2, feedbackText(40)).status).toBe('stale')
    expect(prepareAIFeedback(round2, `\n${feedbackText(40)}  `).status).toBe('stale')
    expect(planRetry(round2).kind).toBe('needs-evaluation')
    expect(round2.masteryMap[1].attempts).toBe(1)
    expect(prepareAIFeedback(round2, feedbackText(60)).status).toBe('ok')
  })

  it('replaces this round\'s AI result when updated feedback is pasted', () => {
    const first = applyFeedback(completedMixed(), feedbackText(90))
    expect(first.masteryMap[1]).toMatchObject({ bestScore: 90, attempts: 1, isMastered: true })
    const corrected = applyFeedback(first, feedbackText(40))
    expect(corrected.masteryMap[1]).toMatchObject({ bestScore: 40, attempts: 1, isMastered: false })
    // The locally graded MCQ is untouched
    expect(corrected.masteryMap[2]).toEqual(first.masteryMap[2])
    expect(planRetry(corrected).kind).toBe('retry')
  })

  it('keeps earlier rounds\' best scores when a later round is re-evaluated', () => {
    const round1 = applyFeedback(completedMixed(), feedbackText(70))
    const round2 = run(round1, { type: 'RETRY_FAILED' }, answer('again'), NEXT)
    const graded = applyFeedback(applyFeedback(round2, feedbackText(30)), feedbackText(20))
    expect(graded.masteryMap[1]).toMatchObject({ bestScore: 70, attempts: 2 })
  })
})

describe('quizReducer: retry failed', () => {
  function evaluatedRound1(score: number) {
    return applyFeedback(
      run(loaded(), { type: 'START_QUIZ' }, answer('x'), NEXT, answer('B) no'), NEXT),
      feedbackText(score)
    )
  }

  it('is unavailable without questions', () => {
    const state = createInitialState()
    expect(planRetry(state).kind).toBe('unavailable')
    expect(run(state, { type: 'RETRY_FAILED' })).toBe(state)
  })

  it('allows an MCQ-only round to retry without AI feedback', () => {
    const state = run(
      createInitialState({ output: MCQ_ONLY, originalOutput: MCQ_ONLY }),
      { type: 'START_QUIZ' }, answer('B'), NEXT, answer('B'), NEXT
    )
    const plan = planRetry(state)
    expect(plan.kind).toBe('retry')
    if (plan.kind === 'retry') expect(plan.questions.map(q => q.number)).toEqual([1])
  })

  it('still blocks a later round that contains open-ended questions until evaluated', () => {
    const round2 = run(evaluatedRound1(30), { type: 'RETRY_FAILED' }, answer('y'), NEXT, answer('A) yes'), NEXT)
    expect(round2.currentRound).toBe(2)
    expect(round2.view).toBe('completed')
    expect(planRetry(round2).kind).toBe('needs-evaluation')
    expect(run(round2, { type: 'RETRY_FAILED' })).toBe(round2)
  })

  it('keeps attempts and best scores across rounds', () => {
    const round2 = run(evaluatedRound1(30), { type: 'RETRY_FAILED' }, answer('y'), NEXT, answer('A) yes'), NEXT)
    const evaluated = applyFeedback(round2, feedbackText(20))
    expect(evaluated.masteryMap[1]).toMatchObject({ attempts: 2, bestScore: 30, isMastered: false })
    expect(evaluated.masteryMap[2]).toMatchObject({ attempts: 2, bestScore: 100, isMastered: true })
    const round3 = run(evaluated, { type: 'RETRY_FAILED' })
    expect(round3.currentRound).toBe(3)
    expect(round3.output?.questions.map(q => q.number)).toEqual([1])
    expect(round3.originalOutput?.questions).toHaveLength(2)
  })

  it('does not retry once everything is mastered', () => {
    const completed = run(loaded(), { type: 'START_QUIZ' }, answer('x'), NEXT, answer('A) yes'), NEXT)
    const evaluated = applyFeedback(completed, feedbackText(95))
    expect(planRetry(evaluated).kind).toBe('all-mastered')
    expect(run(evaluated, { type: 'RETRY_FAILED' })).toBe(evaluated)
  })
})

describe('quizReducer: reset and reload', () => {
  it('clears questions, answers, mastery and round but keeps code mode', () => {
    const retried = run(
      applyFeedback(
        run(loaded(), { type: 'TOGGLE_CODE_MODE' }, { type: 'START_QUIZ' }, answer('x'), NEXT, answer('A) yes'), NEXT),
        feedbackText(40)
      ),
      { type: 'RETRY_FAILED' }
    )
    const reset = run(retried, { type: 'RESET' })
    expect(reset).toEqual(createInitialState({ isCodeMode: true }))
    expect(selectView(reset)).toBe('home')
  })

  it('loading new questions after progress starts a fresh loop', () => {
    const completed = run(loaded(), { type: 'START_QUIZ' }, answer('x'), NEXT, answer('A) yes'), NEXT)
    const reloaded = run(completed, promptInputChanged(MIXED_JSON.replace('Explain X', 'Explain Y')))
    expect(reloaded.masteryMap).toEqual({})
    expect(reloaded.localFeedback).toEqual([])
    expect(reloaded.userAnswers).toEqual([])
    expect(reloaded.currentRound).toBe(1)
    expect(reloaded.sessionId).not.toBe(completed.sessionId)
  })

  it('re-parsing the same questions (e.g. an edit to whitespace) keeps the progress', () => {
    const completed = run(loaded(), { type: 'START_QUIZ' }, answer('x'), NEXT, answer('A) yes'), NEXT)
    const reparsed = run(completed, promptInputChanged(`${MIXED_JSON}\n`))
    expect(reparsed.masteryMap).toEqual(completed.masteryMap)
    expect(reparsed.userAnswers).toEqual(completed.userAnswers)
    expect(reparsed.sessionId).toBe(completed.sessionId)
  })
})

describe('quizReducer: confidence and unknown answers', () => {
  it('stores confidence with the answer and restores it when navigating back', () => {
    const state = run(
      loaded(),
      { type: 'START_QUIZ' },
      answer('x'),
      { type: 'SET_CONFIDENCE', confidence: 'unsure' },
      NEXT
    )
    expect(state.userAnswers[0].confidence).toBe('unsure')
    expect(state.currentConfidence).toBeNull()
    const back = run(state, { type: 'PREVIOUS_QUESTION' })
    expect(back.currentConfidence).toBe('unsure')
  })

  it('a correct guess is graded below mastery', () => {
    const state = run(
      loaded(),
      { type: 'START_QUIZ' },
      answer('x'),
      NEXT,
      answer('A) yes'),
      { type: 'SET_CONFIDENCE', confidence: 'guess' },
      NEXT
    )
    expect(state.view).toBe('completed')
    expect(state.masteryMap[2].isMastered).toBe(false)
    expect(state.localFeedback[0].grade).toContain('60/100')
  })

  it('"I don\'t know" records the answer and moves on', () => {
    const state = run(loaded(), { type: 'START_QUIZ' }, { type: 'ANSWER_UNKNOWN' })
    expect(state.userAnswers[0].provided_answer).toBe("I don't know")
    expect(state.currentQuestionIndex).toBe(1)
  })
})
