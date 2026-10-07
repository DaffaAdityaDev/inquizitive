import { Card, CardBody } from '@nextui-org/react'
import { CheckCircleIcon, XCircleIcon, ClockIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { MASTERY_THRESHOLD, QuestionType } from '../../../../shared/types'
import type { RoundItem, RoundItemStatus, RoundSummary } from './roundSummary'

interface ScoreSummaryProps {
  summary: RoundSummary
  needsAIEval: boolean
  currentRound: number
  onSelectItem: (item: RoundItem) => void
}

const STATUS_STYLES: Record<RoundItemStatus, { icon: typeof CheckCircleIcon; className: string; label: string }> = {
  mastered: { icon: CheckCircleIcon, className: 'text-success', label: 'Mastered' },
  'needs-work': { icon: XCircleIcon, className: 'text-danger', label: 'Needs work' },
  awaiting: { icon: ClockIcon, className: 'text-warning', label: 'Awaiting AI evaluation' }
}

function Headline({ summary, needsAIEval }: Pick<ScoreSummaryProps, 'summary' | 'needsAIEval'>) {
  if (!needsAIEval) {
    return (
      <>
        <p className="text-4xl sm:text-5xl font-black text-default-900">
          {summary.mastered} <span className="text-default-400">/ {summary.total}</span>
        </p>
        <p className="text-default-500 font-medium">correct</p>
      </>
    )
  }

  if (summary.averageScore === null) {
    return (
      <>
        <p className="text-3xl sm:text-4xl font-black text-default-900">Awaiting evaluation</p>
        <p className="text-default-500 font-medium">Get your AI's feedback below to see your score</p>
      </>
    )
  }

  const graded = summary.total - summary.awaiting
  return (
    <>
      <p className="text-4xl sm:text-5xl font-black text-default-900">
        {summary.averageScore}<span className="text-default-400 text-3xl">%</span>
      </p>
      <p className="text-default-500 font-medium">
        average score{summary.awaiting > 0 && ` · ${graded} of ${summary.total} graded`}
      </p>
    </>
  )
}

function Stat({ value, label, className }: { value: number; label: string; className: string }) {
  return (
    <div className="flex-1 min-w-0 rounded-xl bg-default-100/70 px-3 py-2 text-center">
      <p className={`text-2xl font-black ${className}`}>{value}</p>
      <p className="text-tiny font-semibold text-default-500 uppercase tracking-wide truncate">{label}</p>
    </div>
  )
}

export function ScoreSummary({ summary, needsAIEval, currentRound, onSelectItem }: ScoreSummaryProps) {
  return (
    <Card className="border border-divider shadow-lg bg-content1/70 backdrop-blur-md">
      <CardBody className="p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <p className="text-xs font-bold text-default-400 uppercase tracking-widest">
              Round {currentRound} results
            </p>
            <Headline summary={summary} needsAIEval={needsAIEval} />
          </div>
          <div className="flex gap-2 w-full sm:w-auto sm:min-w-[320px]">
            <Stat value={summary.mastered} label="Mastered" className="text-success" />
            <Stat value={summary.needsWork} label="Needs work" className="text-danger" />
            {needsAIEval && <Stat value={summary.awaiting} label="Awaiting AI" className="text-warning" />}
          </div>
        </div>

        <ul className="divide-y divide-divider rounded-xl border border-divider overflow-hidden">
          {summary.items.map(item => {
            const { icon: Icon, className, label } = STATUS_STYLES[item.status]
            return (
              <li key={item.number}>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onSelectItem(item)}
                  className="w-full flex items-center gap-3 px-3 sm:px-4 py-3 text-left hover:bg-default-100 transition-colors focus:outline-none focus-visible:bg-default-100"
                  aria-label={`Question ${item.number}: ${label}. Show details`}
                >
                  <Icon className={`w-6 h-6 shrink-0 ${className}`} aria-hidden />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-default-900 truncate">
                      <span className="text-default-400 mr-1">Q{item.number}.</span>
                      {item.question}
                    </p>
                    <p className="text-tiny text-default-500 truncate">
                      {item.answer ? item.answer : <em>No answer</em>}
                      {item.type === QuestionType.OPEN_ENDED && item.status === 'awaiting' && ' · open-ended'}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-bold tabular-nums ${item.score === null ? 'text-default-400' : className}`}
                    title={item.score === null ? label : `${label} (threshold ${MASTERY_THRESHOLD}%)`}
                  >
                    {item.score === null ? '—' : `${item.score}%`}
                  </span>
                  <ChevronRightIcon className="w-4 h-4 shrink-0 text-default-400" aria-hidden />
                </motion.button>
              </li>
            )
          })}
        </ul>
      </CardBody>
    </Card>
  )
}
