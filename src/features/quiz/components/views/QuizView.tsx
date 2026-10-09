import { forwardRef, useEffect, useRef, useState } from 'react'
import {
  Card,
  CardBody,
  Button,
  Progress,
  Tooltip,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@nextui-org/react'
import {
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  EllipsisVerticalIcon,
  ArrowLeftStartOnRectangleIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import ErrorDisplay from '../../../../shared/components/ErrorDisplay'
import { ConfirmDialog } from '../../../../shared/components/ConfirmDialog'
import { QuestionType, MultipleChoiceQuestion } from '../../../../shared/types'
import type { QuizSession } from '../../hooks/useQuizSession'
import { QuizQuestion } from '../QuizQuestion'
import { QuestionNavigator } from '../QuestionNavigator'
import { ConfidencePicker } from '../ConfidencePicker'
import { viewTransition } from './viewTransition'

interface QuizViewProps {
  session: QuizSession
}

function isTypingOrOverlayTarget(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  if (!target) return false
  if (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return true
  return Boolean(target.closest('[role="dialog"], [role="menu"]') || document.querySelector('[role="dialog"]'))
}

export const QuizView = forwardRef<HTMLDivElement, QuizViewProps>(function QuizView({ session }, ref) {
  const {
    output,
    userAnswers,
    currentQuestionIndex,
    currentQuestion,
    currentAnswer,
    currentConfidence,
    currentRound,
    progress,
    isCodeMode,
    error,
    setCurrentAnswer,
    setConfidence,
    handleAnswerUnknown,
    toggleCodeMode,
    handleKeyPress,
    handleJumpToQuestion,
    handlePreviousQuestion,
    handleNextQuestion,
    handleStartFresh
  } = session

  const [isQuitConfirmOpen, setIsQuitConfirmOpen] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const totalQuestions = output?.questions.length ?? 0
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1
  const isMultipleChoice = currentQuestion?.type === QuestionType.MULTIPLE_CHOICE
  // Retry rounds keep the original numbers so the quiz and the results agree
  const questionNumber = currentQuestion?.number ?? currentQuestionIndex + 1
  const position = currentQuestionIndex + 1

  // Arrow keys move between questions without validating, like the navigator does
  const navRef = useRef({ currentQuestionIndex, totalQuestions, handleJumpToQuestion })
  navRef.current = { currentQuestionIndex, totalQuestions, handleJumpToQuestion }

  useEffect(() => {
    const handleArrowKeys = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
      if (isTypingOrOverlayTarget(e)) return

      const { currentQuestionIndex, totalQuestions, handleJumpToQuestion } = navRef.current
      const nextIndex = currentQuestionIndex + (e.key === 'ArrowLeft' ? -1 : 1)
      if (nextIndex < 0 || nextIndex >= totalQuestions) return
      e.preventDefault()
      handleJumpToQuestion(nextIndex)
    }

    window.addEventListener('keydown', handleArrowKeys)
    return () => window.removeEventListener('keydown', handleArrowKeys)
  }, [])

  // After changing question, make sure the question text isn't tucked under the sticky header
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const header = headerRef.current
    const card = cardRef.current
    if (!header || !card) return
    const headerBottom = header.getBoundingClientRect().bottom
    const cardTop = card.getBoundingClientRect().top
    if (cardTop < headerBottom + 8) {
      window.scrollBy({ top: cardTop - headerBottom - 24, behavior: 'smooth' })
    }
  }, [currentQuestionIndex])

  function confirmQuit() {
    setIsQuitConfirmOpen(false)
    handleStartFresh()
  }

  return (
    <motion.div
      ref={ref}
      {...viewTransition}
      className="max-w-4xl mx-auto px-4 py-3 sm:p-4 space-y-3 sm:space-y-6 relative will-change-transform"
    >
      <div
        ref={headerRef}
        className="sticky top-[4.5rem] sm:top-20 z-20 flex items-center gap-2 sm:gap-4 bg-background/80 backdrop-blur-xl px-3 py-2 sm:p-4 rounded-2xl border border-divider shadow-sm"
      >
        <motion.div layoutId="quiz-round-pill" className="flex-shrink-0">
          <Chip size="sm" color="secondary" variant="flat" className="font-bold">
            <span className="sm:hidden">R{currentRound}</span>
            <span className="hidden sm:inline">Round {currentRound}</span>
          </Chip>
        </motion.div>
        <span
          className="flex-shrink-0 text-xs sm:text-sm font-medium text-default-500 bg-default-100 px-2 py-0.5 rounded-md tabular-nums"
          aria-label={
            questionNumber === position
              ? `Question ${position} of ${totalQuestions}`
              : `Question ${questionNumber}, ${position} of ${totalQuestions} this round`
          }
        >
          {questionNumber === position && <span className="hidden sm:inline">Question </span>}
          {position}
          <span className="sm:hidden">/</span>
          <span className="hidden sm:inline"> of </span>
          {totalQuestions}
        </span>
        <motion.div layoutId="quiz-progress-track" className="flex-1 min-w-0">
          <Progress
            value={progress}
            className="w-full"
            color="primary"
            size="sm"
            radius="full"
            aria-label="Quiz progress"
          />
        </motion.div>
        <div className="flex flex-shrink-0 gap-1 sm:gap-2 items-center">
          <Tooltip content="Switch input mode (Normal / Code)">
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              onPress={toggleCodeMode}
              color={isCodeMode ? 'primary' : 'default'}
              isDisabled={isMultipleChoice}
              aria-label={isCodeMode ? 'Switch to normal input' : 'Switch to code input'}
              className="shadow-sm font-mono font-bold sm:w-10 sm:h-10"
            >
              {isCodeMode ? 'JS' : 'Aa'}
            </Button>
          </Tooltip>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                aria-label="Quiz options"
                className="shadow-sm sm:w-10 sm:h-10"
              >
                <EllipsisVerticalIcon className="w-5 h-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Quiz options"
              onAction={(key) => key === 'quit' && setIsQuitConfirmOpen(true)}
            >
              <DropdownItem
                key="quit"
                color="danger"
                className="text-danger"
                description="Clears questions, answers and progress"
                startContent={<ArrowLeftStartOnRectangleIcon className="w-5 h-5" />}
              >
                Quit to home
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {output && (
        <QuestionNavigator
          questions={output.questions}
          currentIndex={currentQuestionIndex}
          userAnswers={userAnswers}
          onJump={handleJumpToQuestion}
        />
      )}

      {/* FLIP Layout-morphing Question Container */}
      <motion.div
        ref={cardRef}
        layout
        layoutId="quiz-card-morph"
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="mt-5 sm:mt-4"
      >
        <Card className="border border-divider shadow-xl bg-content1 overflow-visible relative">
          <motion.div
            key={`chip-${currentQuestionIndex}`}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 450, damping: 25 }}
            className="absolute -top-3 sm:-top-4 right-4 sm:right-6 z-10"
          >
            <Chip
              color="primary"
              variant="shadow"
              size="sm"
              className="font-black text-tiny tracking-widest uppercase px-2 sm:px-3 shadow-primary/40"
            >
              {currentQuestion?.type.replace('_', ' ')}
            </Chip>
          </motion.div>

          <CardBody className="p-4 pt-6 sm:p-8 md:p-12 overflow-hidden">
            <motion.div
              key={`q-${currentQuestionIndex}`}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              className="min-w-0"
            >
              <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-4 mb-4 sm:mb-8">
                <motion.span
                  key={`badge-${currentQuestionIndex}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                  className="text-5xl font-black text-primary/15 leading-none select-none hidden sm:block"
                >
                  Q{questionNumber}
                </motion.span>
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="text-xs font-bold text-primary uppercase tracking-widest sm:hidden">Question {questionNumber}</span>
                  <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-default-900 leading-snug sm:pt-1 break-words">
                    {currentQuestion?.question}
                  </h3>
                </div>
              </div>

              <div className="sm:py-2 sm:min-h-[160px]">
                <QuizQuestion
                  type={currentQuestion?.type as QuestionType}
                  options={(currentQuestion as MultipleChoiceQuestion)?.options}
                  value={currentAnswer}
                  onChange={setCurrentAnswer}
                  onKeyDown={handleKeyPress}
                  onSubmit={handleNextQuestion}
                  isCodeMode={isCodeMode}
                />
                {error && <div className="mt-4"><ErrorDisplay error={error.message} /></div>}
                <ConfidencePicker
                  value={currentConfidence}
                  onChange={setConfidence}
                  onUnknown={handleAnswerUnknown}
                />
              </div>
            </motion.div>
          </CardBody>
        </Card>
      </motion.div>

      <div className="sticky bottom-3 sm:bottom-6 z-20 flex flex-row justify-between items-center gap-2 sm:gap-4 p-2 sm:p-4 bg-content1/80 backdrop-blur-xl rounded-2xl border border-divider shadow-lg mt-4 sm:mt-8">
        <motion.div whileTap={{ scale: 0.96 }} className="flex-shrink-0">
          <Button
            variant="flat"
            onPress={handlePreviousQuestion}
            isDisabled={currentQuestionIndex === 0}
            aria-label="Previous question"
            startContent={<ArrowLeftIcon className="w-5 h-5 sm:mr-1" />}
            className="min-w-0 font-semibold px-3 sm:px-6 h-11 sm:h-12 rounded-xl text-sm sm:text-base"
          >
            <span className="hidden sm:inline">Previous</span>
          </Button>
        </motion.div>

        <div className="hidden sm:flex items-center gap-2 text-default-500 dark:text-zinc-400 font-semibold text-sm bg-default-100 dark:bg-zinc-800/80 px-4 py-2 rounded-full border border-default-200 dark:border-zinc-700">
          <span>{Math.round(progress)}% Complete</span>
        </div>

        <motion.div whileTap={{ scale: 0.96 }} className="flex-1 sm:flex-initial min-w-0">
          <Button
            color="primary"
            variant="shadow"
            onPress={handleNextQuestion}
            endContent={
              isLastQuestion ? (
                <CheckCircleIcon className="w-5 h-5 ml-1.5" />
              ) : (
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-tiny font-mono font-medium bg-white/25 dark:bg-black/25 text-white rounded border border-white/30 leading-none">
                    ↵
                  </span>
                  <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                </div>
              )
            }
            className="group w-full sm:w-auto font-semibold px-4 sm:px-7 h-11 sm:h-12 rounded-xl text-sm sm:text-base shadow-lg shadow-primary/30 hover:shadow-primary/40 text-white transition-all"
          >
            {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
          </Button>
        </motion.div>
      </div>

      <ConfirmDialog
        isOpen={isQuitConfirmOpen}
        title="Quit this quiz?"
        message={
          <>
            You&apos;ll go back to the home screen and <strong className="text-danger">all progress will be lost</strong>:
            the pasted questions, your answers and mastery for this session are cleared and can&apos;t be recovered.
          </>
        }
        confirmLabel="Quit and clear"
        cancelLabel="Keep going"
        color="danger"
        onConfirm={confirmQuit}
        onCancel={() => setIsQuitConfirmOpen(false)}
      />
    </motion.div>
  )
})
