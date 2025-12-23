'use client'

import { useSubject } from '@/contexts/SubjectContext'
import { Button } from '@/components/ui/button'
import { ChevronDown, Layers, Plus, X, Trash2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { createWorkspace, deleteWorkspace } from '@/app/actions'
import { toast } from 'sonner'

export default function SubjectSelector() {
  const { subject, setSubject, subjects, refreshSubjects } = useSubject()
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Ensure current active subject is always in the list (even if empty/new)
  const displaySubjects = Array.from(new Set([...subjects, subject])).sort()

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsCreating(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCreate = async () => {
    if (newSubjectName.trim()) {
      const name = newSubjectName.trim()
      setSubject(name)
      setIsCreating(false)
      setIsOpen(false)
      setNewSubjectName('')
      
      // Persist to server
      try {
        await createWorkspace(name)
        refreshSubjects() // Trigger re-fetch
      } catch (e) {
        console.error('Failed to create workspace on server', e)
        // Optimistic update already happened
      }
    }
  }

  const handleDelete = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Delete workspace "${name}"? Items will be moved to 'General'.`)) return

    try {
        await deleteWorkspace(name)
        toast.success(`Workspace "${name}" deleted`)
        if (subject === name) setSubject('General')
        refreshSubjects()
    } catch (e) {
        console.error(e)
        toast.error('Failed to delete workspace')
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 border-dashed border-gray-500 bg-transparent text-gray-300 hover:text-white hover:bg-white/10 h-9"
      >
        <Layers className="w-4 h-4" />
        <span className="hidden sm:inline-block max-w-[100px] truncate">{subject}</span>
        <ChevronDown className={cn("w-3 h-3 opacity-50 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl shadow-xl z-50 overflow-hidden ring-1 ring-white/10">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-widest bg-white/5 border-b border-white/5">
            Workspace
          </div>
          
          <div className="p-1.5 space-y-0.5 max-h-[300px] overflow-y-auto custom-scrollbar">
            {displaySubjects.map((s) => (
              <div
                key={s}
                className={cn(
                  "group w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left transition-colors relative",
                  s === subject 
                    ? "bg-neon-blue/10 text-neon-blue" 
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                )}
              >
                <button 
                    className="flex-1 flex items-center gap-2 min-w-0"
                    onClick={() => {
                        setSubject(s)
                        setIsOpen(false)
                    }}
                >
                    <div className={cn("shrink-0 w-2 h-2 rounded-full", s === subject ? "bg-neon-blue" : "bg-white/20")} />
                    <span className="truncate">{s}</span>
                </button>
                
                {s !== 'General' && (
                    <button
                        onClick={(e) => handleDelete(s, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                )}
              </div>
            ))}
          </div>

          <div className="p-1.5 border-t border-white/5">
            {!isCreating ? (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Workspace...</span>
              </button>
            ) : (
              <div className="px-1 py-1 space-y-2">
                <Input
                  autoFocus
                  placeholder="Name..."
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate()
                    if (e.key === 'Escape') setIsCreating(false)
                  }}
                  className="h-8 text-xs bg-white/5 border-white/10"
                />
                <div className="flex gap-1">
                  <Button size="sm" onClick={handleCreate} className="h-6 text-xs w-full bg-neon-blue text-black hover:bg-cyan-400">Add</Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)} className="h-6 w-6 p-0 hover:bg-white/10"><X className="w-3 h-3" /></Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
