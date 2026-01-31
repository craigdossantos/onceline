'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronDown, Award } from 'lucide-react'
import { useStore } from '@/lib/store'
import { formatDateDisplay } from '@/lib/utils'
import { cn } from '@/lib/utils'

const CATEGORY_CONFIG: Record<string, { gradient: string; icon: string; label: string }> = {
  birth: { gradient: 'from-rose-400 to-pink-500', icon: '🎂', label: 'Birth' },
  education: { gradient: 'from-blue-400 to-indigo-500', icon: '🎓', label: 'Education' },
  residence: { gradient: 'from-emerald-400 to-teal-500', icon: '🏠', label: 'Home' },
  work: { gradient: 'from-violet-400 to-purple-500', icon: '💼', label: 'Work' },
  travel: { gradient: 'from-amber-400 to-orange-500', icon: '✈️', label: 'Travel' },
  relationship: { gradient: 'from-pink-400 to-rose-500', icon: '❤️', label: 'People' },
  milestone: { gradient: 'from-yellow-400 to-amber-500', icon: '🏆', label: 'Milestone' },
  memory: { gradient: 'from-slate-400 to-gray-500', icon: '💭', label: 'Memory' }
}

export function TimelinePlayful() {
  const { events, isLoading } = useStore()
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)
  
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      if (!a.start_date && !b.start_date) return 0
      if (!a.start_date) return 1
      if (!b.start_date) return -1
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    })
  }, [events])
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-b from-indigo-50 to-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full"
        />
      </div>
    )
  }
  
  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-indigo-50 to-white overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-indigo-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Your Adventure</h2>
            <p className="text-xs text-indigo-500">{events.length} memories captured</p>
          </div>
        </div>
        
        {/* Stats */}
        {events.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full"
          >
            <Award className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">
              {events.length} {events.length === 1 ? 'memory' : 'memories'}
            </span>
          </motion.div>
        )}
      </div>
      
      {/* Timeline */}
      <div className="flex-1 overflow-y-auto">
        {events.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full p-6"
          >
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, 0, -5, 0]
              }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="text-6xl mb-4"
            >
              🗺️
            </motion.div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              Your adventure awaits!
            </h3>
            <p className="text-slate-500 text-center max-w-sm">
              Start chatting to add memories to your timeline. Each story becomes a stop on your journey! ✨
            </p>
          </motion.div>
        ) : (
          <div className="relative p-6">
            {/* Timeline line */}
            <div className="absolute left-10 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-200 via-purple-200 to-pink-200 rounded-full" />
            
            {/* Events */}
            <div className="space-y-6">
              <AnimatePresence initial={false}>
                {sortedEvents.map((event, index) => {
                  const config = CATEGORY_CONFIG[event.category || 'memory']
                  const isExpanded = expandedEvent === event.id
                  
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, type: 'spring' }}
                      className="relative flex gap-4 pl-2"
                    >
                      {/* Icon bubble */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                        className={cn(
                          'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center',
                          'shadow-lg flex-shrink-0 text-2xl z-10',
                          config.gradient
                        )}
                      >
                        {config.icon}
                      </motion.button>
                      
                      {/* Content card */}
                      <motion.div 
                        className={cn(
                          'flex-1 bg-white rounded-2xl shadow-sm border overflow-hidden',
                          'hover:shadow-md transition-shadow cursor-pointer',
                          isExpanded ? 'border-indigo-200' : 'border-slate-100'
                        )}
                        onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                        layout
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-slate-800">{event.title}</h3>
                              <p className="text-sm text-slate-500 mt-0.5">
                                {formatDateDisplay(event.start_date, event.date_precision)}
                              </p>
                            </div>
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              className="text-slate-400"
                            >
                              <ChevronDown className="w-5 h-5" />
                            </motion.div>
                          </div>
                          
                          <AnimatePresence>
                            {isExpanded && event.description && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <p className="mt-3 pt-3 border-t border-slate-100 text-slate-600">
                                  {event.description}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        
                        {/* Category tag */}
                        <div className={cn(
                          'px-4 py-2 bg-gradient-to-r text-white text-xs font-medium',
                          config.gradient
                        )}>
                          {config.label}
                        </div>
                      </motion.div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
            
            {/* End marker */}
            {events.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: events.length * 0.1 + 0.3 }}
                className="relative mt-6 pl-2 flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 
                                flex items-center justify-center text-2xl z-10">
                  🌟
                </div>
                <p className="text-slate-500 italic">More adventures to come...</p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
