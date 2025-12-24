'use client'

import { useState } from 'react'
import { PROMPT_TEMPLATES, DEFAULT_CONFIG, type QuestionConfig } from '@/constants/prompts'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Copy, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

// Dynamically get all template keys from PROMPT_TEMPLATES
type TemplateKey = keyof typeof PROMPT_TEMPLATES;

// Human-readable labels for each template
const MODE_LABELS: Record<TemplateKey, { label: string; description: string }> = {
  SCENARIO_BASED: {
    label: '🎯 Scenario Based',
    description: 'Real-world production scenarios & debugging'
  },
  CONCEPT_DEEP_DIVE: {
    label: '🔬 Concept Deep Dive',
    description: 'Under-the-hood mechanisms & internals'
  },
  RAPID_FIRE: {
    label: '⚡ Rapid Fire',
    description: 'Quick knowledge validation & interview prep'
  },
  DEBUGGING_MASTERY: {
    label: '🐛 Debugging Mastery',
    description: 'Production incident debugging scenarios'
  },
};

// Get all available modes dynamically
const AVAILABLE_MODES = Object.keys(PROMPT_TEMPLATES) as TemplateKey[];

export default function PromptBuilder() {
  const [topic, setTopic] = useState('')
  const [mode, setMode] = useState<TemplateKey>('SCENARIO_BASED')
  const [config, setConfig] = useState<QuestionConfig>(DEFAULT_CONFIG)

  const generatePrompt = () => {
    if (!topic.trim()) return ''
    return PROMPT_TEMPLATES[mode](topic, config)
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
    <Card className="glass border-0 ring-1 ring-white/10 mb-8">
      <CardHeader className="border-b border-white/5 pb-4">
        <CardTitle className="flex items-center gap-2 text-white text-lg">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          Prompt Builder
        </CardTitle>
        <CardDescription className="text-gray-400">Step 1: Generate Content via AI</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Topic & Mode Row */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="grid gap-2">
            <Label className="text-gray-300">Target Topic</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. React useEffect, SQL Joins..."
              className="bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus:ring-yellow-400/50"
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-gray-300">Learning Mode</Label>
            <div className="relative">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as TemplateKey)}
                className={cn(
                  "flex h-9 w-full rounded-md border border-white/10 bg-black/20 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-yellow-400/50 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                )}
              >
                {AVAILABLE_MODES.map((key) => (
                  <option key={key} value={key} className="bg-gray-900 text-white">
                    {MODE_LABELS[key]?.label || key}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-2.5 pointer-events-none text-gray-400 text-xs">▼</div>
            </div>
            {/* Mode description hint */}
            <p className="text-xs text-gray-500">{MODE_LABELS[mode]?.description}</p>
          </div>
        </div>

        {/* Config Row - Question Count & Difficulty */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="grid gap-2">
            <Label className="text-gray-300">Question Count</Label>
            <Input
              type="number"
              min={10}
              max={100}
              value={config.questionCount}
              onChange={(e) => setConfig(prev => ({ ...prev, questionCount: parseInt(e.target.value) || 50 }))}
              className="bg-black/20 border-white/10 text-white focus:ring-yellow-400/50"
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-gray-300">Difficulty Level</Label>
            <div className="relative">
              <select
                value={config.difficulty}
                onChange={(e) => setConfig(prev => ({ ...prev, difficulty: e.target.value as QuestionConfig['difficulty'] }))}
                className={cn(
                  "flex h-9 w-full rounded-md border border-white/10 bg-black/20 px-3 py-1 text-sm shadow-sm transition-colors text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-yellow-400/50 appearance-none"
                )}
              >
                <option value="intermediate" className="bg-gray-900 text-white">🟢 Intermediate</option>
                <option value="advanced" className="bg-gray-900 text-white">🟡 Advanced</option>
                <option value="expert" className="bg-gray-900 text-white">🔴 Expert</option>
              </select>
              <div className="absolute right-3 top-2.5 pointer-events-none text-gray-400 text-xs">▼</div>
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <Label className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Generated Prompt Preview</Label>
          <div className="relative group">
            <Textarea
              readOnly
              value={generatePrompt()}
              className="h-32 font-mono text-xs resize-none bg-black/40 border-white/10 text-gray-300 focus:ring-yellow-400/50 transition-all"
              placeholder="Enter a topic above to see the magic prompt..."
            />
            <Button
              size="sm"
              className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black hover:bg-gray-200"
              onClick={handleCopy}
            >
              <Copy className="w-3 h-3 mr-2" /> Copy Prompt
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
