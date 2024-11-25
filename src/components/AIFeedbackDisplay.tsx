import { Card, CardBody, Chip } from "@nextui-org/react"
import { ParsedFeedback } from "../types"

interface AIFeedbackDisplayProps {
  feedback: ParsedFeedback[]
}

const parseResourceString = (resource: string): { displayText: string; url: string | null } => {
  // Match URL pattern inside parentheses or a plain URL
  const urlMatch = resource.match(/\[(.*?)\]\((https?:\/\/.*?)\)/) || 
                  resource.match(/(https?:\/\/\S+)/)
  
  if (urlMatch) {
    // If it's in markdown format [text](url)
    if (urlMatch[2]) {
      return {
        displayText: resource,
        url: urlMatch[2]
      }
    }
    // If it's a plain URL
    return {
      displayText: resource,
      url: urlMatch[1]
    }
  }
  
  return {
    displayText: resource,
    url: null
  }
}

export function AIFeedbackDisplay({ feedback }: AIFeedbackDisplayProps) {
  if (!feedback.length) return null

  return (
    <div className="space-y-6">
      {feedback.map((item, index) => (
        <Card key={index} className="w-full">
          <CardBody className="space-y-4">
            {/* Question Header */}
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-semibold">
                Question {item.number}
              </h3>
              <Chip
                variant="flat"
                color={item.grade.includes('🟢') ? 'success' : 
                       item.grade.includes('🟡') ? 'warning' : 'danger'}
              >
                {item.grade}
              </Chip>
            </div>

            {/* Question Text */}
            <div className="bg-default-100 dark:bg-default-50 p-4 rounded-lg">
              <p className="font-medium">{item.question}</p>
            </div>

            {/* User's Answer */}
            <div>
              <p className="text-sm text-default-500 mb-2">Your Answer:</p>
              <div className="bg-default-50 dark:bg-default-100 p-3 rounded-lg">
                {item.provided_answer}
              </div>
            </div>

            {/* Multiple Choice Options */}
            {item.options && (
              <div className="space-y-2">
                <p className="font-medium mb-2">Options:</p>
                {item.options.map((option, idx) => {
                  const optionLetter = String.fromCharCode(65 + idx)
                  const isCorrect = item.correct_option === optionLetter
                  const isSelected = item.provided_answer.startsWith(optionLetter)
                  
                  return (
                    <div 
                      key={idx}
                      className={`p-3 rounded-lg flex items-center gap-2
                        ${isCorrect ? 'bg-success-100 dark:bg-success-200/20' : 
                          isSelected ? 'bg-danger-100 dark:bg-danger-200/20' : 
                          'bg-default-100 dark:bg-default-50'}`}
                    >
                      <span>
                        {isCorrect ? '🟢' : isSelected ? '🔴' : '⚪'}
                      </span>
                      <span>{option}</span>
                      {isSelected && ' (Selected)'}
                      {isCorrect && ' (Correct)'}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Explanations */}
            {item.explanations && (
              <div>
                <p className="font-medium mb-2">Explanations:</p>
                <div className="space-y-2">
                  {Object.entries(item.explanations).map(([key, value]) => (
                    <div key={key} className="bg-default-50 dark:bg-default-100 p-3 rounded-lg">
                      <span className="font-semibold">Option {key}:</span> {value}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expected Answer for Open-Ended */}
            {item.expected_answer && (
              <div>
                <p className="font-medium mb-2">Expected Answer:</p>
                <div className="bg-default-50 dark:bg-default-100 p-3 rounded-lg">
                  {item.expected_answer}
                </div>
              </div>
            )}

            {/* Evaluation */}
            <div>
              <p className="font-medium mb-2">Feedback:</p>
              <div className="bg-default-50 dark:bg-default-100 p-3 rounded-lg">
                {item.evaluation}
              </div>
            </div>

            {/* Resources */}
            {item.resources && item.resources.length > 0 && (
              <div>
                <p className="font-medium mb-2">Resources:</p>
                <div className="space-y-2">
                  {item.resources.map((resource, idx) => {
                    const { displayText, url } = parseResourceString(resource)
                    
                    return url ? (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-default-50 dark:bg-default-100 p-3 rounded-lg
                          text-primary hover:text-primary-600 transition-colors"
                      >
                        {displayText}
                      </a>
                    ) : (
                      <div
                        key={idx}
                        className="block bg-default-50 dark:bg-default-100 p-3 rounded-lg"
                      >
                        {displayText}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  )
} 