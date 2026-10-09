import { Button } from '@nextui-org/react'
import { Confidence } from '../../../shared/types'

interface ConfidencePickerProps {
  value: Confidence | null
  onChange: (value: Confidence | null) => void
  onUnknown: () => void
}

const OPTIONS: { value: Confidence; label: string; activeClass: string }[] = [
  { value: 'sure', label: 'Sure', activeClass: 'bg-success/15 border-success text-success-700 dark:text-success' },
  { value: 'unsure', label: 'Not sure', activeClass: 'bg-warning/15 border-warning text-warning-700 dark:text-warning' },
  { value: 'guess', label: 'Guessing', activeClass: 'bg-danger/15 border-danger text-danger-700 dark:text-danger' }
]

/**
 * Optional self-rating before moving on. It is sent to the AI and the learner
 * profile: a correct guess isn't counted as mastered, a confident mistake is flagged.
 */
export function ConfidencePicker({ value, onChange, onUnknown }: ConfidencePickerProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 mt-4 border-t border-divider">
      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="How sure are you?">
        <span className="text-xs font-semibold text-default-500 mr-1">How sure are you?</span>
        {OPTIONS.map(option => {
          const isActive = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(isActive ? null : option.value)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                isActive ? option.activeClass : 'border-default-200 text-default-500 hover:border-default-400'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      <Button
        size="sm"
        variant="light"
        onPress={onUnknown}
        className="self-start sm:self-auto font-semibold text-default-500"
      >
        I don&apos;t know, skip
      </Button>
    </div>
  )
}
