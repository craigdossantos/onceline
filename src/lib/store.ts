import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, Timeline, TimelineEvent, ChatMessage } from './supabase'

interface AppState {
  // Onboarding
  hasCompletedOnboarding: boolean
  setOnboardingComplete: () => void
  
  // Core state
  timeline: Timeline | null
  events: TimelineEvent[]
  messages: ChatMessage[]
  isLoading: boolean
  isSending: boolean
  
  // UI state
  isChatOpen: boolean
  selectedEventId: string | null
  toggleChat: () => void
  selectEvent: (id: string | null) => void
  
  // Timeline actions
  initTimeline: () => Promise<void>
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
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Onboarding
      hasCompletedOnboarding: false,
      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
      
      // Core state
      timeline: null,
      events: [],
      messages: [],
      isLoading: true,
      isSending: false,
      
      // UI state
      isChatOpen: false,
      selectedEventId: null,
      toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
      selectEvent: (id) => set({ selectedEventId: id }),
      
      // Timeline actions
      initTimeline: async () => {
        set({ isLoading: true })
        
        // Check for existing timeline (MVP: just grab the first one)
        const { data: timelines } = await supabase
          .from('timelines')
          .select('*')
          .limit(1)
        
        let timeline = timelines?.[0]
        
        // Create one if none exists
        if (!timeline) {
          const { data: newTimeline } = await supabase
            .from('timelines')
            .insert({ name: 'My Life' })
            .select()
            .single()
          timeline = newTimeline
        }
        
        set({ timeline, isLoading: false })
        
        // Load events and messages
        if (timeline) {
          get().loadEvents()
          get().loadMessages()
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
        const { timeline, events } = get()
        if (!timeline) return
        
        const { data: newEvent } = await supabase
          .from('events')
          .insert({ ...event, timeline_id: timeline.id })
          .select()
          .single()
        
        if (newEvent) {
          set({ events: [...events, newEvent].sort((a, b) => {
            if (!a.start_date) return 1
            if (!b.start_date) return -1
            return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
          })})
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
        const { timeline, messages } = get()
        if (!timeline) return
        
        set({ isSending: true })
        
        // Save user message
        const { data: userMessage } = await supabase
          .from('chat_messages')
          .insert({ timeline_id: timeline.id, role: 'user', content })
          .select()
          .single()
        
        if (userMessage) {
          set({ messages: [...messages, userMessage] })
        }
        
        try {
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
          
          const data = await response.json()
          
          // Save assistant message
          const { data: assistantMessage } = await supabase
            .from('chat_messages')
            .insert({
              timeline_id: timeline.id,
              role: 'assistant',
              content: data.message,
              created_event_ids: data.events?.map((e: TimelineEvent) => e.id) || []
            })
            .select()
            .single()
          
          if (assistantMessage) {
            set({ messages: [...get().messages, assistantMessage] })
          }
          
          // Add any new events
          if (data.events && data.events.length > 0) {
            for (const event of data.events) {
              await get().addEvent(event)
            }
          }
        } catch (error) {
          console.error('Chat error:', error)
        }
        
        set({ isSending: false })
      },
      
      clearMessages: async () => {
        const { timeline } = get()
        if (!timeline) return
        
        await supabase
          .from('chat_messages')
          .delete()
          .eq('timeline_id', timeline.id)
        
        set({ messages: [] })
      },
    }),
    {
      name: 'onceline-storage',
      partialize: (state) => ({ 
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
)
