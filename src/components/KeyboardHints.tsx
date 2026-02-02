'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Keyboard, X } from 'lucide-react'
import { SHORTCUTS } from '@/hooks/useKeyboardShortcuts'

export function KeyboardHints() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-30 w-10 h-10 rounded-full bg-white border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-bg-warm)] transition-colors shadow-sm"
        title="Keyboard shortcuts"
      >
        <Keyboard className="w-4 h-4 text-[var(--color-text-muted)]" />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
            />

            {/* Modal content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl p-6 w-80"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                  Keyboard Shortcuts
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-[var(--color-bg-warm)] flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-[var(--color-text-muted)]" />
                </button>
              </div>

              <div className="space-y-2">
                {SHORTCUTS.map(({ key, description }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-2 border-b border-[var(--color-border-light)] last:border-0"
                  >
                    <span className="text-sm text-[var(--color-text-muted)]">
                      {description}
                    </span>
                    <kbd className="px-2 py-1 text-xs font-mono bg-[var(--color-bg-warm)] border border-[var(--color-border)] rounded">
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs text-[var(--color-text-light)] text-center">
                Press <kbd className="px-1 py-0.5 text-xs bg-[var(--color-bg-warm)] border border-[var(--color-border)] rounded">?</kbd> to toggle this menu
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
