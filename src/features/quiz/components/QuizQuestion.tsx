import { Textarea } from "@nextui-org/react"
import { MultipleChoiceInput } from "./MultipleChoiceInput"
import { QuestionType } from "../../../shared/types"
import { motion } from "framer-motion"
import { isImeComposing } from "../../../shared/utils/keyboard"

const kbdClass = "px-1 py-0.5 bg-default-100 rounded border border-default-200 font-mono"

// Each question remounts the textarea; refocus it on keyboard devices, but don't pop up a phone keyboard
function prefersAutoFocus() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: fine)').matches
}

interface QuizQuestionProps {
  type: QuestionType
  value: string
  onChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onSubmit: () => void
  options?: string[]
  isCodeMode?: boolean
}

export function QuizQuestion({ 
  type, 
  value, 
  onChange, 
  onKeyDown,
  onSubmit,
  options = [],
  isCodeMode = false
}: QuizQuestionProps) {
  if (type === QuestionType.MULTIPLE_CHOICE) {
    return (
      <MultipleChoiceInput
        options={options}
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
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

    // The session hook leaves Enter as a newline in code mode, so Ctrl/Cmd+Enter is the way forward there
    if (isCodeMode && e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !isImeComposing(e)) {
      e.preventDefault()
      onSubmit()
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
        autoFocus={prefersAutoFocus()}
        minRows={isCodeMode ? 8 : 5}
        aria-label="Answer input"
        variant="faded"
        color="primary"
        size="lg"
        className="min-w-0"
        classNames={{
          input: isCodeMode
            ? "font-mono text-sm sm:text-base leading-relaxed text-default-900 tab-size-2"
            : "font-medium text-default-900 text-lg leading-relaxed",
          inputWrapper: isCodeMode 
            ? "border-2 hover:border-primary/50 focus-within:!border-primary bg-content2/80 font-mono transition-colors py-3 px-4 shadow-sm"
            : "border-2 hover:border-primary/50 focus-within:!border-primary bg-default-50 transition-colors py-4 px-4 shadow-sm",
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1 text-tiny text-default-400 select-none">
        {isCodeMode ? (
          <span className="flex items-center gap-1 font-mono">
            <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
            Code Mode
          </span>
        ) : <span />}
        <span className="flex flex-wrap items-center gap-1">
          {isCodeMode ? (
            <>
              <kbd className={kbdClass}>Ctrl+Enter</kbd> = next · <kbd className={kbdClass}>Tab</kbd> = 2 spaces
            </>
          ) : (
            <>
              <kbd className={kbdClass}>Enter</kbd> = next · <kbd className={kbdClass}>Shift+Enter</kbd> = new line
            </>
          )}
        </span>
      </div>
    </motion.div>
  )
}
