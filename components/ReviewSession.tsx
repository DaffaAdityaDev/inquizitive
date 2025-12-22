'use client'

import { useState, useEffect, useCallback } from 'react'
import { ReviewItem } from '@/types'
import { submitReview } from '@/app/review/actions'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { CodeBlock } from './CodeBlock'

interface ReviewSessionProps {
  initialReviews: ReviewItem[]
}

export default function ReviewSession({ initialReviews }: ReviewSessionProps) {
  const [reviews, setReviews] = useState(initialReviews)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Keyboard navigation - must be before any early returns
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

  // Empty state - after hooks
  if (reviews.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">All Caught Up! 🎉</h2>
        <p className="text-gray-500 mb-8">No cards due for review right now. Go learn something new in The Forge!</p>
        <a href="/quiz" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Go to The Forge</a>
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
      
      // Show XP reward notification
      const xpReward = grade >= 4 ? 15 : grade === 3 ? 10 : 5
      toast.success(`Review saved! +${xpReward} XP 🎯`)
      
      // Move to next card
      if (currentIndex < reviews.length - 1) {
        setIsFlipped(false)
        setCurrentIndex(prev => prev + 1)
      } else {
        // Finished session
        toast.success('Session complete! 🏆 Great work on your reviews!')
        setReviews([]) // Clear list to show "Caught Up" state
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to submit review')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header with navigation */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">Review Session</span>
        <div className="flex items-center gap-4">
          {/* Skip buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={!canGoPrev}
              className={`p-2 rounded-lg transition ${
                canGoPrev 
                  ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400' 
                  : 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
              }`}
              title="Previous card"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-medium">{currentIndex + 1} / {reviews.length}</span>
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className={`p-2 rounded-lg transition ${
                canGoNext 
                  ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400' 
                  : 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
              }`}
              title="Next card"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Flashcard Area */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden min-h-[400px] flex flex-col relative">
        
        {/* Left/Right swipe areas for touch */}
        <button 
          onClick={handlePrev}
          disabled={!canGoPrev}
          className={`absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center opacity-0 hover:opacity-100 transition bg-linear-to-r from-gray-100/50 to-transparent dark:from-gray-800/50 ${!canGoPrev ? 'hidden' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button 
          onClick={handleNext}
          disabled={!canGoNext}
          className={`absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center opacity-0 hover:opacity-100 transition bg-linear-to-l from-gray-100/50 to-transparent dark:from-gray-800/50 ${!canGoNext ? 'hidden' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Front (Question) */}
        <div className="p-8 flex-1">
          <div className="flex justify-between items-start mb-4">
            <span className="inline-block px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-800 rounded">
               {currentItem.topic}
            </span>
            <span className="text-xs text-gray-400">
              Level {currentItem.srs_level}
            </span>
          </div>
          <div className="prose dark:prose-invert max-w-none text-lg">
             <ReactMarkdown
               components={{
                 code({className, children, ...props}) {
                   const match = /language-(\w+)/.exec(className || '')
                   return match ? (
                     <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
                   ) : (
                     <code className={className} {...props}>{children}</code>
                   )
                 }
               }}
             >
               {question.q}
             </ReactMarkdown>
          </div>
        </div>

        {/* Back (Answer) - Only visible if flipped */}
        {isFlipped && (
          <div className="p-8 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
             <div className="mb-2 font-bold text-emerald-600">Correct Answer: {question.answer}</div>
             <div className="prose dark:prose-invert text-sm">
                <ReactMarkdown>{question.explanation}</ReactMarkdown>
             </div>
          </div>
        )}
      </div>

      {/* Keyboard hint */}
      <div className="text-center text-xs text-gray-400">
        Use ← → arrow keys or click arrows to navigate without rating
      </div>

      {/* Controls */}
      <div className="flex justify-center h-16">
        {!isFlipped ? (
          <button
            onClick={() => setIsFlipped(true)}
            className="w-full max-w-md bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
          >
            Show Answer
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-3 w-full">
            <button 
              onClick={() => handleRate(0)}
              disabled={isProcessing}
              className="flex flex-col items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition p-2"
            >
              <span className="font-bold">Again</span>
              <span className="text-xs opacity-75">&lt; 10m</span>
            </button>
            <button 
              onClick={() => handleRate(3)}
              disabled={isProcessing}
              className="flex flex-col items-center justify-center bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition p-2"
            >
              <span className="font-bold">Hard</span>
              <span className="text-xs opacity-75">2d</span>
            </button>
            <button 
              onClick={() => handleRate(4)}
              disabled={isProcessing}
              className="flex flex-col items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition p-2"
            >
              <span className="font-bold">Good</span>
              <span className="text-xs opacity-75">3d</span>
            </button>
            <button 
              onClick={() => handleRate(5)}
              disabled={isProcessing}
              className="flex flex-col items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition p-2"
            >
              <span className="font-bold">Easy</span>
              <span className="text-xs opacity-75">4d</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
