import {
  Card,
  CardBody,
  CardHeader,
  Textarea,
  Button,
  Spacer,
  Code,
  Progress,
  Modal, 
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Switch,
  Select,
  SelectItem
} from "@nextui-org/react"
import { Tabs, Tab } from "@nextui-org/react"
import { useQuestionConverter } from '../hooks/useQuestionConverter'
import ErrorDisplay from './ErrorDisplay'
import { QuestionType, MultipleChoiceQuestion } from '../types'
import { AIFeedbackDisplay } from './AIFeedbackDisplay'

function QuestionConverter() {
  const {
    // Quiz state
    output,
    currentQuestionIndex,
    userAnswers,  
    currentAnswer,
    isQuizMode,
    isCompleted,
    isCodeMode,
    error,
    
    // Question type state
    selectedQuestionType,
    handleQuestionTypeChange,
    
    // Prompt input state
    promptInput,
    
    // AI feedback state
    aiFeedback,
    activeTab,
    setActiveTab,
    parseAIFeedback,
    
    // Tutorial state
    isOpen,
    onOpen,
    onClose,
    isTopicModalOpen,
    topicInput,
    tutorialSteps,
    
    // Functions
    handleStartQuiz,
    handleNextQuestion,
    handleReset,
    handleKeyPress,
    handleKeyPressStart,
    handlePromptInput,
    getCurrentProgress,
    copyToClipboard,
    handleCopyBasePrompt,
    handleTopicSubmit,
    handlePasteFeedback,
    setTopicInput,
    setIsTopicModalOpen,
    setIsCodeMode,
    setCurrentAnswer,
    generateFinalOutput,
    handlePreviousQuestion
  } = useQuestionConverter()

  // Now userAnswers can be used in generateFinalOutput calls
  return (
    <div className="container mx-auto px-4 max-w-4xl">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Question Converter</h1>
          <div className="flex gap-2">
            <Button
              color="primary"
              variant="flat"
              onClick={handleCopyBasePrompt}
              className="text-sm"
            >
              Copy Base Prompt Template
            </Button>
            <Button
              variant="light" 
              onPress={onOpen}
              className="text-sm"
            >
              How to Use
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="mb-4">
            <Select
              label="Question Type"
              placeholder="Select question type"
              selectedKeys={[selectedQuestionType]}
              onChange={(e) => handleQuestionTypeChange(e.target.value as QuestionType)}
            >
              <SelectItem key={QuestionType.OPEN_ENDED} value={QuestionType.OPEN_ENDED}>
                Open Ended
              </SelectItem>
              <SelectItem key={QuestionType.MULTIPLE_CHOICE} value={QuestionType.MULTIPLE_CHOICE}>
                Multiple Choice
              </SelectItem>
            </Select>
          </div>
          {!isQuizMode ? (
            <div 
              role="form" 
              aria-label="Question Input Form"
              onKeyDown={handleKeyPressStart}
            >
              <Textarea
                label="Prompt Input"
                placeholder="Paste your prompt here... (including <output> tags)"
                value={promptInput}
                onValueChange={handlePromptInput}
                minRows={4}
                aria-label="Prompt Input Area"
              />
              <Spacer y={4} />
              
              {error && <ErrorDisplay error={error.message} />}

              <div className="flex gap-2">
                {output && !isCompleted && (
                  <Button
                    color="primary"
                    onClick={handleStartQuiz}
                    className="flex-1"
                    isDisabled={!!error || !output}
                    aria-label="Start Answering Questions"
                  >
                    Start Answering Questions (Enter)
                  </Button>
                )}
                
                {(output || isCompleted) && (
                  <Button
                    color="danger"
                    variant="flat"
                    onClick={handleReset}
                    className="flex-1"
                    aria-label="Reset Form"
                  >
                    Reset
                  </Button>
                )}
              </div>

              {isCompleted && (
                <>
                  <Spacer y={4} />
                  <div>
                    <Tabs 
                      selectedKey={activeTab} 
                      onSelectionChange={(key) => setActiveTab(key as string)}
                      className="relative"
                    >
                      <Tab 
                        key="prompt" 
                        title={
                          <div className="flex items-center gap-2">
                            AI Prompt
                            <Button
                              size="sm"
                              variant="flat"
                              onClick={(e) => {
                                e.stopPropagation()
                                copyToClipboard(generateFinalOutput(userAnswers, output))
                              }}
                            >
                              Copy
                            </Button>
                          </div>
                        }
                      >
                        <Code className="w-full max-h-[500px] overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-sm p-4">
                            {generateFinalOutput(userAnswers.map(a => ({...a, type: a.questionType || QuestionType.OPEN_ENDED})), output)}
                          </pre>
                        </Code>
                      </Tab>
                      <Tab 
                        key="feedback" 
                        title={
                          <div className="flex items-center gap-2">
                            AI Feedback
                            <Button
                              size="sm"
                              variant="flat"
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePasteFeedback()
                              }}
                            >
                              Paste
                            </Button>
                          </div>
                        }
                      >
                        <div className="space-y-4">
                          {aiFeedback ? (
                            <AIFeedbackDisplay feedback={parseAIFeedback(aiFeedback)} />
                          ) : (
                            <div className="text-center p-8 text-default-500">
                              Paste your AI feedback to see the evaluation
                            </div>
                          )}
                        </div>
                      </Tab>
                    </Tabs>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              {isQuizMode && output?.questions[currentQuestionIndex] && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">
                    Question {currentQuestionIndex + 1}:
                  </h3>
                  <p className="mb-4">{output.questions[currentQuestionIndex].question}</p>
                  
                  {output.questions[currentQuestionIndex].type === QuestionType.MULTIPLE_CHOICE ? (
                    <div className="space-y-2">
                      {(output.questions[currentQuestionIndex] as MultipleChoiceQuestion).options.map((option, idx) => (
                        <Button
                          key={idx}
                          className={`w-full text-left justify-start ${
                            currentAnswer === option ? 'bg-primary-100' : ''
                          }`}
                          variant={currentAnswer === option ? "solid" : "flat"}
                          onClick={() => setCurrentAnswer(option)}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm">Code Mode</label>
                        <Switch
                          size="sm"
                          isSelected={isCodeMode}
                          onValueChange={setIsCodeMode}
                          aria-label="Toggle code mode"
                        />
                      </div>
                      <Textarea
                        label="Your Answer"
                        placeholder={isCodeMode ? "Enter your code here..." : "Type your answer here..."}
                        value={currentAnswer}
                        onValueChange={setCurrentAnswer}
                        onKeyDown={(e) => handleKeyPress(e, isCodeMode)}
                        minRows={3}
                        className={isCodeMode ? "font-mono" : ""}
                      />
                    </div>
                  )}

                  <Spacer y={4} />
                  
                  <Progress 
                    aria-label="Question Progress" 
                    value={getCurrentProgress()} 
                    className="mb-4"
                  />

                  <div className="flex gap-2 justify-between">
                    <Button
                      variant="flat"
                      onClick={handlePreviousQuestion}
                      isDisabled={currentQuestionIndex === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      color="primary"
                      onClick={handleNextQuestion}
                    >
                      {currentQuestionIndex === output.questions.length - 1 ? 'Finish' : 'Next'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        size="2xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                How to Use the Question Converter
              </ModalHeader>
              <ModalBody>
                {tutorialSteps.map((step, index) => (
                  <div key={index} className="mb-4">
                    <h3 className="text-medium font-semibold">
                      {step.title}
                    </h3>
                    <p className="text-sm text-default-500">
                      {step.content}
                    </p>
                  </div>
                ))}
                <div className="mt-4">
                  <Button
                    color="primary"
                    variant="flat"
                    onClick={handleCopyBasePrompt}
                    className="w-full"
                  >
                    Copy Base Prompt Template
                  </Button>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={onClose}>
                  Got it
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal 
        isOpen={isTopicModalOpen} 
        onClose={() => {
          setTopicInput("")
          setIsTopicModalOpen(false)
        }}
        size="md"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Enter Your Topic
              </ModalHeader>
              <ModalBody>
                <Input
                  label="Topic"
                  placeholder="Enter the topic for your questions..."
                  value={topicInput}
                  onValueChange={setTopicInput}
                  variant="bordered"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleTopicSubmit()
                    }
                  }}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={handleTopicSubmit}>
                  Copy Template
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}

export default QuestionConverter
