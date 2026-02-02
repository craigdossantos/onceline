import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Browser client for client components
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Helper to create a fresh browser client (for auth context)
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Types
export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  birth_date?: string
  created_at: string
  updated_at: string
}

export interface Timeline {
  id: string
  user_id?: string
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
  image_url?: string
  image_metadata?: {
    dateTaken?: string
    gpsLat?: number
    gpsLng?: number
    camera?: string
    width?: number
    height?: number
  }
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
