'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, FileText, FileJson } from 'lucide-react'
import { useStore } from '@/lib/store'
import { exportAndDownloadJSON, exportAndDownloadCSV } from '@/lib/export'

export function ExportButton() {
  const [isOpen, setIsOpen] = useState(false)
  const { timeline, events } = useStore()

  const handleExportJSON = () => {
    if (timeline && events.length > 0) {
      exportAndDownloadJSON(timeline, events)
    }
    setIsOpen(false)
  }

  const handleExportCSV = () => {
    if (timeline && events.length > 0) {
      exportAndDownloadCSV(timeline, events)
    }
    setIsOpen(false)
  }

  if (events.length === 0) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full flex items-center justify-center border transition-all"
        style={{
          borderColor: 'var(--color-ink-faint)',
          color: 'var(--color-ink-muted)',
        }}
        aria-label="Export timeline data"
      >
        <Download className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute bottom-12 right-0 w-48 bg-[var(--color-paper-cream)] rounded-lg shadow-lg border"
            style={{ borderColor: 'rgba(26, 25, 24, 0.08)' }}
          >
            <div className="p-2">
              <p className="text-xs font-medium px-2 py-1" style={{ color: 'var(--color-ink-muted)' }}>
                Export as
              </p>
              <button
                onClick={handleExportJSON}
                className="w-full text-left flex items-center gap-3 px-2 py-1.5 rounded-md text-sm hover:bg-[var(--color-paper-warm)]"
                style={{ color: 'var(--color-ink)' }}
              >
                <FileJson className="w-4 h-4" />
                <span>JSON</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="w-full text-left flex items-center gap-3 px-2 py-1.5 rounded-md text-sm hover:bg-[var(--color-paper-warm)]"
                style={{ color: 'var(--color-ink)' }}
              >
                <FileText className="w-4 h-4" />
                <span>CSV</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
