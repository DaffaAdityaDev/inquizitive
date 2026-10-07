import { useState } from 'react'
import { Button } from '@nextui-org/react'
import { ClipboardDocumentIcon, ClipboardDocumentCheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { AnimatePresence, motion } from 'framer-motion'

interface EvalStepsProps {
  evalPrompt: string
  hasAIFeedback: boolean
  onCopyPrompt: () => void
  onPasteFeedback: () => void
}

function StepBadge({ n, done }: { n: number; done?: boolean }) {
  return (
    <span
      className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-black ${
        done ? 'bg-success text-success-foreground' : 'bg-primary text-primary-foreground'
      }`}
    >
      {n}
    </span>
  )
}

export function EvalSteps({ evalPrompt, hasAIFeedback, onCopyPrompt, onPasteFeedback }: EvalStepsProps) {
  const [copied, setCopied] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  function handleCopy() {
    onCopyPrompt()
    setCopied(true)
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <p className="text-sm text-default-500">
        Open-ended answers are graded by your AI chat in two steps:
      </p>

      <ol className="space-y-4">
        <li className="flex gap-3">
          <StepBadge n={1} done={copied} />
          <div className="flex-1 min-w-0 space-y-3">
            <p className="text-sm font-semibold text-default-900">
              Copy the evaluation prompt, then paste it into your AI chat (ChatGPT, Gemini, …)
            </p>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                color="primary"
                variant="shadow"
                size="lg"
                className="w-full sm:w-auto font-bold"
                startContent={copied
                  ? <ClipboardDocumentCheckIcon className="w-5 h-5" />
                  : <ClipboardDocumentIcon className="w-5 h-5" />}
                onClick={handleCopy}
              >
                {copied ? 'Copied! Copy again' : 'Copy Evaluation Prompt'}
              </Button>
            </motion.div>
          </div>
        </li>

        <li className="flex gap-3">
          <StepBadge n={2} done={hasAIFeedback} />
          <div className="flex-1 min-w-0 space-y-3">
            <p className="text-sm font-semibold text-default-900">
              Copy the AI's whole reply, then click Paste AI Feedback
            </p>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                color={hasAIFeedback ? 'success' : 'primary'}
                variant={hasAIFeedback ? 'flat' : 'bordered'}
                size="lg"
                className="w-full sm:w-auto font-bold"
                startContent={<ClipboardDocumentCheckIcon className="w-5 h-5" />}
                onClick={onPasteFeedback}
              >
                {hasAIFeedback ? 'Paste Updated Feedback' : 'Paste AI Feedback'}
              </Button>
            </motion.div>
          </div>
        </li>
      </ol>

      <div className="rounded-xl border border-divider overflow-hidden">
        <button
          type="button"
          onClick={() => setShowPrompt(v => !v)}
          aria-expanded={showPrompt}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-default-600 hover:bg-default-100 transition-colors"
        >
          <span>{showPrompt ? 'Hide' : 'Show'} the raw evaluation prompt</span>
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${showPrompt ? 'rotate-180' : ''}`} aria-hidden />
        </button>
        <AnimatePresence initial={false}>
          {showPrompt && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <pre className="bg-default-50 p-4 border-t border-divider font-mono text-xs sm:text-sm max-h-[360px] overflow-auto text-default-600 leading-relaxed whitespace-pre-wrap break-words">
                {evalPrompt}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
