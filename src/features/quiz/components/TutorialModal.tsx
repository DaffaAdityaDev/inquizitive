import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@nextui-org/react'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'

const TUTORIAL_STEPS = [
  {
    title: "Copy a quiz prompt",
    content: "In step 1, click 'Copy Prompt', enter a topic and pick the question type (open-ended, multiple choice or mixed), number of questions, difficulty and language. You can also paste your own notes as source material. The finished prompt is copied to your clipboard."
  },
  {
    title: "Ask a free AI chat",
    content: "Paste the prompt into any free AI chat such as ChatGPT or Gemini. No API key or account setup is needed in Inquizitive."
  },
  {
    title: "Paste the AI's JSON",
    content: "Copy the AI's whole reply and paste it into step 2 (or use 'Paste from Clipboard'). Inquizitive finds the JSON inside the <output> tags and shows how many questions it found, or what is wrong with the JSON."
  },
  {
    title: "Answer the questions",
    content: "Click 'Start Quiz' (or press Ctrl+Enter in the text box). Mark how sure you are (or press 'I don't know'): a correct guess doesn't count as mastered. Multiple choice answers are graded instantly when you finish."
  },
  {
    title: "Get feedback on open-ended answers",
    content: "If your quiz has open-ended questions, copy the evaluation prompt from the results page into the same AI chat, then paste its JSON reply back with 'Paste AI Feedback'. Each result explains what was missing, with references to learn more."
  },
  {
    title: "Study what you missed",
    content: "Open the 'Study Guide' tab and copy the study prompt into your AI chat: it teaches the concepts you got wrong, with examples, practice questions and references. Then copy the next-round prompt: the AI writes new questions from your results and your learning profile. Concepts you have studied come back on the home page when they are due for review."
  }
]

interface TutorialModalProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function TutorialModal({ isOpen, onOpenChange }: TutorialModalProps) {
  return (
    <Modal
      size="2xl"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
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
                {TUTORIAL_STEPS.map((step, index) => (
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
  )
}
