import { describe, it, expect, vi, beforeEach } from 'vitest'

// Reset and import fresh store for each test
describe('Store', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  describe('selectEvent', () => {
    it('should select and deselect events', async () => {
      const { useStore } = await import('@/lib/store')
      
      // Select an event
      useStore.getState().selectEvent('event-123')
      expect(useStore.getState().selectedEventId).toBe('event-123')
      
      // Deselect
      useStore.getState().selectEvent(null)
      expect(useStore.getState().selectedEventId).toBeNull()
    })
  })

  describe('clearNewlyAddedEvent', () => {
    it('should clear newly added event id', async () => {
      const { useStore } = await import('@/lib/store')
      
      useStore.setState({ newlyAddedEventId: 'event-456' })
      useStore.getState().clearNewlyAddedEvent()
      expect(useStore.getState().newlyAddedEventId).toBeNull()
    })
  })

  describe('initial state', () => {
    it('should have correct initial state', async () => {
      const { useStore } = await import('@/lib/store')
      
      const state = useStore.getState()
      expect(state.timeline).toBeNull()
      expect(state.events).toEqual([])
      expect(state.messages).toEqual([])
      expect(state.isLoading).toBe(true)
      expect(state.isSending).toBe(false)
      expect(state.selectedEventId).toBeNull()
      expect(state.newlyAddedEventId).toBeNull()
    })
  })

  describe('sendMessage guards', () => {
    it('should not send message when timeline is null', async () => {
      const { useStore } = await import('@/lib/store')
      
      // Ensure timeline is null
      useStore.setState({ timeline: null })
      
      // Try to send message
      await useStore.getState().sendMessage('Hello')
      
      // Should not have changed isSending
      expect(useStore.getState().isSending).toBe(false)
      expect(useStore.getState().messages).toEqual([])
    })
  })
})
