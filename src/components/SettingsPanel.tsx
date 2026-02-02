'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { exportAndDownloadJSON, exportAndDownloadCSV } from '@/lib/export'
import { 
  X, 
  Settings, 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  Trash2, 
  RefreshCw,
  Edit3,
  Check
} from 'lucide-react'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { timeline, events, updateTimelineName, clearMessages } = useStore()
  const [isEditingName, setIsEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleExportJSON = async () => {
    if (!timeline) return
    setIsExporting(true)
    try {
      exportAndDownloadJSON(timeline, events)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCSV = async () => {
    if (!timeline) return
    setIsExporting(true)
    try {
      exportAndDownloadCSV(timeline, events)
    } finally {
      setIsExporting(false)
    }
  }

  const handleStartEditName = () => {
    setNewName(timeline?.name || '')
    setIsEditingName(true)
  }

  const handleSaveName = async () => {
    if (newName.trim() && newName !== timeline?.name) {
      await updateTimelineName(newName.trim())
    }
    setIsEditingName(false)
  }

  const handleResetConversation = async () => {
    await clearMessages()
    setShowResetConfirm(false)
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

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-light)]">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-[var(--color-accent)]" />
                <h2 className="text-lg font-semibold text-[var(--color-text)]">Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-[var(--color-bg-warm)] flex items-center justify-center"
              >
                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Timeline Name */}
              <section>
                <h3 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                  Timeline
                </h3>
                <div className="bg-[var(--color-bg-warm)] rounded-xl p-4">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        autoFocus
                        className="flex-1 px-3 py-2 rounded-lg bg-white border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-light)]"
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                      />
                      <button
                        onClick={handleSaveName}
                        className="w-10 h-10 rounded-lg bg-[var(--color-accent)] text-white flex items-center justify-center hover:bg-[var(--color-accent-hover)]"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[var(--color-text)]">{timeline?.name}</p>
                        <p className="text-sm text-[var(--color-text-muted)]">
                          {events.length} {events.length === 1 ? 'event' : 'events'}
                        </p>
                      </div>
                      <button
                        onClick={handleStartEditName}
                        className="w-8 h-8 rounded-full hover:bg-white flex items-center justify-center"
                      >
                        <Edit3 className="w-4 h-4 text-[var(--color-text-muted)]" />
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* Export */}
              <section>
                <h3 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                  Export
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={handleExportJSON}
                    disabled={isExporting || events.length === 0}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--color-bg-warm)] rounded-xl hover:bg-[var(--color-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileJson className="w-5 h-5 text-[var(--color-accent)]" />
                    <div className="text-left">
                      <p className="font-medium text-[var(--color-text)]">Export as JSON</p>
                      <p className="text-sm text-[var(--color-text-muted)]">Full data with metadata</p>
                    </div>
                    <Download className="w-4 h-4 text-[var(--color-text-muted)] ml-auto" />
                  </button>

                  <button
                    onClick={handleExportCSV}
                    disabled={isExporting || events.length === 0}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--color-bg-warm)] rounded-xl hover:bg-[var(--color-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    <div className="text-left">
                      <p className="font-medium text-[var(--color-text)]">Export as CSV</p>
                      <p className="text-sm text-[var(--color-text-muted)]">Spreadsheet compatible</p>
                    </div>
                    <Download className="w-4 h-4 text-[var(--color-text-muted)] ml-auto" />
                  </button>
                </div>
              </section>

              {/* Conversation */}
              <section>
                <h3 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                  Conversation
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--color-bg-warm)] rounded-xl hover:bg-red-50 transition-colors group"
                  >
                    <RefreshCw className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-red-500" />
                    <div className="text-left">
                      <p className="font-medium text-[var(--color-text)] group-hover:text-red-600">
                        Reset Conversation
                      </p>
                      <p className="text-sm text-[var(--color-text-muted)]">
                        Clear chat history (keeps events)
                      </p>
                    </div>
                  </button>
                </div>
              </section>

              {/* About */}
              <section>
                <h3 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                  About
                </h3>
                <div className="bg-[var(--color-bg-warm)] rounded-xl p-4">
                  <p className="text-sm text-[var(--color-text-muted)]">
                    <strong className="text-[var(--color-text)]">Onceline</strong> — Every life is a story worth telling.
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)] mt-2">
                    Built with ❤️ in the Bay Area
                  </p>
                </div>
              </section>
            </div>

            {/* Reset Confirmation */}
            <AnimatePresence>
              {showResetConfirm && (
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
                      Reset Conversation?
                    </h3>
                    <p className="text-sm text-[var(--color-text-muted)] mb-6">
                      This will clear your chat history. Your timeline events will be kept.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="btn-ghost"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleResetConversation}
                        className="px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
