import { forwardRef, useMemo, useState, type ReactNode } from 'react'
import { Card, CardBody, Button, Tabs, Tab, Chip } from '@nextui-org/react'
import {
  CheckCircleIcon,
  CheckIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  PlayIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import ErrorDisplay from '../../../../shared/components/ErrorDisplay'
import { ConfirmDialog } from '../../../../shared/components/ConfirmDialog'
import { QuestionData, QuestionType } from '../../../../shared/types'
import {
  DIFFICULTY_LABELS,
  LANGUAGE_LABELS,
  PromptQuestionType,
  QUESTION_TYPE_LABELS
} from '../../../prompts'
import type { QuizSession } from '../../hooks/useQuizSession'
import { viewTransition } from './viewTransition'
import { LearnerPanel } from '../../../learner/components/LearnerPanel'

interface HomeViewProps {
  session: QuizSession
}

type StepStatus = 'done' | 'active' | 'upcoming'

const STEP_TITLES = ['Copy prompt', 'Paste AI\'s JSON', 'Start quiz']

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

function summarizeQuestions(output: QuestionData): string {
  const total = output.questions.length
  const mcq = output.questions.filter(q => q.type === QuestionType.MULTIPLE_CHOICE).length
  const parts = [plural(total, 'question')]
  if (mcq > 0) parts.push(`${mcq} multiple choice`)
  if (total - mcq > 0) parts.push(`${total - mcq} open-ended`)
  return parts.join(' · ')
}

function StepBadge({ index, status }: { index: number; status: StepStatus }) {
  const styles = {
    done: 'bg-success text-success-foreground border-success',
    active: 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30',
    upcoming: 'bg-content2 text-default-400 border-default-200'
  }[status]

  return (
    <div className={`flex-shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-colors ${styles}`}>
      {status === 'done' ? <CheckIcon className="w-5 h-5" strokeWidth={3} /> : index + 1}
    </div>
  )
}

function Stepper({ statuses }: { statuses: StepStatus[] }) {
  return (
    <ol className="flex items-center w-full" aria-label="Quiz setup progress">
      {STEP_TITLES.map((title, i) => (
        <li
          key={title}
          className={`flex items-center ${i < STEP_TITLES.length - 1 ? 'flex-1' : ''}`}
          aria-current={statuses[i] === 'active' ? 'step' : undefined}
        >
          <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2">
            <StepBadge index={i} status={statuses[i]} />
            <span
              className={`text-xs sm:text-sm font-semibold text-center whitespace-nowrap ${
                statuses[i] === 'upcoming' ? 'text-default-400' : 'text-default-800'
              }`}
            >
              {title}
            </span>
          </div>
          {i < STEP_TITLES.length - 1 && (
            <div className="flex-1 h-0.5 mx-2 sm:mx-4 rounded-full bg-default-200 overflow-hidden self-start mt-[17px] sm:self-center sm:mt-0">
              <motion.div
                className="h-full bg-success"
                initial={false}
                animate={{ width: statuses[i] === 'done' ? '100%' : '0%' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          )}
        </li>
      ))}
    </ol>
  )
}

interface StepCardProps {
  index: number
  status: StepStatus
  title: string
  description: string
  action?: ReactNode
  children: ReactNode
}

function StepCard({ index, status, title, description, action, children }: StepCardProps) {
  return (
    <Card
      className={`border shadow-xl bg-content1/70 backdrop-blur-md transition-colors ${
        status === 'active' ? 'border-primary/50' : 'border-divider'
      }`}
    >
      <CardBody className="p-5 md:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-start gap-3">
            <StepBadge index={index} status={status} />
            <div>
              <h2 className="text-lg font-bold text-default-900">{title}</h2>
              <p className="text-sm text-default-500">{description}</p>
            </div>
          </div>
          {action}
        </div>
        {children}
      </CardBody>
    </Card>
  )
}

// forwardRef is required: AnimatePresence mode="popLayout" measures its children via ref
export const HomeView = forwardRef<HTMLDivElement, HomeViewProps>(function HomeView({ session }, ref) {
  const {
    output,
    userAnswers,
    promptInput,
    error,
    promptOptions,
    hasCopiedPrompt,
    selectedQuestionType,
    handleQuestionTypeChange,
    openTutorial,
    handleCopyBasePrompt,
    handlePromptInput,
    handlePastePromptFromClipboard,
    handleKeyPressStart,
    handleStartQuiz,
    handleStartFresh,
    learnerProfile,
    dueConcepts,
    handleCopyReviewPrompt,
    handleResetLearnerHistory
  } = session

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const hasQuestions = !!output
  const statuses: StepStatus[] = [
    hasCopiedPrompt || hasQuestions ? 'done' : 'active',
    hasQuestions ? 'done' : hasCopiedPrompt ? 'active' : 'upcoming',
    hasQuestions ? 'active' : 'upcoming'
  ]

  const questionSummary = useMemo(() => (output ? summarizeQuestions(output) : ''), [output])
  const optionsSummary = [
    plural(promptOptions.count, 'question'),
    DIFFICULTY_LABELS[promptOptions.difficulty],
    LANGUAGE_LABELS[promptOptions.language],
    promptOptions.sourceMaterial.trim() ? 'from your material' : null
  ].filter(Boolean).join(' · ')

  const confirmStartFresh = () => {
    setIsConfirmOpen(false)
    handleStartFresh()
  }

  return (
    <motion.div
      ref={ref}
      {...viewTransition}
      className="max-w-4xl mx-auto p-4 space-y-6 will-change-transform"
    >
      <div className="relative text-center space-y-4 py-10 sm:py-14 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-100/40 via-transparent to-secondary-100/40 rounded-3xl -z-10" />
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl mb-2 shadow-inner border border-primary/10">
          <SparklesIcon className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-default-900 to-default-600 pb-2">
          Master Anything with <span className="text-primary bg-none">Inquizitive</span>
        </h1>
        <p className="text-lg sm:text-xl text-default-500 max-w-2xl mx-auto leading-relaxed">
          Turn any topic or your own study notes into an interactive quiz using a free AI chat
          like ChatGPT or Gemini. No API key needed.
        </p>
        <motion.div whileTap={{ scale: 0.96 }} className="inline-block">
          <Button
            color="primary"
            variant="light"
            size="sm"
            startContent={<QuestionMarkCircleIcon className="w-5 h-5" />}
            onClick={openTutorial}
            className="font-semibold"
          >
            How it works
          </Button>
        </motion.div>
      </div>

      <LearnerPanel
        profile={learnerProfile}
        dueConcepts={dueConcepts}
        onCopyReviewPrompt={handleCopyReviewPrompt}
        onResetHistory={handleResetLearnerHistory}
      />

      <div className="px-1 sm:px-4">
        <Stepper statuses={statuses} />
      </div>

      <div className="flex flex-col gap-5">
        <StepCard
          index={0}
          status={statuses[0]}
          title="Copy the quiz prompt"
          description="Choose a question type, then set the topic and options. Paste the copied prompt into ChatGPT, Gemini or any free AI chat."
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <Tabs
                aria-label="Question type"
                size="md"
                color="primary"
                variant="solid"
                radius="full"
                selectedKey={selectedQuestionType}
                onSelectionChange={(k) => handleQuestionTypeChange(k as string)}
                classNames={{
                  base: 'w-full sm:w-auto',
                  tabList: 'w-full sm:w-auto bg-default-100 border border-default-200',
                  cursor: 'bg-background shadow-sm'
                }}
              >
                {(Object.keys(QUESTION_TYPE_LABELS) as PromptQuestionType[]).map(type => (
                  <Tab key={type} title={QUESTION_TYPE_LABELS[type]} />
                ))}
              </Tabs>
              <p className="text-xs text-default-400 px-1">{optionsSummary}</p>
            </div>
            <motion.div whileTap={{ scale: 0.96 }} className="w-full md:w-auto">
              <Button
                color="secondary"
                variant={statuses[0] === 'active' ? 'shadow' : 'flat'}
                startContent={<ClipboardDocumentListIcon className="w-5 h-5" />}
                onClick={handleCopyBasePrompt}
                className="font-bold w-full md:w-auto shadow-secondary/30"
              >
                {hasCopiedPrompt ? 'Copy Again' : 'Copy Prompt'}
              </Button>
            </motion.div>
          </div>
        </StepCard>

        <StepCard
          index={1}
          status={statuses[1]}
          title="Paste the AI's JSON"
          description="Copy the AI's whole reply and paste it below."
          action={
            <motion.div whileTap={{ scale: 0.96 }} className="w-full sm:w-auto">
              <Button
                size="sm"
                color="primary"
                variant="flat"
                startContent={<ClipboardDocumentCheckIcon className="w-4 h-4" />}
                onClick={handlePastePromptFromClipboard}
                className="font-semibold shadow-sm w-full sm:w-auto"
              >
                Paste from Clipboard
              </Button>
            </motion.div>
          }
        >
          <div className="space-y-3">
            <textarea
              id="prompt-input"
              aria-label="Paste AI-generated JSON response"
              aria-describedby="prompt-input-status"
              className="w-full min-h-[220px] p-4 rounded-xl border-2 border-default-200 bg-content2 focus:border-primary focus:ring-0 transition-all font-mono text-sm resize-none placeholder:text-default-400"
              value={promptInput}
              onChange={(e) => handlePromptInput(e.target.value)}
              placeholder={`Paste your AI assistant's reply here (Ctrl+Enter to start). Example:\n<output>\n{\n  "questions": [\n    {\n      "number": 1,\n      "type": "OPEN_ENDED",\n      "question": "What is the event loop in JavaScript?",\n      "expected_answer": "A mechanism that coordinates async execution..."\n    }\n  ]\n}\n</output>`}
              onKeyDown={handleKeyPressStart}
            />

            <div id="prompt-input-status" aria-live="polite">
              {output && (
                <Chip
                  color="success"
                  variant="flat"
                  startContent={<CheckCircleIcon className="w-4 h-4" />}
                  classNames={{ base: 'max-w-full h-auto py-1', content: 'font-semibold whitespace-normal' }}
                >
                  {questionSummary}
                </Chip>
              )}
              {error && <ErrorDisplay error={error.message} />}
            </div>
          </div>
        </StepCard>

        <StepCard
          index={2}
          status={statuses[2]}
          title="Start the quiz"
          description="Multiple choice is graded instantly; open-ended answers get feedback from the AI afterwards."
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.div whileTap={{ scale: 0.98 }} className="flex-1">
              <Button
                color="primary"
                size="lg"
                className="w-full font-bold h-14 text-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                onClick={handleStartQuiz}
                isDisabled={!output}
                startContent={<PlayIcon className="w-6 h-6" />}
              >
                {output
                  ? (userAnswers.length > 0
                      ? `Resume Quiz (${userAnswers.length}/${output.questions.length} Answered)`
                      : `Start Quiz (${output.questions.length} Questions)`)
                  : 'Start Quiz'}
              </Button>
            </motion.div>
            {(promptInput || output) && (
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  variant="flat"
                  color="default"
                  className="h-14 w-full sm:w-auto font-semibold text-default-600 px-6"
                  onClick={() => setIsConfirmOpen(true)}
                  startContent={<TrashIcon className="w-5 h-5 text-default-500" />}
                >
                  Start Fresh
                </Button>
              </motion.div>
            )}
          </div>
        </StepCard>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Start fresh?"
        message="This clears the pasted questions, your answers, feedback and mastery progress. This can't be undone."
        confirmLabel="Start Fresh"
        color="danger"
        onConfirm={confirmStartFresh}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </motion.div>
  )
})
