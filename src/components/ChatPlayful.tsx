'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, MessageCircle } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const QUICK_PROMPTS = [
  { emoji: '🏫', text: 'Where did you go to school?' },
  { emoji: '🏠', text: 'Where have you lived?' },
  { emoji: '✈️', text: 'Favorite trip you took?' },
  { emoji: '👫', text: 'Tell me about a best friend' },
]

export function ChatPlayful() {
  const [input, setInput] = useState('')
  const [showPrompts, setShowPrompts] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { messages, isSending, sendMessage } = useStore()
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
    if (messages.length > 0) setShowPrompts(false)
  }, [messages])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isSending) return
    
    const message = input
    setInput('')
    setShowPrompts(false)
    await sendMessage(message)
  }

  const handleQuickPrompt = async (text: string) => {
    setShowPrompts(false)
    await sendMessage(text)
  }
  
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-violet-50 to-white">
      {/* Header */}
      <div className="px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-violet-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Timeline Guide</h2>
            <p className="text-xs text-violet-500">Ready to capture memories!</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-6xl mb-4"
              >
                ✨
              </motion.div>
              <p className="text-slate-600 font-medium mb-6">
                Let&apos;s build your story together!
              </p>
              
              {/* Quick prompts */}
              {showPrompts && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-2 gap-3 max-w-sm"
                >
                  {QUICK_PROMPTS.map((prompt, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleQuickPrompt(prompt.text)}
                      className="p-4 bg-white rounded-2xl shadow-sm border border-violet-100 
                                 hover:border-violet-300 hover:shadow-md transition-all text-left"
                    >
                      <span className="text-2xl mb-2 block">{prompt.emoji}</span>
                      <span className="text-sm text-slate-600">{prompt.text}</span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <div className="space-y-4 max-w-2xl mx-auto">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={cn(
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mr-2 flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] px-5 py-3 rounded-2xl shadow-sm',
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-br-sm'
                        : 'bg-white text-slate-700 rounded-bl-sm border border-violet-100'
                    )}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                </motion.div>
              ))}
              
              {isSending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mr-2">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-sm px-5 py-4 border border-violet-100">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-2 h-2 bg-violet-400 rounded-full"
                          animate={{ 
                            scale: [1, 1.3, 1],
                            opacity: [0.5, 1, 0.5]
                          }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-4 bg-white border-t border-violet-100">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="relative flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Share a memory, a moment, a story..."
                className="w-full px-5 py-4 pr-14 bg-violet-50 rounded-2xl border-2 border-transparent
                           focus:outline-none focus:border-violet-400 focus:bg-white
                           placeholder:text-slate-400 text-slate-700 transition-all"
                disabled={isSending}
              />
              <motion.button
                type="submit"
                disabled={!input.trim() || isSending}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center
                           bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-xl
                           disabled:opacity-30 disabled:cursor-not-allowed shadow-lg
                           hover:shadow-xl transition-all"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
