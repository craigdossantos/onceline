'use client'

import { useMemo, useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { format, parseISO, differenceInYears } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar, MapPin } from 'lucide-react'

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

const CATEGORY_ICONS: Record<string, string> = {
  birth: '👶',
  education: '🎓',
  residence: '🏠',
  work: '💼',
  travel: '✈️',
  relationship: '❤️',
  milestone: '⭐',
  memory: '💭',
}

export function TimelineView() {
  const { events, isLoading, selectedEventId, selectEvent } = useStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Calculate timeline bounds
  const { minYear, maxYear, sortedEvents, yearSpan } = useMemo(() => {
    if (events.length === 0) {
      const currentYear = new Date().getFullYear()
      return { minYear: currentYear - 30, maxYear: currentYear, sortedEvents: [], yearSpan: 30 }
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

    const min = Math.min(...years, new Date().getFullYear() - 30)
    const max = Math.max(...years, new Date().getFullYear())
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
    scrollRef.current?.addEventListener('scroll', checkScroll)
    return () => scrollRef.current?.removeEventListener('scroll', checkScroll)
  }, [events])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  const getEventPosition = (date: string) => {
    const eventYear = new Date(date).getFullYear()
    const eventMonth = new Date(date).getMonth()
    const yearProgress = eventMonth / 12
    return ((eventYear - minYear + yearProgress) / yearSpan) * 100
  }

  const selectedEvent = selectedEventId ? events.find((e) => e.id === selectedEventId) : null

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Header */}
      <div className="px-8 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-headline text-3xl text-[var(--color-text)]">Your Story</h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            {events.length === 0
              ? 'Begin writing your timeline'
              : `${events.length} ${events.length === 1 ? 'moment' : 'moments'} captured`}
          </p>
        </div>

        {/* Navigation arrows */}
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="w-10 h-10 rounded-full border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-bg-warm)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-[var(--color-text-muted)]" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="w-10 h-10 rounded-full border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-bg-warm)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)]" />
          </button>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="flex-1 relative">
        {events.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-20 h-20 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📍</span>
              </div>
              <h2 className="text-headline text-2xl text-[var(--color-text)] mb-3">
                Your timeline is empty
              </h2>
              <p className="text-story text-lg max-w-md">
                Every great story has a beginning. Share your first memory and watch your timeline come to life.
              </p>
            </motion.div>
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="h-full overflow-x-auto overflow-y-hidden scrollbar-hide px-8 pb-8"
          >
            <div
              className="relative h-full"
              style={{ minWidth: `${Math.max(yearSpan * 120, 800)}px` }}
            >
              {/* Timeline line */}
              <div className="absolute bottom-24 left-0 right-0 h-px timeline-line" />

              {/* Year markers */}
              {Array.from({ length: yearSpan + 1 }, (_, i) => minYear + i).map((year) => (
                <div
                  key={year}
                  className="absolute bottom-16 transform -translate-x-1/2"
                  style={{ left: `${((year - minYear) / yearSpan) * 100}%` }}
                >
                  <div className="w-px h-3 bg-[var(--color-border)] mx-auto mb-2" />
                  <span className="text-sm text-[var(--color-text-light)] font-medium">{year}</span>
                </div>
              ))}

              {/* Events */}
              {sortedEvents.map((event, index) => {
                if (!event.start_date) return null

                const position = getEventPosition(event.start_date)
                const isSelected = selectedEventId === event.id
                const color = CATEGORY_COLORS[event.category || 'memory']
                const icon = CATEGORY_ICONS[event.category || 'memory']
                const row = index % 3
                const topOffset = 10 + row * 28

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="absolute transform -translate-x-1/2 cursor-pointer group"
                    style={{
                      left: `${position}%`,
                      top: `${topOffset}%`,
                    }}
                    onClick={() => selectEvent(isSelected ? null : event.id)}
                  >
                    {/* Connector line to timeline */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 w-px opacity-30"
                      style={{
                        backgroundColor: color,
                        height: `calc(${100 - topOffset - 24}% - 2rem)`,
                        top: '100%',
                      }}
                    />

                    {/* Event pin */}
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-md transition-all ${
                        isSelected ? 'ring-4 ring-white shadow-lg' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {icon}
                    </motion.div>

                    {/* Event card (always visible, expands on select) */}
                    <motion.div
                      initial={false}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: isSelected ? 1 : 0.95,
                      }}
                      className={`absolute top-16 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-md border border-[var(--color-border-light)] transition-all ${
                        isSelected ? 'w-72 p-4' : 'w-48 p-3'
                      }`}
                    >
                      <h3
                        className={`font-serif font-medium text-[var(--color-text)] ${
                          isSelected ? 'text-lg' : 'text-sm'
                        } line-clamp-2`}
                      >
                        {event.title}
                      </h3>

                      <AnimatePresence>
                        {isSelected && event.description && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-sm text-[var(--color-text-muted)] mt-2 line-clamp-3"
                          >
                            {event.description}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      <div className="flex items-center gap-2 mt-2 text-xs text-[var(--color-text-light)]">
                        <Calendar className="w-3 h-3" />
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
                        {event.category && (
                          <>
                            <span className="opacity-30">•</span>
                            <span className="capitalize">{event.category}</span>
                          </>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Category Legend */}
      <div className="px-8 py-4 border-t border-[var(--color-border-light)] bg-white/80 backdrop-blur-sm">
        <div className="flex flex-wrap gap-4 justify-center">
          {Object.entries(CATEGORY_ICONS).map(([category, icon]) => (
            <div key={category} className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
              <span>{icon}</span>
              <span className="capitalize">{category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
