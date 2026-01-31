'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '@/lib/store'
import { formatDateDisplay } from '@/lib/utils'
import { pinDrop, fadeInUp, popIn } from '@/lib/animations'

const CATEGORY_STYLES: Record<string, { bg: string; icon: string; label: string }> = {
  birth: { bg: 'bg-rose-100 text-rose-600', icon: '✦', label: 'Birth' },
  education: { bg: 'bg-blue-100 text-blue-600', icon: '📚', label: 'Education' },
  residence: { bg: 'bg-emerald-100 text-emerald-600', icon: '🏠', label: 'Home' },
  work: { bg: 'bg-violet-100 text-violet-600', icon: '💼', label: 'Work' },
  travel: { bg: 'bg-amber-100 text-amber-600', icon: '✈️', label: 'Travel' },
  relationship: { bg: 'bg-pink-100 text-pink-600', icon: '❤️', label: 'People' },
  milestone: { bg: 'bg-yellow-100 text-yellow-600', icon: '⭐', label: 'Milestone' },
  memory: { bg: 'bg-stone-100 text-stone-600', icon: '💭', label: 'Memory' }
}

export function TimelineMinimal() {
  const { events, isLoading } = useStore()
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Calculate timeline bounds
  const { minYear, maxYear, sortedEvents } = useMemo(() => {
    if (events.length === 0) {
      const currentYear = new Date().getFullYear()
      return { minYear: currentYear - 30, maxYear: currentYear, sortedEvents: [] }
    }
    
    const sorted = [...events].sort((a, b) => {
      if (!a.start_date && !b.start_date) return 0
      if (!a.start_date) return 1
      if (!b.start_date) return -1
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    })
    
    const years = sorted
      .filter(e => e.start_date)
      .map(e => new Date(e.start_date!).getFullYear())
    
    const min = Math.min(...years)
    const max = Math.max(...years, new Date().getFullYear())
    
    return { minYear: min, maxYear: max + 1, sortedEvents: sorted }
  }, [events])
  
  const yearSpan = maxYear - minYear || 1
  
  const getEventPosition = (date: string) => {
    const eventDate = new Date(date)
    const eventYear = eventDate.getFullYear()
    const eventMonth = eventDate.getMonth()
    const yearProgress = eventMonth / 12
    return ((eventYear - minYear + yearProgress) / yearSpan) * 100
  }

  // Scroll to center on first event
  useEffect(() => {
    if (sortedEvents.length > 0 && scrollRef.current) {
      const firstEvent = sortedEvents[0]
      if (firstEvent.start_date) {
        const position = getEventPosition(firstEvent.start_date)
        const scrollLeft = (position / 100) * scrollRef.current.scrollWidth - scrollRef.current.clientWidth / 2
        scrollRef.current.scrollTo({ left: scrollLeft, behavior: 'smooth' })
      }
    }
  }, [sortedEvents])
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-2 border-stone-200 border-t-amber-500 rounded-full"
        />
      </div>
    )
  }
  
  return (
    <div ref={containerRef} className="h-full flex flex-col bg-stone-50">
      {/* Header */}
      <div className="px-6 py-4 flex justify-between items-center border-b border-stone-100 bg-white">
        <div>
          <h2 className="font-serif text-xl text-stone-800">Your Timeline</h2>
          <p className="text-sm text-stone-500">{events.length} memories</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            <ZoomOut className="w-4 h-4 text-stone-600" />
          </motion.button>
          <span className="text-sm text-stone-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setZoom(z => Math.min(2, z + 0.25))}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            <ZoomIn className="w-4 h-4 text-stone-600" />
          </motion.button>
        </div>
      </div>
      
      {/* Timeline View */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden"
      >
        {events.length === 0 ? (
          <motion.div 
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className="flex items-center justify-center h-full text-stone-400"
          >
            <div className="text-center">
              <div className="text-5xl mb-4 opacity-50">📍</div>
              <p className="font-serif text-lg text-stone-500">Your story awaits</p>
              <p className="text-sm mt-1">Memories will appear here as you share them</p>
            </div>
          </motion.div>
        ) : (
          <div 
            className="relative h-full px-12 py-8"
            style={{ minWidth: `${Math.max(yearSpan * 120 * zoom, 600)}px` }}
          >
            {/* The timeline line */}
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute bottom-24 left-12 right-12 h-0.5 bg-stone-200 origin-left"
            />
            
            {/* Year markers */}
            {Array.from({ length: yearSpan + 1 }, (_, i) => minYear + i).map((year, index) => (
              <motion.div
                key={year}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="absolute bottom-12 transform -translate-x-1/2"
                style={{ left: `${((year - minYear) / yearSpan) * 100}%` }}
              >
                <div className="w-px h-4 bg-stone-300 mb-2 mx-auto" />
                <span className="text-sm text-stone-400 font-medium">{year}</span>
              </motion.div>
            ))}
            
            {/* Events */}
            <AnimatePresence>
              {sortedEvents.map((event, index) => {
                if (!event.start_date) return null
                
                const position = getEventPosition(event.start_date)
                const isSelected = selectedEvent === event.id
                const style = CATEGORY_STYLES[event.category || 'memory']
                
                // Stagger vertically to avoid overlap
                const row = index % 3
                const topOffset = 15 + (row * 25)
                
                return (
                  <motion.div
                    key={event.id}
                    variants={pinDrop}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ delay: index * 0.1 }}
                    className="absolute cursor-pointer group"
                    style={{ 
                      left: `${position}%`,
                      top: `${topOffset}%`,
                      transform: 'translateX(-50%)'
                    }}
                    onClick={() => setSelectedEvent(isSelected ? null : event.id)}
                  >
                    {/* Pin line */}
                    <div 
                      className="absolute left-1/2 -translate-x-1/2 top-full w-px bg-stone-200 group-hover:bg-amber-300 transition-colors"
                      style={{ height: `calc(${75 - topOffset}vh - 6rem)` }}
                    />
                    
                    {/* Pin head */}
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={`relative w-12 h-12 rounded-full ${style.bg} flex items-center justify-center 
                                  text-xl shadow-sm border-2 border-white
                                  ${isSelected ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}
                    >
                      {style.icon}
                    </motion.div>
                    
                    {/* Event card */}
                    <AnimatePresence>
                      {(isSelected || false) && (
                        <motion.div
                          variants={popIn}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className="absolute top-16 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl 
                                     p-4 w-64 z-20 border border-stone-100"
                        >
                          <h3 className="font-serif text-lg text-stone-800">{event.title}</h3>
                          {event.description && (
                            <p className="text-sm text-stone-500 mt-1">{event.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-stone-100">
                            <span className={`text-xs px-2 py-1 rounded-full ${style.bg}`}>
                              {style.label}
                            </span>
                            <span className="text-xs text-stone-400">
                              {formatDateDisplay(event.start_date, event.date_precision)}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* Hover tooltip */}
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-stone-800 text-white 
                                    text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 
                                    transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {event.title}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* Category legend */}
      <div className="px-6 py-3 border-t border-stone-100 bg-white flex flex-wrap gap-4 justify-center">
        {Object.entries(CATEGORY_STYLES).slice(0, 6).map(([key, style]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-stone-500">
            <span>{style.icon}</span>
            <span>{style.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
