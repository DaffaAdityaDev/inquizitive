import { useEffect } from 'react'
import { useQuizState } from './useQuizState'
import { usePromptInput } from './usePromptInput'
import { useAIFeedback } from './useAIFeedback'
import { useTutorialAndModals } from './useTutorialAndModals'
import { toast } from 'sonner'

export function useQuestionConverter() {
  // Combine all the hooks
  const quizState = useQuizState()
  const promptInputState = usePromptInput()
  const aiFeedbackState = useAIFeedback()
  const tutorialState = useTutorialAndModals()

  // Watch for changes in promptInputState.output and update quizState
  useEffect(() => {
    if (promptInputState.output) {
      quizState.setOutput(promptInputState.output)
    }
  }, [promptInputState.output])

  function handlePromptInput(value: string) {
    const result = promptInputState.handlePromptInput(value)
    if (result) {
      quizState.setOutput(result)
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
    quizState.setIsQuizMode(false)
    quizState.setIsCompleted(false)
    aiFeedbackState.setAIFeedback('')
  }

  function handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      if (quizState.isCodeMode) {
        return
      } else if (!e.shiftKey) {
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
      toast.success("Feedback pasted!", {
        description: "AI feedback has been successfully pasted.",
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

  return {
    // Quiz state
    ...quizState,
    // Prompt input state
    ...promptInputState,
    // AI feedback state
    ...aiFeedbackState,
    // Tutorial state
    ...tutorialState,
    // Additional functions
    copyToClipboard,
    handleReset,
    handleKeyPress,
    handleKeyPressStart,
    handlePasteFeedback,
    handlePromptInput,
  }
}
