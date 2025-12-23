'use client'

import { useState, useEffect } from 'react'
import QuizRunner from '@/components/QuizRunner'
import PromptBuilder from '@/components/PromptBuilder'
import { Question } from '@/types'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

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
  const [tags, setTags] = useState('')
  const [mode, setMode] = useState<'input' | 'quiz'>('input')

  const [history, setHistory] = useState<{timestamp: number, topic: string, tags: string, json: string}[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('quiz_history')
    if (saved) {
      try {
        // eslint-disable-next-line
        setHistory(JSON.parse(saved))
      } catch (e) { console.error('Failed to parse history', e) }
    }
  }, [])

  const addToHistory = (topic: string, tags: string, json: string) => {
    const newItem = { timestamp: Date.now(), topic, tags, json }
    const newHistory = [newItem, ...history.filter(h => h.json !== json)].slice(0, 5)
    setHistory(newHistory)
    localStorage.setItem('quiz_history', JSON.stringify(newHistory))
  }

  const loadFromHistory = (item: {topic: string, tags: string, json: string}) => {
      setTopic(item.topic)
      setTags(item.tags)
      setJsonInput(item.json)
      toast.success('Loaded from history')
  }

  const handleStart = () => {
    if (!jsonInput.trim()) {
       toast.error('Please paste JSON')
       return
    }
    
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
      addToHistory(topic, tags, cleanJson)
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
    <div className="p-4 bg-background min-h-screen">
      {mode === 'input' ? (
        <div className="max-w-3xl mx-auto mt-8 space-y-8 pb-20">
          <div className="space-y-2 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">
              The Forge 🔥
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto">
              The input stage of the Neuro-Stack. 
              Generate content, ingest JSON, and prepare for mastery.
            </p>
          </div>
          
          <PromptBuilder />

          <Card className="glass border-0 ring-1 ring-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-white/5">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-xl text-white">
                  📥 JSON Ingest
                </CardTitle>
                <CardDescription className="text-gray-400">Step 3: Paste AI Result</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadDemo}
                className="border-white/10 hover:bg-white/5 text-gray-300"
              >
                ✨ Load Demo Data
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-2">
                <Label className="text-gray-300">Topic Name (for your Vault)</Label>
                <Input 
                  placeholder="e.g. Golang Concurrency"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus:ring-orange-500/50"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-gray-300">Tags (comma separated)</Label>
                <Input 
                  placeholder="e.g. Backend, System Design, Go"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus:ring-orange-500/50"
                />
              </div>
              
              <div className="grid gap-2">
                <Label className="text-gray-300">Paste JSON Array</Label>
                <Textarea 
                  className="h-48 font-mono bg-black/40 border-white/10 text-xs text-gray-300 focus:ring-orange-500/50"
                  placeholder='[{"q": "...", "options": ["A", "B"], "answer": "A", "explanation": "..."}]'
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleStart}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-6 shadow-lg shadow-orange-500/20 border-0"
                size="lg"
              >
                Ignite Quiz 🚀
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <QuizRunner 
          questions={questions} 
          topic={topic || 'Untitled Quiz'} 
          tags={tags.split(',').map(t => t.trim()).filter(Boolean)} 
        />
      )}
      
       {/* History Section */}
       {history.length > 0 && mode === 'input' && (
          <div className="max-w-3xl mx-auto pb-20 mt-8">
            <h3 className="text-xl font-bold text-gray-400 mb-4 px-1">🕑 Recent Forges</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {history.map((item) => (
                <button 
                  key={item.timestamp}
                  onClick={() => loadFromHistory(item)}
                  className="bg-white/5 border border-white/5 p-4 rounded-xl text-left hover:bg-white/10 hover:border-white/10 transition group"
                >
                  <div className="font-bold text-white group-hover:text-neon-blue transition-colors truncate">
                    {item.topic || 'Untitled Quiz'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex justify-between">
                    <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                    <span className="truncate max-w-[100px] text-right ml-2 opacity-70">{item.tags}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
    </div>
  )
}