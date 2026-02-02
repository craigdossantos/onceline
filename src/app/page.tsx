'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChatBar } from '@/components/ChatBar'
import { TimelineView } from '@/components/TimelineView'
import { Celebration } from '@/components/Celebration'
import { EventDetail } from '@/components/EventDetail'
import { KeyboardHints } from '@/components/KeyboardHints'
import { SavePrompt } from '@/components/SavePrompt'
import { useStore } from '@/lib/store'
import { useCelebration } from '@/hooks/useCelebration'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { user, isLoading: authLoading } = useAuth()
  const { initTimeline, initAnonymous, isLoading: storeLoading, events } = useStore()
  const { showCelebration, celebrationMessage, clearCelebration } = useCelebration()
  const [isInitialized, setIsInitialized] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  
  // Enable keyboard shortcuts for navigation
  useKeyboardShortcuts()

  // Initialize timeline - works for both anonymous and authenticated users
  useEffect(() => {
    const init = async () => {
      if (user) {
        // Authenticated: use Supabase
        await initTimeline()
      } else if (!authLoading) {
        // Anonymous: use localStorage
        initAnonymous()
      }
      setIsInitialized(true)
    }
    init()
  }, [initTimeline, initAnonymous, user, authLoading])

  // Show save prompt when anonymous user has events
  useEffect(() => {
    if (!user && events.length >= 2 && !showSavePrompt) {
      const timer = setTimeout(() => setShowSavePrompt(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [user, events.length, showSavePrompt])

  const { selectedEventId } = useStore()

  // Loading state
  if (authLoading || !isInitialized || storeLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-paper)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 rounded-full border-2 mx-auto mb-4"
            style={{ 
              borderColor: 'var(--color-gold)', 
              borderTopColor: 'transparent' 
            }}
          />
          <p 
            className="text-lg"
            style={{ 
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              color: 'var(--color-ink-muted)' 
            }}
          >
            Preparing your story...
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <main className="min-h-screen h-screen flex flex-col overflow-hidden" style={{ background: 'var(--color-paper)' }}>
      {/* Chat Bar at TOP */}
      <ChatBar />

      {/* Timeline below */}
      <TimelineView />

      {/* Celebration overlay */}
      <Celebration 
        show={showCelebration} 
        message={celebrationMessage}
        onComplete={clearCelebration}
      />

      {/* Event Detail Panel (slide-in) */}
      {selectedEventId && <EventDetail />}

      {/* Keyboard shortcuts hint */}
      <KeyboardHints />

      {/* Save prompt for anonymous users */}
      {showSavePrompt && !user && (
        <SavePrompt onDismiss={() => setShowSavePrompt(false)} />
      )}
    </main>
  )
}
