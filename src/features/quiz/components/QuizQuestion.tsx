import { Textarea } from "@nextui-org/react"
import { MultipleChoiceInput } from "./MultipleChoiceInput"
import { QuestionType } from "../../../shared/types"

interface QuizQuestionProps {
  type: QuestionType
  value: string
  onChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  options?: string[]
}

export function QuizQuestion({ 
  type, 
  value, 
  onChange, 
  onKeyDown,
  options = []
}: QuizQuestionProps) {
  if (type === QuestionType.MULTIPLE_CHOICE) {
    return (
      <MultipleChoiceInput
        options={options}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
    )
  }

  return (
    <Textarea
      placeholder="Type your answer here..."
      value={value}
      onValueChange={onChange}
      onKeyDown={onKeyDown}
      minRows={5}
      aria-label="Answer input"
      variant="faded"
      color="primary"
      size="lg"
      classNames={{
        input: "font-medium text-default-900 text-lg leading-relaxed",
        inputWrapper: "border-2 hover:border-primary/50 focus-within:!border-primary bg-default-50 transition-colors py-4 px-4 shadow-sm",
      }}
    />
  )
}
