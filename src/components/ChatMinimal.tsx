'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { messageBubble, fadeInUp } from '@/lib/animations'

export function ChatMinimal() {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { messages, isSending, sendMessage } = useStore()
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isSending) return
    
    const message = input
    setInput('')
    await sendMessage(message)
  }
  
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div 
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              className="h-full flex flex-col items-center justify-center text-stone-400"
            >
              <p className="font-serif text-xl text-stone-500 mb-2">
                Tell me a memory
              </p>
              <p className="text-sm">
                Where you lived, schools you attended, people you loved...
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4 max-w-2xl mx-auto">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  variants={messageBubble}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  layout
                  className={cn(
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] px-5 py-3 rounded-2xl',
                      message.role === 'user'
                        ? 'bg-stone-800 text-white rounded-br-sm'
                        : 'bg-stone-100 text-stone-700 rounded-bl-sm'
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
                  variants={messageBubble}
                  initial="initial"
                  animate="animate"
                  className="flex justify-start"
                >
                  <div className="bg-stone-100 rounded-2xl rounded-bl-sm px-5 py-4">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-2 h-2 bg-stone-400 rounded-full"
                          animate={{ 
                            y: [0, -6, 0],
                            opacity: [0.4, 1, 0.4]
                          }}
                          transition={{
                            duration: 0.8,
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
      <div className="border-t border-stone-100 px-6 py-4 bg-stone-50">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Share a memory, a place, a moment..."
              className="w-full px-5 py-4 pr-14 bg-white rounded-2xl border border-stone-200 
                         focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100
                         placeholder:text-stone-400 text-stone-700 transition-all"
              disabled={isSending}
            />
            <motion.button
              type="submit"
              disabled={!input.trim() || isSending}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="absolute right-2 w-10 h-10 flex items-center justify-center
                         bg-stone-800 text-white rounded-xl
                         disabled:opacity-30 disabled:cursor-not-allowed
                         hover:bg-stone-700 transition-colors"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  )
}
