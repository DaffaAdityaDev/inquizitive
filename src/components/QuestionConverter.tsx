import {
  Card,
  CardBody,
  CardHeader,
  Textarea,
  Button,
  Spacer,
  Code,
  Progress,
  Tooltip,
  Modal, 
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Chip,
  Divider,
  Switch
} from "@nextui-org/react"
import { Tabs, Tab } from "@nextui-org/react"
import { useQuestionConverter } from '../hooks/useQuestionConverter'
import ErrorDisplay from './ErrorDisplay'

function QuestionConverter() {
  const {
    // Quiz state
    output,
    currentQuestionIndex,
    userAnswers,  // Add this
    currentAnswer,
    isQuizMode,
    isCompleted,
    isCodeMode,
    error,
    
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
                      aria-label="AI Evaluation Options"
                      selectedKey={activeTab}
                      onSelectionChange={(key) => setActiveTab(key.toString())}
                      className="mb-4"
                    >
                      <Tab 
                        key="prompt" 
                        title={
                          <div className="flex items-center gap-2">
                            <span>AI Prompt</span>
                            <Tooltip content="Copy to clipboard">
                              <Button 
                                size="sm" 
                                variant="flat"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyToClipboard(
                                    generateFinalOutput(userAnswers, output),
                                    "AI Prompt copied!"
                                  )
                                }}
                              >
                                Copy
                              </Button>
                            </Tooltip>
                          </div>
                        }
                      >
                        <Code className="w-full max-h-[500px] overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-sm p-4">
                            {generateFinalOutput(userAnswers, output)}
                          </pre>
                        </Code>
                      </Tab>
                      <Tab 
                        key="feedback" 
                        title={
                          <div className="flex items-center gap-2">
                            <span>AI Feedback</span>
                            <Tooltip content="Paste from clipboard">
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
                            </Tooltip>
                          </div>
                        }
                      >
                        <div className="w-full space-y-4">
                          {!aiFeedback ? (
                            <div className="text-center p-4 text-default-500">
                              Click "Paste" to add AI feedback here
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {parseAIFeedback(aiFeedback).map((item, index) => (
                                <Card key={index} className="border-1 border-default-200 bg-default-50">
                                  <CardHeader className="flex gap-3">
                                    <div className="flex flex-col">
                                      <p className="text-md font-semibold">Question {item.number}</p>
                                      <p className="text-small text-default-500">{item.question}</p>
                                    </div>
                                    <Chip
                                      className="ml-auto"
                                      color={item.grade.includes("🟢") ? "success" : 
                                             item.grade.includes("🟡") ? "warning" : "danger"}
                                      variant="flat"
                                    >
                                      {item.grade}
                                    </Chip>
                                  </CardHeader>
                                  <Divider className="opacity-50"/>
                                  <CardBody>
                                    <div className="space-y-4">
                                      <div>
                                        <p className="font-semibold mb-2 text-default-700">Your Answer:</p>
                                        <p className="text-default-500 bg-default-100 p-3 rounded-medium">
                                          {item.provided_answer}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="font-semibold mb-2 text-default-700">Expected Answer:</p>
                                        <p className="text-default-500 bg-default-100 p-3 rounded-medium">
                                          {item.expected_answer}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="font-semibold mb-2 text-default-700">Feedback:</p>
                                        <p className="text-default-500 bg-default-100 p-3 rounded-medium">
                                          {item.evaluation}
                                        </p>
                                      </div>
                                      {item.resources && item.resources.length > 0 && (
                                        <div>
                                          <p className="font-semibold mb-2 text-default-700">Resources:</p>
                                          <div className="space-y-2">
                                            {item.resources.map((resource, idx) => (
                                              <a
                                                key={idx}
                                                href={resource}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block text-primary hover:underline bg-default-100 p-3 rounded-medium"
                                              >
                                                {resource}
                                              </a>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </CardBody>
                                </Card>
                              ))}
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
              <Progress 
                value={getCurrentProgress()} 
                className="mb-4"
                aria-label="Question Progress"
                label={`Question ${currentQuestionIndex + 1} of ${output?.questions.length}`}
              />
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">
                  Question {output?.questions[currentQuestionIndex].number}:
                </h3>
                <p className="mb-4" role="heading" aria-level={4}>
                  {output?.questions[currentQuestionIndex].question}
                </p>
                
                <div className="flex items-center gap-2 mb-2">
                  <Switch
                    isSelected={isCodeMode}
                    onValueChange={setIsCodeMode}
                    size="sm"
                  >
                    Code Mode
                  </Switch>
                  <p className="text-small text-default-500">
                    {isCodeMode 
                      ? "Enter creates new line" 
                      : "Enter submits answer (use Shift+Enter for new line)"}
                  </p>
                </div>
                
                <Textarea
                  label="Your Answer"
                  placeholder={isCodeMode 
                    ? "Enter your code here... (Enter creates new line)" 
                    : "Type your answer here... (Press Enter to submit)"
                  }
                  value={currentAnswer}
                  onValueChange={setCurrentAnswer}
                  onKeyDown={handleKeyPress}
                  minRows={3}
                  aria-label={`Answer for question ${currentQuestionIndex + 1}`}
                />
              </div>

              {error && <ErrorDisplay error={error.message} />}

              <div className="flex gap-2">
                <Button
                  color="primary"
                  variant="flat"
                  onClick={handlePreviousQuestion}
                  isDisabled={currentQuestionIndex === 0}
                  className="flex-1"
                  aria-label="Previous Question"
                >
                  Previous
                </Button>
                
                <Button
                  color="primary"
                  onClick={handleNextQuestion}
                  className="flex-1"
                  aria-label={currentQuestionIndex < (output?.questions.length || 0) - 1 
                    ? "Next Question" 
                    : "Finish Quiz"}
                >
                  {currentQuestionIndex < (output?.questions.length || 0) - 1 
                    ? "Next" 
                    : "Finish"}
                </Button>
              </div>
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
