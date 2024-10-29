import { useState } from 'react'
import { useDisclosure } from "@nextui-org/react"
import { toast } from "sonner"

interface TutorialStep {
  title: string
  content: string
}

export function useTutorialAndModals() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false)
  const [topicInput, setTopicInput] = useState("")

  const tutorialSteps: TutorialStep[] = [
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

  const basePromptTemplate = (topic: string) => `
# Self-Testing Prompt Generator for Open-Ended Questions

You are an intelligent and meticulous AI assistant designed to create self-testing materials. Your goal is to generate questions that effectively assess understanding of: ${topic}

## Instructions

1. Begin by analyzing the topic thoroughly
2. Generate both theoretical and practical questions
3. For coding topics, include code examples and snippets
4. Ensure questions encourage critical thinking

Please structure your response using these tags:

<thinking>
[Your analysis of the ${topic} and key concepts to cover]
</thinking>

<reflection>
[Your evaluation of the question quality and coverage]
</reflection>

<output>
{
  "questions": [
    {
      "number": 1,
      "question": "What is the fundamental concept of ${topic}?",
      "expected_answer": "A comprehensive explanation including key principles..."
    },
    {
      "number": 2,
      "question": "How would you implement ${topic} in a practical scenario?",
      "expected_answer": "Step-by-step implementation guide with code examples if applicable..."
    }
  ]
}
</output>

Guidelines:
- Questions should encourage detailed explanations
- Include both theoretical and practical aspects
- For coding topics, include code examples
- Ensure questions are clear and unambiguous
- Provide comprehensive expected answers

Please generate 3-5 questions following this format.`

  const handleCopyBasePrompt = () => {
    setIsTopicModalOpen(true)
  }

  const handleTopicSubmit = async () => {
    if (!topicInput.trim()) {
      toast.error("Please enter a topic", {
        description: "The topic cannot be empty",
        duration: 2000,
      })
      return
    }

    try {
      const promptText = basePromptTemplate(topicInput)
      await navigator.clipboard.writeText(promptText)
      toast.success("Template copied!", {
        description: "You can now paste this to your AI assistant",
        duration: 2000,
      })
      setTopicInput("")
      setIsTopicModalOpen(false)
    } catch (error) {
      console.error("Error copying template:", error)
      toast.error("Failed to copy template", {
        description: "Please try again or copy manually",
        duration: 2000,
      })
    }
  }

  const closeTopicModal = () => {
    setTopicInput("")
    setIsTopicModalOpen(false)
  }

  return {
    isOpen,
    onOpen,
    onClose,
    isTopicModalOpen,
    setIsTopicModalOpen,
    topicInput,
    setTopicInput,
    tutorialSteps,
    handleCopyBasePrompt,
    handleTopicSubmit,
    closeTopicModal
  }
}
