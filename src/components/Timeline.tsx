'use client'

import { useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import { format, parseISO } from 'date-fns'

const CATEGORY_COLORS: Record<string, string> = {
  birth: 'bg-pink-500',
  education: 'bg-blue-500',
  residence: 'bg-green-500',
  work: 'bg-purple-500',
  travel: 'bg-orange-500',
  relationship: 'bg-red-500',
  milestone: 'bg-yellow-500',
  memory: 'bg-gray-500'
}

const CATEGORY_ICONS: Record<string, string> = {
  birth: '👶',
  education: '🎓',
  residence: '🏠',
  work: '💼',
  travel: '✈️',
  relationship: '❤️',
  milestone: '⭐',
  memory: '💭'
}

export function Timeline() {
  const { events, isLoading } = useStore()
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  
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
    
    const min = Math.min(...years, new Date().getFullYear() - 30)
    const max = Math.max(...years, new Date().getFullYear())
    
    return { minYear: min, maxYear: max + 1, sortedEvents: sorted }
  }, [events])
  
  const yearSpan = maxYear - minYear
  
  const getEventPosition = (date: string) => {
    const eventYear = new Date(date).getFullYear()
    const eventMonth = new Date(date).getMonth()
    const yearProgress = eventMonth / 12
    return ((eventYear - minYear + yearProgress) / yearSpan) * 100
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }
  
  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Your Timeline</h2>
          <p className="text-sm text-gray-500">{events.length} events</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            −
          </button>
          <span className="text-sm text-gray-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(2, z + 0.25))}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            +
          </button>
        </div>
      </div>
      
      {/* Timeline View */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">📍</div>
              <p>Events will appear here as you share your story</p>
            </div>
          </div>
        ) : (
          <div 
            className="relative h-full"
            style={{ minWidth: `${yearSpan * 80 * zoom}px` }}
          >
            {/* Year markers */}
            <div className="absolute bottom-8 left-0 right-0 h-0.5 bg-gray-200" />
            
            {Array.from({ length: yearSpan + 1 }, (_, i) => minYear + i).map(year => (
              <div
                key={year}
                className="absolute bottom-0 transform -translate-x-1/2"
                style={{ left: `${((year - minYear) / yearSpan) * 100}%` }}
              >
                <div className="w-0.5 h-4 bg-gray-300 mb-1" />
                <span className="text-xs text-gray-500">{year}</span>
              </div>
            ))}
            
            {/* Events */}
            {sortedEvents.map((event, index) => {
              if (!event.start_date) return null
              
              const position = getEventPosition(event.start_date)
              const isSelected = selectedEvent === event.id
              const color = CATEGORY_COLORS[event.category || 'memory'] || CATEGORY_COLORS.memory
              const icon = CATEGORY_ICONS[event.category || 'memory'] || CATEGORY_ICONS.memory
              
              // Stagger vertically based on index to avoid overlap
              const row = index % 3
              const topOffset = 20 + (row * 30)
              
              return (
                <div
                  key={event.id}
                  className="absolute transform -translate-x-1/2 cursor-pointer group"
                  style={{ 
                    left: `${position}%`,
                    top: `${topOffset}%`
                  }}
                  onClick={() => setSelectedEvent(isSelected ? null : event.id)}
                >
                  {/* Pin line */}
                  <div 
                    className={`w-0.5 ${color} opacity-50`}
                    style={{ height: `${100 - topOffset - 10}%`, position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)' }}
                  />
                  
                  {/* Pin head */}
                  <div
                    className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white text-lg shadow-lg transform transition-transform group-hover:scale-110 ${isSelected ? 'scale-125 ring-4 ring-white ring-opacity-50' : ''}`}
                  >
                    {icon}
                  </div>
                  
                  {/* Event card */}
                  <div
                    className={`absolute top-12 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-xl p-4 w-64 transition-all z-10 ${
                      isSelected ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-800">{event.title}</h3>
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    )}
                    <div className="flex items-center mt-2 text-xs text-gray-400">
                      <span className={`w-2 h-2 rounded-full ${color} mr-2`} />
                      {event.start_date && format(parseISO(event.start_date), 
                        event.date_precision === 'year' ? 'yyyy' :
                        event.date_precision === 'month' ? 'MMM yyyy' : 'MMM d, yyyy'
                      )}
                      {event.category && (
                        <span className="ml-2 capitalize">{event.category}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Category Legend */}
      <div className="px-6 py-3 border-t border-gray-100 flex flex-wrap gap-3">
        {Object.entries(CATEGORY_ICONS).map(([category, icon]) => (
          <div key={category} className="flex items-center text-xs text-gray-500">
            <span className="mr-1">{icon}</span>
            <span className="capitalize">{category}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
