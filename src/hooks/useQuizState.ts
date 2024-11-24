import { useState } from 'react'
import { QuestionData, UserAnswer, QuestionType, ErrorType } from '../types'
import { toast } from 'sonner'

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
    if (questionType === QuestionType.MULTIPLE_CHOICE) {
      if (!answer.match(/^[A-D]\)/)) {
        setError({
          message: "Please select one of the provided options",
          type: 'validation'
        })
        return false
      }
    } else {
      if (!answer.trim()) {
        setError({
          message: "Please provide an answer",
          type: 'validation'
        })
        return false
      }
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
      setCurrentQuestionIndex(prev => prev + 1)
      setCurrentAnswer('')
      setError(null)
    } else {
      setIsCompleted(true)
      setIsQuizMode(false)
    }
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, isCodeMode: boolean) => {
    if (e.key === 'Enter') {
      if (isCodeMode || e.shiftKey) {
        // In code mode or with shift key, allow new lines
        return
      } else {
        // In normal mode without shift key, go to next question
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
    copyToClipboard,
    handlePreviousQuestion,
    isQuestionAnswered,
    areAllQuestionsAnswered
  }
}
