import { useState } from 'react'
import { QuestionData, UserAnswer } from '../types'
import { toast } from 'sonner'

type ErrorType = {
  message: string
  type: 'parse' | 'validation' | 'quiz'
}

export function useQuizState() {
  // Core quiz state
  const [output, setOutput] = useState<QuestionData | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [isQuizMode, setIsQuizMode] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isCodeMode, setIsCodeMode] = useState(false)
  const [error, setError] = useState<ErrorType | null>(null)

  const handleStartQuiz = () => {
    if (!output || !output.questions || output.questions.length === 0) {
      setError({
        message: "No questions available",
        type: 'quiz'
      })
      return
    }
    
    setCurrentQuestionIndex(0)
    setUserAnswers([])
    setCurrentAnswer('')
    setIsQuizMode(true)
    setError(null)
  }

  const handleNextQuestion = () => {
    if (!currentAnswer.trim()) {
      setError({
        message: "Please provide an answer",
        type: 'validation'
      })
      return
    }

    if (!output?.questions) {
      setError({
        message: "No questions available",
        type: 'quiz'
      })
      return
    }

    const currentQuestion = output.questions[currentQuestionIndex]
    
    const newAnswer: UserAnswer = {
      number: currentQuestion.number,
      question: currentQuestion.question,
      provided_answer: currentAnswer
    }

    setUserAnswers(prev => [...prev, newAnswer])
    setCurrentAnswer('')
    setError(null)

    if (currentQuestionIndex < output.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      setIsQuizMode(false)
      setIsCompleted(true)
    }
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (isCodeMode) {
        return
      } else if (!e.shiftKey) {
        e.preventDefault()
        handleNextQuestion()
      }
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
    copyToClipboard
  }
}
