import { useRef, useMemo } from 'react'
import {
  Card,
  CardBody,
  Button,
  Progress,
  Tabs,
  Tab,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Tooltip,
  Chip
} from "@nextui-org/react"
import {
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  PlayIcon,
  QuestionMarkCircleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  AcademicCapIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuizOrchestrator } from '../hooks/useQuizOrchestrator'
import ErrorDisplay from '../../../shared/components/ErrorDisplay'
import { QuestionType, MultipleChoiceQuestion, MASTERY_THRESHOLD } from '../../../shared/types'
import { AIFeedbackDisplay } from '../../feedback'
import { QuizQuestion } from './QuizQuestion'
import { QuestionNavigator } from './QuestionNavigator'

export function QuizPage() {
  const {
    // Quiz state
    output,
    currentQuestionIndex,
    currentAnswer,
    setCurrentAnswer,
    isQuizMode,
    isCompleted,
    error,
    userAnswers,
    handleStartQuiz,
    handleNextQuestion,
    handlePreviousQuestion,
    handleJumpToQuestion,
    handleReset,
    handleStartFresh,
    handleKeyPress,
    handleKeyPressStart,
    getCurrentProgress,
    // Prompt state
    promptInput,
    handlePromptInput,
    // AI Feedback state
    aiFeedback,
    localFeedback,
    activeTab,
    setActiveTab,
    handlePasteFeedback,
    handlePastePromptFromClipboard,
    parseAIFeedback,
    generateAIPrompt,
    // Tutorial state
    isOpen,
    onOpen,
    tutorialSteps,
    isTopicModalOpen,
    topicInput,
    setTopicInput,
    handleCopyBasePrompt,
    handleTopicSubmit,
    closeTopicModal,
    selectedQuestionType,
    handleQuestionTypeChange,
    // mastery state
    currentRound,
    masteredCount,
    handleRetryFailed,
    originalTotalCount,
    // Shared
    copyToClipboard,
    isCodeMode,
    setIsCodeMode
  } = useQuizOrchestrator()

  const tabsRef = useRef<HTMLDivElement>(null)

  const currentQuestion = output?.questions[currentQuestionIndex]
  const progress = getCurrentProgress()

  const currentView = (!output || (!isQuizMode && !isCompleted))
    ? 'home'
    : isCompleted
    ? 'completed'
    : 'quiz'

  const isMastered = originalTotalCount > 0 && masteredCount === originalTotalCount
  const hasFeedback = !!aiFeedback || (localFeedback && localFeedback.length > 0)

  const parsedFeedback = useMemo(() => {
    if (aiFeedback) {
      return parseAIFeedback(aiFeedback, userAnswers, output?.questions)
    }
    return localFeedback || []
  }, [aiFeedback, localFeedback, userAnswers, output?.questions, parseAIFeedback])

  return (
    <div className="w-full">
      <AnimatePresence mode="popLayout" initial={false}>
        {/* VIEW 1: HOME & PROMPT SETUP */}
        {currentView === 'home' && (
          <motion.div
            key="home-view"
            initial={{ opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.985 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl mx-auto p-4 space-y-8 will-change-transform"
          >
            <div className="relative text-center space-y-4 py-16 px-4">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-100/40 via-transparent to-secondary-100/40 rounded-3xl -z-10" />
              <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl mb-2 shadow-inner border border-primary/10">
                <SparklesIcon className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-5xl font-black tracking-tight lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-default-900 to-default-600 pb-2">
                Master Anything with <span className="text-primary bg-none">Inquizitive</span>
              </h1>
              <p className="text-xl text-default-500 max-w-2xl mx-auto leading-relaxed">
                Transform documentation, tutorials, or study notes into interactive quizzes in seconds. 
                Powered by AI, designed for rapid learning.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row justify-between items-center px-2 gap-4">
                <div className="flex flex-wrap gap-4 items-center justify-center">
                  <motion.div whileTap={{ scale: 0.96 }}>
                    <Button
                      color="primary"
                      variant="flat"
                      startContent={<QuestionMarkCircleIcon className="w-5 h-5" />}
                      onClick={onOpen}
                      className="font-semibold shadow-sm"
                    >
                      How it works
                    </Button>
                  </motion.div>
                  <Tabs 
                    size="md"
                    color="primary"
                    variant="solid"
                    radius="full"
                    selectedKey={selectedQuestionType}
                    onSelectionChange={(k) => handleQuestionTypeChange(k as string)}
                    classNames={{
                      cursor: "bg-background shadow-sm",
                      tabList: "bg-default-100 border border-default-200"
                    }}
                  >
                    <Tab key={QuestionType.OPEN_ENDED} title="Open-ended" />
                    <Tab key={QuestionType.MULTIPLE_CHOICE} title="Multiple choice" />
                  </Tabs>
                </div>
                <motion.div whileTap={{ scale: 0.96 }}>
                  <Button
                    color="secondary"
                    variant="shadow"
                    startContent={<ClipboardDocumentCheckIcon className="w-5 h-5" />}
                    onClick={handleCopyBasePrompt}
                    className="font-bold shadow-secondary/30"
                  >
                    Copy Base Prompt
                  </Button>
                </motion.div>
              </div>

              <Card className="border border-divider shadow-2xl bg-content1/70 backdrop-blur-md">
                <CardBody className="p-6 md:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-divider">
                    <div>
                      <h2 className="text-lg font-bold text-default-900">Quiz JSON Prompt</h2>
                      <p className="text-sm text-default-500">
                        Paste the generated questions JSON from your AI assistant below
                      </p>
                    </div>
                    <motion.div whileTap={{ scale: 0.96 }}>
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        startContent={<ClipboardDocumentCheckIcon className="w-4 h-4" />}
                        onClick={handlePastePromptFromClipboard}
                        className="font-semibold shadow-sm"
                      >
                        Paste from Clipboard
                      </Button>
                    </motion.div>
                  </div>

                  <div className="space-y-3">
                    <textarea
                      id="prompt-input"
                      aria-label="Paste AI-generated JSON response"
                      className="w-full min-h-[260px] p-4 rounded-xl border-2 border-default-200 bg-content2 focus:border-primary focus:ring-0 transition-all font-mono text-sm resize-none placeholder:text-default-400"
                      value={promptInput}
                      onChange={(e) => handlePromptInput(e.target.value)}
                      placeholder={`Paste your AI assistant's JSON response here. Example:\n{\n  "questions": [\n    {\n      "number": 1,\n      "type": "open_ended",\n      "question": "What is the event loop in JavaScript?",\n      "expected_answer": "A mechanism that coordinates async execution..."\n    }\n  ]\n}`}
                      onKeyDown={(e) => handleKeyPressStart(e as unknown as React.KeyboardEvent<HTMLInputElement>)}
                    />
                  </div>

                  {error && <ErrorDisplay error={error.message} />}

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
                              : `Start Answering (${output.questions.length} Questions)`)
                          : 'Start Answering Questions'}
                      </Button>
                    </motion.div>
                    {(promptInput || output) && (
                      <motion.div whileTap={{ scale: 0.98 }}>
                        <Button
                          size="lg"
                          variant="flat"
                          color="default"
                          className="h-14 font-semibold text-default-600 px-6"
                          onClick={handleStartFresh}
                          startContent={<TrashIcon className="w-5 h-5 text-default-500" />}
                        >
                          Start Fresh
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          </motion.div>
        )}

        {/* VIEW 2: ACTIVE QUIZ */}
        {currentView === 'quiz' && (
          <motion.div
            key="quiz-view"
            initial={{ opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.985 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl mx-auto p-4 space-y-6 relative will-change-transform"
          >
            <div className="sticky top-20 z-20 flex flex-col md:flex-row justify-between items-center gap-4 bg-background/80 backdrop-blur-xl p-4 rounded-2xl border border-divider shadow-sm">
              <div className="space-y-1 w-full md:w-auto flex-1">
                <div className="flex items-center gap-3">
                  <motion.div layoutId="quiz-round-pill">
                    <Chip size="sm" color="secondary" variant="flat" className="font-bold">Round {currentRound}</Chip>
                  </motion.div>
                  <span className="text-sm font-medium text-default-400 bg-default-100 px-2 py-0.5 rounded-md">Question {currentQuestionIndex + 1} of {output?.questions.length}</span>
                </div>
                <motion.div layoutId="quiz-progress-track" className="w-full md:w-72">
                  <Progress 
                    value={progress} 
                    className="w-full h-2 mt-2" 
                    color="primary" 
                    size="sm"
                    radius="full"
                  />
                </motion.div>
              </div>
              <div className="flex gap-2 items-center">
                <Tooltip content="Switch input mode (Normal / Code)">
                  <Button
                    isIconOnly
                    variant="flat"
                    onPress={() => setIsCodeMode(!isCodeMode)}
                    color={isCodeMode ? "primary" : "default"}
                    className="shadow-sm font-mono font-bold"
                  >
                     {isCodeMode ? "JS" : "Aa"}
                  </Button>
                </Tooltip>
                <motion.div whileTap={{ scale: 0.96 }}>
                  <Button
                    color="default"
                    variant="flat"
                    size="md"
                    onClick={handleStartFresh}
                    className="font-medium text-default-600 hidden sm:flex"
                  >
                    Start Fresh
                  </Button>
                </motion.div>
                <motion.div whileTap={{ scale: 0.96 }}>
                  <Button
                    color="danger"
                    variant="flat"
                    size="md"
                    onClick={handleReset}
                    className="font-bold shadow-sm"
                  >
                    Quit Quiz
                  </Button>
                </motion.div>
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
              layout 
              layoutId="quiz-card-morph"
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="mt-4"
            >
              <Card className="border border-divider shadow-xl bg-content1 overflow-visible relative">
                <motion.div 
                  key={`chip-${currentQuestionIndex}`}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 450, damping: 25 }}
                  className="absolute -top-4 right-6 z-10"
                >
                  <Chip
                    color="primary"
                    variant="shadow"
                    className="font-black text-tiny tracking-widest uppercase px-3 shadow-primary/40"
                  >
                    {currentQuestion?.type.replace('_', ' ')}
                  </Chip>
                </motion.div>
                
                <CardBody className="p-8 md:p-12 overflow-hidden">
                  <motion.div 
                    key={`q-${currentQuestionIndex}`}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-4 mb-8">
                      <motion.span 
                        key={`badge-${currentQuestionIndex}`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 450, damping: 25 }}
                        className="text-5xl font-black text-primary/15 leading-none select-none hidden sm:block"
                      >
                        Q{currentQuestionIndex + 1}
                      </motion.span>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-primary uppercase tracking-widest sm:hidden">Question {currentQuestionIndex + 1}</span>
                        <h3 className="text-2xl md:text-3xl font-bold text-default-900 leading-snug pt-1">
                          {currentQuestion?.question}
                        </h3>
                      </div>
                    </div>

                    <div className="py-2 min-h-[160px]">
                      <QuizQuestion
                        type={currentQuestion?.type as QuestionType}
                        options={(currentQuestion as MultipleChoiceQuestion)?.options}
                        value={currentAnswer}
                        onChange={setCurrentAnswer}
                        onKeyDown={(e) => handleKeyPress(e as unknown as React.KeyboardEvent<HTMLInputElement>, isCodeMode)}
                        isCodeMode={isCodeMode}
                      />
                      {error && <div className="mt-4"><ErrorDisplay error={error.message} /></div>}
                    </div>
                  </motion.div>
                </CardBody>
              </Card>
            </motion.div>

            <div className="sticky bottom-6 z-20 flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-content1/80 backdrop-blur-xl rounded-2xl border border-divider shadow-lg mt-8">
              <motion.div whileTap={{ scale: 0.96 }} className="w-full sm:w-auto">
                <Button
                  variant="flat"
                  onClick={handlePreviousQuestion}
                  isDisabled={currentQuestionIndex === 0}
                  startContent={<ArrowLeftIcon className="w-5 h-5 mr-1" />}
                  className="w-full sm:w-auto font-semibold px-6 h-11 sm:h-12 rounded-xl text-sm sm:text-base"
                >
                  Previous
                </Button>
              </motion.div>
              
              <div className="hidden sm:flex items-center gap-2 text-default-500 dark:text-zinc-400 font-semibold text-sm bg-default-100 dark:bg-zinc-800/80 px-4 py-2 rounded-full border border-default-200 dark:border-zinc-700">
                <span>{Math.round(progress)}% Complete</span>
              </div>

              <motion.div whileTap={{ scale: 0.96 }} className="w-full sm:w-auto">
                <Button
                  color="primary"
                  variant="shadow"
                  onClick={handleNextQuestion}
                  endContent={
                    currentQuestionIndex === (output?.questions.length ?? 0) - 1 ? (
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
                  className="group w-full sm:w-auto font-semibold px-7 h-11 sm:h-12 rounded-xl text-sm sm:text-base shadow-lg shadow-primary/30 hover:shadow-primary/40 text-white transition-all"
                >
                  {currentQuestionIndex === (output?.questions.length ?? 0) - 1 ? 'Finish Quiz' : 'Next Question'}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* VIEW 3: COMPLETED & EVALUATION */}
        {currentView === 'completed' && (
          <motion.div
            key="completed-view"
            initial={{ opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.985 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl mx-auto p-4 space-y-6 will-change-transform"
          >
            <div className="text-center space-y-4 py-8">
              <div className="inline-block p-4 bg-success-100 rounded-full mb-4">
                <CheckCircleIcon className="w-12 h-12 text-success" />
              </div>
              <h1 className="text-4xl font-extrabold text-default-900">Quiz Completed!</h1>
              <p className="text-xl text-default-500">
                Great job! You've answered all questions. Here's your final output for AI evaluation.
              </p>
            </div>

            {/* FLIP Morphing Completed Card */}
            <motion.div
              layout
              layoutId="quiz-card-morph"
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="w-full"
            >
              <Card className="border border-divider shadow-xl bg-content1/70 backdrop-blur-md overflow-hidden">
                <CardBody className="p-0">
                  <div className="grid md:grid-cols-12 min-h-[500px]">
                    {/* Left Sidebar Status */}
                    <div className="md:col-span-4 bg-default-50 p-6 border-r border-default-100 space-y-8">
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-default-400 uppercase tracking-widest">Mastery Progress</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-2xl font-black text-primary">{masteredCount}/{originalTotalCount}</span>
                            <span className="text-xs font-bold text-default-400 mb-1">QUESTIONS</span>
                          </div>
                          <motion.div layoutId="quiz-progress-track" className="w-full">
                            <Progress 
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
                                You still have <span className="font-bold">{originalTotalCount - masteredCount}</span> {originalTotalCount - masteredCount === 1 ? 'question' : 'questions'} left to master.
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
                                  Retry Failed ({originalTotalCount - masteredCount})
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
                      <motion.div whileTap={{ scale: 0.96 }}>
                        <Button
                          variant="bordered"
                          className="w-full font-medium"
                          startContent={<ArrowPathIcon className="w-5 h-5" />}
                          onClick={handleReset}
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
                          onClick={handleStartFresh}
                        >
                          Start Fresh (Wipe)
                        </Button>
                      </motion.div>
                    </div>
                  </div>

                  {/* Right Content Area (Tabs) */}
                  <div className="md:col-span-8 p-0" ref={tabsRef}>
                    <Tabs
                      variant="underlined"
                      aria-label="Result options"
                      color="primary"
                       classNames={{
                        base: "w-full border-b border-divider",
                        tabList: "gap-6 w-full relative rounded-none p-4 pb-0 items-end overflow-x-auto",
                        cursor: "w-full bg-primary",
                        tab: "max-w-fit px-4 h-10",
                        tabContent: "group-data-[selected=true]:text-primary font-bold text-sm"
                      }}
                      selectedKey={activeTab}
                      onSelectionChange={(key) => setActiveTab(key as string)}
                    >
                      <Tab
                        key="prompt"
                        title={
                          <div className="flex items-center space-x-2">
                            <SparklesIcon className="w-4 h-4" />
                            <span>AI Eval Prompt</span>
                          </div>
                        }
                      >
                        <div className="p-6 space-y-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-bold text-default-700">Copy this to get feedback</h4>
                            <motion.div whileTap={{ scale: 0.96 }}>
                              <Button 
                                size="sm" 
                                variant="flat"
                                startContent={<ClipboardDocumentCheckIcon className="w-4 h-4" />}
                                onClick={() => {
                                  if (output) {
                                    copyToClipboard(generateAIPrompt(userAnswers, output))
                                  }
                                }}
                              >
                                Copy All
                              </Button>
                            </motion.div>
                          </div>
                          <div className="relative group">
                            <pre className="bg-default-50 p-5 rounded-2xl border-2 border-default-200 font-mono text-sm overflow-x-auto max-h-[400px] text-default-600 leading-relaxed scrollbar-hide">
                              {output ? generateAIPrompt(userAnswers, output) : ''}
                            </pre>
                            <div className="absolute inset-0 bg-gradient-to-t from-default-50/50 to-transparent pointer-events-none rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
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
                        <div className="p-6 space-y-6">
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
                            <AIFeedbackDisplay feedback={parsedFeedback} />
                          )}
                        </div>
                      </Tab>
                    </Tabs>
                  </div>
                </div>
              </CardBody>
            </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Modal */}
      <Modal
        size="2xl"
        isOpen={isOpen}
        onOpenChange={onOpen}
        classNames={{
          base: "bg-content1",
          header: "border-b border-divider",
          footer: "border-t border-divider",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <QuestionMarkCircleIcon className="w-6 h-6 text-primary" />
                  <span>How to use Inquizitive</span>
                </div>
              </ModalHeader>
              <ModalBody className="py-6">
                <div className="space-y-6">
                  {tutorialSteps.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-default-900">{step.title}</h4>
                        <p className="text-sm text-default-500 leading-relaxed">{step.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" variant="flat" onPress={onClose}>
                  Got it!
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Topic Entry Modal */}
      <Modal
        isOpen={isTopicModalOpen}
        onOpenChange={closeTopicModal}
        classNames={{
          base: "bg-content1",
          header: "border-b border-divider",
        }}
      >
        <ModalContent>
          <ModalHeader>Choose a Topic</ModalHeader>
          <ModalBody className="py-6">
            <p className="text-sm text-default-500 mb-4">
              What would you like to be quizzed on? We'll tailor the template for you.
            </p>
            <Input
              autoFocus
              label="Topic"
              placeholder="e.g. Python AsyncIO, Medieval History"
              value={topicInput}
              onValueChange={setTopicInput}
              variant="bordered"
              onKeyDown={(e) => e.key === 'Enter' && handleTopicSubmit()}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={closeTopicModal}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleTopicSubmit}>
              Copy Template
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
