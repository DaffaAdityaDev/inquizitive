import { useState } from 'react'
import { Button, Card, CardBody } from '@nextui-org/react'
import { ClipboardDocumentIcon, ClipboardDocumentCheckIcon, SparklesIcon, PlayIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

interface NextRoundCardProps {
  onCopyPrompt: () => void
  onPasteQuestions: () => void
}

/**
 * The adaptive loop: the AI writes the next round from this round's results and
 * the learner profile, instead of repeating the same questions.
 */
export function NextRoundCard({ onCopyPrompt, onPasteQuestions }: NextRoundCardProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    onCopyPrompt()
    setCopied(true)
  }

  return (
    <Card className="border-2 border-secondary/40 bg-gradient-to-br from-secondary-50/60 to-primary-50/40 dark:from-secondary-900/20 dark:to-primary-900/10 shadow-lg">
      <CardBody className="p-4 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-secondary/15 rounded-xl shrink-0">
            <SparklesIcon className="w-6 h-6 text-secondary" />
          </div>
          <div className="space-y-1 min-w-0">
            <h2 className="text-lg font-bold text-default-900">Next round, built for you by AI</h2>
            <p className="text-sm text-default-600">
              The AI writes brand-new questions from your results: it re-tests what you missed or guessed from a new
              angle, targets your misconceptions, and steps up what you already know. No memorising the same questions.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
            <Button
              color="secondary"
              variant="shadow"
              className="w-full font-bold"
              startContent={copied
                ? <ClipboardDocumentCheckIcon className="w-5 h-5" />
                : <ClipboardDocumentIcon className="w-5 h-5" />}
              onClick={handleCopy}
            >
              {copied ? '1. Copied! Paste into your AI chat' : '1. Copy next-round prompt'}
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
            <Button
              color="secondary"
              variant={copied ? 'solid' : 'bordered'}
              className="w-full font-bold"
              startContent={<PlayIcon className="w-5 h-5" />}
              onClick={onPasteQuestions}
            >
              2. Paste AI&apos;s questions &amp; start
            </Button>
          </motion.div>
        </div>
      </CardBody>
    </Card>
  )
}
