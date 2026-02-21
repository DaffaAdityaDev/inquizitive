import { Button } from "@nextui-org/react"
import { CheckCircleIcon } from "@heroicons/react/24/solid"

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

  return (
    <div className="flex flex-col gap-3 w-full">
      {options.map((option, idx) => {
        const isSelected = value === option;
        
        return (
          <Button
            key={idx}
            className={`w-full flex justify-between items-center sm:px-6 py-6 sm:py-8 border-2 transition-all h-auto ${
              isSelected 
                ? 'bg-primary/10 border-primary shadow-sm' 
                : 'bg-content1 border-default-200 hover:border-primary/40 hover:bg-default-50 shadow-sm'
            }`}
            variant="light"
            onClick={() => onChange(option)}
            onKeyDown={onKeyDown}
            radius="lg"
          >
            <div className="flex items-center gap-3 sm:gap-4 text-left w-full pr-2">
              <span className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-md font-bold text-sm ${
                isSelected ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-default-200 text-default-600'
              }`}>
                {letters[idx] || idx + 1}
              </span>
              <span className={`text-sm sm:text-base font-medium whitespace-normal leading-relaxed ${
                isSelected ? 'text-primary font-bold' : 'text-default-700'
              }`}>
                {option}
              </span>
            </div>
            {isSelected && (
              <CheckCircleIcon className="w-6 h-6 text-primary flex-shrink-0" />
            )}
          </Button>
        )
      })}
    </div>
  )
}
