import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Note: This will fail at runtime if actual keys aren't provided
// but allows the build to complete for CI/CD
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Timeline {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface TimelineEvent {
  id: string
  timeline_id: string
  title: string
  description?: string
  start_date?: string
  end_date?: string
  date_precision: 'year' | 'month' | 'day'
  age_start?: number
  age_end?: number
  category?: string
  tags?: string[]
  source: 'chat' | 'manual' | 'photo' | 'import'
  sort_order: number
  is_private: boolean
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  timeline_id: string
  role: 'user' | 'assistant'
  content: string
  created_event_ids?: string[]
  created_at: string
}
