import { useState } from 'react'
import { Button } from '@nextui-org/react'
import { AcademicCapIcon, ClipboardDocumentIcon, ClipboardDocumentCheckIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { ParsedFeedback } from '../../../../shared/types'

interface StudyGuideProps {
  weakItems: ParsedFeedback[]
  /** Open-ended answers still waiting for AI feedback can't be judged yet. */
  isAwaitingAIEval: boolean
  onCopyStudyPrompt: () => void
  onSelectItem: (number: number) => void
}

/** Groups weak questions by concept so related gaps are studied together. */
function groupByConcept(items: ParsedFeedback[]) {
  const groups = new Map<string, ParsedFeedback[]>()
  for (const item of items) {
    const concept = item.key_concept?.trim() || item.question
    groups.set(concept, [...(groups.get(concept) ?? []), item])
  }
  return Array.from(groups, ([concept, items]) => ({ concept, items }))
}

export function StudyGuide({ weakItems, isAwaitingAIEval, onCopyStudyPrompt, onSelectItem }: StudyGuideProps) {
  const [copied, setCopied] = useState(false)

  if (weakItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-3">
        <div className="p-3 bg-success-100 rounded-full">
          <CheckCircleIcon className="w-8 h-8 text-success" />
        </div>
        <p className="text-default-900 font-bold">
          {isAwaitingAIEval ? 'Nothing to review yet' : 'Nothing to review'}
        </p>
        <p className="text-default-500 text-small max-w-xs">
          {isAwaitingAIEval
            ? 'Paste the AI feedback for your open-ended answers to see what to study next.'
            : 'Every graded question in this round reached mastery.'}
        </p>
      </div>
    )
  }

  const groups = groupByConcept(weakItems)

  function handleCopy() {
    onCopyStudyPrompt()
    setCopied(true)
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="rounded-xl border-2 border-primary/40 bg-primary-50/60 dark:bg-primary-900/20 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <AcademicCapIcon className="w-6 h-6 text-primary shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-default-900">Learn what you missed</p>
            <p className="text-sm text-default-600">
              Copy a tutoring prompt built from your mistakes and paste it into your AI chat. It explains each
              concept, where your answer went wrong, gives examples, practice questions and references.
            </p>
          </div>
        </div>
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            color="primary"
            variant="shadow"
            className="w-full sm:w-auto font-bold"
            startContent={copied
              ? <ClipboardDocumentCheckIcon className="w-5 h-5" />
              : <ClipboardDocumentIcon className="w-5 h-5" />}
            onClick={handleCopy}
          >
            {copied ? 'Copied! Copy again' : 'Copy Study Prompt'}
          </Button>
        </motion.div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold text-default-400 uppercase tracking-widest">
          Concepts to review ({groups.length})
        </h4>
        {groups.map(({ concept, items }) => {
          const gaps = items.flatMap(i => [...(i.missing_points ?? []), ...(i.misconceptions ?? [])])
          return (
            <div key={concept} className="rounded-xl border border-divider bg-content1 p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-default-900 break-words min-w-0">{concept}</p>
                <div className="flex gap-1.5">
                  {items.map(i => (
                    <button
                      key={i.number}
                      type="button"
                      onClick={() => onSelectItem(i.number)}
                      className="text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-md transition-colors"
                      aria-label={`Show feedback for question ${i.number}`}
                    >
                      Q{i.number}
                    </button>
                  ))}
                </div>
              </div>
              {gaps.length > 0 && (
                <ul className="space-y-1">
                  {gaps.slice(0, 4).map((gap, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-default-600 leading-relaxed">
                      <span className="text-danger font-bold shrink-0" aria-hidden>✗</span>
                      <span className="break-words min-w-0">{gap}</span>
                    </li>
                  ))}
                </ul>
              )}
              {items.map(i => i.how_to_improve).filter(Boolean).slice(0, 2).map((tip, idx) => (
                <p key={idx} className="text-sm text-default-700 leading-relaxed break-words">
                  <span className="font-semibold text-primary">Next step: </span>{tip}
                </p>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
