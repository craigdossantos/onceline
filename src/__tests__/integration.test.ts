import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock localStorage for tests
const mockStorage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { mockStorage[key] = value },
  removeItem: (key: string) => { delete mockStorage[key] },
  clear: () => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]) },
})

describe('Anonymous Mode Integration', () => {
  beforeEach(() => {
    vi.resetModules()
    // Clear mock storage
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])
  })

  it('should initialize anonymous timeline', async () => {
    const { useStore } = await import('@/lib/store')
    
    useStore.getState().initAnonymous()
    
    const state = useStore.getState()
    expect(state.isAnonymous).toBe(true)
    expect(state.timeline).not.toBeNull()
    expect(state.timeline?.id).toBe('anonymous')
    expect(state.isLoading).toBe(false)
  })

  it('should add events in anonymous mode', async () => {
    const { useStore } = await import('@/lib/store')
    
    useStore.getState().initAnonymous()
    
    await useStore.getState().addEvent({
      title: 'Test Event',
      description: 'A test event',
      start_date: '2020-01-01',
      category: 'milestone',
      timeline_id: 'anonymous',
    } as any)
    
    const events = useStore.getState().events
    expect(events).toHaveLength(1)
    expect(events[0].title).toBe('Test Event')
    expect(events[0].id).toBeDefined()
  })

  it('should persist events to localStorage in anonymous mode', async () => {
    const { useStore } = await import('@/lib/store')
    
    useStore.getState().initAnonymous()
    
    await useStore.getState().addEvent({
      title: 'Persisted Event',
      start_date: '2020-06-15',
      category: 'memory',
      timeline_id: 'anonymous',
    } as any)
    
    // Check localStorage was updated
    const stored = mockStorage['onceline_anonymous_data']
    expect(stored).toBeDefined()
    
    const parsed = JSON.parse(stored)
    expect(parsed.events).toHaveLength(1)
    expect(parsed.events[0].title).toBe('Persisted Event')
  })

  it('should load events from localStorage on init', async () => {
    // Pre-populate mock storage
    const mockData = {
      events: [
        { id: '1', title: 'Stored Event', timeline_id: 'anonymous', category: 'work' }
      ],
      messages: []
    }
    mockStorage['onceline_anonymous_data'] = JSON.stringify(mockData)
    
    const { useStore } = await import('@/lib/store')
    
    useStore.getState().initAnonymous()
    
    const events = useStore.getState().events
    expect(events).toHaveLength(1)
    expect(events[0].title).toBe('Stored Event')
  })
})

describe('Chat Message Flow', () => {
  beforeEach(() => {
    vi.resetModules()
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])
  })

  it('should add user message to state', async () => {
    const { useStore } = await import('@/lib/store')
    
    useStore.getState().initAnonymous()
    
    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({
        message: 'That sounds wonderful!',
        events: []
      })
    })
    
    await useStore.getState().sendMessage('I graduated in 2020')
    
    const messages = useStore.getState().messages
    expect(messages.length).toBeGreaterThanOrEqual(1)
    expect(messages[0].role).toBe('user')
    expect(messages[0].content).toBe('I graduated in 2020')
  })

  it('should add assistant response to state', async () => {
    const { useStore } = await import('@/lib/store')
    
    useStore.getState().initAnonymous()
    
    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({
        message: 'Congratulations on your graduation! What did you study?',
        events: [{
          id: 'event-1',
          title: 'Graduation',
          start_date: '2020-05-15',
          category: 'education'
        }]
      })
    })
    
    await useStore.getState().sendMessage('I graduated from college in 2020')
    
    const messages = useStore.getState().messages
    const assistantMessages = messages.filter(m => m.role === 'assistant')
    expect(assistantMessages.length).toBeGreaterThanOrEqual(1)
  })

  it('should handle API errors gracefully', async () => {
    const { useStore } = await import('@/lib/store')
    
    useStore.getState().initAnonymous()
    
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))
    
    await useStore.getState().sendMessage('Test message')
    
    // Should have error message
    const messages = useStore.getState().messages
    const errorMessage = messages.find(m => m.content.includes('something went wrong'))
    expect(errorMessage).toBeDefined()
    
    // Should not be in sending state
    expect(useStore.getState().isSending).toBe(false)
  })
})

describe('Event Sorting', () => {
  beforeEach(() => {
    vi.resetModules()
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])
  })

  it('should sort events by start_date ascending', async () => {
    const { useStore } = await import('@/lib/store')
    
    useStore.getState().initAnonymous()
    
    // Add events out of order
    await useStore.getState().addEvent({
      title: 'Event 3',
      start_date: '2022-01-01',
      timeline_id: 'anonymous',
    } as any)
    
    await useStore.getState().addEvent({
      title: 'Event 1',
      start_date: '2020-01-01',
      timeline_id: 'anonymous',
    } as any)
    
    await useStore.getState().addEvent({
      title: 'Event 2',
      start_date: '2021-01-01',
      timeline_id: 'anonymous',
    } as any)
    
    const events = useStore.getState().events
    expect(events[0].title).toBe('Event 1')
    expect(events[1].title).toBe('Event 2')
    expect(events[2].title).toBe('Event 3')
  })

  it('should handle events without dates', async () => {
    const { useStore } = await import('@/lib/store')
    
    useStore.getState().initAnonymous()
    
    await useStore.getState().addEvent({
      title: 'Event with date',
      start_date: '2020-01-01',
      timeline_id: 'anonymous',
    } as any)
    
    await useStore.getState().addEvent({
      title: 'Event without date',
      timeline_id: 'anonymous',
    } as any)
    
    const events = useStore.getState().events
    expect(events).toHaveLength(2)
    // Event without date should be at the end
    expect(events[events.length - 1].title).toBe('Event without date')
  })
})
