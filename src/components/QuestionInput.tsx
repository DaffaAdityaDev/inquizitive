import { Textarea } from "@nextui-org/react"
import { MultipleChoiceInput } from "./MultipleChoiceInput"
import { QuestionType } from "../types"

interface QuestionInputProps {
  type: QuestionType
  value: string
  onChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  options?: string[]
}

export function QuestionInput({ 
  type, 
  value, 
  onChange, 
  onKeyDown,
  options = []
}: QuestionInputProps) {
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
      placeholder="Enter your answer..."
      value={value}
      onValueChange={onChange}
      onKeyDown={onKeyDown}
      minRows={4}
      aria-label="Answer input"
    />
  )
}