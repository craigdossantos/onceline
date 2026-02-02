'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Image, Calendar, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { format, subDays, addDays, parseISO } from 'date-fns'

interface GooglePhoto {
  id: string
  url: string
  fullUrl: string
  dateTaken?: string
  width?: number
  height?: number
  filename?: string
}

interface GooglePhotosPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (photo: GooglePhoto) => void
  eventDate?: string // Suggest photos around this date
}

export function GooglePhotosPicker({ isOpen, onClose, onSelect, eventDate }: GooglePhotosPickerProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [photos, setPhotos] = useState<GooglePhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<GooglePhoto | null>(null)
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null)
  
  // Check connection status on mount
  useEffect(() => {
    if (isOpen) {
      checkConnection()
    }
  }, [isOpen])
  
  // Set initial date range based on event date
  useEffect(() => {
    if (eventDate) {
      const eventDateObj = new Date(eventDate)
      setDateRange({
        start: format(subDays(eventDateObj, 7), 'yyyy-MM-dd'),
        end: format(addDays(eventDateObj, 7), 'yyyy-MM-dd'),
      })
    }
  }, [eventDate])
  
  // Fetch photos when date range changes
  useEffect(() => {
    if (isConnected && dateRange) {
      fetchPhotos()
    }
  }, [isConnected, dateRange])
  
  const checkConnection = async () => {
    try {
      const res = await fetch('/api/photos/google?action=status')
      const data = await res.json()
      setIsConnected(data.connected)
      
      if (data.connected && !dateRange) {
        // No event date, just load recent photos
        fetchPhotos()
      }
    } catch (error) {
      console.error('Failed to check connection:', error)
      setIsConnected(false)
    }
  }
  
  const fetchPhotos = async (pageToken?: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/photos/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: dateRange?.start,
          endDate: dateRange?.end,
          pageToken,
        }),
      })
      
      const data = await res.json()
      
      if (data.needsReconnect) {
        setIsConnected(false)
        return
      }
      
      if (pageToken) {
        setPhotos(prev => [...prev, ...data.photos])
      } else {
        setPhotos(data.photos || [])
      }
      setNextPageToken(data.nextPageToken || null)
    } catch (error) {
      console.error('Failed to fetch photos:', error)
    }
    setLoading(false)
  }
  
  const handleConnect = () => {
    window.location.href = '/api/photos/google?action=connect'
  }
  
  const handleSelect = () => {
    if (selectedPhoto) {
      onSelect(selectedPhoto)
      onClose()
    }
  }
  
  const shiftDateRange = (direction: 'earlier' | 'later') => {
    if (!dateRange) return
    
    const days = direction === 'earlier' ? -14 : 14
    setDateRange({
      start: format(addDays(parseISO(dateRange.start), days), 'yyyy-MM-dd'),
      end: format(addDays(parseISO(dateRange.end), days), 'yyyy-MM-dd'),
    })
  }
  
  if (!isOpen) return null
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col mt-auto sm:mt-0 sm:my-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-light)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                <Image className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-[var(--color-text)]">Google Photos</h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {isConnected ? 'Select a photo' : 'Connect to browse your photos'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-[var(--color-bg-warm)] flex items-center justify-center"
            >
              <X className="w-5 h-5 text-[var(--color-text-muted)]" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isConnected === null ? (
              // Loading connection status
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-text-muted)]" />
              </div>
            ) : !isConnected ? (
              // Not connected - show connect prompt
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center mx-auto mb-4">
                  <Image className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
                  Connect Google Photos
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] mb-6 max-w-sm mx-auto">
                  Import photos directly from your Google Photos library to add to your memories
                </p>
                <button
                  onClick={handleConnect}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Connect Google Photos
                </button>
              </div>
            ) : (
              // Connected - show photo grid
              <>
                {/* Date range controls */}
                {dateRange && (
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => shiftDateRange('earlier')}
                      className="flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Earlier
                    </button>
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text)]">
                      <Calendar className="w-4 h-4" />
                      {format(parseISO(dateRange.start), 'MMM d')} - {format(parseISO(dateRange.end), 'MMM d, yyyy')}
                    </div>
                    <button
                      onClick={() => shiftDateRange('later')}
                      className="flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    >
                      Later
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {loading && photos.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--color-text-muted)]" />
                  </div>
                ) : photos.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[var(--color-text-muted)]">No photos found for this date range</p>
                  </div>
                ) : (
                  <>
                    {/* Photo grid */}
                    <div className="grid grid-cols-3 gap-1 sm:gap-2">
                      {photos.map(photo => (
                        <button
                          key={photo.id}
                          onClick={() => setSelectedPhoto(photo)}
                          className={`relative aspect-square rounded-lg overflow-hidden group ${
                            selectedPhoto?.id === photo.id ? 'ring-2 ring-[var(--color-accent)]' : ''
                          }`}
                        >
                          <img
                            src={photo.url}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {selectedPhoto?.id === photo.id && (
                            <div className="absolute inset-0 bg-[var(--color-accent)]/20 flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center">
                                <Check className="w-5 h-5 text-white" />
                              </div>
                            </div>
                          )}
                          {photo.dateTaken && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs text-white">
                                {format(new Date(photo.dateTaken), 'MMM d, yyyy')}
                              </span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    
                    {/* Load more */}
                    {nextPageToken && (
                      <div className="text-center mt-4">
                        <button
                          onClick={() => fetchPhotos(nextPageToken)}
                          disabled={loading}
                          className="px-4 py-2 text-sm text-[var(--color-accent)] hover:bg-[var(--color-accent-light)] rounded-lg"
                        >
                          {loading ? 'Loading...' : 'Load more'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
          
          {/* Footer */}
          {isConnected && selectedPhoto && (
            <div className="px-6 py-4 border-t border-[var(--color-border-light)] flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                Cancel
              </button>
              <button
                onClick={handleSelect}
                className="px-6 py-2 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:opacity-90"
              >
                Use this photo
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
