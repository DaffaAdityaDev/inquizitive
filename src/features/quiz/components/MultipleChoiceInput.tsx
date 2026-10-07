import { useEffect, useRef } from "react"
import { Button } from "@nextui-org/react"
import { CheckCircleIcon } from "@heroicons/react/24/solid"
import { motion } from "framer-motion"

interface MultipleChoiceInputProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const MAX_NUMBER_KEY = 9

const kbdClass = 'px-1.5 py-0.5 bg-default-100 border border-default-200 rounded font-mono text-default-600 font-semibold'

function shouldIgnoreKey(e: KeyboardEvent) {
  if (e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return true
  const target = e.target as HTMLElement | null
  if (!target) return false
  if (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return true
  // Keys belong to an open modal or dropdown menu, not the question underneath
  if (target.closest('[role="dialog"], [role="menu"]') || document.querySelector('[role="dialog"]')) return true
  return false
}

// Focus follows shortcut selection; otherwise Enter would re-select a previously clicked (focused) option
function selectByShortcut(index: number, options: string[], onChange: (value: string) => void) {
  onChange(options[index])
  document.querySelector<HTMLElement>(`[data-mcq-option="${index}"]`)?.focus()
}

export function MultipleChoiceInput({
  options,
  value,
  onChange,
  onSubmit
}: MultipleChoiceInputProps) {
  // Refs keep one stable listener while always seeing the latest props
  const latest = useRef({ options, value, onChange, onSubmit })
  latest.current = { options, value, onChange, onSubmit }

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreKey(e)) return
      const { options, value, onChange, onSubmit } = latest.current

      if (e.key === 'Enter') {
        // Let other focused buttons (Previous/Next, menu) handle their own Enter
        const button = (e.target as HTMLElement | null)?.closest('button, a, [role="button"]')
        const focusedOption = button?.getAttribute('data-mcq-option')
        if (button && focusedOption == null) return
        // Stop the option button's own press handling so Enter can't also re-select after advancing
        e.preventDefault()
        e.stopPropagation()
        if (e.repeat) return
        const focused = focusedOption ? options[Number(focusedOption)] : undefined
        if (focused !== undefined && focused !== value) onChange(focused)
        else if (value) onSubmit()
        return
      }

      if (e.key.length !== 1) return

      const letterIndex = LETTERS.indexOf(e.key.toUpperCase())
      if (letterIndex !== -1 && letterIndex < options.length) {
        e.preventDefault()
        selectByShortcut(letterIndex, options, onChange)
        return
      }

      const num = Number(e.key)
      if (Number.isInteger(num) && num >= 1 && num <= Math.min(options.length, MAX_NUMBER_KEY)) {
        e.preventDefault()
        selectByShortcut(num - 1, options, onChange)
      }
    }

    // Capture phase runs before React's handlers on the focused element
    window.addEventListener('keydown', handleGlobalKeyDown, true)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, true)
  }, [])

  const lastLetter = LETTERS[Math.max(options.length, 1) - 1]
  const lastNumber = Math.min(options.length, MAX_NUMBER_KEY)

  return (
    <div className="flex flex-col gap-2.5 sm:gap-3 w-full">
      {options.map((option, idx) => {
        const isSelected = value === option
        const letter = LETTERS[idx] ?? `${idx + 1}`
        const numberKey = idx < MAX_NUMBER_KEY ? `${idx + 1}` : null

        return (
          <motion.div
            key={`${option}-${idx}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.035, type: "spring", stiffness: 380, damping: 28 }}
            whileTap={{ scale: 0.985 }}
            className="w-full min-w-0"
          >
            <Button
              data-mcq-option={idx}
              className={`w-full min-w-0 flex justify-between items-center px-3 sm:px-6 py-4 sm:py-7 border-2 transition-all h-auto text-left group ${
                isSelected
                  ? 'bg-primary/10 border-primary shadow-sm ring-2 ring-primary/20'
                  : 'bg-content1 border-default-200 hover:border-primary/40 hover:bg-default-50 shadow-sm'
              }`}
              variant="light"
              onPress={() => onChange(option)}
              aria-keyshortcuts={numberKey ? `${letter} ${numberKey}` : letter}
              radius="lg"
            >
              <div className="flex items-center gap-3 sm:gap-4 text-left w-full min-w-0 pr-2">
                <span className={`flex-shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-bold text-sm transition-transform group-hover:scale-105 ${
                  isSelected ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-default-200 text-default-600'
                }`}>
                  {letter}
                </span>
                <span className={`text-sm sm:text-base font-medium whitespace-normal break-words leading-relaxed flex-1 min-w-0 ${
                  isSelected ? 'text-primary font-bold' : 'text-default-700'
                }`}>
                  {option}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="hidden sm:flex items-center gap-1" aria-hidden="true">
                  {[letter, numberKey].filter(Boolean).map(key => (
                    <kbd
                      key={key}
                      className={`px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors ${
                        isSelected
                          ? 'bg-primary/20 text-primary border-primary/30 font-bold'
                          : 'bg-default-100 text-default-400 border-default-200 group-hover:border-default-300'
                      }`}
                    >
                      {key}
                    </kbd>
                  ))}
                </span>
                {isSelected && (
                  <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary animate-in zoom-in duration-200" />
                )}
              </div>
            </Button>
          </motion.div>
        )
      })}

      <div className="hidden sm:flex flex-wrap items-center justify-center gap-2 pt-2 text-tiny text-default-400 select-none">
        <span>Press</span>
        <kbd className={kbdClass}>A–{lastLetter}</kbd>
        <span>or</span>
        <kbd className={kbdClass}>1–{lastNumber}</kbd>
        <span>to select</span>
        <span>•</span>
        <kbd className={kbdClass}>Enter ↵</kbd>
        <span>next</span>
        <span>•</span>
        <kbd className={kbdClass}>← →</kbd>
        <span>navigate</span>
      </div>
    </div>
  )
}
