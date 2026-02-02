'use client'

import { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { PinDropAnimation } from './PinDropAnimation'
import { ExportButton } from './ExportButton'

const CATEGORY_COLORS: Record<string, string> = {
  birth: 'var(--color-birth)',
  education: 'var(--color-education)',
  residence: 'var(--color-residence)',
  work: 'var(--color-work)',
  travel: 'var(--color-travel)',
  relationship: 'var(--color-relationship)',
  milestone: 'var(--color-milestone)',
  memory: 'var(--color-memory)',
}

const CATEGORY_LABELS: Record<string, { icon: string; label: string }> = {
  birth: { icon: '◉', label: 'Birth' },
  education: { icon: '◈', label: 'Education' },
  residence: { icon: '⌂', label: 'Home' },
  work: { icon: '◆', label: 'Career' },
  travel: { icon: '✦', label: 'Travel' },
  relationship: { icon: '♡', label: 'Love' },
  milestone: { icon: '★', label: 'Milestone' },
  memory: { icon: '○', label: 'Memory' },
}

const MIN_ZOOM = 0.5
const MAX_ZOOM = 2.5

export function TimelineView() {
  const { events, isLoading, selectedEventId, selectEvent, newlyAddedEventId, clearNewlyAddedEvent } = useStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const eventRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [isPinching, setIsPinching] = useState(false)
  const lastPinchDistance = useRef<number | null>(null)

  // Scroll to center on newly added event
  const scrollToEvent = useCallback((eventId: string) => {
    const eventElement = eventRefs.current.get(eventId)
    const scrollContainer = scrollRef.current
    
    if (eventElement && scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect()
      const eventRect = eventElement.getBoundingClientRect()
      
      const eventCenterX = eventRect.left + eventRect.width / 2
      const containerCenterX = containerRect.left + containerRect.width / 2
      const scrollOffset = eventCenterX - containerCenterX + scrollContainer.scrollLeft
      
      scrollContainer.scrollTo({
        left: scrollOffset,
        behavior: 'smooth',
      })
    }
  }, [])

  // Scroll to today on mount
  const scrollToToday = useCallback(() => {
    const scrollContainer = scrollRef.current
    const contentElement = contentRef.current
    if (!scrollContainer || !contentElement) return

    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()
    
    // Get timeline bounds from current state
    const years = events
      .filter((e) => e.start_date)
      .map((e) => new Date(e.start_date!).getFullYear())
    
    const minYear = Math.min(...years, currentYear - 30)
    const maxYear = Math.max(...years, currentYear) + 1
    const yearSpan = maxYear - minYear

    const yearProgress = currentMonth / 12
    const todayPosition = ((currentYear - minYear + yearProgress) / yearSpan)
    
    const scrollTarget = contentElement.scrollWidth * todayPosition - scrollContainer.clientWidth / 2
    
    scrollContainer.scrollTo({
      left: Math.max(0, scrollTarget),
      behavior: 'auto',
    })
  }, [events])

  // Scroll to today on mount
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(scrollToToday, 100)
      return () => clearTimeout(timer)
    }
  }, [isLoading, scrollToToday])

  // Handle newly added event - scroll to it
  useEffect(() => {
    if (newlyAddedEventId) {
      const timer = setTimeout(() => {
        scrollToEvent(newlyAddedEventId)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [newlyAddedEventId, scrollToEvent])

  // Calculate timeline bounds
  const { minYear, maxYear, sortedEvents, yearSpan } = useMemo(() => {
    const currentYear = new Date().getFullYear()
    
    if (events.length === 0) {
      return { minYear: currentYear - 30, maxYear: currentYear + 1, sortedEvents: [], yearSpan: 31 }
    }

    const sorted = [...events].sort((a, b) => {
      if (!a.start_date && !b.start_date) return 0
      if (!a.start_date) return 1
      if (!b.start_date) return -1
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    })

    const years = sorted
      .filter((e) => e.start_date)
      .map((e) => new Date(e.start_date!).getFullYear())

    const min = Math.min(...years, currentYear - 30)
    const max = Math.max(...years, currentYear)
    const span = max - min + 1

    return { minYear: min, maxYear: max + 1, sortedEvents: sorted, yearSpan: span }
  }, [events])

  // Check scroll state
  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        setCanScrollLeft(scrollLeft > 0)
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
      }
    }

    checkScroll()
    const ref = scrollRef.current
    ref?.addEventListener('scroll', checkScroll)
    return () => ref?.removeEventListener('scroll', checkScroll)
  }, [events, zoom])

  // Pinch-to-zoom handling
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        setIsPinching(true)
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        lastPinchDistance.current = Math.hypot(dx, dy)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastPinchDistance.current !== null) {
        e.preventDefault()
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const distance = Math.hypot(dx, dy)
        
        const delta = distance - lastPinchDistance.current
        const zoomDelta = delta * 0.005
        
        setZoom(prev => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + zoomDelta)))
        lastPinchDistance.current = distance
      }
    }

    const handleTouchEnd = () => {
      setIsPinching(false)
      lastPinchDistance.current = null
    }

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const zoomDelta = e.deltaY * -0.002
        setZoom(prev => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + zoomDelta)))
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)
    container.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('wheel', handleWheel)
    }
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.6
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  const adjustZoom = (delta: number) => {
    setZoom(prev => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)))
  }

  const getEventPosition = (date: string) => {
    const eventYear = new Date(date).getFullYear()
    const eventMonth = new Date(date).getMonth()
    const yearProgress = eventMonth / 12
    return ((eventYear - minYear + yearProgress) / yearSpan) * 100
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--color-paper)' }}>
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 rounded-full border-2 border-t-transparent"
            style={{ borderColor: 'var(--color-gold)', borderTopColor: 'transparent' }}
          />
          <p className="text-caption">Loading your story...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ background: 'var(--color-paper)' }}>
      {/* Main Timeline Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {events.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
              className="text-center max-w-lg"
            >
              {/* Decorative element */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-8"
              >
                <div 
                  className="w-20 h-20 rounded-full mx-auto flex items-center justify-center animate-float"
                  style={{ 
                    background: 'linear-gradient(135deg, var(--color-gold-light) 0%, var(--color-paper-warm) 100%)',
                    boxShadow: 'var(--shadow-gold)'
                  }}
                >
                  <span 
                    className="text-3xl"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    ✦
                  </span>
                </div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-2xl font-medium mb-4"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
              >
                Your timeline awaits
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-lg mb-8"
                style={{ color: 'var(--color-ink-muted)' }}
              >
                Share a memory above and watch your story unfold
              </motion.p>

              {/* Timeline preview */}
              <motion.div
                initial={{ opacity: 0, scaleX: 0.5 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
                className="relative h-16"
              >
                <div 
                  className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2"
                  style={{ 
                    background: 'linear-gradient(to right, transparent, var(--color-gold-light), var(--color-gold), var(--color-gold-light), transparent)'
                  }}
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full animate-gold-pulse"
                  style={{ background: 'var(--color-gold)' }}
                />
              </motion.div>
            </motion.div>
          </div>
        ) : (
          /* Timeline with events */
          <>
            {/* Timeline scroll container */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-x-auto overflow-y-hidden px-6 lg:px-10 pt-6"
              style={{ scrollbarWidth: 'thin', touchAction: isPinching ? 'none' : 'pan-x' }}
            >
              <div
                ref={contentRef}
                className="relative h-full transition-transform duration-100"
                style={{ 
                  minWidth: `${Math.max(yearSpan * 140 * zoom, 900)}px`,
                  transform: `scaleX(${zoom})`,
                  transformOrigin: 'left center',
                }}
              >
                {/* Events positioned above the timeline */}
                {sortedEvents.map((event, index) => {
                  if (!event.start_date) return null

                  const position = getEventPosition(event.start_date)
                  const isSelected = selectedEventId === event.id
                  const isNewlyAdded = newlyAddedEventId === event.id
                  const color = CATEGORY_COLORS[event.category || 'memory']
                  const categoryInfo = CATEGORY_LABELS[event.category || 'memory']
                  const row = index % 3
                  const topOffset = 5 + row * 22

                  return (
                    <motion.div
                      key={event.id}
                      ref={(el) => {
                        if (el) eventRefs.current.set(event.id, el)
                        else eventRefs.current.delete(event.id)
                      }}
                      initial={isNewlyAdded ? { opacity: 1 } : { opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={isNewlyAdded ? { duration: 0 } : { delay: index * 0.05, duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                      className="absolute transform -translate-x-1/2 cursor-pointer"
                      style={{
                        left: `${position}%`,
                        top: `${topOffset}%`,
                      }}
                    >
                      {/* Connector to timeline */}
                      <motion.div
                        initial={isNewlyAdded ? { scaleY: 0, opacity: 0 } : { scaleY: 1, opacity: 0.2 }}
                        animate={{ scaleY: 1, opacity: 0.2 }}
                        transition={isNewlyAdded ? { delay: 0.7, duration: 0.3 } : { duration: 0.2 }}
                        className="absolute left-1/2 -translate-x-1/2 w-px origin-top"
                        style={{
                          backgroundColor: color,
                          height: `calc(${85 - topOffset}% - 8px)`,
                          top: 'calc(100% + 8px)',
                        }}
                      />

                      {/* Event pin with drop animation */}
                      <PinDropAnimation
                        color={color}
                        isSelected={isSelected}
                        isNew={isNewlyAdded}
                        onClick={() => selectEvent(isSelected ? null : event.id)}
                        onAnimationComplete={() => {
                          if (isNewlyAdded) {
                            clearNewlyAddedEvent()
                          }
                        }}
                      />

                      {/* Event card */}
                      <AnimatePresence>
                        {(isSelected || true) && (
                          <motion.div
                            initial={isNewlyAdded ? { opacity: 0, y: 20, scale: 0.8 } : { opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ 
                              opacity: 1, 
                              y: 0, 
                              scale: isSelected ? 1.02 : 1,
                            }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={isNewlyAdded ? { delay: 0.6, duration: 0.4, ease: [0.25, 1, 0.5, 1] } : { duration: 0.2 }}
                            className={`absolute top-8 left-1/2 -translate-x-1/2 bg-[var(--color-paper-cream)] rounded-xl border transition-all ${
                              isSelected 
                                ? 'w-72 p-5 shadow-lg' 
                                : 'w-48 p-3 shadow-sm hover:shadow-md'
                            }`}
                            style={{ borderColor: 'rgba(26, 25, 24, 0.08)' }}
                          >
                            {/* Photo thumbnail */}
                            {event.image_url && (
                              <div 
                                className={`rounded-lg overflow-hidden mb-2 ${isSelected ? 'h-24' : 'h-16'}`}
                              >
                                <img 
                                  src={event.image_url} 
                                  alt={event.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            
                            <h3
                              className={`font-medium line-clamp-2 ${isSelected ? 'text-base' : 'text-sm'}`}
                              style={{ 
                                fontFamily: 'var(--font-display)', 
                                color: 'var(--color-ink)' 
                              }}
                            >
                              {event.title}
                            </h3>

                            {isSelected && event.description && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="text-sm mt-2 line-clamp-3"
                                style={{ color: 'var(--color-ink-muted)' }}
                              >
                                {event.description}
                              </motion.p>
                            )}

                            <div 
                              className="flex items-center gap-2 mt-3 text-xs"
                              style={{ color: 'var(--color-ink-faint)' }}
                            >
                              <span>
                                {format(
                                  parseISO(event.start_date),
                                  event.date_precision === 'year'
                                    ? 'yyyy'
                                    : event.date_precision === 'month'
                                    ? 'MMM yyyy'
                                    : 'MMM d, yyyy'
                                )}
                              </span>
                              <span style={{ color: color }}>•</span>
                              <span style={{ color: color }}>{categoryInfo.label}</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}

                {/* The golden thread - positioned near bottom */}
                <div 
                  className="absolute left-0 right-0"
                  style={{ 
                    bottom: '80px',
                    height: '2px',
                    background: 'linear-gradient(to right, transparent 0%, var(--color-gold) 5%, var(--color-gold) 95%, transparent 100%)'
                  }}
                />

                {/* Today marker */}
                {(() => {
                  const currentYear = new Date().getFullYear()
                  const currentMonth = new Date().getMonth()
                  const yearProgress = currentMonth / 12
                  const todayPosition = ((currentYear - minYear + yearProgress) / yearSpan) * 100
                  
                  return (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5, duration: 0.3 }}
                      className="absolute -translate-x-1/2"
                      style={{ 
                        left: `${todayPosition}%`,
                        bottom: '76px',
                      }}
                    >
                      <div 
                        className="w-3 h-3 rounded-full animate-gold-pulse"
                        style={{ background: 'var(--color-gold)', boxShadow: '0 0 12px var(--color-gold)' }}
                      />
                      <span 
                        className="absolute left-1/2 -translate-x-1/2 top-5 text-xs font-medium whitespace-nowrap"
                        style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-display)' }}
                      >
                        Today
                      </span>
                    </motion.div>
                  )
                })()}

                {/* Year markers at BOTTOM */}
                {Array.from({ length: yearSpan + 1 }, (_, i) => minYear + i).map((year) => {
                  const isCurrentYear = year === new Date().getFullYear()
                  return (
                    <div
                      key={year}
                      className="absolute transform -translate-x-1/2"
                      style={{ 
                        left: `${((year - minYear) / yearSpan) * 100}%`,
                        bottom: '24px',
                      }}
                    >
                      <div 
                        className="w-px h-6 mx-auto mb-2"
                        style={{ background: isCurrentYear ? 'var(--color-gold)' : 'var(--color-ink-faint)' }}
                      />
                      <span 
                        className="text-xs block text-center"
                        style={{ 
                          color: isCurrentYear ? 'var(--color-gold)' : 'var(--color-ink-faint)',
                          fontWeight: isCurrentYear ? 600 : 400,
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {year}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Navigation & Zoom Controls */}
            <div 
              className="px-6 lg:px-10 py-3 flex items-center justify-between border-t"
              style={{ borderColor: 'rgba(26, 25, 24, 0.06)', background: 'var(--color-paper-cream)' }}
            >
              {/* Scroll controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scroll('left')}
                  disabled={!canScrollLeft}
                  className="w-9 h-9 rounded-full flex items-center justify-center border transition-all disabled:opacity-20"
                  style={{ 
                    borderColor: 'var(--color-ink-faint)',
                    color: 'var(--color-ink-muted)'
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scroll('right')}
                  disabled={!canScrollRight}
                  className="w-9 h-9 rounded-full flex items-center justify-center border transition-all disabled:opacity-20"
                  style={{ 
                    borderColor: 'var(--color-ink-faint)',
                    color: 'var(--color-ink-muted)'
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Category Legend */}
              <div className="hidden md:flex items-center gap-4">
                {Object.entries(CATEGORY_LABELS).slice(0, 6).map(([category, { icon, label }]) => (
                  <div 
                    key={category} 
                    className="flex items-center gap-1.5 text-xs"
                    style={{ color: 'var(--color-ink-muted)' }}
                  >
                    <span style={{ color: CATEGORY_COLORS[category] }}>{icon}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              {/* Zoom & Export controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => adjustZoom(-0.2)}
                  disabled={zoom <= MIN_ZOOM}
                  className="w-9 h-9 rounded-full flex items-center justify-center border transition-all disabled:opacity-20"
                  style={{ 
                    borderColor: 'var(--color-ink-faint)',
                    color: 'var(--color-ink-muted)'
                  }}
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span 
                  className="text-xs w-12 text-center tabular-nums"
                  style={{ color: 'var(--color-ink-muted)' }}
                >
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => adjustZoom(0.2)}
                  disabled={zoom >= MAX_ZOOM}
                  className="w-9 h-9 rounded-full flex items-center justify-center border transition-all disabled:opacity-20"
                  style={{ 
                    borderColor: 'var(--color-ink-faint)',
                    color: 'var(--color-ink-muted)'
                  }}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <ExportButton />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
