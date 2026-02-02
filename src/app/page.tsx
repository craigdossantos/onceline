'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Onboarding } from '@/components/Onboarding'
import { TimelineView } from '@/components/TimelineView'
import { ChatSheet } from '@/components/ChatSheet'
import { Celebration } from '@/components/Celebration'
import { KeyboardHints } from '@/components/KeyboardHints'
import { EventDetail } from '@/components/EventDetail'
import { AddEventModal } from '@/components/AddEventModal'
import { useStore } from '@/lib/store'
import { useCelebration } from '@/hooks/useCelebration'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { Plus } from 'lucide-react'

export default function Home() {
  const { initTimeline, isLoading, hasCompletedOnboarding, setOnboardingComplete, events, selectedEventId } = useStore()
  const { showCelebration, celebrationMessage, clearCelebration } = useCelebration()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  
  // Enable keyboard shortcuts
  useKeyboardShortcuts({
    onAddEvent: () => setShowAddModal(true),
  })

  useEffect(() => {
    const init = async () => {
      await initTimeline()
      setIsInitialized(true)
    }
    init()
  }, [initTimeline])

  // Show onboarding if not completed and no events exist
  useEffect(() => {
    if (isInitialized && !isLoading) {
      if (!hasCompletedOnboarding && events.length === 0) {
        setShowOnboarding(true)
      }
    }
  }, [isInitialized, isLoading, hasCompletedOnboarding, events.length])

  const handleOnboardingComplete = () => {
    setOnboardingComplete()
    setShowOnboarding(false)
  }

  // Loading state
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] paper-texture">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-2 border-[var(--color-accent)] border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-story text-lg text-[var(--color-text-muted)]">
            Preparing your story...
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] paper-texture">
      {/* Onboarding */}
      <AnimatePresence>
        {showOnboarding && (
          <Onboarding onComplete={handleOnboardingComplete} />
        )}
      </AnimatePresence>

      {/* Main App */}
      <AnimatePresence>
        {!showOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-screen flex flex-col"
          >
            {/* Header */}
            <header className="px-8 py-4 flex items-center justify-between border-b border-[var(--color-border-light)] bg-white/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] flex items-center justify-center shadow-sm">
                  <span className="text-white text-lg">📍</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-[var(--color-text)]">Onceline</h1>
                  <p className="text-xs text-[var(--color-text-muted)]">Your life, one line at a time</p>
                </div>
              </div>

              {/* Stats and Add Button */}
              <div className="flex items-center gap-6">
                {events.length > 0 && (
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-xl font-semibold text-[var(--color-text)]">{events.length}</div>
                      <div className="text-[var(--color-text-muted)]">Moments</div>
                    </div>
                    {events.length > 0 && events[0].start_date && (
                      <div className="text-center">
                        <div className="text-xl font-semibold text-[var(--color-text)]">
                          {Math.abs(
                            new Date().getFullYear() - new Date(events[0].start_date).getFullYear()
                          )}
                        </div>
                        <div className="text-[var(--color-text-muted)]">Years</div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="text-xl font-semibold text-[var(--color-text)]">
                        {new Set(events.map((e) => e.category).filter(Boolean)).size}
                      </div>
                      <div className="text-[var(--color-text-muted)]">Categories</div>
                    </div>
                  </div>
                )}
                
                {/* Add Event Button */}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white rounded-xl font-medium hover:bg-[var(--color-accent-hover)] transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Memory</span>
                </button>
              </div>
            </header>

            {/* Timeline */}
            <div className="flex-1 overflow-hidden">
              <TimelineView />
            </div>

            {/* Chat Sheet */}
            <ChatSheet />

            {/* Celebration */}
            <Celebration 
              show={showCelebration} 
              message={celebrationMessage}
              onComplete={clearCelebration}
            />

            {/* Event Detail Panel */}
            {selectedEventId && <EventDetail />}

            {/* Add Event Modal */}
            <AddEventModal 
              isOpen={showAddModal} 
              onClose={() => setShowAddModal(false)} 
            />

            {/* Keyboard shortcuts hint */}
            <KeyboardHints />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
