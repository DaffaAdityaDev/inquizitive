import { useEffect, useRef, useState } from 'react'
import { useQuizState } from './useQuizState'
import { usePromptInput } from './usePromptInput'
import { useAIFeedback } from '../../feedback'
import { useTutorialAndModals } from './useTutorialAndModals'
import { useQuestionType } from '../../prompts'
import { useMasteryTracking } from '../../mastery'
import { toast } from 'sonner'
import { QuestionData, ParsedFeedback } from '../../../shared/types'
import { saveSession, loadSavedSession, clearSavedSession } from './useQuizPersistence'
import { evaluateQuizAnswers } from '../utils/mcqEvaluator'

export function useQuizOrchestrator() {
  // Add questionType state
  const {
    selectedQuestionType,
    handleQuestionTypeChange,
    getPromptTemplate
  } = useQuestionType()

  // Combine all the hooks
  const quizState = useQuizState()
  const promptInputState = usePromptInput()
  const aiFeedbackState = useAIFeedback()
  const tutorialState = useTutorialAndModals()
  const masteryState = useMasteryTracking()

  // Keep a reference to the initial full question set (synchronized on mount / restored from storage)
  const savedSession = loadSavedSession()
  const originalOutputRef = useRef<QuestionData | null>(
    savedSession?.originalOutput || quizState.output
  )

  // Local evaluation state for instantaneous feedback (especially Multiple Choice)
  const [localFeedback, setLocalFeedback] = useState<ParsedFeedback[]>(() => {
    return savedSession?.localFeedback || []
  })

  // Ensure originalOutputRef stays populated if output becomes available
  useEffect(() => {
    if (!originalOutputRef.current && quizState.output) {
      originalOutputRef.current = quizState.output
    }
  }, [quizState.output])

  // Automatically evaluate Multiple Choice questions locally when quiz completes
  useEffect(() => {
    if (quizState.isCompleted && originalOutputRef.current?.questions && quizState.userAnswers.length > 0) {
      const evaluation = evaluateQuizAnswers(
        originalOutputRef.current.questions,
        quizState.userAnswers,
        masteryState.masteryMap
      )

      if (evaluation.hasEvaluatedItems) {
        setLocalFeedback(prev => {
          const updated = [...prev]
          for (const item of evaluation.localFeedback) {
            const idx = updated.findIndex(f => f.number === item.number)
            if (idx !== -1) {
              updated[idx] = item
            } else {
              updated.push(item)
            }
          }
          return updated.sort((a, b) => a.number - b.number)
        })

        masteryState.applyLocalMastery(evaluation.masteryMapUpdates, originalOutputRef.current.questions)
      }
    }
  }, [quizState.isCompleted, quizState.userAnswers])

  // Auto-save active session to localStorage whenever state changes
  useEffect(() => {
    if (quizState.output || promptInputState.promptInput) {
      saveSession({
        output: quizState.output,
        originalOutput: originalOutputRef.current,
        userAnswers: quizState.userAnswers,
        currentQuestionIndex: quizState.currentQuestionIndex,
        currentAnswer: quizState.currentAnswer,
        isQuizMode: quizState.isQuizMode,
        isCompleted: quizState.isCompleted,
        isCodeMode: quizState.isCodeMode,
        promptInput: promptInputState.promptInput,
        aiFeedback: aiFeedbackState.aiFeedback,
        localFeedback,
        masteryMap: masteryState.masteryMap,
        currentRound: masteryState.currentRound
      })
    }
  }, [
    quizState.output,
    quizState.userAnswers,
    quizState.currentQuestionIndex,
    quizState.currentAnswer,
    quizState.isQuizMode,
    quizState.isCompleted,
    quizState.isCodeMode,
    promptInputState.promptInput,
    aiFeedbackState.aiFeedback,
    localFeedback,
    masteryState.masteryMap,
    masteryState.currentRound
  ])

  // Modify handleCopyBasePrompt to use the selected question type
  const handleCopyBasePrompt = () => {
    tutorialState.setIsTopicModalOpen(true)
  }

  const handleTopicSubmit = async () => {
    if (!tutorialState.topicInput.trim()) {
      toast.error("Please enter a topic", {
        description: "The topic cannot be empty",
        duration: 2000,
      })
      return
    }

    try {
      const promptText = getPromptTemplate(tutorialState.topicInput)
      await navigator.clipboard.writeText(promptText)
      toast.success("Template copied!", {
        description: "You can now paste this into your AI assistant",
        duration: 2000,
      })
      tutorialState.setTopicInput("")
      tutorialState.setIsTopicModalOpen(false)
    } catch (error) {
      console.error("Error copying template:", error)
      toast.error("Failed to copy template", {
        description: "Please try again or copy manually",
        duration: 2000,
      })
    }
  }

  const { setOutput } = quizState

  // Watch for changes in promptInputState.output and update quizState
  useEffect(() => {
    if (promptInputState.output) {
      setOutput(promptInputState.output)
    }
  }, [promptInputState.output, setOutput])

  function handlePromptInput(value: string) {
    const result = promptInputState.handlePromptInput(value)
    if (result) {
      quizState.setOutput(result)
      originalOutputRef.current = result
      setLocalFeedback([])
      masteryState.resetMastery() // Reset mastery on new paste
    }
  }

  async function handlePastePromptFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      if (!text.trim()) {
        toast.error("Clipboard is empty", { duration: 2000 })
        return
      }
      promptInputState.setPromptInput(text)
      const result = promptInputState.handlePromptInput(text)
      if (result) {
        quizState.setOutput(result)
        originalOutputRef.current = result
        setLocalFeedback([])
        masteryState.resetMastery()
        toast.success("Questions loaded from clipboard!", { duration: 2000 })
      }
    } catch (err) {
      console.error("Clipboard read error:", err)
      toast.error("Could not read from clipboard. Please paste manually.", { duration: 2500 })
    }
  }

  function copyToClipboard(text: string, message: string = "Copied to clipboard!") {
    navigator.clipboard.writeText(text)
    toast.success(message, {
      description: "You can now paste this content wherever you need it.",
      duration: 2000,
    })
  }

  function handleReset() {
    promptInputState.setPromptInput('')
    quizState.setCurrentQuestionIndex(0)
    quizState.setUserAnswers([])
    quizState.setCurrentAnswer('')
    promptInputState.setError(null)
    quizState.setOutput(null)
    originalOutputRef.current = null
    quizState.setIsQuizMode(false)
    quizState.setIsCompleted(false)
    aiFeedbackState.setAIFeedback('')
    setLocalFeedback([])
    masteryState.resetMastery()
  }

  function handleStartFresh() {
    clearSavedSession()
    handleReset()
    toast.success("Started fresh!", {
      description: "All stored questions and answers cleared.",
      duration: 2000
    })
  }

  function handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>, isCodeMode: boolean) {
    if (e.key === 'Enter') {
      if (isCodeMode || e.shiftKey) {
        // In code mode or with shift key, allow new lines
        return
      } else {
        // In normal mode without shift key, go to next question
        e.preventDefault()
        quizState.handleNextQuestion()
      }
    }
  }

  function handleKeyPressStart(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' && quizState.output && !quizState.isCompleted) {
      quizState.handleStartQuiz()
    }
  }

  async function handlePasteFeedback() {
    try {
      const text = await navigator.clipboard.readText()
      aiFeedbackState.setAIFeedback(text)
      aiFeedbackState.setActiveTab('feedback')
      
      // Auto-apply to mastery progress
      const questionsList = originalOutputRef.current?.questions || quizState.output?.questions || []
      const parsed = aiFeedbackState.parseAIFeedback(text, quizState.userAnswers, questionsList)
      if (parsed.length > 0 && questionsList.length > 0) {
        masteryState.updateMastery(parsed, questionsList)
      }

      toast.success("Feedback pasted!", {
        description: "AI feedback has been successfully applied to your progress.",
        duration: 2000,
      })
    } catch (error) {
      console.error("Error pasting from clipboard:", error)
      toast.error("Failed to paste", {
        description: "Please make sure you have content copied to your clipboard.",
        duration: 2000,
      })
      promptInputState.setError({
        message: "Failed to paste from clipboard",
        type: 'parse'
      })
    }
  }

  function handleRetryFailed() {
    if (!originalOutputRef.current) return

    // Guard: Check if any evaluations exist
    const evaluatedCount = Object.keys(masteryState.masteryMap).length
    if (evaluatedCount === 0 && !aiFeedbackState.aiFeedback) {
      toast.error("Evaluation required", {
        description: "Please paste AI feedback first to evaluate your answers before retrying.",
        duration: 3000
      })
      return
    }

    // Get the current failed questions from the mastery map vs the original full set
    const failedQuestions = originalOutputRef.current.questions.filter(
      q => !masteryState.masteryMap[q.number]?.isMastered
    )

    if (failedQuestions.length === 0) {
      toast.success("All questions mastered!")
      return
    }
    
    // Reset quiz state and subset the questions
    quizState.setOutput({ questions: failedQuestions })
    quizState.setCurrentQuestionIndex(0)
    quizState.setUserAnswers([])
    quizState.setCurrentAnswer('')
    
    // Crucially, transition back to quiz mode immediately
    quizState.setIsCompleted(false)
    quizState.setIsQuizMode(true)
    
    // Clear external AI feedback so the tabs reset for the new attempt
    aiFeedbackState.setAIFeedback('')
    aiFeedbackState.setActiveTab('prompt')
    toast.success(`Retrying ${failedQuestions.length} questions`)
  }

  return {
    // Quiz state
    ...quizState,
    // Prompt input state
    ...promptInputState,
    // AI feedback state
    ...aiFeedbackState,
    // Local feedback
    localFeedback,
    // Tutorial state
    ...tutorialState,
    // Question type state
    selectedQuestionType,
    handleQuestionTypeChange,
    // Mastery state
    ...masteryState,
    handleRetryFailed,
    originalTotalCount: originalOutputRef.current?.questions.length || 0,
    // Additional functions
    copyToClipboard,
    handleReset,
    handleStartFresh,
    handleJumpToQuestion: quizState.handleJumpToQuestion,
    handleKeyPress,
    handleKeyPressStart,
    handlePasteFeedback,
    handlePastePromptFromClipboard,
    handlePromptInput,
    handleCopyBasePrompt,
    handleTopicSubmit,
    isCodeMode: quizState.isCodeMode,
    setIsCodeMode: quizState.setIsCodeMode
  }
}
