'use client'

import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AuthCodeError() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--color-paper)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
        className="w-full max-w-md text-center"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ 
            background: 'var(--color-paper-warm)',
            border: '1px solid var(--color-ink-faint)'
          }}
        >
          <AlertCircle 
            className="w-8 h-8"
            style={{ color: 'var(--color-relationship)' }}
          />
        </motion.div>

        <h1 
          className="text-2xl mb-3"
          style={{ 
            fontFamily: 'var(--font-display)', 
            fontWeight: 500,
            color: 'var(--color-ink)'
          }}
        >
          Something went wrong
        </h1>
        
        <p 
          className="mb-8"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          We couldn&apos;t verify your magic link. It may have expired or already been used.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all"
          style={{ 
            background: 'var(--color-ink)',
            color: 'var(--color-paper)',
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Try again</span>
        </Link>

        <p 
          className="mt-8 text-sm"
          style={{ 
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            color: 'var(--color-ink-faint)'
          }}
        >
          Magic links expire after 1 hour for security
        </p>
      </motion.div>
    </div>
  )
}
