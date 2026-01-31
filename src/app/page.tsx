'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChatPlayful } from '@/components/ChatPlayful'
import { TimelinePlayful } from '@/components/TimelinePlayful'
import { OnboardingPlayful } from '@/components/OnboardingPlayful'
import { useStore } from '@/lib/store'
import { Sparkles, Menu, X } from 'lucide-react'

export default function Home() {
  const { initTimeline, isLoading, timeline, events, messages } = useStore()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [mobileView, setMobileView] = useState<'chat' | 'timeline'>('chat')
  
  useEffect(() => {
    initTimeline().then(() => {
      setIsInitialized(true)
    })
  }, [initTimeline])

  useEffect(() => {
    if (isInitialized && !isLoading && events.length === 0 && messages.length === 0) {
      setShowOnboarding(true)
    }
  }, [isInitialized, isLoading, events.length, messages.length])

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-100 via-purple-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { repeat: Infinity, duration: 2, ease: 'linear' },
              scale: { repeat: Infinity, duration: 1 }
            }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
          <p className="text-violet-600 font-medium">Loading your adventure...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <OnboardingPlayful onComplete={() => setShowOnboarding(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <main className="min-h-screen bg-gradient-to-br from-violet-100 via-purple-50 to-indigo-100">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-40 px-4 py-3 bg-white/80 backdrop-blur-md border-b border-violet-100">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg"
              >
                <span className="text-white text-xl">📍</span>
              </motion.div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  Onceline
                </h1>
                <p className="text-xs text-violet-500">Your life adventure</p>
              </div>
            </div>
            
            {/* Mobile toggle */}
            <div className="flex lg:hidden">
              <button
                onClick={() => setMobileView(mobileView === 'chat' ? 'timeline' : 'chat')}
                className="px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-medium"
              >
                {mobileView === 'chat' ? '📍 Timeline' : '💬 Chat'}
              </button>
            </div>
            
            {/* Desktop stats */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-100 to-purple-100 rounded-full">
                <span className="text-lg">✨</span>
                <span className="text-sm font-medium text-violet-700">
                  {events.length} {events.length === 1 ? 'memory' : 'memories'}
                </span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <div className="pt-16 h-screen flex flex-col lg:flex-row">
          {/* Mobile view */}
          <div className="lg:hidden flex-1">
            <AnimatePresence mode="wait">
              {mobileView === 'chat' ? (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="h-full"
                >
                  <ChatPlayful />
                </motion.div>
              ) : (
                <motion.div
                  key="timeline"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full"
                >
                  <TimelinePlayful />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Desktop view */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden lg:block lg:w-1/2 h-full border-r border-violet-100"
          >
            <TimelinePlayful />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="hidden lg:block lg:w-1/2 h-full"
          >
            <ChatPlayful />
          </motion.div>
        </div>
      </main>
    </>
  )
}
