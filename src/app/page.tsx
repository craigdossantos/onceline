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
  const [showDelayedLoader, setShowDelayedLoader] = useState(false)
  
  // Enable keyboard shortcuts for navigation
  useKeyboardShortcuts()
  
  // Only show loading spinner after a delay to avoid flash for fast loads
  useEffect(() => {
    const timer = setTimeout(() => setShowDelayedLoader(true), 400)
    return () => clearTimeout(timer)
  }, [])

  // Initialize timeline - works for both anonymous and authenticated users
  useEffect(() => {
    // Don't do anything while auth is still loading
    if (authLoading) {
      console.log('[page] auth still loading, waiting...')
      return
    }
    
    const init = async () => {
      console.log('[page] init called, user:', !!user, 'authLoading:', authLoading)
      try {
        if (user) {
          // Authenticated: use Supabase
          console.log('[page] calling initTimeline for user:', user.id)
          await initTimeline()
          console.log('[page] initTimeline completed')
        } else {
          // Anonymous: use localStorage
          console.log('[page] calling initAnonymous')
          initAnonymous()
          console.log('[page] initAnonymous completed')
        }
      } catch (error) {
        console.error('[page] init error:', error)
      } finally {
        console.log('[page] setting isInitialized=true')
        setIsInitialized(true)
      }
    }
    init()
  }, [initTimeline, initAnonymous, user, authLoading])

  // Show save prompt when anonymous user has events
  useEffect(() => {
    if (!user && events.length >= 2 && !showSavePrompt) {
      const timer = setTimeout(() => setShowSavePrompt(true), 3000)
      return () => clearTimeout(timer)
    }
    // Hide save prompt when user signs in
    if (user && showSavePrompt) {
      setShowSavePrompt(false)
    }
  }, [user, events.length, showSavePrompt])

  const { selectedEventId } = useStore()

  // Loading state logic:
  // - Show spinner while auth is checking (but only after delay to avoid flash)
  // - For authenticated users, show spinner while loading their data
  // - For anonymous users, don't show spinner (localStorage is synchronous)
  const needsLoading = authLoading || (user && storeLoading)
  const showLoadingSpinner = showDelayedLoader && needsLoading
  
  if (showLoadingSpinner) {
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
