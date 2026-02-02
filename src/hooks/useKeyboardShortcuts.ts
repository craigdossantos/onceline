import { useEffect, useCallback } from 'react'
import { useStore } from '@/lib/store'

interface KeyboardShortcutOptions {
  onAddEvent?: () => void
}

export function useKeyboardShortcuts(options?: KeyboardShortcutOptions) {
  const { 
    events, 
    selectedEventId, 
    selectEvent, 
    toggleChat, 
    isChatOpen 
  } = useStore()

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input/textarea
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return
    }

    // Prevent default for our shortcuts
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
      
      // Toggle chat with 'c'
      case 'c': {
        e.preventDefault()
        toggleChat()
        break
      }
      
      // New event with 'n'
      case 'n': {
        e.preventDefault()
        options?.onAddEvent?.()
        break
      }
      
      // Escape to close chat or deselect event
      case 'escape': {
        if (isChatOpen) {
          toggleChat()
        } else if (selectedEventId) {
          selectEvent(null)
        }
        break
      }
      
      // Select first event with 'g' then 'g'
      case 'g': {
        if (events.length > 0) {
          selectEvent(events[0].id)
        }
        break
      }
      
      // Select last event with 'G' (shift+g)
      case 'g': {
        if (e.shiftKey && events.length > 0) {
          selectEvent(events[events.length - 1].id)
        }
        break
      }
      
      // Toggle event selection with space or enter
      case ' ':
      case 'enter': {
        if (selectedEventId) {
          // Could toggle expanded state in future
          e.preventDefault()
        }
        break
      }
    }
  }, [events, selectedEventId, selectEvent, toggleChat, isChatOpen])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Keyboard shortcut reference
export const SHORTCUTS = [
  { key: 'n', description: 'New memory' },
  { key: 'c', description: 'Toggle chat' },
  { key: 'j', description: 'Next event' },
  { key: 'k', description: 'Previous event' },
  { key: 'g', description: 'First event' },
  { key: 'G', description: 'Last event' },
  { key: 'Esc', description: 'Close / Deselect' },
]
