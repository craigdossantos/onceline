'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChatMinimal } from '@/components/ChatMinimal'
import { TimelineMinimal } from '@/components/TimelineMinimal'
import { Onboarding } from '@/components/Onboarding'
import { useStore } from '@/lib/store'
import { fadeIn, slideInBottom } from '@/lib/animations'

export default function Home() {
  const { initTimeline, isLoading, timeline, events, messages } = useStore()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  
  useEffect(() => {
    initTimeline().then(() => {
      setIsInitialized(true)
    })
  }, [initTimeline])

  // Show onboarding if no events and no messages (fresh user)
  useEffect(() => {
    if (isInitialized && !isLoading && events.length === 0 && messages.length === 0) {
      setShowOnboarding(true)
    }
  }, [isInitialized, isLoading, events.length, messages.length])

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
  }

  // Show loading state
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            className="w-10 h-10 mx-auto mb-4 border-2 border-stone-200 border-t-amber-500 rounded-full"
          />
          <p className="text-stone-500 font-serif">Loading your timeline...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      {/* Onboarding overlay */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <Onboarding onComplete={handleOnboardingComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main app */}
      <motion.main 
        variants={fadeIn}
        initial="initial"
        animate="animate"
        className="min-h-screen bg-stone-50"
      >
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-40 px-6 py-4 bg-white/80 backdrop-blur-md border-b border-stone-100">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm"
              >
                <span className="text-white text-lg">📍</span>
              </motion.div>
              <div>
                <h1 className="text-xl font-serif font-semibold text-stone-800">Onceline</h1>
                <p className="text-xs text-stone-500">Your life, one line at a time</p>
              </div>
            </div>
            
            {timeline && (
              <div className="hidden md:flex items-center gap-4">
                <span className="text-sm text-stone-500">{events.length} memories</span>
              </div>
            )}
          </div>
        </header>
        
        {/* Main Content */}
        <div className="pt-20 h-screen flex flex-col lg:flex-row">
          {/* Timeline Panel - Full width on mobile, left side on desktop */}
          <motion.div 
            variants={slideInBottom}
            initial="initial"
            animate="animate"
            className="flex-1 lg:w-3/5 h-[50vh] lg:h-auto order-2 lg:order-1"
          >
            <TimelineMinimal />
          </motion.div>
          
          {/* Chat Panel - Full width on mobile, right side on desktop */}
          <motion.div 
            variants={slideInBottom}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1 }}
            className="lg:w-2/5 h-[50vh] lg:h-auto border-t lg:border-t-0 lg:border-l border-stone-200 order-1 lg:order-2"
          >
            <ChatMinimal />
          </motion.div>
        </div>
      </motion.main>
    </>
  )
}
