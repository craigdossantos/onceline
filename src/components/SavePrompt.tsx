'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface SavePromptProps {
  onDismiss: () => void
}

export function SavePrompt({ onDismiss }: SavePromptProps) {
  const { signInWithMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      await signInWithMagicLink(email)
      setIsSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
      >
        <div 
          className="rounded-2xl shadow-lg border overflow-hidden"
          style={{ 
            background: 'var(--color-paper-cream)',
            borderColor: 'rgba(201, 162, 39, 0.3)',
            boxShadow: '0 8px 32px -8px rgba(26, 25, 24, 0.2), 0 0 0 1px rgba(201, 162, 39, 0.1)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--color-gold) 0%, var(--color-gold-deep) 100%)' }}
              >
                <span className="text-white text-lg">✦</span>
              </div>
              <div>
                <h3 
                  className="font-medium"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
                >
                  {isSent ? 'Check your email!' : 'Save your story'}
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>
                  {isSent 
                    ? 'Click the link to save your timeline' 
                    : 'Sign in to keep your memories safe'}
                </p>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="p-2 rounded-full transition-colors hover:bg-black/5"
              style={{ color: 'var(--color-ink-muted)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Expanded form */}
          <AnimatePresence>
            {(isExpanded || isSent) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4">
                  {isSent ? (
                    <div 
                      className="flex items-center gap-2 p-3 rounded-lg text-sm"
                      style={{ background: 'rgba(201, 162, 39, 0.1)', color: 'var(--color-gold-deep)' }}
                    >
                      <Mail className="w-4 h-4" />
                      <span>Magic link sent to <strong>{email}</strong></span>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <div className="relative">
                        <Mail 
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" 
                          style={{ color: 'var(--color-ink-faint)' }}
                        />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full pl-11 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2"
                          style={{ 
                            borderColor: 'var(--color-ink-faint)',
                            background: 'white',
                            color: 'var(--color-ink)'
                          }}
                          autoFocus
                        />
                      </div>
                      {error && (
                        <p className="text-sm text-red-600">{error}</p>
                      )}
                      <button
                        type="submit"
                        disabled={isSubmitting || !email.trim()}
                        className="w-full py-3 rounded-xl font-medium text-sm transition-all disabled:opacity-50"
                        style={{ 
                          background: 'var(--color-ink)',
                          color: 'var(--color-paper)'
                        }}
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        ) : (
                          'Send magic link'
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expand button (when collapsed) */}
          {!isExpanded && !isSent && (
            <div className="px-4 pb-4">
              <button
                onClick={() => setIsExpanded(true)}
                className="w-full py-3 rounded-xl font-medium text-sm transition-all"
                style={{ 
                  background: 'var(--color-ink)',
                  color: 'var(--color-paper)'
                }}
              >
                Save my timeline
              </button>
            </div>
          )}
        </div>

        {/* Dismiss hint */}
        <p 
          className="text-center text-xs mt-2"
          style={{ color: 'var(--color-ink-faint)' }}
        >
          Your timeline is saved locally until you sign in
        </p>
      </motion.div>
    </AnimatePresence>
  )
}
