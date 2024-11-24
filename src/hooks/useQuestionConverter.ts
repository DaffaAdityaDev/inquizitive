import { useEffect } from 'react'
import { useQuizState } from './useQuizState'
import { usePromptInput } from './usePromptInput'
import { useAIFeedback } from './useAIFeedback'
import { useTutorialAndModals } from './useTutorialAndModals'
import { useQuestionType } from './useQuestionType'
import { toast } from 'sonner'

export function useQuestionConverter() {
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
        description: "You can now paste this to your AI assistant",
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
    // Question type state
    selectedQuestionType,
    handleQuestionTypeChange,
    // Additional functions
    copyToClipboard,
    handleReset,
    handleKeyPress,
    handleKeyPressStart,
    handlePasteFeedback,
    handlePromptInput,
    handleCopyBasePrompt,
    handleTopicSubmit,
    isCodeMode: quizState.isCodeMode,
    setIsCodeMode: quizState.setIsCodeMode
  }
}
