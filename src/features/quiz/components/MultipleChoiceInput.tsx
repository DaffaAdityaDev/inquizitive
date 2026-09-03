import { useEffect } from "react"
import { Button } from "@nextui-org/react"
import { CheckCircleIcon } from "@heroicons/react/24/solid"
import { motion } from "framer-motion"

interface MultipleChoiceInputProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

export function MultipleChoiceInput({ 
  options, 
  value, 
  onChange, 
  onKeyDown 
}: MultipleChoiceInputProps) {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F']

  // Keyboard shortcut listener for fast MCQ answering
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') {
        return
      }

      const keyUpper = e.key.toUpperCase()
      
      // Match letter keys A-F
      const letterIndex = letters.indexOf(keyUpper)
      if (letterIndex !== -1 && letterIndex < options.length) {
        e.preventDefault()
        onChange(options[letterIndex])
        return
      }

      // Match numeric keys 1-6
      const num = parseInt(e.key, 10)
      if (!isNaN(num) && num >= 1 && num <= options.length) {
        e.preventDefault()
        onChange(options[num - 1])
        return
      }

      // Enter key advances to next question
      if (e.key === 'Enter') {
        e.preventDefault()
        onKeyDown(e as unknown as React.KeyboardEvent)
        return
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [options, onChange, onKeyDown])

  return (
    <div className="flex flex-col gap-3 w-full">
      {options.map((option, idx) => {
        const isSelected = value === option
        const letter = letters[idx] || `${idx + 1}`
        
        return (
          <motion.div
            key={`${option}-${idx}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.035, type: "spring", stiffness: 380, damping: 28 }}
            whileTap={{ scale: 0.985 }}
            className="w-full"
          >
            <Button
              className={`w-full flex justify-between items-center sm:px-6 py-6 sm:py-7 border-2 transition-all h-auto text-left group ${
                isSelected 
                  ? 'bg-primary/10 border-primary shadow-sm ring-2 ring-primary/20' 
                  : 'bg-content1 border-default-200 hover:border-primary/40 hover:bg-default-50 shadow-sm'
              }`}
              variant="light"
              onClick={() => onChange(option)}
              onKeyDown={onKeyDown}
              radius="lg"
            >
              <div className="flex items-center gap-3 sm:gap-4 text-left w-full pr-2">
                <span className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm transition-transform group-hover:scale-105 ${
                  isSelected ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-default-200 text-default-600'
                }`}>
                  {letter}
                </span>
                <span className={`text-sm sm:text-base font-medium whitespace-normal leading-relaxed flex-1 ${
                  isSelected ? 'text-primary font-bold' : 'text-default-700'
                }`}>
                  {option}
                </span>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <kbd className={`hidden sm:inline-block px-2 py-0.5 text-xs font-mono rounded border transition-colors ${
                  isSelected
                    ? 'bg-primary/20 text-primary border-primary/30 font-bold'
                    : 'bg-default-100 text-default-400 border-default-200 group-hover:border-default-300'
                }`}>
                  {letter}
                </kbd>
                {isSelected && (
                  <CheckCircleIcon className="w-6 h-6 text-primary animate-in zoom-in duration-200" />
                )}
              </div>
            </Button>
          </motion.div>
        )
      })}

      <div className="flex items-center justify-center gap-2 pt-2 text-tiny text-default-400 select-none">
        <span>Press</span>
        <kbd className="px-1.5 py-0.5 bg-default-100 border border-default-200 rounded font-mono text-default-600 font-semibold">A–D</kbd>
        <span>or</span>
        <kbd className="px-1.5 py-0.5 bg-default-100 border border-default-200 rounded font-mono text-default-600 font-semibold">1–4</kbd>
        <span>to select</span>
        <span>•</span>
        <kbd className="px-1.5 py-0.5 bg-default-100 border border-default-200 rounded font-mono text-default-600 font-semibold">Enter ↵</kbd>
        <span>to next</span>
      </div>
    </div>
  )
}
