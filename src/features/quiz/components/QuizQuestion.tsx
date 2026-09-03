import { Textarea } from "@nextui-org/react"
import { MultipleChoiceInput } from "./MultipleChoiceInput"
import { QuestionType } from "../../../shared/types"
import { motion } from "framer-motion"

interface QuizQuestionProps {
  type: QuestionType
  value: string
  onChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  options?: string[]
  isCodeMode?: boolean
}

export function QuizQuestion({ 
  type, 
  value, 
  onChange, 
  onKeyDown,
  options = [],
  isCodeMode = false
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

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (isCodeMode && e.key === 'Tab') {
      e.preventDefault()
      const target = e.currentTarget as HTMLTextAreaElement
      const start = target.selectionStart ?? 0
      const end = target.selectionEnd ?? 0
      const newValue = value.substring(0, start) + '  ' + value.substring(end)
      onChange(newValue)

      // Retain cursor position after inserting 2 spaces
      requestAnimationFrame(() => {
        if (target) {
          target.selectionStart = target.selectionEnd = start + 2
        }
      })
      return
    }

    onKeyDown(e as unknown as React.KeyboardEvent)
  }

  return (
    <motion.div 
      layout 
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }} 
      className="w-full space-y-2"
    >
      <Textarea
        placeholder={isCodeMode ? "// Type or paste your code snippet here...\nfunction solution() {\n  \n}" : "Type your answer here..."}
        value={value}
        onValueChange={onChange}
        onKeyDown={handleTextareaKeyDown}
        minRows={isCodeMode ? 8 : 5}
        aria-label="Answer input"
        variant="faded"
        color="primary"
        size="lg"
        classNames={{
          input: isCodeMode
            ? "font-mono text-sm sm:text-base leading-relaxed text-default-900 tab-size-2"
            : "font-medium text-default-900 text-lg leading-relaxed",
          inputWrapper: isCodeMode 
            ? "border-2 hover:border-primary/50 focus-within:!border-primary bg-content2/80 font-mono transition-colors py-3 px-4 shadow-sm"
            : "border-2 hover:border-primary/50 focus-within:!border-primary bg-default-50 transition-colors py-4 px-4 shadow-sm",
        }}
      />
      {isCodeMode && (
        <div className="flex items-center justify-between px-1 text-tiny text-default-400 font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
            Code Mode Active
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-default-100 rounded border border-default-200">Tab</kbd> = 2 spaces • <kbd className="px-1 py-0.5 bg-default-100 rounded border border-default-200">Shift+Enter</kbd> = newline
          </span>
        </div>
      )}
    </motion.div>
  )
}
