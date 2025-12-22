export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      review_items: {
        Row: {
          id: string
          user_id: string
          topic: string
          question_json: Json
          srs_level: number
          ease_factor: number
          interval_days: number
          last_reviewed_at: string | null
          next_review_at: string
          created_at: string
          tags: string[]
        }
        Insert: {
          id?: string
          user_id: string
          topic: string
          question_json: Json
          srs_level?: number
          ease_factor?: number
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_at?: string
          created_at?: string
          tags?: string[]
        }
        Update: {
          id?: string
          user_id?: string
          topic?: string
          question_json?: Json
          srs_level?: number
          ease_factor?: number
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_at?: string
          created_at?: string
          tags?: string[]
        }
      }
    }
  }
}
