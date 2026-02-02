'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { useAuth } from '@/contexts/AuthContext'
import { Send, Sparkles, ChevronDown, ChevronUp, LogOut, User } from 'lucide-react'

const CONVERSATION_STARTERS = [
  "Tell me about a favorite childhood memory",
  "What was a turning point in your life?",
  "Describe a place that shaped who you are",
  "What's a moment you wish you could relive?",
  "Tell me about someone who changed your life",
  "What's a small moment that meant everything?",
]

export function ChatBar() {
  const [input, setInput] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [showStarters, setShowStarters] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { messages, isSending, sendMessage, events } = useStore()
  const { user, signOut } = useAuth()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Hide starters once there are messages or events
  useEffect(() => {
    if (messages.length > 0 || events.length > 0) {
      setShowStarters(false)
    }
  }, [messages.length, events.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isSending) return

    const message = input
    setInput('')
    setIsExpanded(true)
    await sendMessage(message)
  }

  const handleStarterClick = (starter: string) => {
    setInput(starter)
    inputRef.current?.focus()
  }

  const hasMessages = messages.length > 0

  return (
    <div 
      className="border-b"
      style={{ 
        background: 'var(--color-paper-cream)',
        borderColor: 'rgba(26, 25, 24, 0.08)'
      }}
    >
      {/* Header */}
      <div className="px-6 lg:px-10 py-4">
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--color-ink)' }}
          >
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              className="w-5 h-5"
              stroke="var(--color-paper)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className="flex-1">
            <h1 
              className="text-xl font-medium"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
            >
              Your Story
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>
              Share your memories and watch your timeline unfold
            </p>
          </div>
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'var(--color-gold-light)' }}
          >
            <Sparkles className="w-4 h-4" style={{ color: 'var(--color-gold)' }} />
            <span 
              className="text-sm font-medium"
              style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-display)' }}
            >
              {events.length} {events.length === 1 ? 'moment' : 'moments'}
            </span>
          </div>

          {/* User Menu - only show when authenticated */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
                style={{ 
                  background: 'var(--color-paper)',
                  border: '1px solid rgba(26, 25, 24, 0.12)'
                }}
                title={user?.email}
              >
                <User className="w-5 h-5" style={{ color: 'var(--color-ink-muted)' }} />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <>
                    {/* Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    
                    {/* Menu */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 z-50 w-56 rounded-xl shadow-lg overflow-hidden"
                      style={{ 
                        background: 'var(--color-paper-cream)',
                        border: '1px solid rgba(26, 25, 24, 0.1)'
                      }}
                    >
                      <div 
                        className="px-4 py-3 border-b"
                        style={{ borderColor: 'rgba(26, 25, 24, 0.08)' }}
                      >
                        <p 
                          className="text-sm font-medium truncate"
                          style={{ color: 'var(--color-ink)' }}
                        >
                          {user?.email}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          setShowUserMenu(false)
                          await signOut()
                        }}
                        className="w-full px-4 py-3 flex items-center gap-3 text-left transition-colors hover:bg-[var(--color-paper)]"
                        style={{ color: 'var(--color-ink-muted)' }}
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Sign out</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : null}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSubmit} className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me about a moment in your life..."
            className="w-full pl-5 pr-14 py-4 rounded-2xl border-2 transition-all text-base"
            style={{ 
              background: 'var(--color-paper)',
              borderColor: input ? 'var(--color-gold)' : 'rgba(26, 25, 24, 0.1)',
              color: 'var(--color-ink)',
              fontFamily: 'var(--font-body)',
            }}
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
            style={{ 
              background: input.trim() ? 'var(--color-gold)' : 'transparent',
              color: input.trim() ? 'white' : 'var(--color-ink-muted)'
            }}
          >
            {isSending ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 rounded-full"
                style={{ borderColor: 'var(--color-gold)', borderTopColor: 'transparent' }}
              />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>

        {/* Conversation Starters */}
        <AnimatePresence>
          {showStarters && !input && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <p 
                className="text-sm mb-3"
                style={{ color: 'var(--color-ink-faint)', fontStyle: 'italic' }}
              >
                Not sure where to start? Try one of these:
              </p>
              <div className="flex flex-wrap gap-2">
                {CONVERSATION_STARTERS.slice(0, 3).map((starter) => (
                  <button
                    key={starter}
                    onClick={() => handleStarterClick(starter)}
                    className="px-4 py-2 rounded-full text-sm transition-all hover:scale-[1.02]"
                    style={{ 
                      background: 'var(--color-paper)',
                      border: '1px solid rgba(26, 25, 24, 0.12)',
                      color: 'var(--color-ink-muted)',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Expandable Messages Panel */}
      {hasMessages && (
        <div style={{ borderTop: '1px solid rgba(26, 25, 24, 0.06)' }}>
          {/* Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-6 lg:px-10 py-2 flex items-center justify-between hover:bg-[var(--color-paper-warm)] transition-colors"
          >
            <span className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" style={{ color: 'var(--color-ink-muted)' }} />
            ) : (
              <ChevronDown className="w-4 h-4" style={{ color: 'var(--color-ink-muted)' }} />
            )}
          </button>

          {/* Messages */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div 
                  className="px-6 lg:px-10 pb-4 space-y-3 max-h-64 overflow-y-auto"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'rounded-br-md'
                            : 'rounded-bl-md'
                        }`}
                        style={{
                          background: message.role === 'user' 
                            ? 'var(--color-ink)' 
                            : 'var(--color-paper)',
                          color: message.role === 'user' 
                            ? 'var(--color-paper)' 
                            : 'var(--color-ink)',
                        }}
                      >
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                      </div>
                    </motion.div>
                  ))}

                  {isSending && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div 
                        className="rounded-2xl rounded-bl-md px-4 py-3"
                        style={{ background: 'var(--color-paper)' }}
                      >
                        <div className="flex space-x-1.5">
                          {[0, 0.15, 0.3].map((delay, i) => (
                            <motion.div
                              key={i}
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 0.6, delay }}
                              className="w-2 h-2 rounded-full"
                              style={{ background: 'var(--color-ink-faint)' }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
