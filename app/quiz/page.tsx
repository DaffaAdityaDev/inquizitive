'use client'

import { useState } from 'react'
import QuizRunner from '@/components/QuizRunner'
import PromptBuilder from '@/components/PromptBuilder'
import { Question } from '@/types'
import { toast } from 'sonner'

const DEMO_QUIZ = [
  {
    "q": "What is the primary purpose of the `useEffect` hook in React?",
    "options": ["To manage global state", "To handle side effects", "To optimize rendering", "To create custom hooks"],
    "answer": "To handle side effects",
    "explanation": "`useEffect` is designed to perform side effects in function components, such as data fetching, subscriptions, or manually changing the DOM."
  },
  {
    "q": "Which method is used to update state in a Redux reducer?",
    "options": ["setState", "mutateState", "return new state", "dispatch"],
    "answer": "return new state",
    "explanation": "Reducers must be pure functions that calculate the next state based on the previous state and the action. They must return a new state object, never mutate the existing one."
  }
]

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [jsonInput, setJsonInput] = useState('')
  const [topic, setTopic] = useState('')
  const [tags, setTags] = useState('') // New state for tags
  const [mode, setMode] = useState<'input' | 'quiz'>('input')

  const handleStart = () => {
    if (!jsonInput.trim()) {
       toast.error('Please paste JSON')
       return
    }
    // Topic is optional if user just pastes JSON, but good to have.
    // We can infer topic from the prompt builder if they used it, but for now let's keep it manual or auto-fill.
    
    try {
      // Clean up markdown code blocks if present (e.g. ```json ... ```)
      const cleanJson = jsonInput.replace(/```json/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleanJson)
      
      if (!Array.isArray(parsed)) {
        toast.error('JSON must be an array of questions')
        return
      }
      
      if (parsed.length > 0) {
        const sample = parsed[0]
        if (!sample.q || !sample.answer || !sample.explanation || !Array.isArray(sample.options)) {
           toast.error('Invalid format. Missing q, answer, explanation, or options array.')
           return
        }
      }

      setQuestions(parsed)
      setMode('quiz')
      toast.success(`Loaded ${parsed.length} questions!`)
    } catch (e) {
      console.error(e)
      toast.error('Invalid JSON format. Make sure to copy ONLY the array.')
    }
  }

  const loadDemo = () => {
    setJsonInput(JSON.stringify(DEMO_QUIZ, null, 2))
    setTopic('React & Redux Basics (Demo)')
    setTags('Demo, React')
    toast.success('Demo loaded! Click Ignite to start.')
  }

  return (
    <div className="p-4">
      {mode === 'input' ? (
        <div className="max-w-3xl mx-auto mt-8">
          <h1 className="text-3xl font-bold mb-2">The Forge 🔥</h1>
          <p className="text-gray-500 mb-8">
            The input stage of the Neuro-Stack. 
            <br/>
            1. Generate Prompt -&gt; 2. Paste to AI -&gt; 3. Paste JSON Result here.
          </p>
          
          <PromptBuilder />

          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-lg font-semibold flex items-center gap-2">
                 📥 JSON Ingest <span className="text-xs font-normal text-gray-500">(Step 3: Paste Result)</span>
               </h2>
               <button 
                 onClick={loadDemo}
                 className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 font-medium transition"
               >
                 ✨ Load Demo Data
               </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Topic Name (for your Vault)</label>
                <input 
                  className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700" 
                  placeholder="e.g. Golang Concurrency"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                <input 
                  className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700" 
                  placeholder="e.g. Backend, System Design, Go"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Paste JSON Array</label>
                <textarea 
                  className="w-full h-48 p-3 font-mono text-sm border rounded dark:bg-gray-800 dark:border-gray-700"
                  placeholder='[{"q": "...", "options": ["A", "B"], "answer": "A", "explanation": "..."}]'
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                />
              </div>

              <button 
                onClick={handleStart}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl flex justify-center items-center gap-2"
              >
                <span>Ignite Quiz 🚀</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <QuizRunner 
          questions={questions} 
          topic={topic || 'Untitled Quiz'} 
          tags={tags.split(',').map(t => t.trim()).filter(Boolean)} 
        />
      )}
    </div>
  )
}