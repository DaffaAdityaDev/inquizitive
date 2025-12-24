'use client'

import { useState } from 'react'
import { Question } from '@/types'
import { saveMistake } from '@/app/quiz/actions'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { CodeBlock } from './CodeBlock'

import { useSubject } from '@/contexts/SubjectContext'

interface QuizRunnerProps {
  questions: Question[];
  topic: string;
  tags?: string[];
}

export default function QuizRunner({ questions, topic, tags = [] }: QuizRunnerProps) {
  const { subject } = useSubject()

  // Edge case: Empty questions array
  if (!questions || questions.length === 0) {
    return (
      <div className="text-center p-12 glass rounded-3xl border border-white/10">
        <h3 className="text-xl font-bold text-white mb-2">No Questions Available</h3>
        <p className="text-gray-400">Could not load quiz questions. Please try again.</p>
      </div>
    )
  }

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [hardcoreMode, setHardcoreMode] = useState(false)
  const [showOptions, setShowOptions] = useState(true)
  const [feynmanMode, setFeynmanMode] = useState(false)
  const [feynmanWhy, setFeynmanWhy] = useState('')

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return
    setSelectedOption(option)
  }

  const checkAnswer = (selected: string, answer: string, options: string[]) => {
    // 1. Exact Match
    if (selected === answer) return true

    // 2. Index Match (if answer is 0, 1, 2, 3)
    const selectedIdx = options.indexOf(selected)
    if (String(selectedIdx) === String(answer)) return true

    // 3. Letter Match (if answer is 'A', 'B', 'C'...)
    const letter = String.fromCharCode(65 + selectedIdx) // 0 -> 'A'
    if (letter === answer.trim().toUpperCase()) return true

    // 4. Prefix Match (if answer is "A. The Answer")
    if (answer.startsWith(`${letter}.`) || answer.startsWith(`${letter})`)) return true

    return false
  }

  const handleSubmit = async () => {
    if (!selectedOption) {
      toast.error('Please select an option')
      return
    }

    if (feynmanMode && !feynmanWhy.trim()) {
      toast.error('Feynman Mode: Please explain WHY this is the answer.')
      return
    }

    const correct = checkAnswer(selectedOption, currentQuestion.answer, currentQuestion.options || [])
    setIsCorrect(correct)
    setIsAnswered(true)
    setExplanation(currentQuestion.explanation)

    if (correct) {
      toast.success('Correct! Discarding from memory.')
    } else {
      toast.error('Incorrect. Saving to Vault...')
      try {
        await saveMistake(topic, currentQuestion, ['Quiz', ...tags], subject)
        toast.info('Saved to your Review Vault')
      } catch (e) {
        console.error(e)
        toast.error('Failed to save. (Check if logged in)')
      }
    }
  }

  const handleNext = () => {
    if (isLastQuestion) {
      toast.success('Quiz Completed!')
      window.location.href = '/'
    } else {
      setCurrentIndex(prev => prev + 1)
      // Reset State
      setSelectedOption(null)
      setIsAnswered(false)
      setIsCorrect(false)
      setExplanation('')
      setShowOptions(!hardcoreMode) // Reset visibility based on mode
      setFeynmanWhy('')
    }
  }

  const toggleHardcore = (val: boolean) => {
    setHardcoreMode(val)
    if (!isAnswered) {
      setShowOptions(!val)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Settings Bar */}
      <div className="flex justify-end gap-4 text-sm text-gray-400 mb-4 glass p-3 rounded-lg">
        <label className="flex items-center gap-2 cursor-pointer hover:text-blue-400 transition">
          <input
            type="checkbox"
            checked={hardcoreMode}
            onChange={(e) => toggleHardcore(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500 bg-black/40 border-white/10"
          />
          <span>🔥 Hardcore Mode</span>
        </label>
        <div className="w-px h-4 bg-white/10"></div>
        <label className="flex items-center gap-2 cursor-pointer hover:text-purple-400 transition">
          <input
            type="checkbox"
            checked={feynmanMode}
            onChange={(e) => setFeynmanMode(e.target.checked)}
            className="rounded text-purple-600 focus:ring-purple-500 bg-black/40 border-white/10"
          />
          <span>🧠 Feynman Mode</span>
        </label>
      </div>

      {/* Progress */}
      <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-neon-blue h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(14,215,181,0.5)]"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div key={`${currentIndex}-${hardcoreMode}`} className="glass rounded-3xl p-8 animate-fade-in ring-1 ring-white/10">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Question {currentIndex + 1}</h3>
          <span className="text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-full text-gray-400">{topic}</span>
        </div>

        <div className="prose prose-invert max-w-none mb-10 text-xl leading-relaxed text-gray-100">
          <ReactMarkdown
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '')
                return match ? (
                  <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
                ) : (
                  <code className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 text-sm font-mono text-red-500 dark:text-red-400" {...props}>{children}</code>
                )
              }
            }}
          >
            {currentQuestion.q}
          </ReactMarkdown>
        </div>

        {/* Hardcore Overlay */}
        {hardcoreMode && !showOptions && !isAnswered && (
          <div className="text-center py-12 glass border border-white/10 rounded-xl mb-6">
            <p className="mb-4 text-neon-blue font-bold tracking-widest text-sm uppercase">Generation Effect Active</p>
            <p className="text-gray-300 mb-6 max-w-md mx-auto leading-relaxed">Try to solve it mentally first. This strengthens your retrieval pathways.</p>
            <button
              onClick={() => setShowOptions(true)}
              className="px-6 py-2 bg-white/10 border border-white/10 text-white rounded-lg hover:bg-white/20 transition font-medium"
            >
              Show Options
            </button>
          </div>
        )}

        {/* Options */}
        {(showOptions || isAnswered) && (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isAnswer = option === currentQuestion.answer;

              let optionClass = "w-full text-left p-4 rounded-xl border transition-all duration-200 relative overflow-hidden group ";

              if (isAnswered) {
                if (isAnswer) {
                  optionClass += "border-emerald-500 bg-emerald-500/20 text-emerald-300";
                } else if (isSelected && !isCorrect) {
                  optionClass += "border-red-500 bg-red-500/20 text-red-300";
                } else {
                  optionClass += "border-white/5 text-gray-500 opacity-50";
                }
              } else {
                if (isSelected) {
                  optionClass += "border-neon-blue bg-neon-blue text-black font-bold";
                } else {
                  optionClass += "border-white/10 text-gray-300 hover:border-white/30 hover:bg-white/5";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(option)}
                  disabled={isAnswered}
                  className={optionClass}
                >
                  <div className="flex gap-4 items-center">
                    <span className={`
                      flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 transition-colors
                      ${isAnswered && isAnswer ? 'bg-emerald-500 text-black' :
                        isAnswered && isSelected && !isCorrect ? 'bg-red-500 text-white' :
                          isSelected ? 'bg-black text-blue-500' : 'bg-white/10 text-gray-400 group-hover:bg-white/20 group-hover:text-white'}
                    `}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <div className="prose dark:prose-invert text-sm max-w-none">
                      <ReactMarkdown>{option}</ReactMarkdown>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Feynman Input (Pre-Answer) */}
        {feynmanMode && !isAnswered && (
          <div className="mt-8 bg-black/30 p-5 rounded-xl border border-purple-500/30">
            <div className="flex items-center gap-2 text-sm font-bold mb-2 text-purple-400">
              <span>🧠 Feynman Technique</span>
              <span className="text-xs font-normal opacity-75 text-gray-400">- Explain it simply</span>
            </div>
            <textarea
              className="w-full p-3 border border-white/10 rounded-lg bg-black/20 text-white placeholder:text-gray-600 focus:ring-2 focus:ring-purple-500/50 outline-none text-sm transition-all resize-y min-h-[100px]"
              placeholder="Why is this the correct answer? Explain it like I'm 5..."
              value={feynmanWhy}
              onChange={(e) => setFeynmanWhy(e.target.value)}
              rows={3}
            />
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          {!isAnswered ? (
            <button
              onClick={handleSubmit}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transform hover:-translate-y-0.5"
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 transition font-bold shadow-lg"
            >
              {isLastQuestion ? 'Finish Quiz' : 'Next Question →'}
            </button>
          )}
        </div>

        {/* Explanation / Feynman Review */}
        {isAnswered && (
          <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* The Real Explanation */}
            <div className={`p-5 rounded-xl border ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <h4 className={`font-bold mb-3 flex items-center gap-2 ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                {isCorrect ? '✅ Excellent!' : '❌ Learning Opportunity'}
              </h4>
              <div className="prose prose-invert text-sm text-gray-200">
                <ReactMarkdown>{explanation}</ReactMarkdown>
              </div>
            </div>

            {/* Feynman Self-Correction */}
            {feynmanMode && (
              <div className="p-5 bg-purple-500/5 rounded-xl border border-purple-500/20">
                <h4 className="font-bold mb-2 text-purple-400 text-sm">Your Explanation (Self-Check):</h4>
                <p className="text-gray-300 italic mb-4 text-sm">&quot;{feynmanWhy}&quot;</p>
                <div className="text-xs text-purple-300 bg-purple-500/10 p-2 rounded">
                  👉 Compare your explanation above with the actual answer. Did you miss any nuances?
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}