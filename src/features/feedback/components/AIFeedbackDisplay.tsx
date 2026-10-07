import { useEffect, useState } from "react"
import { Card, CardHeader, CardBody, Chip } from "@nextui-org/react"
import { ChevronDownIcon } from "@heroicons/react/24/outline"
import { MASTERY_THRESHOLD, ParsedFeedback } from "../../../shared/types"
import { resolveFeedbackScore } from "../../mastery/utils/masteryUpdates"

/** A new object per request, so asking for the same question twice still re-focuses it. */
export interface FeedbackFocusRequest {
  number: number
}

interface AIFeedbackDisplayProps {
  feedback: ParsedFeedback[]
  focusRequest?: FeedbackFocusRequest | null
}

const feedbackItemId = (number: number) => `feedback-item-${number}`

const parseResourceString = (resource: string): { displayText: string; url: string | null } => {
  if (!resource) return { displayText: '', url: null };

  // 1. Match [Category]: [Title](https://...)
  const linkWithCategory = resource.match(/(?:\[(.*?)\]:\s*)?\[(.*?)\]\((https?:\/\/[^\s)]+)\)/);
  if (linkWithCategory) {
    const category = linkWithCategory[1] ? `${linkWithCategory[1]}: ` : '';
    const title = linkWithCategory[2] || 'Resource Link';
    const url = linkWithCategory[3];
    return { displayText: `${category}${title}`.replace(/[[\]]/g, ''), url };
  }

  // 2. Match standard markdown [Title](https://...)
  const standardLink = resource.match(/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/);
  if (standardLink) {
    return { displayText: standardLink[1].replace(/[[\]]/g, ''), url: standardLink[2] };
  }

  // 3. Match raw URL in text
  const rawUrl = resource.match(/(https?:\/\/[^\s)]+)/);
  if (rawUrl) {
    const cleanText = resource.replace(rawUrl[0], '').replace(/[[\]():]/g, ' ').trim();
    return { displayText: cleanText || rawUrl[0], url: rawUrl[0] };
  }

  // 4. Strip stray markdown brackets from plain text
  const cleaned = resource.replace(/[[\]]/g, '').trim();
  return { displayText: cleaned, url: null };
};

