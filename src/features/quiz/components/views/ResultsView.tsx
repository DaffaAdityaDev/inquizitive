import { forwardRef, useMemo, useRef, useState } from 'react'
import { Card, CardBody, Button, Progress, Tabs, Tab, Chip } from '@nextui-org/react'
import {
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  BookOpenIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { MASTERY_THRESHOLD } from '../../../../shared/types'
import { AIFeedbackDisplay, FeedbackFocusRequest } from '../../../feedback'
import { ConfirmDialog } from '../../../../shared/components/ConfirmDialog'
import type { QuizSession } from '../../hooks/useQuizSession'
import type { ResultsTab } from '../../state/quizReducer'
import { summarizeRound, RoundItem } from '../results/roundSummary'
import { ScoreSummary } from '../results/ScoreSummary'
import { EvalSteps } from '../results/EvalSteps'
import { StudyGuide } from '../results/StudyGuide'
import { NextRoundCard } from '../results/NextRoundCard'
import { viewTransition } from './viewTransition'

interface ResultsViewProps {
  session: QuizSession
}

type PendingConfirm = 'new-topic' | 'wipe' | null

const CONFIRM_COPY = {
  'new-topic': {
    title: 'Start a new topic?',
    message: 'Your current questions, answers and mastery progress will be cleared.',
    confirmLabel: 'Start New Topic',
    color: 'primary'
  },
  wipe: {
    title: 'Wipe everything?',
    message: 'This permanently deletes all stored questions, answers, feedback and mastery progress. It cannot be undone.',
    confirmLabel: 'Wipe Everything',
    color: 'danger'
  }
} as const

export const ResultsView = forwardRef<HTMLDivElement, ResultsViewProps>(function ResultsView({ session }, ref) {
  const {
    output,
    userAnswers,
    aiFeedback,
    currentRound,
    masteredCount,
    originalTotalCount,
    isMastered,
    needsAIEval,
    hasFeedback,
    resultsTab,
    mergedFeedback,
    weakItems,
    evalPrompt,
    setActiveTab,
    handleRetryFailed,
    handlePasteFeedback,
    handleReset,
    handleStartFresh,
    handleCopyEvalPrompt,
    handleCopyStudyPrompt,
    roundFeedback,
    handleCopyAdaptivePrompt,
    handlePasteNextRound
  } = session

  const remainingCount = originalTotalCount - masteredCount
  const summary = useMemo(
    () => summarizeRound(output?.questions ?? [], userAnswers, mergedFeedback),
    [output, userAnswers, mergedFeedback]
  )

  const detailsRef = useRef<HTMLDivElement>(null)
  const [focusRequest, setFocusRequest] = useState<FeedbackFocusRequest | null>(null)
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null)

  function handleSelectItem(item: RoundItem) {
    if (item.hasFeedback) {
      setActiveTab('feedback')
      setFocusRequest({ number: item.number })
      return
    }
    if (needsAIEval) setActiveTab('prompt')
    detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function showFeedbackFor(number: number) {
    setActiveTab('feedback')
    setFocusRequest({ number })
  }

  function handleTabChange(key: ResultsTab) {
    // Drop the pending focus so revisiting the Analysis tab doesn't jump again
    setFocusRequest(null)
    setActiveTab(key)
  }

  function handleConfirm() {
    if (pendingConfirm === 'new-topic') handleReset()
    else if (pendingConfirm === 'wipe') handleStartFresh()
    setPendingConfirm(null)
  }

  const confirmCopy = pendingConfirm ? CONFIRM_COPY[pendingConfirm] : null

  return (
    <motion.div
      ref={ref}
      {...viewTransition}
      className="max-w-4xl mx-auto p-4 space-y-6 will-change-transform"
    >
      <div className="flex items-center gap-3 pt-4">
        <div className="p-2 bg-success-100 rounded-full shrink-0">
          <CheckCircleIcon className="w-6 h-6 text-success" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-default-900">Quiz Completed!</h1>
          <p className="text-sm sm:text-base text-default-500">
            {needsAIEval && !aiFeedback
              ? 'Multiple choice is graded. Follow the two steps below to grade your open-ended answers.'
              : 'Your answers have been graded. Tap a question to see its feedback.'}
          </p>
        </div>
      </div>

      <ScoreSummary
        summary={summary}
        needsAIEval={needsAIEval}
        currentRound={currentRound}
        onSelectItem={handleSelectItem}
      />

      {/* Only once the whole round is graded, so the AI sees every result */}
      {roundFeedback.length > 0 && (!needsAIEval || !!aiFeedback) && (
        <NextRoundCard onCopyPrompt={handleCopyAdaptivePrompt} onPasteQuestions={handlePasteNextRound} />
      )}

      {/* FLIP Morphing Completed Card */}
      <motion.div
        ref={detailsRef}
        layout
        layoutId="quiz-card-morph"
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full scroll-mt-4"
      >
        <Card className="border border-divider shadow-xl bg-content1/70 backdrop-blur-md overflow-hidden">
          <CardBody className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-12 md:min-h-[500px]">
              {/* Left Sidebar Status: placed after the details on mobile so the eval steps come first */}
              <div className="order-last md:order-none md:col-span-4 min-w-0 bg-default-50 p-4 sm:p-6 border-t md:border-t-0 md:border-r border-default-100 space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-default-400 uppercase tracking-widest">Mastery Progress</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-2xl font-black text-primary">{masteredCount}/{originalTotalCount}</span>
                      <span className="text-xs font-bold text-default-400 mb-1">QUESTIONS</span>
                    </div>
                    <motion.div layoutId="quiz-progress-track" className="w-full">
                      <Progress
                        aria-label="Mastery progress"
                        value={(masteredCount / (originalTotalCount || 1)) * 100}
                        color={isMastered ? "success" : "primary"}
                        className="h-2"
                      />
                    </motion.div>
                    <p className="text-tiny text-default-500 font-medium">
                      Mastery Threshold: <span className="text-primary font-bold">{MASTERY_THRESHOLD}%</span> score
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-default-400 uppercase tracking-widest">Mastery Loop Info</h3>
                  <div className="p-4 bg-content1 rounded-xl border border-default-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-small font-medium text-default-600">Current Round:</span>
                      <motion.div layoutId="quiz-round-pill">
                        <Chip size="sm" color="secondary" variant="flat" className="font-bold"># {currentRound}</Chip>
                      </motion.div>
                    </div>
                    {!isMastered && (
                      <div className="flex flex-col gap-2 pt-2">
                        <p className="text-tiny text-warning-600 leading-tight">
                          You still have <span className="font-bold">{remainingCount}</span> {remainingCount === 1 ? 'question' : 'questions'} left to master.
                        </p>
                        <motion.div whileTap={{ scale: 0.96 }}>
                          <Button
                            size="sm"
                            color="success"
                            variant="flat"
                            className="w-full font-bold"
                            startContent={<ArrowPathIcon className="w-4 h-4" />}
                            onClick={handleRetryFailed}
                          >
                            Retry Failed ({remainingCount})
                          </Button>
                        </motion.div>
                      </div>
                    )}
                    {isMastered && (
                      <p className="text-tiny text-success-600 font-bold flex items-center gap-1">
                        <CheckCircleIcon className="w-3 h-3" /> Fully Mastered!
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  {needsAIEval && (
                    <motion.div whileTap={{ scale: 0.96 }}>
                      <Button
                        color="primary"
                        variant="shadow"
                        className="w-full font-bold"
                        startContent={<ClipboardDocumentCheckIcon className="w-5 h-5" />}
                        onClick={handlePasteFeedback}
                      >
                        Paste AI Feedback
                      </Button>
                    </motion.div>
                  )}
                  <motion.div whileTap={{ scale: 0.96 }}>
                    <Button
                      variant="bordered"
                      className="w-full font-medium"
                      startContent={<ArrowPathIcon className="w-5 h-5" />}
                      onClick={() => setPendingConfirm('new-topic')}
                    >
                      Start New Topic
                    </Button>
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.96 }}>
                    <Button
                      variant="flat"
                      color="danger"
                      className="w-full font-medium"
                      startContent={<TrashIcon className="w-5 h-5" />}
                      onClick={() => setPendingConfirm('wipe')}
                    >
                      Start Fresh (Wipe)
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Right Content Area (Tabs) */}
              <div className="md:col-span-8 min-w-0 p-0">
                <Tabs
                  variant="underlined"
                  aria-label="Result options"
                  color="primary"
                  classNames={{
                    base: "w-full border-b border-divider",
                    tabList: "gap-2 sm:gap-6 w-full relative rounded-none p-4 pb-0 items-end overflow-x-auto",
                    cursor: "w-full bg-primary",
                    tab: "max-w-fit px-2 sm:px-4 h-10",
                    tabContent: "group-data-[selected=true]:text-primary font-bold text-sm"
                  }}
                  selectedKey={resultsTab}
                  onSelectionChange={(key) => handleTabChange(key as ResultsTab)}
                  disabledKeys={needsAIEval ? [] : ['prompt']}
                >
                  <Tab
                    key="prompt"
                    title={
                      <div className="flex items-center space-x-2">
                        <SparklesIcon className="w-4 h-4" />
                        <span>AI Evaluation</span>
                      </div>
                    }
                  >
                    <EvalSteps
                      evalPrompt={evalPrompt}
                      hasAIFeedback={!!aiFeedback}
                      onCopyPrompt={handleCopyEvalPrompt}
                      onPasteFeedback={handlePasteFeedback}
                    />
                  </Tab>

                  <Tab
                    key="feedback"
                    isDisabled={!hasFeedback}
                    title={
                      <div className="flex items-center space-x-2">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>Analysis</span>
                        {hasFeedback && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                      </div>
                    }
                  >
                    <div className="p-4 sm:p-6 space-y-6">
                      {!hasFeedback ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                          <div className="p-3 bg-default-100 rounded-full">
                            <AcademicCapIcon className="w-8 h-8 text-default-400" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-default-900 font-bold">Waiting for Feedback</p>
                            <p className="text-default-500 text-small max-w-[240px]">Paste your AI feedback to see questions evaluation and mastery progress.</p>
                          </div>
                        </div>
                      ) : (
                        <AIFeedbackDisplay feedback={mergedFeedback} focusRequest={focusRequest} />
                      )}
                    </div>
                  </Tab>

                  <Tab
                    key="study"
                    isDisabled={!hasFeedback}
                    title={
                      <div className="flex items-center space-x-2">
                        <BookOpenIcon className="w-4 h-4" />
                        <span>Study Guide</span>
                        {weakItems.length > 0 && (
                          <Chip size="sm" color="danger" variant="flat" className="h-5 min-w-5 px-1 text-tiny font-bold">
                            {weakItems.length}
                          </Chip>
                        )}
                      </div>
                    }
                  >
                    <StudyGuide
                      weakItems={weakItems}
                      isAwaitingAIEval={needsAIEval && !aiFeedback}
                      onCopyStudyPrompt={handleCopyStudyPrompt}
                      onSelectItem={showFeedbackFor}
                    />
                  </Tab>
                </Tabs>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      <ConfirmDialog
        isOpen={!!confirmCopy}
        title={confirmCopy?.title ?? ''}
        message={confirmCopy?.message ?? ''}
        confirmLabel={confirmCopy?.confirmLabel}
        color={confirmCopy?.color}
        onConfirm={handleConfirm}
        onCancel={() => setPendingConfirm(null)}
      />
    </motion.div>
  )
})
