import { useState } from 'react'
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
  useDisclosure,
  Input
} from "@nextui-org/react"
import { Tabs, Tab } from "@nextui-org/react"
import { toast } from "sonner"

interface Question {
  number: number
  question: string
  expected_answer: string
}

interface QuestionData {
  questions: Question[]
}

interface UserAnswer {
  number: number
  question: string
  provided_answer: string
}

// Add this interface for AI prompt structure
interface AIPromptTemplate {
  topic: string
  responses: {
    number: number
    question: string
    provided_answer: string
  }[]
}

function QuestionConverter() {
  const [promptInput, setPromptInput] = useState('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [error, setError] = useState('')
  const [output, setOutput] = useState<QuestionData | null>(null)
  const [isQuizMode, setIsQuizMode] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [activeTab, setActiveTab] = useState('prompt')
  const [aiFeedback, setAIFeedback] = useState('')
  const {isOpen, onOpen, onClose} = useDisclosure()
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false)
  const [topicInput, setTopicInput] = useState("")

  // Update the tutorial steps with more detailed information
  const tutorialSteps = [
    {
      title: "Step 1: Get the Base Prompt",
      content: "Click the 'Copy Base Prompt' button below to get started. This will give you a template that you can modify with your own topic and questions."
    },
    {
      title: "Step 2: Create Your Questions",
      content: "Replace the example topic and questions in the template with your own. Make sure to keep the JSON format intact and include question numbers, questions, and expected answers."
    },
    {
      title: "Step 3: Paste Your Prompt",
      content: "Copy your modified prompt and paste it into the input area. The prompt must include the JSON structure wrapped in either code blocks (```json) or output tags (<output>)."
    },
    {
      title: "Step 4: Answer Questions",
      content: "Click 'Start Answering Questions' to begin the quiz. Type your answers in the text area and press Enter or click Next to proceed."
    },
    {
      title: "Step 5: Get AI Feedback",
      content: "After completing all questions, you'll get an AI prompt. Copy it and paste it to your AI assistant to receive detailed feedback on your answers."
    }
  ]
  // Update base prompt to be a function that takes a topic
  const getBasePrompt = (topic: string) => `# Self-Testing Prompt Generator for Open-Ended Questions

You are an intelligent and meticulous AI assistant designed to create self-testing materials based on a given input topic. Your goal is to generate a JSON structure containing open-ended questions that effectively assess understanding of the provided topic. To ensure high-quality and accurate question generation, follow the structured thought process outlined below.

## Instructions

1. **Understand the Input Topic**
   - Begin by thoroughly analyzing the provided topic to grasp its core concepts and key details.

2. **Iterative Thought Process with Structured Reasoning**
   - Use the following tags to organize your reasoning and output:
     - \`<thinking>\`: Detail your step-by-step thought process.
     - \`<reflection>\`: Critically evaluate your reasoning and identify any potential gaps or improvements.
     - \`<output>\`: Present the final JSON structure with the generated questions.

3. **Generate Open-Ended Questions**
   - Create a set of well-structured open-ended questions that cover various aspects of the topic.
   - Each question should include:
     - A unique question number.
     - The question text.
     - An optional field for an expected answer or guidelines for evaluation.

4. **Ensure Clarity and Relevance**
   - Questions should be clear, unambiguous, and directly related to the topic.
   - Ensure that each question prompts a comprehensive and thoughtful response to effectively assess the learner's understanding.

5. **Format the Output in JSON**
   - Structure the questions in a JSON format as demonstrated in the example below.

## Example Structure

### User Input:
\`\`\`
Topic: ${topic}
\`\`\`

### Assistant Response:
\`\`\`

\`\`\`html
<thinking>
To generate effective open-ended questions on "The Water Cycle," I need to identify the key components and processes involved, such as evaporation, condensation, precipitation, and collection. Additionally, I should consider the relationships between these processes, their significance in Earth's climate system, and their real-world applications. Incorporating questions that encourage detailed explanations and critical thinking will provide a comprehensive assessment.
</thinking>

<reflection>
The identified areas cover the fundamental aspects of the water cycle, including both definitions and applications. Ensuring that questions require elaboration will help assess both basic and deeper understanding. It's important to vary the scope of the questions to cater to different cognitive levels.
</reflection>

\`\`\`json
{
  "questions": [
    {
      "number": 1,
      "question": "Explain the process of evaporation and its role in the water cycle.",
      "expected_answer": "A comprehensive explanation of how water changes from liquid to gas, the factors affecting evaporation, and its significance in the water cycle."
    },
    {
      "number": 2,
      "question": "Describe how condensation contributes to cloud formation.",
      "expected_answer": "Details on how water vapor cools and changes back into liquid droplets, leading to cloud formation, including the conditions necessary for condensation."
    },
    {
      "number": 3,
      "question": "Discuss the impact of precipitation on Earth's ecosystems.",
      "expected_answer": "An analysis of how precipitation distributes water across different regions, supports plant and animal life, and influences weather patterns."
    },
    {
      "number": 4,
      "question": "How does the water cycle regulate Earth's climate?",
      "expected_answer": "Explanation of the water cycle's role in temperature regulation, distribution of heat, and maintenance of climate stability."
    },
    {
      "number": 5,
      "question": "Analyze the effects of human activities on the natural water cycle.",
      "expected_answer": "Discussion on how activities like deforestation, urbanization, and pollution disrupt the water cycle, leading to issues like reduced rainfall, increased runoff, and water contamination."
    }
  ]
}
\`\`\`
</output>
\`\`\`

## Prompt Template

Use the following template to generate your own self-testing questions based on any given topic.

### User Input:
\`\`\`
Topic: <Your Topic Here>
\`\`\`

### Assistant Response:

\`\`\`html
<thinking>
[Your detailed, step-by-step thought process in understanding the topic and formulating open-ended questions]
</thinking>

<reflection>
[Your critical evaluation of the generated questions, ensuring coverage and quality]
</reflection>

<output>
\`\`\`json
{
  "questions": [
    {
      "number": 1,
      "question": "<First Open-Ended Question>",
      "expected_answer": "<Guidelines or key points for the answer>"
    },
    {
      "number": 2,
      "question": "<Second Open-Ended Question>",
      "expected_answer": "<Guidelines or key points for the answer>"
    },
    {
      "number": 3,
      "question": "<Third Open-Ended Question>",
      "expected_answer": "<Guidelines or key points for the answer>"
    }
    // Add more questions as needed
  ]
}
\`\`\`
</output>
\`\`\`

### USER TOPIC
\`\`\`json

\`\`\`

## Guidelines for Effective Question Generation

- **Comprehensive Coverage**: Ensure that the questions cover all major aspects of the topic.
- **Encourage Critical Thinking**: Formulate questions that require explanation, analysis, and synthesis of information.
- **Clarity and Precision**: Questions should be clearly worded and free from ambiguity.
- **Relevance**: All questions should directly relate to the key concepts of the topic.
- **Balanced Difficulty**: Include a mix of questions that vary in complexity to assess different levels of understanding.

## Final Instructions

- **Review and Revise**: After generating the questions, review them to ensure accuracy and completeness.
- **Maintain Consistency**: Follow a consistent format for all questions and fields.
- **Provide Answer Guidelines**: Include expected answers or key points to guide the evaluation of responses.
- **Ethical Considerations**: Ensure that all questions are appropriate and free from bias.

---

By following this structured approach, you will create effective self-testing materials that facilitate meaningful learning and assessment through open-ended questions.
`

  // Update copyBasePrompt to open topic modal instead
  function handleCopyBasePrompt() {
    setIsTopicModalOpen(true)
  }

  // Add function to handle topic submission
  function handleTopicSubmit() {
    if (!topicInput.trim()) {
      toast.error("Topic required", {
        description: "Please enter a topic before copying the template.",
        duration: 2000,
      })
      return
    }
    
    copyToClipboard(
      getBasePrompt(topicInput),
      `Template for "${topicInput}" copied!`
    )
    setTopicInput("")
    setIsTopicModalOpen(false)
  }

  function extractJsonFromPrompt(prompt: string): QuestionData | null {
    try {
      // First try to find JSON within code block
      const codeBlockRegex = /```json\s*([\s\S]*?)\s*```/
      const codeBlockMatch = prompt.match(codeBlockRegex)
      
      if (codeBlockMatch) {
        const jsonStr = codeBlockMatch[1].trim()
        return JSON.parse(jsonStr)
      }

      // If no code block found, try output tags
      const outputMatch = prompt.match(/<output>([\s\S]*?)<\/output>/)
      if (outputMatch) {
        // Find the JSON object within the output tags
        const jsonRegex = /\{[\s\S]*\}/
        const jsonMatch = outputMatch[1].match(jsonRegex)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
      }

      return null
    } catch (error) {
      console.error('Error parsing JSON:', error)
      return null
    }
  }

  function handlePromptInput(value: string) {
    setPromptInput(value)
    setError('')
    setUserAnswers([])
    setCurrentQuestionIndex(0)
    setIsCompleted(false)

    const extractedData = extractJsonFromPrompt(value)
    if (extractedData?.questions) {
      setOutput(extractedData)
    } else {
      setError('Invalid prompt format or no questions found')
    }
  }

  function handleStartQuiz() {
    if (!output?.questions.length) {
      setError('No questions loaded')
      return
    }
    setIsQuizMode(true)
    setCurrentQuestionIndex(0)
    setUserAnswers([])
    setIsCompleted(false)
  }

  function handleNextQuestion() {
    if (!currentAnswer.trim()) {
      setError('Please provide an answer')
      return
    }

    const currentQuestion = output!.questions[currentQuestionIndex]
    
    const newAnswer: UserAnswer = {
      number: currentQuestion.number,
      question: currentQuestion.question,
      provided_answer: currentAnswer
    }

    setUserAnswers(prev => [...prev, newAnswer])
    setCurrentAnswer('')
    setError('')

    if (currentQuestionIndex < output!.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      setIsQuizMode(false)
      setIsCompleted(true)
    }
  }

  // Add function to generate AI evaluation prompt
  function generateAIPrompt(answers: UserAnswer[]): string {
    const promptTemplate: AIPromptTemplate = {
      topic: output?.questions[0].question.split(' ')[0] || "Topic",
      responses: answers.map(answer => ({
        number: answer.number,
        question: answer.question,
        provided_answer: answer.provided_answer
      }))
    }

    return `### IMPORTANT: WRAP YOUR ENTIRE RESPONSE IN MARKDOWN TEXT FORMAT ###

# Self-Testing Answer Verification for Open-Ended Questions

Topic: ${promptTemplate.topic}
Questions and Provided Answers:
\`\`\`json
${JSON.stringify(promptTemplate, null, 2)}
\`\`\`

## Evaluation Instructions

Please evaluate these answers and provide your response in proper markdown format with:

1. **Evaluation Criteria**
   - Compare against expected answers
   - Assess accuracy, completeness, and clarity
   - Provide detailed feedback
   - Grade using emojis (🟢 Excellent, 🟡 Good, 🔴 Needs Improvement)

2. **Required Response Format**
   Use these tags within your markdown response:

   \`\`\`markdown
   <thinking>
   [Your detailed evaluation process]
   </thinking>

   <reflection>
   [Your overall assessment]
   </reflection>

   <output>
   [Your detailed evaluation in JSON format]
   </output>
   \`\`\`

### REMINDER: ENSURE YOUR ENTIRE RESPONSE IS IN MARKDOWN FORMAT ###`
  }

  function generateFinalOutput(): string {
    const simulatedAIEvaluation = {
      verification: userAnswers.map(answer => ({
        number: answer.number,
        question: answer.question,
        provided_answer: answer.provided_answer,
        expected_answer: output?.questions.find(q => q.number === answer.number)?.expected_answer || "",
        evaluation: "[This is where the AI would provide detailed feedback based on the answer.]",
        grade: "[🟡 This is where the AI would provide Grade.]"
      }))
    }

    return `${generateAIPrompt(userAnswers)}

---

## Example Response Format

Your response should be formatted like this:

\`\`\`markdown
# Evaluation Results

<thinking>
Detailed analysis of each answer...
</thinking>

<reflection>
Overall assessment of the responses...
</reflection>

<output>
\`\`\`json
${JSON.stringify(simulatedAIEvaluation, null, 2)}
\`\`\`
</output>
\`\`\`

### END OF PROMPT - REMEMBER TO WRAP YOUR RESPONSE IN MARKDOWN ###`
  }

  function getCurrentProgress() {
    if (!output?.questions.length) return 0
    return ((currentQuestionIndex + 1) / output.questions.length) * 100
  }

  function copyToClipboard(text: string, message: string = "Copied to clipboard!") {
    navigator.clipboard.writeText(text)
    toast.success(message, {
      description: "You can now paste this content wherever you need it.",
      duration: 2000,
    })
  }

  function handleReset() {
    setPromptInput('')
    setCurrentQuestionIndex(0)
    setUserAnswers([])
    setCurrentAnswer('')
    setError('')
    setOutput(null)
    setIsQuizMode(false)
    setIsCompleted(false)
    setAIFeedback('') // Add this line
  }

  // Add keyboard event handler for the answer textarea
  function handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    // If Enter is pressed without Shift (Shift+Enter allows multiline)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault() // Prevent newline
      handleNextQuestion()
    }
  }

  // Add keyboard handler for starting quiz
  function handleKeyPressStart(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' && output && !isCompleted) {
      handleStartQuiz()
    }
  }


  // Add paste handler function
  async function handlePasteFeedback() {
    try {
      const text = await navigator.clipboard.readText()
      setAIFeedback(text)
      toast.success("Feedback pasted!", {
        description: "AI feedback has been successfully pasted.",
        duration: 2000,
      })
    } catch (error) {
      console.error("Error pasting from clipboard:", error);
      toast.error("Failed to paste", {
        description: "Please make sure you have content copied to your clipboard.",
        duration: 2000,
      })
      setError('Failed to paste from clipboard')
    }
  }

  return (
    <div className="max-w-full mx-auto p-4">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div className="flex flex-col">
            <p className="text-md">Open-Ended Question System</p>
            <p className="text-small text-default-500">
              Create and answer self-testing questions
            </p>
          </div>
          <div>
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
              
              {error && (
                <p className="text-danger mb-4" role="alert">
                  {error}
                </p>
              )}

              <div className="flex gap-2">
                {output && !isCompleted && (
                  <Button
                    color="primary"
                    onClick={handleStartQuiz}
                    className="flex-1"
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
                                    generateFinalOutput(),
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
                            {generateFinalOutput()}
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
                        <div className="w-full">
                          {!aiFeedback ? (
                            <div className="text-center p-4 text-default-500">
                              Click "Paste" to add AI feedback here
                            </div>
                          ) : (
                            <Code className="w-full max-h-[500px] overflow-y-auto">
                              <pre className="whitespace-pre-wrap text-sm p-4">
                                {aiFeedback}
                              </pre>
                            </Code>
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
                
                <Textarea
                  label="Your Answer"
                  placeholder="Type your answer here... (Press Enter to submit)"
                  value={currentAnswer}
                  onValueChange={setCurrentAnswer}
                  onKeyDown={handleKeyPress}
                  minRows={3}
                  aria-label={`Answer for question ${currentQuestionIndex + 1}`}
                />
                
                <p className="text-small text-default-500 mt-2">
                  Tip: Press Enter to submit, Shift+Enter for new line
                </p>
              </div>

              {error && (
                <p className="text-danger mb-4" role="alert">
                  {error}
                </p>
              )}

              <Button
                color="primary"
                onClick={handleNextQuestion}
                className="w-full"
                aria-label={currentQuestionIndex < (output?.questions.length || 0) - 1 
                  ? "Next Question" 
                  : "Finish Quiz"}
              >
                {currentQuestionIndex < (output?.questions.length || 0) - 1 
                  ? "Next Question" 
                  : "Finish"}
              </Button>
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

      {/* Add new topic input modal */}
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