export function AIFeedbackDisplay({ feedback, focusRequest }: AIFeedbackDisplayProps) {
  const [collapsed, setCollapsed] = useState<Set<number>>(() => new Set())
  const [highlighted, setHighlighted] = useState<number | null>(null)

  useEffect(() => {
    if (!focusRequest) return
    const { number } = focusRequest
    setCollapsed(prev => {
      if (!prev.has(number)) return prev
      const next = new Set(prev)
      next.delete(number)
      return next
    })
    setHighlighted(number)
    // Wait a frame so a just-mounted tab panel or just-expanded card has its final layout
    const frame = requestAnimationFrame(() => {
      document.getElementById(feedbackItemId(number))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    const timer = setTimeout(() => setHighlighted(h => (h === number ? null : h)), 1800)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [focusRequest])

  function toggle(number: number) {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(number)) next.delete(number)
      else next.add(number)
      return next
    })
  }

  if (!feedback || feedback.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <p className="text-default-900 font-bold text-lg">No Feedback Items Found</p>
        <p className="text-default-500 text-sm max-w-sm">
          Please click <strong>Paste AI Feedback</strong> to load your evaluation results.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {feedback.map((item, index) => {
        const score = resolveFeedbackScore(item)
        const chipColor = score >= MASTERY_THRESHOLD ? "success" : score >= 60 ? "warning" : "danger"
        const isCollapsed = collapsed.has(item.number)

        return (
          <Card
            key={`${item.number}-${index}`}
            id={feedbackItemId(item.number)}
            className={`feedback-card-item will-change-transform w-full scroll-mt-4 border shadow-sm hover:shadow-md transition-shadow ${
              highlighted === item.number ? "border-primary ring-2 ring-primary/40" : "border-divider"
            }`}
          >
            <CardHeader className="p-0">
              <button
                type="button"
                onClick={() => toggle(item.number)}
                aria-expanded={!isCollapsed}
                className="w-full flex flex-col-reverse sm:flex-row sm:justify-between items-start gap-2 sm:gap-4 text-left pt-4 sm:pt-6 px-4 sm:px-6 pb-2"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-xs font-bold text-primary tracking-wider uppercase">Question {item.number}</p>
                  <p className="text-base font-semibold text-default-900 dark:text-white leading-snug break-words">{item.question}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Chip
                    color={chipColor}
                    variant="flat"
                    size="md"
                    className="font-bold border-2 border-transparent max-w-full"
                  >
                    {item.grade}
                  </Chip>
                  <ChevronDownIcon className={`w-4 h-4 text-default-400 transition-transform ${isCollapsed ? "" : "rotate-180"}`} aria-hidden />
                </div>
              </button>
            </CardHeader>
            {!isCollapsed && (
            <CardBody className="px-4 sm:px-6 pb-6 pt-2">
              <div className="space-y-6">
                <div className={`grid gap-4 pt-2 ${item.expected_answer ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                  {/* Your Answer */}
                  <div className="bg-slate-100/90 dark:bg-zinc-900/80 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
                    <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Your Answer</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white leading-relaxed whitespace-pre-wrap break-words">
                      {item.provided_answer || "No answer provided"}
                    </p>
                  </div>

                  {/* Expected / Correct Answer */}
                  {item.expected_answer && (
                    <div className="bg-blue-50/90 dark:bg-blue-950/40 p-4 rounded-xl border-2 border-blue-300 dark:border-blue-500/50">
                      <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-2">Expected Answer</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed whitespace-pre-wrap break-words">
                        {item.expected_answer}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* AI Evaluation */}
                <div className="bg-slate-100/90 dark:bg-zinc-900/80 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">AI Evaluation</p>
                  <p className="text-sm text-slate-900 dark:text-zinc-100 leading-relaxed font-normal break-words">
                    {(item.evaluation || '').replace(/【.*?】/g, '').trim()}
                  </p>
                </div>

                {/* Detailed Explanation */}
                {item.explanations && Object.keys(item.explanations).length > 0 && (
                  <div className="bg-amber-50/90 dark:bg-amber-950/30 p-4 rounded-xl border-2 border-amber-300 dark:border-amber-500/40">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-3">Detailed Explanation</p>
                    <div className="space-y-3">
                      {Object.entries(item.explanations).map(([key, val]) => (
                        <div key={key} className="flex flex-col sm:flex-row gap-1 sm:gap-3">
                          <span className="font-bold text-amber-700 dark:text-amber-400 text-sm whitespace-nowrap min-w-[32px]">{key}:</span>
                          <span className="text-sm font-normal text-slate-900 dark:text-zinc-100 leading-relaxed break-words min-w-0">
                            {String(val || '').replace(/【.*?】/g, '').trim()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Resources */}
                {item.resources && item.resources.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-zinc-800">
                    <p className="text-tiny font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-2">Recommended Resources:</p>
                    <div className="flex flex-wrap gap-2">
                      {item.resources.map((resource, rIdx) => {
                        const { displayText, url } = parseResourceString(resource);
                        return url ? (
                          <a 
                            key={rIdx} 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="max-w-full break-all text-xs font-semibold text-sky-700 dark:text-sky-300 hover:text-sky-900 dark:hover:text-white bg-sky-50 dark:bg-sky-950/50 border border-sky-300 dark:border-sky-700/80 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <span>{displayText}</span>
                            <span className="text-tiny opacity-80">↗</span>
                          </a>
                        ) : (
                          <span key={rIdx} className="text-xs text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800/80 border border-slate-300 dark:border-zinc-700 px-3 py-1.5 rounded-lg">
                            {displayText}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
            )}
          </Card>
        )
      })}
    </div>
  )
}
