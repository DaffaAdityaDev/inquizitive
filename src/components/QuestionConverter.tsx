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
  Input,
  Chip,
  Divider,
  Switch
} from "@nextui-org/react"
import { Tabs, Tab } from "@nextui-org/react"
import { toast } from "sonner"

interface Question {
  number: number
  question: string
  expected_answer: string
  isCodeQuestion?: boolean // Add this field
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

// Add new interface for parsed feedback
interface ParsedFeedback {
  number: number
  question: string
  provided_answer: string
  expected_answer: string
  evaluation: string
  grade: string
}

// Add this type for consistent error messages
type ErrorType = {
  message: string;
  type: 'parse' | 'validation' | 'quiz';
}

// Add function to parse AI feedback
function parseAIFeedback(feedback: string): ParsedFeedback[] {
  try {
    // Update patterns to match both <json> and ```json formats
    const patterns = [
      /<json>([\s\S]*?)<\/json>/,
      /```json\s*([\s\S]*?)```/
    ]

    for (const pattern of patterns) {
      const match = feedback.match(pattern)
      if (match) {
        const jsonContent = JSON.parse(match[1].trim())
        return jsonContent.verification || []
      }
    }

    // If no matches found, try parsing the entire feedback as JSON
    const jsonMatch = feedback.match(/{[\s\S]*}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return parsed.verification || []
    }

    return []
  } catch (error) {
    console.error('Error parsing AI feedback:', error)
    return []
  }
}


function QuestionConverter() {
  const [promptInput, setPromptInput] = useState('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [error, setError] = useState<ErrorType | null>(null)
  const [output, setOutput] = useState<QuestionData | null>(null)
  const [isQuizMode, setIsQuizMode] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [activeTab, setActiveTab] = useState('prompt')
  const [aiFeedback, setAIFeedback] = useState('')
  const {isOpen, onOpen, onClose} = useDisclosure()
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false)
  const [topicInput, setTopicInput] = useState("")
  const [isCodeMode, setIsCodeMode] = useState(false)

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
   - If use want Coding questions make question, if user want non-coding questions, make non-coding questions. if user want both, make both. 
   - For Coding question, it should have code example or code snippets.

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
<user_input>
Topic: react and software engineering concepts and best practices, coding challenges
</user_input>

### Assistant Response:
<assistant_response>

</assistant_response>

<thinking>
<thinking>
To generate effective open-ended questions on "The Water Cycle," I need to identify the key components and processes involved, such as evaporation, condensation, precipitation, and collection. Additionally, I should consider the relationships between these processes, their significance in Earth's climate system, and their real-world applications. Incorporating questions that encourage detailed explanations and critical thinking will provide a comprehensive assessment.
</thinking>

<reflection>
The identified areas cover the fundamental aspects of the water cycle, including both definitions and applications. Ensuring that questions require elaboration will help assess both basic and deeper understanding. It's important to vary the scope of the questions to cater to different cognitive levels.
</reflection>

<assistant_response>
<output>
<json>
{
  "questions": [
    {
      "number": 1,
      "question": "How to design secure applications",
      "expected_answer": "make sure to use secure practices such as encryption, secure coding practices, and regular security audits. follow best practices for secure coding and implement security measures to protect sensitive data."
    {
      "number": 2,
      "question": "How to use UseState in React",
      "expected_answer": "
      <code>
      import { useState } from 'react';

      function Example() {
        const [count, setCount] = useState(0);

        return (
          <div>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>Increment</button>
          </div>
        );
      }

      export default Example;
      </code>
      "
    },
    {
      "number": 3,
      "question": "How Improve Perfomance on db?",
      "expected_answer": "for improving performance on db, you can use indexing, caching, and optimizing queries. use tools like EXPLAIN ANALYZE to identify and optimize slow queries. consider database tuning and schema optimization. sql queries should be optimized for performance and efficiency. 
      nosql, redis, and other db should be optimized for performance and efficiency. like using caching mechanisms, indexing, and sharding."
    },
    {
      "number": 4,
      "question": "how make sure frontend is performant?",
      "expected_answer": "to make sure frontend is performant, you can use tools like react dev tools to identify and optimize slow queries. consider using server-side rendering, code-splitting, and lazy loading. use tools like react dev tools to identify and optimize slow queries. consider using server-side rendering, code-splitting, and lazy loading. use tools like react dev tools to identify and optimize slow queries. consider using server-side rendering, code-splitting, and lazy loading."
    },
    {
      "number": 5,
      "question": "to make sure backend is performant?",
      "expected_answer": "to make sure backend is performant, you can use tools like express dev tools to identify and optimize slow queries. consider using server-side rendering, code-splitting, and lazy loading. use tools like express dev tools to identify and optimize slow queries. consider using server-side rendering, code-splitting, and lazy loading. use tools like express dev tools to identify and optimize slow queries. consider using server-side rendering, code-splitting, and lazy loading."
    },
    {
      "number": 6,
      "question": "implement lazy loading in react",
      "expected_answer": "to implement lazy loading in react, you can use the React.lazy function and Suspense component. wrap the component you want to lazy load in a React.lazy function and wrap it in a Suspense component. use the lazy function to import the component and the Suspense component to handle the loading state. this will improve the performance of your application by only loading the components that are needed when they are needed.
      these are the steps: "
     
      1. import { lazy, Suspense } from 'react';
      2. create a function that returns a lazy loaded component
      3. use the lazy function to import the component
      4. wrap the lazy loaded component in a Suspense component
      5. use the imported component in your application
  
      these are the code:
      <code>
      import { lazy, Suspense } from 'react';

      const LazyComponent = lazy(() => import('./LazyComponent'));

      function App() {
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <LazyComponent />
          </Suspense>
        );
      }

      export default App;
      </code>
      "
    }
  ]
}
</json>
</output>
</assistant_response>
## Prompt Template

Use the following template to generate your own self-testing questions based on any given topic.

### User Input:
<user_input>
Topic: ${topic}
</user_input>

### Assistant Response:

<assistant_response>
<thinking>
[Your detailed, step-by-step thought process in understanding the topic and formulating open-ended questions]
</thinking>

<reflection>
[Your critical evaluation of the generated questions, ensuring coverage and quality]
</reflection>

<output>
<json>
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
</json>
</output>
</assistant_response>

### USER TOPIC
<user_input>
${topic}
</user_input>

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

    console.log(getBasePrompt(topicInput))
    
    copyToClipboard(
      getBasePrompt(topicInput),
      `Template for "${topicInput}" copied!`
    )
    setTopicInput("")
    setIsTopicModalOpen(false)
  }

