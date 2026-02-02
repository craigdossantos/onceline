import { useState, useEffect, useRef } from 'react'
import { useStore } from '@/lib/store'

export function useCelebration() {
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationMessage, setCelebrationMessage] = useState('Memory saved!')
  const { events } = useStore()
  const prevEventsLengthRef = useRef(events.length)

  useEffect(() => {
    // Check if a new event was added
    if (events.length > prevEventsLengthRef.current) {
      const newEvent = events[events.length - 1]
      
      // Customize message based on event type
      let message = 'Memory saved!'
      if (newEvent.category === 'birth') {
        message = 'Your story begins!'
      } else if (newEvent.category === 'milestone') {
        message = 'Milestone captured!'
      } else if (newEvent.category === 'travel') {
        message = 'Adventure logged!'
      } else if (events.length === 1) {
        message = 'First memory saved!'
      }
      
      setCelebrationMessage(message)
      setShowCelebration(true)
    }
    
    prevEventsLengthRef.current = events.length
  }, [events])

  const clearCelebration = () => setShowCelebration(false)

  return {
    showCelebration,
    celebrationMessage,
    clearCelebration,
  }
}
