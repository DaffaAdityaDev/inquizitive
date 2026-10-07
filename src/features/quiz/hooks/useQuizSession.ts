import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { toast } from 'sonner'
import { buildQuizPrompt, getPromptOptions, PromptQuestionType, usePromptOptions } from '../../prompts'
import { generateAIPrompt } from '../../feedback/utils/evalPrompt'
import { useTutorialAndModals } from './useTutorialAndModals'
import { isImeComposing } from '../../../shared/utils/keyboard'
import {
  quizReducer,
  promptInputChanged,
  planRetry,
  prepareAIFeedback,
  ResultsTab
} from '../state/quizReducer'
import { initQuizState, saveSession, clearSession } from '../state/quizStorage'
import {
  selectView,
  selectCurrentQuestion,
  selectProgress,
  selectOriginalTotalCount,
  selectMasteredCount,
  selectIsMastered,
  selectNeedsAIEval,
  selectHasFeedback,
  selectResultsTab,
  selectMergedFeedback
} from '../state/quizSelectors'

/**
 * The single hook the quiz UI consumes. State transitions live in the pure
 * quizReducer; this hook adds persistence and side effects (clipboard, toasts).
 */
export function useQuizSession() {
  const [state, dispatch] = useReducer(quizReducer, undefined, initQuizState)
  const { options: promptOptions, updateOptions: updatePromptOptions } = usePromptOptions()
  // Drives the home stepper's "step 1 done" state; intentionally not persisted
  const [hasCopiedPrompt, setHasCopiedPrompt] = useState(false)
  const modals = useTutorialAndModals()

  // Async clipboard handlers read the latest state after their await
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    if (state.output || state.promptInput) {
      saveSession(state)
    } else {
      clearSession()
    }
  }, [state])

  const mergedFeedback = useMemo(() => selectMergedFeedback(state), [state])
  const evalPrompt = useMemo(
    () => (state.output ? generateAIPrompt(state.userAnswers, state.output) : ''),
    [state.userAnswers, state.output]
  )

  function copyToClipboard(text: string, message: string = 'Copied to clipboard!') {
    navigator.clipboard.writeText(text)
    toast.success(message, {
      description: 'You can now paste this content wherever you need it.',
      duration: 2000,
    })
  }

  function handleCopyEvalPrompt() {
    if (state.output) copyToClipboard(evalPrompt)
  }

  function handlePromptInput(value: string) {
    dispatch(promptInputChanged(value))
  }

  async function handlePastePromptFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      if (!text.trim()) {
        toast.error('Clipboard is empty', { duration: 2000 })
        return
      }
      const action = promptInputChanged(text)
      dispatch(action)
      if (action.result && 'data' in action.result) {
        toast.success('Questions loaded from clipboard!', { duration: 2000 })
      }
    } catch (err) {
      console.error('Clipboard read error:', err)
      toast.error('Could not read from clipboard. Please paste manually.', { duration: 2500 })
    }
  }

  async function handleTopicSubmit() {
    if (!modals.topicInput.trim()) {
      toast.error('Please enter a topic', {
        description: 'The topic cannot be empty',
        duration: 2000,
      })
      return
    }

    try {
      await navigator.clipboard.writeText(buildQuizPrompt({ ...getPromptOptions(), topic: modals.topicInput }))
      toast.success('Prompt copied!', {
        description: 'Paste it into a free AI chat (ChatGPT, Gemini...), then paste its JSON reply here.',
        duration: 3000,
      })
      setHasCopiedPrompt(true)
      modals.closeTopicModal()
    } catch (error) {
      console.error('Error copying template:', error)
      toast.error('Failed to copy template', {
        description: 'Please try again or copy manually',
        duration: 2000,
      })
    }
  }

  function handleReset() {
    clearSession()
    setHasCopiedPrompt(false)
    dispatch({ type: 'RESET' })
  }

  function handleStartFresh() {
    handleReset()
    toast.success('Started fresh!', {
      description: 'All stored questions and answers cleared.',
      duration: 2000
    })
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key !== 'Enter' || isImeComposing(e)) return
    // In code mode or with Shift, Enter inserts a newline
    if (state.isCodeMode || e.shiftKey) return
    e.preventDefault()
    // A held-down Enter would otherwise skip through several questions
    if (e.repeat) return
    dispatch({ type: 'NEXT_QUESTION' })
  }

  function handleKeyPressStart(e: React.KeyboardEvent) {
    // Plain Enter must stay a newline so the JSON can still be edited
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !isImeComposing(e) && state.output && state.view !== 'completed') {
      e.preventDefault()
      dispatch({ type: 'START_QUIZ' })
    }
  }

  async function handlePasteFeedback() {
    let text: string
    try {
      text = await navigator.clipboard.readText()
    } catch (error) {
      console.error('Error pasting from clipboard:', error)
      toast.error('Failed to paste', {
        description: 'Please make sure you have content copied to your clipboard.',
        duration: 2000,
      })
      dispatch({ type: 'SET_ERROR', error: { message: 'Failed to paste from clipboard', type: 'parse' } })
      return
    }

    const result = prepareAIFeedback(stateRef.current, text)
    if (result.status === 'duplicate') {
      dispatch({ type: 'SET_ACTIVE_TAB', tab: 'feedback' })
      toast.info('This feedback is already applied', { duration: 2000 })
      return
    }
    if (result.status === 'stale') {
      toast.error('This feedback is from an earlier round', {
        description: 'Copy this round\'s evaluation prompt into your AI chat, then paste its new reply.',
        duration: 3500,
      })
      return
    }
    if (result.status === 'invalid') {
      toast.error('No evaluation found', {
        description: 'Make sure you copied the AI response containing the JSON evaluation for this round.',
        duration: 3000,
      })
      return
    }

    dispatch({ type: 'APPLY_AI_FEEDBACK', text, items: result.items })
    toast.success('Feedback pasted!', {
      description: 'AI feedback has been successfully applied to your progress.',
      duration: 2000,
    })
  }

  function handleRetryFailed() {
    const plan = planRetry(state)
    switch (plan.kind) {
      case 'unavailable':
        return
      case 'needs-evaluation':
        toast.error('Evaluation required', {
          description: 'Please paste AI feedback first to evaluate your answers before retrying.',
          duration: 3000
        })
        return
      case 'all-mastered':
        toast.success('All questions mastered!')
        return
      case 'retry':
        dispatch({ type: 'RETRY_FAILED' })
        toast.success(`Retrying ${plan.questions.length} questions`)
    }
  }

  return {
    // State
    output: state.output,
    userAnswers: state.userAnswers,
    currentQuestionIndex: state.currentQuestionIndex,
    currentAnswer: state.currentAnswer,
    isCodeMode: state.isCodeMode,
    promptInput: state.promptInput,
    aiFeedback: state.aiFeedback,
    localFeedback: state.localFeedback,
    masteryMap: state.masteryMap,
    currentRound: state.currentRound,
    error: state.error,

    // Derived
    view: selectView(state),
    currentQuestion: selectCurrentQuestion(state),
    progress: selectProgress(state),
    originalTotalCount: selectOriginalTotalCount(state),
    masteredCount: selectMasteredCount(state),
    isMastered: selectIsMastered(state),
    needsAIEval: selectNeedsAIEval(state),
    hasFeedback: selectHasFeedback(state),
    resultsTab: selectResultsTab(state),
    mergedFeedback,
    evalPrompt,

    // Quiz actions
    setCurrentAnswer: (answer: string) => dispatch({ type: 'SET_CURRENT_ANSWER', answer }),
    setActiveTab: (tab: ResultsTab) => dispatch({ type: 'SET_ACTIVE_TAB', tab }),
    toggleCodeMode: () => dispatch({ type: 'TOGGLE_CODE_MODE' }),
    handleStartQuiz: () => dispatch({ type: 'START_QUIZ' }),
    handleNextQuestion: () => dispatch({ type: 'NEXT_QUESTION' }),
    handlePreviousQuestion: () => dispatch({ type: 'PREVIOUS_QUESTION' }),
    handleJumpToQuestion: (index: number) => dispatch({ type: 'JUMP_TO_QUESTION', index }),
    handleKeyPress,
    handleKeyPressStart,
    handlePromptInput,
    handlePastePromptFromClipboard,
    handlePasteFeedback,
    handleRetryFailed,
    handleReset,
    handleStartFresh,
    copyToClipboard,
    handleCopyEvalPrompt,

    // Prompt setup and modals
    promptOptions,
    updatePromptOptions,
    hasCopiedPrompt,
    selectedQuestionType: promptOptions.questionType,
    handleQuestionTypeChange: (key: string | number) => updatePromptOptions({ questionType: key as PromptQuestionType }),
    handleCopyBasePrompt: modals.openTopicModal,
    handleTopicSubmit,
    isTutorialOpen: modals.isTutorialOpen,
    openTutorial: modals.openTutorial,
    onTutorialOpenChange: modals.onTutorialOpenChange,
    isTopicModalOpen: modals.isTopicModalOpen,
    topicInput: modals.topicInput,
    setTopicInput: modals.setTopicInput,
    closeTopicModal: modals.closeTopicModal
  }
}

export type QuizSession = ReturnType<typeof useQuizSession>
