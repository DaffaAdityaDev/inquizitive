import { useEffect, useState } from 'react'
import { useQuizState } from './useQuizState'
import { usePromptInput } from './usePromptInput'
import { useAIFeedback } from './useAIFeedback'
import { useTutorialAndModals } from './useTutorialAndModals'
import { useQuestionType } from './useQuestionType'
import { toast } from 'sonner'
import { generateTemplate } from '../services/geminiService'
import { useModelContext } from '../context/ModelContext'
import { QuestionType } from '../types'

export function useQuestionConverter() {
  // Model selection from context
  const { selectedModel } = useModelContext()
  // State for direct AI generation of question templates
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false)
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false)

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

  /**
   * Generate the question template directly via the Gemini API
   */
  async function handleGenerateTemplate() {
    if (!tutorialState.topicInput.trim()) {
      toast.error("Please enter a topic", { description: "The topic cannot be empty", duration: 2000 })
      return
    }
    setIsGeneratingTemplate(true)
    try {
      const basePrompt = getPromptTemplate(tutorialState.topicInput)
      console.log("handleGenerateTemplate: sending prompt to Gemini:", basePrompt)
      const aiResponse = await generateTemplate(basePrompt, selectedModel)
      // Update the prompt input and derived output
      promptInputState.setPromptInput(aiResponse)
      const parsed = promptInputState.handlePromptInput(aiResponse)
      if (parsed) {
        quizState.setOutput(parsed)
        tutorialState.setTopicInput("")
        tutorialState.setIsTopicModalOpen(false)
        toast.success("Template generated!", { description: "Questions generated successfully", duration: 2000 })
      } else {
        toast.error("Failed to parse AI response", { description: "Please try again" })
      }
    } catch (error) {
      console.error("Error generating template:", error)
      // Show the actual error message to the user for debugging
      const errMsg = error instanceof Error ? error.message : JSON.stringify(error)
      toast.error("Failed to generate template", {
        description: errMsg,
        duration: 4000,
      })
    } finally {
      setIsGeneratingTemplate(false)
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

  /**
   * Generate feedback evaluation directly via the Gemini API
   */
  async function handleGenerateFeedback() {
    if (!quizState.userAnswers.length || !quizState.output) {
      toast.error('No answers available to evaluate')
      return
    }
    setIsGeneratingFeedback(true)
    try {
      const evalPrompt = aiFeedbackState.generateAIPrompt(quizState.userAnswers.map(a => ({ ...a, type: a.questionType || QuestionType.OPEN_ENDED })), quizState.output)
      const aiResponse = await generateTemplate(evalPrompt, selectedModel)
      aiFeedbackState.setAIFeedback(aiResponse)
      toast.success('Feedback generated!', { description: 'AI evaluation completed', duration: 2000 })
    } catch (error) {
      console.error('Error generating feedback:', error)
      const errMsg = error instanceof Error ? error.message : JSON.stringify(error)
      toast.error('Failed to generate feedback', { description: errMsg, duration: 4000 })
    } finally {
      setIsGeneratingFeedback(false)
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
    handleGenerateTemplate,
    isGeneratingTemplate,
    isCodeMode: quizState.isCodeMode,
    setIsCodeMode: quizState.setIsCodeMode,
    handleGenerateFeedback,
    isGeneratingFeedback
  }
}
