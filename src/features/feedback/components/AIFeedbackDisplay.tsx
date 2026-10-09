import { useEffect, useState } from "react"
import { Card, CardHeader, CardBody, Chip } from "@nextui-org/react"
import { ChevronDownIcon } from "@heroicons/react/24/outline"
import { MASTERY_THRESHOLD, ParsedFeedback } from "../../../shared/types"
import { resolveFeedbackScore } from "../../mastery/utils/masteryUpdates"
import { optionLetter } from "../../quiz/utils/mcqEvaluator"

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

const cleanText = (text: string) => text.replace(/【.*?】/g, '').trim()

/** A search link always works, even when the AI gave no reference or a dead one. */
const searchUrl = (query: string) => `https://www.google.com/search?q=${encodeURIComponent(query)}`

const optionKey = (key: string) => key.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')

const LIST_TONES = {
  success: { box: 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/40', title: 'text-emerald-700 dark:text-emerald-400', bullet: '✓' },
  danger: { box: 'bg-rose-50/90 dark:bg-rose-950/30 border-rose-300 dark:border-rose-500/40', title: 'text-rose-700 dark:text-rose-400', bullet: '✗' },
  warning: { box: 'bg-orange-50/90 dark:bg-orange-950/30 border-orange-300 dark:border-orange-500/40', title: 'text-orange-700 dark:text-orange-400', bullet: '!' },
  neutral: { box: 'bg-slate-100/90 dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800', title: 'text-slate-500 dark:text-zinc-400', bullet: '•' }
} as const

function ListBlock({ title, items, tone }: { title: string; items?: string[]; tone: keyof typeof LIST_TONES }) {
  if (!items || items.length === 0) return null
  const styles = LIST_TONES[tone]
  return (
    <div className={`p-4 rounded-xl border ${styles.box}`}>
      <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${styles.title}`}>{title}</p>
      <ul className="space-y-1.5">
        {items.map((text, i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-900 dark:text-zinc-100 leading-relaxed">
            <span className={`font-bold shrink-0 ${styles.title}`} aria-hidden>{styles.bullet}</span>
            <span className="break-words min-w-0">{cleanText(text)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

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
                  <p className="text-xs font-bold text-primary tracking-wider uppercase">
                    Question {item.number}
                    {item.key_concept && <span className="ml-2 normal-case tracking-normal font-semibold text-default-500">· {item.key_concept}</span>}
                  </p>
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
                
                {/* Evaluation */}
                <div className="bg-slate-100/90 dark:bg-zinc-900/80 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Evaluation</p>
                  <p className="text-sm text-slate-900 dark:text-zinc-100 leading-relaxed font-normal whitespace-pre-wrap break-words">
                    {cleanText(item.evaluation || '')}
                  </p>
                </div>

                {/* What went right and wrong */}
                {(!!item.strengths?.length || !!item.missing_points?.length || !!item.misconceptions?.length) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ListBlock title="What you got right" items={item.strengths} tone="success" />
                    <ListBlock title="What was missing" items={item.missing_points} tone="danger" />
                    <ListBlock title="Misconceptions" items={item.misconceptions} tone="warning" />
                  </div>
                )}

                {item.how_to_improve && (
                  <div className="bg-primary-50/80 dark:bg-primary-900/20 p-4 rounded-xl border-2 border-primary/40">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">How to improve</p>
                    <p className="text-sm text-slate-900 dark:text-zinc-100 leading-relaxed whitespace-pre-wrap break-words">
                      {cleanText(item.how_to_improve)}
                    </p>
                  </div>
                )}

                <ListBlock title="A complete answer covers" items={item.key_points} tone="neutral" />

                {/* Concept explanation */}
                {item.explanation && (
                  <div className="bg-violet-50/90 dark:bg-violet-950/30 p-4 rounded-xl border-2 border-violet-300 dark:border-violet-500/40">
                    <p className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider mb-2">
                      Understand the concept{item.key_concept ? `: ${item.key_concept}` : ''}
                    </p>
                    <p className="text-sm text-slate-900 dark:text-zinc-100 leading-relaxed whitespace-pre-wrap break-words">
                      {cleanText(item.explanation)}
                    </p>
                  </div>
                )}

                {/* Per-option explanations, with the correct option and the user's pick marked */}
                {item.explanations && Object.keys(item.explanations).length > 0 && (
                  <div className="bg-amber-50/90 dark:bg-amber-950/30 p-4 rounded-xl border-2 border-amber-300 dark:border-amber-500/40">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-3">Every option explained</p>
                    <div className="space-y-3">
                      {Object.entries(item.explanations).map(([key, val]) => {
                        const letter = optionKey(key)
                        const isCorrect = !!item.correct_option && letter === optionKey(item.correct_option)
                        const isPicked = letter === optionLetter(item.provided_answer || '', item.options)
                        return (
                          <div
                            key={key}
                            className={`flex flex-col sm:flex-row gap-1 sm:gap-3 rounded-lg ${
                              isCorrect ? 'bg-emerald-100/70 dark:bg-emerald-900/30 p-2 -mx-2'
                                : isPicked ? 'bg-rose-100/70 dark:bg-rose-900/30 p-2 -mx-2' : ''
                            }`}
                          >
                            <span className="font-bold text-amber-700 dark:text-amber-400 text-sm whitespace-nowrap min-w-[32px]">
                              {key}:
                              {isCorrect && <span className="ml-1 text-emerald-700 dark:text-emerald-400">✓</span>}
                              {isPicked && !isCorrect && <span className="ml-1 text-rose-700 dark:text-rose-400">(your pick)</span>}
                            </span>
                            <span className="text-sm font-normal text-slate-900 dark:text-zinc-100 leading-relaxed break-words min-w-0">
                              {cleanText(String(val || ''))}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* References */}
                {(!!item.resources?.length || !!item.key_concept) && (
                  <div className="pt-2 border-t border-slate-200 dark:border-zinc-800">
                    <p className="text-tiny font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-2">Learn more</p>
                    <div className="flex flex-wrap gap-2">
                      {item.resources?.map((resource, rIdx) => {
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
                      {item.key_concept && (
                        <a
                          href={searchUrl(item.key_concept)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="max-w-full break-all text-xs font-semibold text-default-600 hover:text-default-900 bg-default-100 border border-default-200 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
                        >
                          <span>Search: {item.key_concept}</span>
                          <span className="text-tiny opacity-80">↗</span>
                        </a>
                      )}
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
