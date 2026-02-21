import { useRef } from 'react'
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
} from '@heroicons/react/24/outline'
import { useQuizOrchestrator } from '../hooks/useQuizOrchestrator'
import ErrorDisplay from '../../../shared/components/ErrorDisplay'
import { QuestionType, MultipleChoiceQuestion, MASTERY_THRESHOLD } from '../../../shared/types'
import { AIFeedbackDisplay } from '../../feedback'
import { QuizQuestion } from './QuizQuestion'

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
    handleReset,
    handleKeyPress,
    handleKeyPressStart,
    getCurrentProgress,
    // Prompt state
    promptInput,
    handlePromptInput,
    // AI Feedback state
    aiFeedback,
    activeTab,
    setActiveTab,
    handlePasteFeedback,
    handleGenerateFeedback,
    isGeneratingFeedback,
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
    isGeneratingTemplate,
    handleGenerateTemplate,
    isCodeMode,
    setIsCodeMode
  } = useQuizOrchestrator()

  const tabsRef = useRef<HTMLDivElement>(null)

  const currentQuestion = output?.questions[currentQuestionIndex]
  const progress = getCurrentProgress()

  if (!output || !isQuizMode && !isCompleted) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
              <Button
                color="primary"
                variant="flat"
                startContent={<QuestionMarkCircleIcon className="w-5 h-5" />}
                onClick={onOpen}
                className="font-semibold shadow-sm"
              >
                How it works
              </Button>
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
            <Button
              color="secondary"
              variant="shadow"
              startContent={<ClipboardDocumentCheckIcon className="w-5 h-5" />}
              onClick={handleCopyBasePrompt}
              className="font-bold shadow-secondary/30"
            >
              Copy Base Prompt
            </Button>
          </div>

          <Card className="border-none shadow-2xl bg-content1/50 backdrop-blur-md">
            <CardBody className="p-0">
              <Tabs
                aria-label="Input options"
                color="primary"
                variant="underlined"
                classNames={{
                  base: "w-full border-b border-divider",
                  tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                  cursor: "w-full bg-primary",
                  tab: "max-w-fit px-8 h-12",
                  tabContent: "group-data-[selected=true]:text-primary font-semibold"
                }}
                selectedKey={activeTab}
                onSelectionChange={(key) => setActiveTab(key as string)}
              >
                <Tab
                  key="prompt"
                  title={
                    <div className="flex items-center space-x-2">
                      <PlayIcon className="w-4 h-4" />
                      <span>Start Quiz</span>
                    </div>
                  }
                >
                  <div className="p-8 space-y-6">
                    <div className="space-y-4">
                      <label htmlFor="prompt-input" className="block text-sm font-semibold text-default-700">
                        Paste your AI-generated response here
                      </label>
                      <textarea
                        id="prompt-input"
                        className="w-full min-h-[300px] p-4 rounded-xl border-2 border-default-200 bg-content2 focus:border-primary focus:ring-0 transition-all font-mono text-sm resize-none"
                        value={promptInput}
                        onChange={(e) => handlePromptInput(e.target.value)}
                        placeholder="Paste the JSON response from your AI assistant..."
                        onKeyDown={(e) => handleKeyPressStart(e as unknown as React.KeyboardEvent<HTMLInputElement>)}
                      />
                    </div>

                    {error && <ErrorDisplay error={error.message} />}

                    <Button
                      color="primary"
                      size="lg"
                      className="w-full font-bold h-14 text-lg shadow-lg hover:shadow-primary/20"
                      onClick={handleStartQuiz}
                      isDisabled={!output}
                      startContent={<PlayIcon className="w-6 h-6" />}
                    >
                      Start Answering Questions
                    </Button>
                  </div>
                </Tab>

                <Tab
                  key="feedback"
                  title={
                    <div className="flex items-center space-x-2">
                      <AcademicCapIcon className="w-4 h-4" />
                      <span>Direct AI Generation</span>
                    </div>
                  }
                >
                  <div className="p-8 space-y-8 flex flex-col items-center justify-center min-h-[400px]">
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-bold">Automatic Quiz Generation</h3>
                      <p className="text-default-500 max-w-md">Enter any topic and we'll generate the questions for you directly using Google Gemini AI.</p>
                    </div>
                    
                    <div className="w-full max-w-md space-y-4">
                      <Input
                        label="Quiz Topic"
                        placeholder="e.g. Next.js App Router, Molecular Biology"
                        value={topicInput}
                        onValueChange={setTopicInput}
                        variant="bordered"
                        size="lg"
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerateTemplate()}
                      />
                      <Button
                        color="primary"
                        size="lg"
                        className="w-full font-bold h-14 text-lg shadow-lg shadow-primary/20"
                        onClick={handleGenerateTemplate}
                        isLoading={isGeneratingTemplate}
                        startContent={!isGeneratingTemplate && <SparklesIcon className="w-6 h-6" />}
                      >
                        Generate Quiz Now
                      </Button>
                    </div>
                  </div>
                </Tab>
              </Tabs>
            </CardBody>
          </Card>
        </div>

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

  if (isCompleted) {
    const isMastered = masteredCount === originalTotalCount;

    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-4 py-8">
          <div className="inline-block p-4 bg-success-100 rounded-full mb-4">
            <CheckCircleIcon className="w-12 h-12 text-success" />
          </div>
          <h1 className="text-4xl font-extrabold text-default-900">Quiz Completed!</h1>
          <p className="text-xl text-default-500">
            Great job! You've answered all questions. Here's your final output for AI evaluation.
          </p>
        </div>

        <Card className="border-none shadow-xl bg-content1/50 backdrop-blur-md overflow-hidden">
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
                    <Progress 
                      value={(masteredCount / originalTotalCount) * 100} 
                      color={isMastered ? "success" : "primary"}
                      className="h-2"
                    />
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
                        <Chip size="sm" color="secondary" variant="flat" className="font-bold"># {currentRound}</Chip>
                      </div>
                      {!isMastered && (
                        <div className="flex flex-col gap-2 pt-2">
                          <p className="text-tiny text-warning-600 leading-tight">
                            You still have <span className="font-bold">{originalTotalCount - masteredCount}</span> questions left to master.
                          </p>
                           <Button 
                            size="sm" 
                            color="success" 
                            variant="flat" 
                            className="w-full font-bold"
                            startContent={<ArrowPathIcon className="w-4 h-4" />}
                            onClick={handleRetryFailed}
                          >
                            Retry Failed
                          </Button>
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
                  <Button
                    color="primary"
                    variant="shadow"
                    className="w-full font-bold"
                    startContent={<SparklesIcon className="w-5 h-5" />}
                    onClick={handleGenerateFeedback}
                    isLoading={isGeneratingFeedback}
                  >
                    Direct AI Evaluation
                  </Button>
                  <Button
                    color="secondary"
                    variant="flat"
                    className="w-full font-bold"
                    startContent={<ClipboardDocumentCheckIcon className="w-5 h-5" />}
                    onClick={handlePasteFeedback}
                  >
                    Paste AI Feedback
                  </Button>
                  <Button
                    variant="bordered"
                    className="w-full font-medium"
                    startContent={<ArrowPathIcon className="w-5 h-5" />}
                    onClick={handleReset}
                  >
                    Start New Topic
                  </Button>
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
                        <Button 
                          size="sm" 
                          variant="flat"
                          startContent={<ClipboardDocumentCheckIcon className="w-4 h-4" />}
                          onClick={() => copyToClipboard(generateAIPrompt(userAnswers, output))}
                        >
                          Copy All
                        </Button>
                      </div>
                      <div className="relative group">
                        <pre className="bg-default-50 p-5 rounded-2xl border-2 border-default-200 font-mono text-sm overflow-x-auto max-h-[400px] text-default-600 leading-relaxed scrollbar-hide">
                          {generateAIPrompt(userAnswers, output)}
                        </pre>
                        <div className="absolute inset-0 bg-gradient-to-t from-default-50/50 to-transparent pointer-events-none rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </Tab>
                  
                  <Tab
                    key="feedback"
                    isDisabled={!aiFeedback}
                    title={
                      <div className="flex items-center space-x-2">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>Analysis</span>
                        {aiFeedback && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                      </div>
                    }
                  >
                    <div className="p-6 space-y-6">
                      {!aiFeedback ? (
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
                        <AIFeedbackDisplay feedback={parseAIFeedback(aiFeedback, userAnswers)} />
                      )}
                    </div>
                  </Tab>
                </Tabs>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="sticky top-20 z-20 flex flex-col md:flex-row justify-between items-center gap-4 bg-background/80 backdrop-blur-xl p-4 rounded-2xl border border-divider shadow-sm">
        <div className="space-y-1 w-full md:w-auto flex-1">
          <h2 className="text-xl font-black text-default-900 flex items-center gap-3">
            Round {currentRound} 
            <span className="text-sm font-medium text-default-400 bg-default-100 px-2 py-0.5 rounded-md">Question {currentQuestionIndex + 1} of {output.questions.length}</span>
          </h2>
          <Progress 
            value={progress} 
            className="w-full md:w-72 h-2 mt-2" 
            color="primary" 
            size="sm"
            radius="full"
          />
        </div>
        <div className="flex gap-2">
          <Tooltip content="Switch input mode">
            <Button
              isIconOnly
              variant="flat"
              onPress={() => setIsCodeMode(!isCodeMode)}
              color={isCodeMode ? "primary" : "default"}
              className="shadow-sm"
            >
               {isCodeMode ? "JS" : "Aa"}
            </Button>
          </Tooltip>
          <Button
            color="danger"
            variant="flat"
            size="md"
            onClick={handleReset}
            className="font-bold shadow-sm"
          >
            Quit Quiz
          </Button>
        </div>
      </div>

      <Card className="border border-divider shadow-xl bg-content1 overflow-visible relative mt-8">
        <div className="absolute -top-4 right-6">
          <Chip
            color="primary"
            variant="shadow"
            className="font-black text-tiny tracking-widest uppercase px-3 shadow-primary/40"
          >
            {currentQuestion?.type.replace('_', ' ')}
          </Chip>
        </div>
        
        <CardBody className="p-8 md:p-12">
          <div className="flex flex-col sm:flex-row items-start gap-4 mb-8">
            <span className="text-5xl font-black text-primary/10 leading-none select-none hidden sm:block">
              Q{currentQuestionIndex + 1}
            </span>
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
            />
            {error && <div className="mt-4"><ErrorDisplay error={error.message} /></div>}
          </div>
        </CardBody>
      </Card>

      <div className="sticky bottom-6 z-20 flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-content1/80 backdrop-blur-xl rounded-2xl border border-divider shadow-lg mt-8">
        <Button
          variant="flat"
          onClick={handlePreviousQuestion}
          isDisabled={currentQuestionIndex === 0}
          startContent={<ArrowLeftIcon className="w-5 h-5" />}
          className="w-full sm:w-auto font-bold"
        >
          Previous
        </Button>
        
        <div className="hidden sm:flex items-center gap-2 text-default-500 font-bold text-sm bg-default-100/50 px-4 py-2 rounded-full">
          <span>{Math.round(progress)}% Complete</span>
        </div>

        <Button
          color="primary"
          variant="shadow"
          onClick={handleNextQuestion}
          endContent={currentQuestionIndex === output.questions.length - 1 ? <CheckCircleIcon className="w-5 h-5" /> : <ArrowRightIcon className="w-5 h-5" />}
          className="w-full sm:w-auto font-black px-8 h-10 sm:h-auto shadow-lg hover:shadow-primary/30"
        >
          {currentQuestionIndex === output.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
        </Button>
      </div>
    </div>
  )
}

