'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { X, Plus, Calendar, Tag } from 'lucide-react'

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

interface AddEventModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddEventModal({ isOpen, onClose }: AddEventModalProps) {
  const { addEvent, timeline } = useStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'memory',
    start_date: '',
    tags: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!timeline || !formData.title.trim()) return

    setIsSubmitting(true)

    try {
      await addEvent({
        timeline_id: timeline.id,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        start_date: formData.start_date || undefined,
        date_precision: 'day',
        category: formData.category,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        source: 'manual',
        sort_order: 0,
        is_private: false,
      })

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'memory',
        start_date: '',
        tags: '',
      })
      onClose()
    } catch (error) {
      console.error('Failed to add event:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg"
          >
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-light)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center">
                    <Plus className="w-5 h-5 text-[var(--color-accent)]" />
                  </div>
                  <h2 className="text-lg font-semibold text-[var(--color-text)]">
                    Add a Memory
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full hover:bg-[var(--color-bg-warm)] flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                    What happened? *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Graduated from college, First day at new job..."
                    required
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-warm)] border border-transparent focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-light)]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                    Tell the story (optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add more details about this moment..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-warm)] border border-transparent focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-light)] resize-none"
                  />
                </div>

                {/* Date and Category row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      When?
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-warm)] border border-transparent focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-light)]"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                      <Tag className="w-3 h-3 inline mr-1" />
                      Tags
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="career, happy, family"
                      className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-warm)] border border-transparent focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-light)]"
                    />
                  </div>
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
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.value })}
                        className={`p-2.5 rounded-xl text-center transition-all ${
                          formData.category === cat.value
                            ? 'bg-[var(--color-accent-light)] border-2 border-[var(--color-accent)]'
                            : 'bg-[var(--color-bg-warm)] border-2 border-transparent hover:border-[var(--color-border)]'
                        }`}
                      >
                        <span className="text-lg block">{cat.icon}</span>
                        <span className="text-xs text-[var(--color-text-muted)] mt-0.5 block">
                          {cat.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-[var(--color-border-light)] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formData.title.trim() || isSubmitting}
                  className="btn-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add Memory
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
