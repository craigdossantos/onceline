import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from '@testing-library/react'

// Mock supabase before importing store
vi.mock('./supabase', () => {
  const mockFrom = vi.fn()
  return {
    supabase: {
      from: mockFrom,
    },
  }
})

// Import store and supabase after mock setup
import { useStore } from './store'
import { supabase } from './supabase'

const mockSupabase = supabase as { from: ReturnType<typeof vi.fn> }

describe('Store', () => {
  beforeEach(() => {
    // Reset the store state
    useStore.setState({
      timeline: null,
      events: [],
      messages: [],
      isLoading: true,
      isSending: false,
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useStore.getState()
      
      expect(state.timeline).toBeNull()
      expect(state.events).toEqual([])
      expect(state.messages).toEqual([])
      expect(state.isLoading).toBe(true)
      expect(state.isSending).toBe(false)
    })
  })

  describe('initTimeline', () => {
    it('should load existing timeline', async () => {
      const mockTimeline = { id: 'timeline-1', name: 'My Life', created_at: '2024-01-01', updated_at: '2024-01-01' }
      
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'timelines') {
          return {
            select: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [mockTimeline], error: null }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }
      })

      await act(async () => {
        await useStore.getState().initTimeline()
      })

      const state = useStore.getState()
      expect(state.timeline).toEqual(mockTimeline)
      expect(state.isLoading).toBe(false)
    })

    it('should create new timeline if none exists', async () => {
      const newTimeline = { id: 'new-timeline', name: 'My Life', created_at: '2024-01-01', updated_at: '2024-01-01' }
      
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'timelines') {
          return {
            select: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: newTimeline, error: null }),
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }
      })

      await act(async () => {
        await useStore.getState().initTimeline()
      })

      const state = useStore.getState()
      expect(state.timeline).toEqual(newTimeline)
      expect(state.isLoading).toBe(false)
    })
  })

  describe('loadEvents', () => {
    it('should load events for the current timeline', async () => {
      const mockEvents = [
        { id: 'event-1', title: 'Born', start_date: '1990-01-01', timeline_id: 'timeline-1' },
        { id: 'event-2', title: 'Started school', start_date: '1995-09-01', timeline_id: 'timeline-1' },
      ]

      useStore.setState({ timeline: { id: 'timeline-1', name: 'Test', created_at: '', updated_at: '' } })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockEvents, error: null }),
          }),
        }),
      })

      await act(async () => {
        await useStore.getState().loadEvents()
      })

      expect(useStore.getState().events).toEqual(mockEvents)
    })

    it('should not load events if no timeline', async () => {
      useStore.setState({ timeline: null })

      await act(async () => {
        await useStore.getState().loadEvents()
      })

      expect(mockSupabase.from).not.toHaveBeenCalled()
    })
  })

  describe('addEvent', () => {
    it('should add new event and sort by date', async () => {
      const existingEvents = [
        { id: 'event-1', title: 'Born', start_date: '1990-01-01', timeline_id: 'timeline-1' },
      ]
      const newEvent = { 
        id: 'event-2', 
        title: 'New Event', 
        start_date: '1985-01-01', 
        timeline_id: 'timeline-1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      }

      useStore.setState({
        timeline: { id: 'timeline-1', name: 'Test', created_at: '', updated_at: '' },
        events: existingEvents as any,
      })

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: newEvent, error: null }),
          }),
        }),
      })

      await act(async () => {
        await useStore.getState().addEvent({
          title: 'New Event',
          start_date: '1985-01-01',
          timeline_id: 'timeline-1',
          date_precision: 'day',
          source: 'manual',
          sort_order: 0,
          is_private: false,
        })
      })

      const events = useStore.getState().events
      expect(events).toHaveLength(2)
      // Should be sorted - 1985 comes before 1990
      expect(events[0].start_date).toBe('1985-01-01')
    })
  })

  describe('sendMessage', () => {
    it('should save user message and get AI response', async () => {
      const userMessage = {
        id: 'msg-1',
        timeline_id: 'timeline-1',
        role: 'user' as const,
        content: 'I was born in 1990',
        created_at: '2024-01-01',
      }
      const assistantMessage = {
        id: 'msg-2',
        timeline_id: 'timeline-1',
        role: 'assistant' as const,
        content: "That's great!",
        created_at: '2024-01-01',
      }

      useStore.setState({
        timeline: { id: 'timeline-1', name: 'Test', created_at: '', updated_at: '' },
        messages: [],
        events: [],
      })

      let insertCallCount = 0
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockImplementation(() => {
              insertCallCount++
              if (insertCallCount === 1) {
                return Promise.resolve({ data: userMessage, error: null })
              }
              return Promise.resolve({ data: assistantMessage, error: null })
            }),
          }),
        }),
      })

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ message: "That's great!", events: [] }),
      })

      await act(async () => {
        await useStore.getState().sendMessage('I was born in 1990')
      })

      const state = useStore.getState()
      expect(state.isSending).toBe(false)
      expect(state.messages).toHaveLength(2)
    })

    it('should set isSending while processing', async () => {
      useStore.setState({
        timeline: { id: 'timeline-1', name: 'Test', created_at: '', updated_at: '' },
        messages: [],
        events: [],
      })

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'msg-1' }, error: null }),
          }),
        }),
      })

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ message: 'response', events: [] }),
      })

      const sendPromise = useStore.getState().sendMessage('test')
      
      // Check that isSending is true while processing
      expect(useStore.getState().isSending).toBe(true)
      
      await act(async () => {
        await sendPromise
      })
      
      expect(useStore.getState().isSending).toBe(false)
    })

    it('should handle errors gracefully', async () => {
      useStore.setState({
        timeline: { id: 'timeline-1', name: 'Test', created_at: '', updated_at: '' },
        messages: [],
        events: [],
      })

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'msg-1' }, error: null }),
          }),
        }),
      })

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Should not throw
      await act(async () => {
        await useStore.getState().sendMessage('test')
      })

      expect(useStore.getState().isSending).toBe(false)
      consoleSpy.mockRestore()
    })
  })
})
