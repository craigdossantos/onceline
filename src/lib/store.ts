import { create } from 'zustand'
import { supabase, Timeline, TimelineEvent, ChatMessage } from './supabase'

const ANONYMOUS_STORAGE_KEY = 'onceline_anonymous_data'

interface AnonymousData {
  events: TimelineEvent[]
  messages: ChatMessage[]
}

function loadAnonymousData(): AnonymousData {
  if (typeof window === 'undefined') return { events: [], messages: [] }
  try {
    const data = localStorage.getItem(ANONYMOUS_STORAGE_KEY)
    return data ? JSON.parse(data) : { events: [], messages: [] }
  } catch {
    return { events: [], messages: [] }
  }
}

function saveAnonymousData(data: AnonymousData) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(ANONYMOUS_STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save anonymous data:', e)
  }
}

interface AppState {
  // Core state
  timeline: Timeline | null
  events: TimelineEvent[]
  messages: ChatMessage[]
  isLoading: boolean
  isSending: boolean
  isAnonymous: boolean
  
  // UI state
  selectedEventId: string | null
  newlyAddedEventId: string | null
  selectEvent: (id: string | null) => void
  clearNewlyAddedEvent: () => void
  
  // Timeline actions
  initTimeline: () => Promise<void>
  initAnonymous: () => void
  updateTimelineName: (name: string) => Promise<void>
  
  // Event actions
  loadEvents: () => Promise<void>
  addEvent: (event: Omit<TimelineEvent, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateEvent: (id: string, updates: Partial<TimelineEvent>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  
  // Chat actions
  loadMessages: () => Promise<void>
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => Promise<void>
  
  // Migration
  migrateAnonymousData: () => Promise<void>
}

export const useStore = create<AppState>()((set, get) => ({
  // Core state
  timeline: null,
  events: [],
  messages: [],
  isLoading: true,
  isSending: false,
  isAnonymous: false,
  
  // UI state
  selectedEventId: null,
  newlyAddedEventId: null,
  selectEvent: (id) => set({ selectedEventId: id }),
  clearNewlyAddedEvent: () => set({ newlyAddedEventId: null }),
  
  // Anonymous mode - uses localStorage
  initAnonymous: () => {
    const data = loadAnonymousData()
    set({
      isAnonymous: true,
      isLoading: false,
      timeline: { id: 'anonymous', name: 'My Life', created_at: '', updated_at: '' },
      events: data.events,
      messages: data.messages,
    })
  },
  
  // Timeline actions
  initTimeline: async () => {
    set({ isLoading: true, isAnonymous: false })
    
    try {
      // Get current user's session
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        set({ isLoading: false })
        return
      }
      
      // Check for existing timeline for this user
      const { data: timelines, error: queryError } = await supabase
        .from('timelines')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
      
      if (queryError) {
        console.error('Failed to query timelines:', queryError)
      }
      
      let timeline = timelines?.[0]
      
      // Create one if none exists
      if (!timeline) {
        const { data: newTimeline, error: insertError } = await supabase
          .from('timelines')
          .insert({ 
            name: 'My Life',
            user_id: user.id,
          })
          .select()
          .single()
        
        if (insertError) {
          console.error('Failed to create timeline:', insertError)
        } else {
          timeline = newTimeline
        }
      }
      
      set({ timeline, isLoading: false })
      
      // Load events and messages
      if (timeline) {
        get().loadEvents()
        get().loadMessages()
        
        // Migrate any anonymous data
        await get().migrateAnonymousData()
      }
    } catch (error) {
      console.error('Error initializing timeline:', error)
      set({ isLoading: false })
    }
  },
  
  updateTimelineName: async (name: string) => {
    const { timeline } = get()
    if (!timeline) return
    
    await supabase
      .from('timelines')
      .update({ name })
      .eq('id', timeline.id)
    
    set({ timeline: { ...timeline, name } })
  },
  
  // Event actions
  loadEvents: async () => {
    const { timeline } = get()
    if (!timeline) return
    
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('timeline_id', timeline.id)
      .order('start_date', { ascending: true, nullsFirst: false })
    
    set({ events: events || [] })
  },
  
  addEvent: async (event) => {
    const { timeline, events, isAnonymous } = get()
    if (!timeline) return
    
    if (isAnonymous) {
      // Anonymous: save to localStorage
      const newEvent: TimelineEvent = {
        ...event,
        id: crypto.randomUUID(),
        timeline_id: 'anonymous',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as TimelineEvent
      
      const newEvents = [...events, newEvent].sort((a, b) => {
        if (!a.start_date) return 1
        if (!b.start_date) return -1
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      })
      
      set({ events: newEvents, newlyAddedEventId: newEvent.id })
      saveAnonymousData({ events: newEvents, messages: get().messages })
      return
    }
    
    // Authenticated: save to Supabase
    const { data: newEvent } = await supabase
      .from('events')
      .insert({ ...event, timeline_id: timeline.id })
      .select()
      .single()
    
    if (newEvent) {
      set({ 
        events: [...events, newEvent].sort((a, b) => {
          if (!a.start_date) return 1
          if (!b.start_date) return -1
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        }),
        newlyAddedEventId: newEvent.id
      })
    }
  },
  
  updateEvent: async (id, updates) => {
    const { events } = get()
    
    const { data: updatedEvent } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (updatedEvent) {
      set({ 
        events: events.map(e => e.id === id ? updatedEvent : e).sort((a, b) => {
          if (!a.start_date) return 1
          if (!b.start_date) return -1
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        })
      })
    }
  },
  
  deleteEvent: async (id) => {
    await supabase
      .from('events')
      .delete()
      .eq('id', id)
    
    set({ events: get().events.filter(e => e.id !== id) })
  },
  
  // Chat actions
  loadMessages: async () => {
    const { timeline } = get()
    if (!timeline) return
    
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('timeline_id', timeline.id)
      .order('created_at', { ascending: true })
    
    set({ messages: messages || [] })
  },
  
  sendMessage: async (content: string) => {
    const { timeline, messages, isAnonymous } = get()
    if (!timeline) return
    
    set({ isSending: true })
    
    // Create user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      timeline_id: timeline.id,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    
    const updatedMessages = [...messages, userMessage]
    set({ messages: updatedMessages })
    
    // Save to localStorage if anonymous
    if (isAnonymous) {
      saveAnonymousData({ events: get().events, messages: updatedMessages })
    } else {
      // Save to Supabase
      await supabase
        .from('chat_messages')
        .insert({ timeline_id: timeline.id, role: 'user', content })
    }
    
    try {
      // Get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeline_id: timeline.id,
          messages: get().messages.map(m => ({ role: m.role, content: m.content })),
          events: get().events
        })
      })
      
      const data = await response.json()
      
      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        timeline_id: timeline.id,
        role: 'assistant',
        content: data.message || 'I had trouble understanding that. Could you try again?',
        created_event_ids: [],
        created_at: new Date().toISOString(),
      }
      
      const finalMessages = [...get().messages, assistantMessage]
      set({ messages: finalMessages })
      
      // Save to localStorage if anonymous
      if (isAnonymous) {
        saveAnonymousData({ events: get().events, messages: finalMessages })
      } else {
        // Save to Supabase
        await supabase
          .from('chat_messages')
          .insert({
            timeline_id: timeline.id,
            role: 'assistant',
            content: data.message,
            created_event_ids: data.events?.map((e: TimelineEvent) => e.id) || []
          })
      }
      
      // Add any new events
      if (data.events && data.events.length > 0) {
        for (const event of data.events) {
          await get().addEvent(event)
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      // Add error message
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        timeline_id: timeline.id,
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        created_at: new Date().toISOString(),
      }
      set({ messages: [...get().messages, errorMessage] })
    }
    
    set({ isSending: false })
  },
  
