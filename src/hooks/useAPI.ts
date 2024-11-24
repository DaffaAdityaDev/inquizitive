import { useState, useEffect, useCallback, useRef } from "react"

// Types for better error handling and configuration
interface APIError extends Error {
  code?: string
  status?: number
  data?: unknown
}

interface RequestState {
  timestamp: number
  retryCount: number
  abortController: AbortController
}

interface APIConfig {
  retryAttempts?: number
  retryDelay?: number
  cacheTime?: number
  staleTime?: number
  onSuccess?: (data: any) => void
  onError?: (error: APIError) => void
}

interface APIHookResult<T> {
  data: T | null
  error: APIError | null
  isLoading: boolean
  isStale: boolean
  execute: (params?: unknown) => Promise<void>
  reset: () => void
  cancel: () => void
}

const DEFAULT_CONFIG: APIConfig = {
  retryAttempts: 3,
  retryDelay: 1000,
  cacheTime: 5 * 60 * 1000, // 5 minutes
  staleTime: 30 * 1000, // 30 seconds
}

export function useAPI<T>(
  apiFunction: (signal?: AbortSignal, params?: unknown) => Promise<T>,
  dependencies: any[] = [],
  config: APIConfig = {}
): APIHookResult<T> {
  // Merge default config with provided config
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<APIError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isStale, setIsStale] = useState(false)

  // Refs for managing request state and cache
  const requestStateRef = useRef<RequestState | null>(null)
  const cacheRef = useRef<{
    data: T | null
    timestamp: number
  } | null>(null)

  // Cleanup function
  const cleanup = useCallback(() => {
    if (requestStateRef.current?.abortController) {
      requestStateRef.current.abortController.abort()
    }
    requestStateRef.current = null
  }, [])

  // Reset function
  const reset = useCallback(() => {
    cleanup()
    setData(null)
    setError(null)
    setIsLoading(false)
    setIsStale(false)
    cacheRef.current = null
  }, [cleanup])

  // Execute function with retry logic and caching
  const execute = useCallback(async (params?: unknown) => {
    cleanup()

    // Check cache
    if (cacheRef.current) {
      const isStale = Date.now() - cacheRef.current.timestamp > finalConfig.staleTime!
      if (!isStale) {
        setData(cacheRef.current.data)
        setIsStale(false)
        return
      }
      setIsStale(true)
    }

    const abortController = new AbortController()
    requestStateRef.current = {
      timestamp: Date.now(),
      retryCount: 0,
      abortController,
    }

    const attemptRequest = async (attempt: number): Promise<void> => {
      try {
        setIsLoading(true)
        setError(null)

        const result = await apiFunction(abortController.signal, params)
        
        // Update cache
        cacheRef.current = {
          data: result,
          timestamp: Date.now(),
        }

        setData(result)
        setIsStale(false)
        finalConfig.onSuccess?.(result)
      } catch (err) {
        const apiError = err as APIError
        
        // Retry logic
        if (attempt < finalConfig.retryAttempts! && !abortController.signal.aborted) {
          await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay! * attempt))
          return attemptRequest(attempt + 1)
        }

        setError(apiError)
        finalConfig.onError?.(apiError)
      } finally {
        setIsLoading(false)
      }
    }

    await attemptRequest(1)
  }, [apiFunction, finalConfig])

  // Effect for automatic execution
  useEffect(() => {
    execute()
    return cleanup
  }, [...dependencies, execute])

  // Effect for cache invalidation
  useEffect(() => {
    const cacheTimeout = setTimeout(() => {
      if (cacheRef.current) {
        cacheRef.current = null
      }
    }, finalConfig.cacheTime)

    return () => clearTimeout(cacheTimeout)
  }, [data, finalConfig.cacheTime])

  return {
    data,
    error,
    isLoading,
    isStale,
    execute,
    reset,
    cancel: cleanup,
  }
}

// Test utilities
export const createTestAPIHook = <T>(mockData: T, mockError?: APIError) => {
  let shouldFail = false
  let responseDelay = 0

  const mockAPI = async (signal?: AbortSignal): Promise<T> => {
    if (signal?.aborted) {
      throw new Error('Request aborted')
    }

    await new Promise(resolve => setTimeout(resolve, responseDelay))

    if (shouldFail) {
      throw mockError || new Error('Mock API error')
    }

    return mockData
  }

  return {
    mockAPI,
    setShouldFail: (fail: boolean) => { shouldFail = fail },
    setResponseDelay: (delay: number) => { responseDelay = delay },
  }
}
