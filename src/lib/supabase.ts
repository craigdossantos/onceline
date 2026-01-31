import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables at runtime
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

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

// Type guard helpers
export function isTimelineEvent(obj: unknown): obj is TimelineEvent {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'timeline_id' in obj &&
    'title' in obj
  )
}

export function isChatMessage(obj: unknown): obj is ChatMessage {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'timeline_id' in obj &&
    'role' in obj &&
    'content' in obj
  )
}