  clearMessages: async () => {
    const { timeline, isAnonymous } = get()
    if (!timeline) return
    
    if (isAnonymous) {
      set({ messages: [] })
      saveAnonymousData({ events: get().events, messages: [] })
      return
    }
    
    await supabase
      .from('chat_messages')
      .delete()
      .eq('timeline_id', timeline.id)
    
    set({ messages: [] })
  },
  
  // Migrate anonymous data to authenticated account
  migrateAnonymousData: async () => {
    const { timeline } = get()
    if (!timeline || timeline.id === 'anonymous') return
    
    const anonymousData = loadAnonymousData()
    if (anonymousData.events.length === 0 && anonymousData.messages.length === 0) return
    
    console.log('Migrating anonymous data...', anonymousData)
    
    // Migrate events
    for (const event of anonymousData.events) {
      const { id, timeline_id, created_at, updated_at, ...eventData } = event
      await supabase
        .from('events')
        .insert({ ...eventData, timeline_id: timeline.id })
    }
    
    // Migrate messages
    for (const message of anonymousData.messages) {
      const { id, timeline_id, created_at, ...messageData } = message
      await supabase
        .from('chat_messages')
        .insert({ ...messageData, timeline_id: timeline.id })
    }
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ANONYMOUS_STORAGE_KEY)
    }
    
    // Reload data from Supabase
    get().loadEvents()
    get().loadMessages()
  },
}))
