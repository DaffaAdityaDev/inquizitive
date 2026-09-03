import { useState } from 'react'
import { QuestionData, UserAnswer, QuestionType, ErrorType } from '../../../shared/types'
import { toast } from 'sonner'
import { loadSavedSession } from './useQuizPersistence'

export function useQuizState() {
  // Core quiz state: synchronously restored from saved session on initial render
  const [output, setOutput] = useState<QuestionData | null>(() => {
    const saved = loadSavedSession()
    return saved?.output || null
  })
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => {
    const saved = loadSavedSession()
    return saved?.currentQuestionIndex ?? 0
  })
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>(() => {
    const saved = loadSavedSession()
    return saved?.userAnswers || []
  })
  const [currentAnswer, setCurrentAnswer] = useState(() => {
    const saved = loadSavedSession()
    return saved?.currentAnswer || ''
  })
  const [isQuizMode, setIsQuizMode] = useState(() => {
    const saved = loadSavedSession()
    return !!saved?.isQuizMode
  })
  const [isCompleted, setIsCompleted] = useState(() => {
    const saved = loadSavedSession()
    return !!saved?.isCompleted
  })
  const [isCodeMode, setIsCodeMode] = useState(() => {
    const saved = loadSavedSession()
    return !!saved?.isCodeMode
  })
  const [error, setError] = useState<ErrorType | null>(null)

  const handleStartQuiz = () => {
    if (!output || !output.questions || output.questions.length === 0) {
      setError({
        message: "No questions available",
        type: 'quiz'
      })
      return
    }
    
    // Resume at first unanswered question if answers already exist, otherwise start at 0
    let startIndex = 0
    if (userAnswers.length > 0) {
      const firstUnansweredIndex = output.questions.findIndex(
        q => !userAnswers.some(a => a.number === q.number)
      )
      if (firstUnansweredIndex !== -1) {
        startIndex = firstUnansweredIndex
      }
    } else {
      setUserAnswers([])
    }

    setCurrentQuestionIndex(startIndex)
    const activeQuestion = output.questions[startIndex]
    const existingAnswer = userAnswers.find(a => a.number === activeQuestion?.number)
    setCurrentAnswer(existingAnswer?.provided_answer || '')
    setIsQuizMode(true)
    setError(null)
  }

  const isQuestionAnswered = (index: number) => {
    return userAnswers.some(answer => 
      answer.number === output?.questions[index].number
    )
  }

  const areAllQuestionsAnswered = () => {
    if (!output?.questions) return false
    return output.questions.every((_, index) => isQuestionAnswered(index))
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      // Save current answer if it exists
      if (currentAnswer.trim()) {
        handleSaveAnswer()
      }
      
      const prevIndex = currentQuestionIndex - 1
      setCurrentQuestionIndex(prevIndex)
      
      // Load previous answer if it exists
      const prevAnswer = userAnswers.find(
        answer => answer.number === output?.questions[prevIndex].number
      )
      setCurrentAnswer(prevAnswer?.provided_answer || '')
    }
  }

  const validateAnswer = (answer: string, questionType: QuestionType) => {
    if (!answer || !answer.trim()) {
      setError({
        message: questionType === QuestionType.MULTIPLE_CHOICE
          ? "Please select an option to continue"
          : "Please provide an answer before advancing",
        type: 'validation'
      })
      return false
    }
    return true
  }

  const handleNextQuestion = () => {
    if (!output?.questions) return

    const currentQuestion = output.questions[currentQuestionIndex]
    
    if (!validateAnswer(currentAnswer, currentQuestion.type)) {
      return
    }

    // Save the answer
    setUserAnswers(prev => [
      ...prev.filter(a => a.number !== currentQuestion.number),
      {
        number: currentQuestion.number,
        question: currentQuestion.question,
        provided_answer: currentAnswer,
        type: currentQuestion.type,
        questionType: currentQuestion.type
      }
    ])

    // Move to next question or complete
    if (currentQuestionIndex < output.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1
      const nextQuestion = output.questions[nextIndex]
      const existingNextAnswer = userAnswers.find(a => a.number === nextQuestion?.number)
      
      setCurrentQuestionIndex(nextIndex)
      setCurrentAnswer(existingNextAnswer?.provided_answer || '')
      setError(null)
    } else {
      setIsCompleted(true)
      setIsQuizMode(false)
    }
  }

  const handleJumpToQuestion = (targetIndex: number) => {
    if (!output?.questions || targetIndex < 0 || targetIndex >= output.questions.length) return
    if (targetIndex === currentQuestionIndex) return

    // Auto-save current answer if provided
    if (currentAnswer.trim()) {
      handleSaveAnswer()
    }

    setCurrentQuestionIndex(targetIndex)
    const targetQuestion = output.questions[targetIndex]
    const targetAnswer = userAnswers.find(a => a.number === targetQuestion.number)
    setCurrentAnswer(targetAnswer?.provided_answer || '')
    setError(null)
  }

  const handleSaveAnswer = () => {
    if (!output?.questions) return

    const currentQuestion = output.questions[currentQuestionIndex]
    const newAnswer: UserAnswer = {
      number: currentQuestion.number,
      question: currentQuestion.question,
      provided_answer: currentAnswer,
      type: currentQuestion.type,
      questionType: currentQuestion.type
    }

    setUserAnswers(prev => {
      const filtered = prev.filter(a => a.number !== newAnswer.number)
      return [...filtered, newAnswer]
    })
    setError(null)
  }

  const handleReset = () => {
    setCurrentQuestionIndex(0)
    setUserAnswers([])
    setCurrentAnswer('')
    setError(null)
    setOutput(null)
    setIsQuizMode(false)
    setIsCompleted(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, _isCodeMode: boolean) => {
    // Ctrl+Enter or Cmd+Enter advances immediately
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleNextQuestion()
      return
    }

    // For single-line inputs, Enter advances; textareas allow normal newlines
    const isTextarea = (e.target as HTMLElement)?.tagName === 'TEXTAREA'
    if (e.key === 'Enter' && !isTextarea) {
      e.preventDefault()
      handleNextQuestion()
    }
  }

  const handleKeyPressStart = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && output && !isCompleted) {
      handleStartQuiz()
    }
  }

  const getCurrentProgress = () => {
    if (!output?.questions.length) return 0
    return ((currentQuestionIndex + 1) / output.questions.length) * 100
  }

  const copyToClipboard = (text: string, message: string = "Copied to clipboard!") => {
    navigator.clipboard.writeText(text)
    toast.success(message, {
      description: "You can now paste this content wherever you need it.",
      duration: 2000,
    })
  }

  return {
    // State
    output,
    setOutput,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    userAnswers,
    setUserAnswers,
    currentAnswer,
    setCurrentAnswer,
    isQuizMode,
    setIsQuizMode,
    isCompleted,
    setIsCompleted,
    isCodeMode,
    setIsCodeMode,
    error,
    setError,

    // Functions
    handleStartQuiz,
    handleNextQuestion,
    handleReset,
    handleKeyPress,
    handleKeyPressStart,
    getCurrentProgress,
    copyToClipboard,
    handlePreviousQuestion,
    handleJumpToQuestion,
    isQuestionAnswered,
    areAllQuestionsAnswered
  }
}
