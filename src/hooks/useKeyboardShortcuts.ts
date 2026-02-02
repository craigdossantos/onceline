import { useEffect, useCallback } from 'react'
import { useStore } from '@/lib/store'

export function useKeyboardShortcuts() {
  const { 
    events, 
    selectedEventId, 
    selectEvent,
  } = useStore()

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input/textarea
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return
    }

    const key = e.key.toLowerCase()
    
    switch (key) {
      // Navigate events with j/k (vim-style)
      case 'j': {
        e.preventDefault()
        if (events.length === 0) return
        
        const currentIndex = selectedEventId 
          ? events.findIndex(e => e.id === selectedEventId)
          : -1
        const nextIndex = Math.min(currentIndex + 1, events.length - 1)
        selectEvent(events[nextIndex].id)
        break
      }
      
      case 'k': {
        e.preventDefault()
        if (events.length === 0) return
        
        const currentIndex = selectedEventId 
          ? events.findIndex(e => e.id === selectedEventId)
          : events.length
        const prevIndex = Math.max(currentIndex - 1, 0)
        selectEvent(events[prevIndex].id)
        break
      }
      
      // Escape to deselect event
      case 'escape': {
        if (selectedEventId) {
          selectEvent(null)
        }
        break
      }
      
      // Select first event with 'g'
      case 'g': {
        if (!e.shiftKey && events.length > 0) {
          selectEvent(events[0].id)
        }
        // Select last event with 'G' (shift+g)
        if (e.shiftKey && events.length > 0) {
          selectEvent(events[events.length - 1].id)
        }
        break
      }
    }
  }, [events, selectedEventId, selectEvent])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Keyboard shortcut reference
export const SHORTCUTS = [
  { key: 'j', description: 'Next event' },
  { key: 'k', description: 'Previous event' },
  { key: 'g', description: 'First event' },
  { key: 'G', description: 'Last event' },
  { key: 'Esc', description: 'Deselect event' },
]
