'use client'

import { useState, useEffect, useCallback } from 'react'
import { ReviewItem } from '@/types'
import { submitReview } from '@/app/review/actions'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { CodeBlock } from './CodeBlock'
import { cn } from '@/lib/utils'

interface ReviewSessionProps {
  initialReviews: ReviewItem[]
}

export default function ReviewSession({ initialReviews }: ReviewSessionProps) {
  const [reviews, setReviews] = useState(initialReviews)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (reviews.length === 0) return
    
    if (e.key === 'ArrowLeft') {
      if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1)
        setIsFlipped(false)
      }
    } else if (e.key === 'ArrowRight') {
      if (currentIndex < reviews.length - 1) {
        setCurrentIndex(prev => prev + 1)
        setIsFlipped(false)
      }
    } else if (e.key === ' ' && !isFlipped) {
      e.preventDefault()
      setIsFlipped(true)
    }
  }, [currentIndex, reviews.length, isFlipped])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (reviews.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-block p-4 rounded-full bg-white/5 mb-6">
            <span className="text-4xl">🎉</span>
        </div>
        <h2 className="text-2xl font-bold mb-4 text-white">All Caught Up!</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">No cards due for review right now. Go learn something new in The Forge!</p>
        <a href="/quiz" className="px-8 py-3 bg-neon-blue text-black font-bold rounded-full hover:bg-cyan-400 transition shadow-[0_0_20px_rgba(14,215,181,0.4)]">
            Go to The Forge
        </a>
      </div>
    )
  }

  const currentItem = reviews[currentIndex]
  const question = currentItem.question_json
  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex < reviews.length - 1

  const handlePrev = () => {
    if (canGoPrev) {
      setCurrentIndex(prev => prev - 1)
      setIsFlipped(false)
    }
  }

  const handleNext = () => {
    if (canGoNext) {
      setCurrentIndex(prev => prev + 1)
      setIsFlipped(false)
    }
  }

  const handleRate = async (grade: number) => {
    setIsProcessing(true)
    try {
      await submitReview(currentItem.id, grade)
      const xpReward = grade >= 4 ? 15 : grade === 3 ? 10 : 5
      toast.success(`Review saved! +${xpReward} XP 🎯`)
      
      if (currentIndex < reviews.length - 1) {
        setIsFlipped(false)
        setCurrentIndex(prev => prev + 1)
      } else {
        toast.success('Session complete! 🏆 Great work!')
        setReviews([])
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to submit review')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center text-gray-400">
        <span className="text-sm font-medium tracking-wide uppercase">Review Session</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full">
            <span className="text-sm font-bold text-white">{currentIndex + 1}</span>
            <span className="text-xs text-gray-500">/</span>
            <span className="text-sm text-gray-400">{reviews.length}</span>
          </div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="glass rounded-3xl min-h-[450px] flex flex-col relative overflow-hidden transition-all duration-500 transform perspective-1000">
        
        {/* Navigation Overlays */}
        {canGoPrev && (
            <div 
                onClick={handlePrev}
                className="absolute left-0 top-0 bottom-0 w-16 z-20 hover:bg-gradient-to-r from-white/5 to-transparent cursor-pointer transition flex items-center justify-center group"
            >
                <div className="opacity-0 group-hover:opacity-100 transition text-white/50 text-2xl">‹</div>
            </div>
        )}
        {canGoNext && (
            <div 
                onClick={handleNext}
                className="absolute right-0 top-0 bottom-0 w-16 z-20 hover:bg-gradient-to-l from-white/5 to-transparent cursor-pointer transition flex items-center justify-center group"
            >
                <div className="opacity-0 group-hover:opacity-100 transition text-white/50 text-2xl">›</div>
            </div>
        )}

        {/* Front (Question) */}
        <div className="p-10 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <span className="inline-block px-3 py-1 text-xs font-bold bg-white/10 text-neon-blue rounded-full tracking-wide">
               {currentItem.topic}
            </span>
             <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < currentItem.srs_level ? 'bg-neon-emerald' : 'bg-gray-700'}`} />
                ))}
             </div>
          </div>
          
          <div className="prose prose-invert max-w-none text-xl leading-relaxed flex-1 flex flex-col justify-center">
             <ReactMarkdown
               components={{
                 code({className, children, ...props}) {
                   const match = /language-(\w+)/.exec(className || '')
                   return match ? (
                     <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
                   ) : (
                     <code className="bg-white/10 px-1 py-0.5 rounded text-neon-purple font-mono text-base" {...props}>{children}</code>
                   )
                 }
               }}
             >
               {question.q}
             </ReactMarkdown>
          </div>
        </div>

        {/* Back (Answer) */}
        {isFlipped && (
          <div className="p-10 bg-black/40 border-t border-white/5 animate-slide-up backdrop-blur-xl">
             <div className="mb-4 pl-4 border-l-4 border-neon-emerald">
                <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">Correct Answer</div>
                <div className="text-lg text-white font-medium">{question.answer}</div>
             </div>
             <div className="prose prose-invert text-sm text-gray-300">
                <ReactMarkdown>{question.explanation}</ReactMarkdown>
             </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="h-20 flex items-center justify-center">
        {!isFlipped ? (
          <button
            onClick={() => setIsFlipped(true)}
            className="group relative px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-gray-200 transition overflow-hidden"
          >
            <span className="relative z-10">Show Answer</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition" />
            <div className="absolute -inset-1 blur-lg bg-white/30 opacity-0 group-hover:opacity-100 transition" />
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-4 w-full max-w-xl">
            <RateButton label="Again" sub="< 1m" color="bg-red-500" onClick={() => handleRate(0)} disabled={isProcessing} />
            <RateButton label="Hard" sub="2d" color="bg-orange-500" onClick={() => handleRate(3)} disabled={isProcessing} />
            <RateButton label="Good" sub="3d" color="bg-blue-500" onClick={() => handleRate(4)} disabled={isProcessing} />
            <RateButton label="Easy" sub="4d" color="bg-emerald-500" onClick={() => handleRate(5)} disabled={isProcessing} />
          </div>
        )}
      </div>
      
      <div className="text-center text-xs text-gray-600 font-mono">
         [Space] Flip • [←/→] Navigate
      </div>
    </div>
  )
}

function RateButton({ label, sub, color, onClick, disabled }: any) {
    return (
        <button 
            onClick={onClick}
            disabled={disabled}
            className={`flex flex-col items-center justify-center py-3 rounded-xl transition transform hover:scale-105 active:scale-95 ${color} bg-opacity-10 hover:bg-opacity-20 border border-transparent hover:border-${color.split('-')[1]}-500/50`}
        >
            <span className={`font-bold text-${color.split('-')[1]}-400`}>{label}</span>
            <span className="text-xs text-gray-500">{sub}</span>
        </button>
    )
}
