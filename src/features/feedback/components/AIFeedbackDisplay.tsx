import { Card, CardHeader, CardBody, Chip } from "@nextui-org/react"
import { ParsedFeedback } from "../../../shared/types"

interface AIFeedbackDisplayProps {
  feedback: ParsedFeedback[]
}

const parseResourceString = (resource: string): { displayText: string; url: string | null } => {
  const urlMatch = resource.match(/\[(.*?)\]\((https?:\/\/.*?)\)/) || 
                   resource.match(/(https?:\/\/[\w:/%?=&.-]+)/);
  
  if (urlMatch) {
    const displayText = urlMatch[1] || urlMatch[0];
    const url = urlMatch[2] || urlMatch[1] || urlMatch[0];
    return { displayText, url };
  }
  
  return { displayText: resource, url: null };
};

export function AIFeedbackDisplay({ feedback }: AIFeedbackDisplayProps) {
  return (
    <div className="space-y-4">
      {feedback.map((item, index) => (
        <Card key={index} className="w-full border border-divider shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex justify-between items-start pt-6 px-6 pb-2">
            <div className="flex flex-col gap-1 pr-4">
              <p className="text-xs font-bold text-primary tracking-wider uppercase">Question {item.number}</p>
              <p className="text-base font-semibold text-default-900 leading-snug">{item.question}</p>
            </div>
            <Chip 
              color={item.grade.includes('🟢') ? "success" : item.grade.includes('🟡') ? "warning" : "danger"}
              variant="flat"
              size="md"
              className="font-bold border-2 border-transparent"
            >
              {item.grade}
            </Chip>
          </CardHeader>
          <CardBody className="px-6 pb-6 pt-2">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-default-50 p-4 rounded-xl border border-default-200">
                  <p className="text-xs font-bold text-default-500 uppercase tracking-wider mb-2">Your Answer</p>
                  <p className="text-sm text-default-700 font-medium">
                    {item.provided_answer || "No answer provided"}
                  </p>
                </div>
                {item.expected_answer ? (
                  <div className="bg-primary-50 p-4 rounded-xl border border-primary-100">
                    <p className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-2">Expected Answer</p>
                    <p className="text-sm text-primary-900 font-medium">
                      {item.expected_answer}
                    </p>
                  </div>
                ) : (
                  <div className="bg-content2 p-4 rounded-xl border border-divider flex items-center justify-center text-default-400 text-sm italic">
                    Open-ended response
                  </div>
                )}
              </div>
              
              <div className="bg-content1 p-4 rounded-xl border border-divider">
                <p className="text-xs font-bold text-default-500 uppercase tracking-wider mb-2">AI Evaluation</p>
                <p className="text-sm text-default-800 leading-relaxed">{item.evaluation}</p>
              </div>

              {item.explanations && Object.keys(item.explanations).length > 0 && (
                <div className="bg-warning-50 p-4 rounded-xl border border-warning-100">
                  <p className="text-xs font-bold text-warning-700 uppercase tracking-wider mb-3">Detailed Explanation</p>
                  <div className="space-y-3">
                    {Object.entries(item.explanations).map(([key, val]) => (
                      <div key={key} className="flex flex-col sm:flex-row gap-1 sm:gap-3">
                        <span className="font-bold text-warning-800 text-sm whitespace-nowrap min-w-[120px]">{key}:</span>
                        <span className="text-sm text-warning-900">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {item.resources && item.resources.length > 0 && (
                <div className="pt-2 border-t border-default-100">
                  <p className="text-tiny font-semibold text-default-400 uppercase mb-2">Recommended Resources:</p>
                  <div className="flex flex-wrap gap-2">
                    {item.resources.map((resource, rIdx) => {
                      const { displayText, url } = parseResourceString(resource);
                      return url ? (
                        <a 
                          key={rIdx} 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-tiny text-primary hover:underline bg-primary-50 px-2 py-1 rounded"
                        >
                          {displayText}
                        </a>
                      ) : (
                        <span key={rIdx} className="text-tiny text-default-500 bg-default-100 px-2 py-1 rounded">
                          {displayText}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}
