'use client'

import { useState } from 'react'

export default function Tutorial() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="w-full max-w-4xl mb-8">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition"
      >
        <span>{isOpen ? '🔽 Hide Guide' : 'ℹ️ How does this work?'}</span>
      </button>

      {isOpen && (
        <div className="mt-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4">The Neuro-Stack Workflow 🧠</h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="font-bold text-blue-600">1. The Forge 🔥</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Go here to create new quizzes. Use the <b>Prompt Builder</b> to ask an AI (like ChatGPT) for questions, then paste the JSON result back.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="font-bold text-purple-600">2. The Filter 🛡️</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Take the quiz. If you answer correctly, it&apos;s discarded (you already know it!). 
                If you get it <b>WRONG</b>, it&apos;s automatically saved to your Vault.
              </p>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-emerald-600">3. The Gym 🏋️</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Come here daily. The Spaced Repetition algorithm will serve you the questions you previously got wrong, right when you&apos;re about to forget them.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