  // Update extractJsonFromPrompt function
  function extractJsonFromPrompt(prompt: string): QuestionData | null {
    try {
      const patterns = [
        /<json>([\s\S]*?)<\/json>/,
        /<output>[\s\S]*?{[\s\S]*?}[\s\S]*?<\/output>/,
        /```json\s*([\s\S]*?)```/,
        /{[\s\S]*"questions"[\s\S]*}/
      ]

      for (const pattern of patterns) {
        const match = prompt.match(pattern)
        if (match) {
          let jsonString = match[0]
          // Remove any surrounding tags or code block markers
          jsonString = jsonString.replace(/<\/?json>|<\/?output>|```json|```/g, '').trim()
          
          // Additional cleaning steps
          jsonString = jsonString
            .replace(/\\n/g, '\\n')
            .replace(/\\'/g, "\\'")
            .replace(/\\"/g, '\\"')
            .replace(/\\&/g, '\\&')
            .replace(/\\r/g, '\\r')
            .replace(/\\t/g, '\\t')
            .replace(/\\b/g, '\\b')
            .replace(/\\f/g, '\\f')
            .replace(/[\u0000-\u0019]+/g, '')
          
          try {
            const parsed = JSON.parse(jsonString)
            
            // Validate the parsed data structure
            if (!parsed.questions || !Array.isArray(parsed.questions)) {
              setError({
                message: "Invalid format: Missing questions array",
                type: 'parse'
              })
              return null
            }
            
            // Validate each question has required fields
            const isValidQuestions = parsed.questions.every((q: Question) => 
              typeof q.number === 'number' && 
              typeof q.question === 'string' && 
              typeof q.expected_answer === 'string'
            )

            if (!isValidQuestions) {
              setError({
                message: "Invalid format: Questions must have number, question, and expected_answer fields",
                type: 'parse'
              })
              return null
            }
            
            return parsed
          } catch (parseError) {
            console.error('Error parsing JSON:', parseError)
            // Continue to the next pattern if parsing fails
          }
        }
      }

      setError({
        message: "No valid JSON found in prompt",
        type: 'parse'
      })
      return null
    } catch (error) {
      let errorMessage = "Failed to parse JSON"
      
      if (error instanceof Error) {
        // Provide more user-friendly error messages
        if (error.message.includes("control character")) {
          errorMessage = "Invalid characters in JSON. Please check for special characters or line breaks"
        } else if (error.message.includes("Unexpected token")) {
          errorMessage = "Invalid JSON format. Please check the syntax"
        } else {
          errorMessage = `JSON parsing error: ${error.message}`
        }
      }

      setError({
        message: errorMessage,
        type: 'parse'
      })
      console.error('Error parsing JSON:', error)
      return null
    }
  }

  // Update handlePromptInput to show loading state
  function handlePromptInput(value: string) {
    setPromptInput(value)
    setError(null)
    
    if (!value.trim()) {
      setOutput(null)
      return
    }

    try {
      const parsed = extractJsonFromPrompt(value)
      if (parsed) {
        setOutput(parsed)
      }
    } catch (error) {
      console.error('Error in handlePromptInput:', error)
      setError({
        message: "Failed to process input",
        type: 'parse'
      })
    }
  }

  function handleStartQuiz() {
    if (!output || !output.questions || output.questions.length === 0) {
      setError({
        message: "No valid questions found. Please check your prompt format.",
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

  function handleNextQuestion() {
    if (!currentAnswer.trim()) {
      setError({
        message: "Please provide an answer",
        type: 'validation'
      })
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
    setError(null)

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
<json>
${JSON.stringify(promptTemplate, null, 2)}
</json>

## Evaluation Instructions

Please evaluate these answers and provide your response in proper markdown format with:

1. **Evaluation Criteria**
   - Compare against expected answers
   - Assess accuracy, completeness, and clarity
   - Provide detailed feedback
   - Grade using emojis (🟢 Excellent, 🟡 Good, 🔴 Needs Improvement) for each question Also include a grade NUMBER for the overall quiz

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
   <json>
   [Your detailed evaluation in JSON format]
   </json>
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
        grade: "[🟡 This is where the AI would provide Grade. Example: Grade 2/10]"
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
<json>
${JSON.stringify(simulatedAIEvaluation, null, 2)}
</json>
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
    setError(null)
    setOutput(null)
    setIsQuizMode(false)
    setIsCompleted(false)
    setAIFeedback('') // Add this line
  }

  // Add keyboard event handler for the answer textarea
  function handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    // In code mode, Enter creates new line. Otherwise, Enter submits
    if (e.key === 'Enter') {
      if (isCodeMode) {
        // Let the default behavior happen (new line)
        return
      } else if (!e.shiftKey) {
        e.preventDefault()
        handleNextQuestion()
      }
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
      setError({
        message: "Failed to paste from clipboard",
        type: 'parse'
      })
    }
  }

  // Add error display component
  function ErrorDisplay({ error }: { error: ErrorType }) {
    return (
      <div 
        className={`mb-4 p-3 rounded-medium ${
          error.type === 'parse' ? 'bg-danger-50 dark:bg-danger-900/20' : 
          error.type === 'validation' ? 'bg-warning-50 dark:bg-warning-900/20' : 
          'bg-danger-50 dark:bg-danger-900/20'
        }`}
      >
        <p className="text-danger dark:text-danger-500 text-small">
          {error.message}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-full mx-auto p-4 pt-0">
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
                <ErrorDisplay error={error} />
              )}

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
                                      Grade {item.grade}
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
                
                {/* Add code mode toggle */}
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

              {error && (
                <ErrorDisplay error={error} />
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
