import { ParsedFeedback, Question, QuestionType } from '../../../shared/types'
import { parseAIFeedback } from '../../feedback/utils/parseFeedback'
import { countMastered } from '../../mastery/utils/masteryUpdates'
import { QuizSessionState, QuizView, ResultsTab, roundOpenEndedNumbers } from './quizReducer'

/** Without questions there is nothing to show but the home view. */
export function selectView(state: QuizSessionState): QuizView {
  return state.output ? state.view : 'home'
}

export function selectCurrentQuestion(state: QuizSessionState): Question | undefined {
  return state.output?.questions[state.currentQuestionIndex]
}

export function selectProgress(state: QuizSessionState): number {
  if (!state.output?.questions.length) return 0
  return ((state.currentQuestionIndex + 1) / state.output.questions.length) * 100
}

export function selectOriginalTotalCount(state: QuizSessionState): number {
  return state.originalOutput?.questions.length || 0
}

/** Only counts questions in the current set, so a stray AI number can't inflate the total. */
export function selectMasteredCount(state: QuizSessionState): number {
  const numbers = new Set(state.originalOutput?.questions.map(q => q.number))
  const known = Object.fromEntries(
    Object.entries(state.masteryMap).filter(([key]) => numbers.has(Number(key)))
  )
  return countMastered(known)
}

export function selectIsMastered(state: QuizSessionState): boolean {
  const total = selectOriginalTotalCount(state)
  return total > 0 && selectMasteredCount(state) === total
}

/** Rounds with only multiple choice are fully graded locally, so the AI step is skipped. */
export function selectNeedsAIEval(state: QuizSessionState): boolean {
  return !!state.output?.questions.some(q => q.type === QuestionType.OPEN_ENDED)
}

export function selectHasFeedback(state: QuizSessionState): boolean {
  return !!state.aiFeedback || state.localFeedback.length > 0
}

export function selectResultsTab(state: QuizSessionState): ResultsTab {
  return selectNeedsAIEval(state) ? state.activeTab : 'feedback'
}

/** Local MCQ grades are authoritative; AI feedback only fills in the remaining items. */
export function selectMergedFeedback(state: QuizSessionState): ParsedFeedback[] {
  const local = state.localFeedback
  if (!state.aiFeedback) return local
  const localNumbers = new Set(local.map(f => f.number))
  const roundNumbers = roundOpenEndedNumbers(state)
  const ai = parseAIFeedback(state.aiFeedback, state.userAnswers, state.output?.questions)
    .filter(f => roundNumbers.has(f.number) && !localNumbers.has(f.number))
  return [...local, ...ai].sort((a, b) => a.number - b.number)
}
