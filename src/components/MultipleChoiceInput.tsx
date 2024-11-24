import { Button } from "@nextui-org/react"

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
  return (
    <div className="space-y-2">
      {options.map((option, idx) => (
        <Button
          key={idx}
          className={`w-full text-left justify-start ${
            value === option ? 'bg-primary-100' : ''
          }`}
          variant={value === option ? "solid" : "flat"}
          onClick={() => onChange(option)}
          onKeyDown={onKeyDown}
        >
          {option}
        </Button>
      ))}
    </div>
  )
}