'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { useAuth } from '@/contexts/AuthContext'
import { format, parseISO } from 'date-fns'
import { X, Edit2, Trash2, Calendar, Tag, Save, MapPin, Image, Upload, Loader2 } from 'lucide-react'
import { uploadEventPhoto, resizeImage, extractPhotoMetadata } from '@/lib/photos'
import { GooglePhotosPicker } from './GooglePhotosPicker'

const CATEGORY_OPTIONS = [
  { value: 'birth', label: 'Birth', icon: '👶' },
  { value: 'education', label: 'Education', icon: '🎓' },
  { value: 'residence', label: 'Residence', icon: '🏠' },
  { value: 'work', label: 'Work', icon: '💼' },
  { value: 'travel', label: 'Travel', icon: '✈️' },
  { value: 'relationship', label: 'Relationship', icon: '❤️' },
  { value: 'milestone', label: 'Milestone', icon: '⭐' },
  { value: 'memory', label: 'Memory', icon: '💭' },
]

export function EventDetail() {
  const { events, selectedEventId, selectEvent, updateEvent, deleteEvent, isAnonymous } = useStore()
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    category: '',
    start_date: '',
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [exifSuggestion, setExifSuggestion] = useState<{ date: string; show: boolean } | null>(null)
  const [showGooglePhotos, setShowGooglePhotos] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const event = events.find((e) => e.id === selectedEventId)

  if (!event) return null

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    
    setIsUploading(true)
    try {
      // Resize image before upload
      const resized = await resizeImage(file)
      
      // Upload to Supabase Storage
      const result = await uploadEventPhoto(resized, user.id, event.id)
      
      if (result) {
        // Update event with photo URL
        await updateEvent(event.id, {
          image_url: result.url,
          image_metadata: result.metadata,
        })
        
        // If photo has date and event doesn't, suggest using it
        if (result.metadata.dateTaken && !event.start_date) {
          const photoDate = new Date(result.metadata.dateTaken)
          setExifSuggestion({
            date: photoDate.toISOString().split('T')[0],
            show: true
          })
        }
      }
    } catch (error) {
      console.error('Upload failed:', error)
    }
    setIsUploading(false)
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const applyExifDate = async () => {
    if (exifSuggestion) {
      await updateEvent(event.id, { start_date: exifSuggestion.date })
      setExifSuggestion(null)
    }
  }

  const handleGooglePhotoSelect = async (photo: { id: string; url: string; fullUrl: string; dateTaken?: string }) => {
    if (!user) return
    
    setIsUploading(true)
    try {
      const response = await fetch('/api/photos/google/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId: photo.id,
          eventId: event.id,
          userId: user.id,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Refresh event data
        await updateEvent(event.id, {
          image_url: data.url,
          image_metadata: data.metadata,
        })
        
        // Suggest date from photo if event has no date
        if (data.metadata?.dateTaken && !event.start_date) {
          const photoDate = new Date(data.metadata.dateTaken)
          setExifSuggestion({
            date: photoDate.toISOString().split('T')[0],
            show: true
          })
        }
      }
    } catch (error) {
      console.error('Failed to import photo:', error)
    }
    setIsUploading(false)
  }

  const startEditing = () => {
    setEditData({
      title: event.title,
      description: event.description || '',
      category: event.category || 'memory',
      start_date: event.start_date || '',
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    await updateEvent(event.id, {
      title: editData.title,
      description: editData.description || undefined,
      category: editData.category,
      start_date: editData.start_date || undefined,
    })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    await deleteEvent(event.id)
    selectEvent(null)
    setShowDeleteConfirm(false)
  }

  const categoryInfo = CATEGORY_OPTIONS.find((c) => c.value === event.category) || CATEGORY_OPTIONS[7]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={{ type: 'spring', damping: 25 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:max-w-md bg-white shadow-2xl z-40 flex flex-col safe-area-inset"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-light)]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{categoryInfo.icon}</span>
            <span className="font-medium text-[var(--color-text)]">{categoryInfo.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <button
                  onClick={startEditing}
                  className="w-8 h-8 rounded-full hover:bg-[var(--color-bg-warm)] flex items-center justify-center"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4 text-[var(--color-text-muted)]" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </>
            )}
            <button
              onClick={() => {
                selectEvent(null)
                setIsEditing(false)
              }}
              className="w-8 h-8 rounded-full hover:bg-[var(--color-bg-warm)] flex items-center justify-center"
            >
              <X className="w-5 h-5 text-[var(--color-text-muted)]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isEditing ? (
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-warm)] border border-transparent focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-light)]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                  Description
                </label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-warm)] border border-transparent focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-light)] resize-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                  Category
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setEditData({ ...editData, category: cat.value })}
                      className={`p-3 rounded-xl text-center transition-all ${
                        editData.category === cat.value
                          ? 'bg-[var(--color-accent-light)] border-2 border-[var(--color-accent)]'
                          : 'bg-[var(--color-bg-warm)] border-2 border-transparent hover:border-[var(--color-border)]'
                      }`}
                    >
                      <span className="text-xl block">{cat.icon}</span>
                      <span className="text-xs text-[var(--color-text-muted)] mt-1 block">
                        {cat.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={editData.start_date}
                  onChange={(e) => setEditData({ ...editData, start_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-warm)] border border-transparent focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-light)]"
                />
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                className="w-full btn-accent flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Photo */}
              <div className="relative">
                {event.image_url ? (
                  <div className="relative rounded-xl overflow-hidden bg-[var(--color-bg-warm)]">
                    <img 
                      src={event.image_url} 
                      alt={event.title}
                      className="w-full h-48 object-cover"
                    />
                    {!isAnonymous && user && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors"
                        title="Change photo"
                      >
                        <Edit2 className="w-4 h-4 text-[var(--color-text-muted)]" />
                      </button>
                    )}
                  </div>
                ) : !isAnonymous && user ? (
                  <div className="space-y-2">
                    {isUploading ? (
                      <div className="w-full h-32 rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center gap-2 text-[var(--color-text-muted)]">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-sm">Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 h-24 rounded-xl border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-light)] transition-all flex flex-col items-center justify-center gap-2 text-[var(--color-text-muted)]"
                        >
                          <Upload className="w-5 h-5" />
                          <span className="text-xs">From device</span>
                        </button>
                        <button
                          onClick={() => setShowGooglePhotos(true)}
                          className="flex-1 h-24 rounded-xl border-2 border-dashed border-[var(--color-border)] hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-2 text-[var(--color-text-muted)]"
                        >
                          <Image className="w-5 h-5" />
                          <span className="text-xs">Google Photos</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
              
              {/* EXIF Date Suggestion */}
              {exifSuggestion?.show && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-[var(--color-accent-light)] border border-[var(--color-accent)]"
                >
                  <p className="text-sm text-[var(--color-text)] mb-2">
                    📸 This photo was taken on {format(parseISO(exifSuggestion.date), 'MMMM d, yyyy')}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={applyExifDate}
                      className="px-3 py-1.5 text-sm bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90"
                    >
                      Use this date
                    </button>
                    <button
                      onClick={() => setExifSuggestion(null)}
                      className="px-3 py-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    >
                      No thanks
                    </button>
                  </div>
                </motion.div>
              )}
              
              {/* Title */}
              <h2 className="text-headline text-2xl text-[var(--color-text)]">{event.title}</h2>

              {/* Date */}
              {event.start_date && (
                <div className="flex items-center gap-3 text-[var(--color-text-muted)]">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(
                      parseISO(event.start_date),
                      event.date_precision === 'year'
                        ? 'yyyy'
                        : event.date_precision === 'month'
                        ? 'MMMM yyyy'
                        : 'MMMM d, yyyy'
                    )}
                  </span>
                </div>
              )}

              {/* Description */}
              {event.description && (
                <div className="prose prose-stone">
                  <p className="text-[var(--color-text)] leading-relaxed">{event.description}</p>
                </div>
              )}

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-sm bg-[var(--color-bg-warm)] text-[var(--color-text-muted)] rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Metadata */}
              <div className="pt-6 border-t border-[var(--color-border-light)] text-sm text-[var(--color-text-light)]">
                <div className="flex items-center gap-2">
                  <Tag className="w-3 h-3" />
                  <span>Source: {event.source}</span>
                </div>
                {event.created_at && (
                  <div className="mt-2">
                    Added {format(parseISO(event.created_at), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Delete confirmation */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
                  Delete this memory?
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] mb-6">
                  This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Google Photos Picker */}
      <GooglePhotosPicker
        isOpen={showGooglePhotos}
        onClose={() => setShowGooglePhotos(false)}
        onSelect={handleGooglePhotoSelect}
        eventDate={event.start_date}
      />
    </AnimatePresence>
  )
}
