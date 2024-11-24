import { APIError } from '../types/api'

export class APIService {
  private baseURL: string
  private defaultHeaders: HeadersInit

  constructor(baseURL: string, defaultHeaders: HeadersInit = {}) {
    this.baseURL = baseURL
    this.defaultHeaders = defaultHeaders
  }

  async fetch<T>(
    endpoint: string,
    options: RequestInit = {},
    signal?: AbortSignal
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      signal,
    })

    if (!response.ok) {
      const error = new Error('API request failed') as APIError
      error.status = response.status
      error.code = response.statusText
      
      try {
        error.data = await response.json()
      } catch {
        // If response is not JSON, store as string
        const textData = await response.text()
        error.data = { message: textData }
      }
      
      throw error
    }

    return response.json()
  }
} 