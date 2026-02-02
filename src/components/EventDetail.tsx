'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { format, parseISO } from 'date-fns'
import { X, Edit2, Trash2, Calendar, Tag, Save, MapPin } from 'lucide-react'

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
  const { events, selectedEventId, selectEvent, updateEvent, deleteEvent } = useStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    category: '',
    start_date: '',
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const event = events.find((e) => e.id === selectedEventId)

  if (!event) return null

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
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-40 flex flex-col"
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
    </AnimatePresence>
  )
}
