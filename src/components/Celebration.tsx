'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CelebrationProps {
  show: boolean
  message?: string
  onComplete?: () => void
}

export function Celebration({ show, message = 'Memory saved!', onComplete }: CelebrationProps) {
  const [isVisible, setIsVisible] = useState(false)

  const fireConfetti = useCallback(async () => {
    try {
      const confetti = (await import('canvas-confetti')).default
      const colors = ['#D97706', '#FBBF24', '#FEF3C7', '#F59E0B']
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors,
      })
    } catch (e) {
      // Confetti not available, skip silently
    }
  }, [])

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      fireConfetti()

      // Auto-hide after animation
      const timer = setTimeout(() => {
        setIsVisible(false)
        onComplete?.()
      }, 2500)

      return () => clearTimeout(timer)
    }
  }, [show, onComplete, fireConfetti])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ type: 'spring', damping: 15 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-[var(--color-border-light)] px-6 py-4 flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
              className="text-2xl"
            >
              ✨
            </motion.div>
            <div>
              <p className="font-medium text-[var(--color-text)]">{message}</p>
              <p className="text-sm text-[var(--color-text-muted)]">Your story grows...</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
