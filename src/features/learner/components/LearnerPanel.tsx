import { useMemo, useState } from 'react'
import { Button, Card, CardBody, Chip } from '@nextui-org/react'
import { ArrowPathIcon, ChartBarIcon, ClipboardDocumentIcon, TrashIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog'
import { ConceptSummary, LearnerProfile, summarizeProfile } from '../learnerProfile'

interface LearnerPanelProps {
  profile: LearnerProfile
  dueConcepts: ConceptSummary[]
  onCopyReviewPrompt: () => void
  onResetHistory: () => void
}

const MAX_CHIPS = 8

function Stat({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-content2/60 border border-divider min-w-[72px]">
      <span className={`text-xl font-black tabular-nums ${className}`}>{value}</span>
      <span className="text-[11px] font-semibold text-default-500 uppercase tracking-wide">{label}</span>
    </div>
  )
}

/** The learner's side of the loop: what the system knows about them and what is due for review. */
export function LearnerPanel({ profile, dueConcepts, onCopyReviewPrompt, onResetHistory }: LearnerPanelProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const summaries = useMemo(() => summarizeProfile(profile), [profile])
  if (summaries.length === 0) return null

  const strong = summaries.filter(s => s.status === 'strong').length
  const weak = summaries.filter(s => s.status === 'weak').length

  return (
    <Card className="border border-divider shadow-xl bg-content1/70 backdrop-blur-md">
      <CardBody className="p-5 md:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-xl shrink-0">
              <ChartBarIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-default-900">Your learning profile</h2>
              <p className="text-sm text-default-500">
                Built from every quiz you take and sent with each prompt, so the AI adapts its questions to you.
              </p>
            </div>
          </div>
          <div className="flex gap-2 self-start">
            <Stat label="Concepts" value={summaries.length} className="text-default-900" />
            <Stat label="Strong" value={strong} className="text-success" />
            <Stat label="Weak" value={weak} className="text-danger" />
          </div>
        </div>

        {dueConcepts.length > 0 ? (
          <div className="rounded-xl border-2 border-warning/40 bg-warning-50/50 dark:bg-warning-900/10 p-4 space-y-3">
            <p className="text-sm font-bold text-default-900">
              {dueConcepts.length} {dueConcepts.length === 1 ? 'concept is' : 'concepts are'} due for review
            </p>
            <div className="flex flex-wrap gap-1.5">
              {dueConcepts.slice(0, MAX_CHIPS).map(s => (
                <Chip key={s.record.key} size="sm" variant="flat" color={s.status === 'weak' ? 'danger' : 'warning'}>
                  {s.record.concept}
                </Chip>
              ))}
              {dueConcepts.length > MAX_CHIPS && (
                <Chip size="sm" variant="flat">+{dueConcepts.length - MAX_CHIPS} more</Chip>
              )}
            </div>
            <p className="text-xs text-default-500">
              The AI writes a fresh review quiz on these. Paste its reply into step 2 below.
            </p>
            <motion.div whileTap={{ scale: 0.97 }} className="inline-block">
              <Button
                color="warning"
                variant="shadow"
                className="font-bold"
                startContent={<ArrowPathIcon className="w-5 h-5" />}
                onClick={onCopyReviewPrompt}
              >
                Copy review prompt
              </Button>
            </motion.div>
          </div>
        ) : (
          <p className="text-sm text-default-500 flex items-center gap-2">
            <ClipboardDocumentIcon className="w-4 h-4 shrink-0" />
            Nothing due for review right now. New quiz prompts already include your weak spots.
          </p>
        )}

        <div className="flex justify-end">
          <Button
            size="sm"
            variant="light"
            className="text-default-400"
            startContent={<TrashIcon className="w-4 h-4" />}
            onClick={() => setIsConfirmOpen(true)}
          >
            Clear learning history
          </Button>
        </div>
      </CardBody>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Clear learning history?"
        message="This deletes everything the app has learned about you: concept scores, review schedule and recurring mistakes. The current quiz is kept."
        confirmLabel="Clear history"
        color="danger"
        onConfirm={() => {
          setIsConfirmOpen(false)
          onResetHistory()
        }}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </Card>
  )
}
