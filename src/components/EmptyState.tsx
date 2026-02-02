'use client'

import { motion } from 'framer-motion'

interface EmptyStateProps {
  icon?: string
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon = '📍', title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">{icon}</span>
      </div>
      
      <h2 className="text-headline text-2xl text-[var(--color-text)] mb-3">
        {title}
      </h2>
      
      <p className="text-story text-lg max-w-md text-[var(--color-text-muted)]">
        {description}
      </p>
      
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 btn-accent"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  )
}
