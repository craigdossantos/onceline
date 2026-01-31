import { create } from 'zustand'
import { supabase, Timeline, TimelineEvent, ChatMessage } from './supabase'

interface AppState {
  timeline: Timeline | null
  events: TimelineEvent[]
  messages: ChatMessage[]
  isLoading: boolean
  isSending: boolean
  error: string | null
  
  // Timeline actions
  initTimeline: () => Promise<void>
  
  // Event actions
  loadEvents: () => Promise<void>
  addEvent: (event: Omit<TimelineEvent, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  
  // Chat actions
  loadMessages: () => Promise<void>
  sendMessage: (content: string) => Promise<void>
  
  // Error handling
  clearError: () => void
}

export const useStore = create<AppState>((set, get) => ({
  timeline: null,
  events: [],
  messages: [],
  isLoading: true,
  isSending: false,
  error: null,
  
  clearError: () => set({ error: null }),
  
  initTimeline: async () => {
    set({ isLoading: true, error: null })
    
    try {
      // Check for existing timeline (MVP: just grab the first one)
      const { data: timelines, error: fetchError } = await supabase
        .from('timelines')
        .select('*')
        .limit(1)
      
      if (fetchError) {
        throw new Error(`Failed to fetch timelines: ${fetchError.message}`)
      }
      
      let timeline = timelines?.[0]
      
      // Create one if none exists
      if (!timeline) {
        const { data: newTimeline, error: createError } = await supabase
          .from('timelines')
          .insert({ name: 'My Life' })
          .select()
          .single()
        
        if (createError) {
          throw new Error(`Failed to create timeline: ${createError.message}`)
        }
        
        timeline = newTimeline
      }
      
      set({ timeline, isLoading: false })
      
      // Load events and messages in parallel
      if (timeline) {
        await Promise.all([
          get().loadEvents(),
          get().loadMessages()
        ])
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize timeline'
      console.error('initTimeline error:', error)
      set({ error: errorMessage, isLoading: false })
    }
  },
  
  loadEvents: async () => {
    const { timeline } = get()
    if (!timeline) return
    
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('timeline_id', timeline.id)
        .order('start_date', { ascending: true, nullsFirst: false })
      
      if (error) {
        throw new Error(`Failed to load events: ${error.message}`)
      }
      
      set({ events: events || [] })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load events'
      console.error('loadEvents error:', error)
      set({ error: errorMessage })
    }
  },
  
  addEvent: async (event) => {
    const { timeline, events } = get()
    if (!timeline) return
    
    try {
      const { data: newEvent, error } = await supabase
        .from('events')
        .insert({ ...event, timeline_id: timeline.id })
        .select()
        .single()
      
      if (error) {
        throw new Error(`Failed to add event: ${error.message}`)
      }
      
      if (newEvent) {
        set({ events: [...events, newEvent].sort((a, b) => {
          if (!a.start_date) return 1
          if (!b.start_date) return -1
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        })})
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add event'
      console.error('addEvent error:', error)
      set({ error: errorMessage })
    }
  },
  
  loadMessages: async () => {
    const { timeline } = get()
    if (!timeline) return
    
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('timeline_id', timeline.id)
        .order('created_at', { ascending: true })
      
      if (error) {
        throw new Error(`Failed to load messages: ${error.message}`)
      }
      
      set({ messages: messages || [] })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load messages'
      console.error('loadMessages error:', error)
      set({ error: errorMessage })
    }
  },
  
  sendMessage: async (content: string) => {
    const { timeline, messages } = get()
    if (!timeline) return
    
    // Validate input
    const trimmedContent = content.trim()
    if (!trimmedContent) return
    
    set({ isSending: true, error: null })
    
    try {
      // Save user message
      const { data: userMessage, error: userError } = await supabase
        .from('chat_messages')
        .insert({ timeline_id: timeline.id, role: 'user', content: trimmedContent })
        .select()
        .single()
      
      if (userError) {
        throw new Error(`Failed to save message: ${userError.message}`)
      }
      
      if (userMessage) {
        set({ messages: [...messages, userMessage] })
      }
      
      // Get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeline_id: timeline.id,
          messages: [...get().messages.map(m => ({ role: m.role, content: m.content }))],
          events: get().events
        })
      })
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Check for API error response
      if (data.error) {
        throw new Error(data.error)
      }
      
      // Save assistant message
      const { data: assistantMessage, error: assistantError } = await supabase
        .from('chat_messages')
        .insert({
          timeline_id: timeline.id,
          role: 'assistant',
          content: data.message,
          created_event_ids: data.events?.map((e: TimelineEvent) => e.id) || []
        })
        .select()
        .single()
      
      if (assistantError) {
        throw new Error(`Failed to save assistant message: ${assistantError.message}`)
      }
      
      if (assistantMessage) {
        set({ messages: [...get().messages, assistantMessage] })
      }
      
      // Add any new events
      if (data.events && Array.isArray(data.events) && data.events.length > 0) {
        for (const event of data.events) {
          await get().addEvent(event)
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message'
      console.error('sendMessage error:', error)
      set({ error: errorMessage })
    } finally {
      set({ isSending: false })
    }
  }
}))
