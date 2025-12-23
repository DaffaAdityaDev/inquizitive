'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface SubjectContextType {
  subject: string
  setSubject: (newSubject: string) => void
  subjects: string[]
  refreshSubjects: () => Promise<void>
}

const SubjectContext = createContext<SubjectContextType | undefined>(undefined)

import { getSubjects } from '@/app/actions'

export function SubjectProvider({ 
  children, 
  initialSubject = 'General',
  initialSubjects = ['General'] 
}: { 
  children: React.ReactNode
  initialSubject?: string 
  initialSubjects?: string[]
}) {
  const [subject, setSubjectState] = useState(initialSubject)
  const [subjects, setSubjects] = useState(initialSubjects)
  const router = useRouter()

  useEffect(() => {
    setSubjects(initialSubjects)
  }, [initialSubjects])

  const setSubject = (newSubject: string) => {
    // 1. Update State
    setSubjectState(newSubject)
    
    // 2. Update Cookie (valid for 1 year)
    document.cookie = `subject=${encodeURIComponent(newSubject)}; path=/; max-age=31536000; SameSite=Lax`
    
    // 3. Refresh Server Components
    router.refresh()
    
    toast.success(`Switched workspace to: ${newSubject}`)
  }
  
  const refreshSubjects = async () => {
      try {
        const newSubjects = await getSubjects()
        setSubjects(newSubjects)
        router.refresh() // Also refresh server components
      } catch (error) {
        console.error('Failed to refresh subjects', error)
      }
  }

  return (
    <SubjectContext.Provider value={{ subject, setSubject, subjects, refreshSubjects }}>
      {children}
    </SubjectContext.Provider>
  )
}

export function useSubject() {
  const context = useContext(SubjectContext)
  if (context === undefined) {
    throw new Error('useSubject must be used within a SubjectProvider')
  }
  return context
}
