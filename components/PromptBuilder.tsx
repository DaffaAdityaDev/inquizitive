'use client'

import { useState } from 'react'
import { PROMPT_TEMPLATES } from '@/constants/prompts'
import { toast } from 'sonner'

export default function PromptBuilder() {
  const [topic, setTopic] = useState('')
  const [mode, setMode] = useState<'SCENARIO_BASED' | 'CONCEPT_DEEP_DIVE'>('SCENARIO_BASED')

  const generatePrompt = () => {
    if (!topic.trim()) return ''
    return PROMPT_TEMPLATES[mode](topic)
  }

  const handleCopy = () => {
    const text = generatePrompt()
    if (!text) {
      toast.error('Please enter a topic first')
      return
    }
    navigator.clipboard.writeText(text)
    toast.success('Prompt copied! Now paste it into Gemini/ChatGPT.')
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 mb-8">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        🛠️ Prompt Builder <span className="text-xs font-normal text-gray-500">(Step 1: Generate Content)</span>
      </h2>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Target Topic</label>
          <input 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. React useEffect, SQL Joins..."
            className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Learning Mode</label>
          <select 
            value={mode}
            onChange={(e) => setMode(e.target.value as 'SCENARIO_BASED' | 'CONCEPT_DEEP_DIVE')}
            className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="SCENARIO_BASED">Scenario Based (Real World)</option>
            <option value="CONCEPT_DEEP_DIVE">Concept Deep Dive (Under the Hood)</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium mb-1 text-gray-500">Generated Prompt Preview:</label>
        <div className="relative">
          <textarea 
            readOnly
            value={generatePrompt()}
            className="w-full h-32 p-3 text-sm font-mono bg-gray-50 dark:bg-gray-950 border rounded-lg resize-none text-gray-600 dark:text-gray-400"
            placeholder="Enter a topic to see the magic prompt..."
          />
          <button
            onClick={handleCopy}
            className="absolute bottom-3 right-3 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md font-medium text-xs hover:opacity-80 transition shadow-sm"
          >
            Copy Prompt
          </button>
        </div>
      </div>
    </div>
  )
}
