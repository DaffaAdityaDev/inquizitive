import { Tooltip } from "@nextui-org/react"
import { Question, UserAnswer } from "../../../shared/types"
import { CheckIcon } from "@heroicons/react/24/outline"
import { motion } from "framer-motion"

interface QuestionNavigatorProps {
  questions: Question[]
  currentIndex: number
  userAnswers: UserAnswer[]
  onJump: (index: number) => void
}

export function QuestionNavigator({
  questions,
  currentIndex,
  userAnswers,
  onJump
}: QuestionNavigatorProps) {
  const answeredSet = new Set(userAnswers.map(a => a.number))
  const total = questions.length
  const answeredCount = questions.filter(q => answeredSet.has(q.number)).length

  return (
    <div className="w-full bg-content2/50 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-divider shadow-sm space-y-2">
      <div className="flex justify-between items-center px-1 text-xs">
        <span className="font-bold text-default-600 tracking-wider uppercase">
          Question Navigator
        </span>
        <span className="font-semibold text-default-400">
          <span className="text-primary font-bold">{answeredCount}</span> of {total} answered
        </span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 scrollbar-none">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIndex
          const isAnswered = answeredSet.has(q.number)

          return (
            <Tooltip 
              key={q.number || idx} 
              content={`Q${idx + 1}: ${isCurrent ? 'Current' : isAnswered ? 'Answered' : 'Unanswered'}`}
              delay={300}
            >
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => onJump(idx)}
                className={`relative flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs sm:text-sm flex items-center justify-center cursor-pointer border transition-colors ${
                  isCurrent
                    ? 'text-white font-bold border-transparent'
                    : isAnswered
                    ? 'bg-success-100/70 dark:bg-success-950/40 text-success-800 dark:text-success-300 border-success-300/80 dark:border-success-800/60 font-semibold hover:bg-success-200/60'
                    : 'bg-default-100/80 dark:bg-zinc-800/70 text-default-600 dark:text-zinc-300 border-default-200 dark:border-zinc-700/80 hover:bg-default-200/70'
                }`}
                aria-label={`Jump to question ${idx + 1}`}
              >
                {/* Framer Motion FLIP Shared Pill Slider */}
                {isCurrent && (
                  <motion.div
                    layoutId="active-pill-slider"
                    className="absolute inset-0 bg-primary rounded-xl shadow-md shadow-primary/40 -z-0"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{idx + 1}</span>
                {isAnswered && !isCurrent && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-success-500 text-white rounded-full flex items-center justify-center shadow-xs z-10">
                    <CheckIcon className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </motion.button>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}
