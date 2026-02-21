import { createContext, useState, useContext, useEffect, ReactNode } from 'react'
import { APIService } from '../infrastructure/http/api'
import { toast } from 'sonner'

export interface ModelContextType {
  models: string[]
  selectedModel: string
  setSelectedModel: (model: string) => void
  loadingModels: boolean
}

const ModelContext = createContext<ModelContextType | undefined>(undefined)

// Temporary APIService for listing models
const apiKey = import.meta.env.VITE_GEMINI_API_KEY
const LIST_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const listService = new APIService(LIST_BASE_URL)

export const ModelProvider = ({ children }: { children: ReactNode }) => {
  const [models, setModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<string>(
    import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash'
  )
  const [loadingModels, setLoadingModels] = useState<boolean>(false)

  useEffect(() => {
    const fetchModels = async () => {
      if (!apiKey) {
        toast.error('Missing Gemini API key for model listing')
        return
      }
      setLoadingModels(true)
      try {
        const res = await listService.fetch<{ models: { name: string }[] }>(
          `?key=${apiKey}`
        )
        const names = res.models.map((m: any) => {
          // Extract model name suffix if full resource path
          const parts = m.name.split('/')
          return parts[parts.length - 1]
        })
        setModels(names)
      } catch (err) {
        console.error('Error fetching models:', err)
        toast.error('Failed to load models list')
      } finally {
        setLoadingModels(false)
      }
    }
    fetchModels()
  }, [])

  return (
    <ModelContext.Provider
      value={{ models, selectedModel, setSelectedModel, loadingModels }}
    >
      {children}
    </ModelContext.Provider>
  )
}

export const useModelContext = () => {
  const context = useContext(ModelContext)
  if (!context) {
    throw new Error('useModelContext must be used within ModelProvider')
  }
  return context
} 