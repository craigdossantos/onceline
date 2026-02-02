'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Sparkles, ArrowRight, Check } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function LoginForm() {
  const { signInWithMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    const { error: signInError } = await signInWithMagicLink(email)

    if (signInError) {
      setError(signInError.message)
      setIsSubmitting(false)
    } else {
      setIsSuccess(true)
      setIsSubmitting(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--color-paper)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--color-gold) 0%, var(--color-gold-deep) 100%)' }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </motion.div>
          
          <h1 
            className="text-4xl mb-3"
            style={{ 
              fontFamily: 'var(--font-display)', 
              fontWeight: 400,
              color: 'var(--color-ink)'
            }}
          >
            Onceline
          </h1>
          
          <p 
            className="text-lg"
            style={{ 
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              color: 'var(--color-ink-muted)'
            }}
          >
            Your life, beautifully told
          </p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="card p-8"
          style={{ 
            background: 'var(--color-paper-cream)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-medium)'
          }}
        >
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.form
                key="form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div>
                  <label 
                    htmlFor="email"
                    className="block mb-2 text-sm font-medium"
                    style={{ color: 'var(--color-ink-soft)' }}
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Mail 
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                      style={{ color: 'var(--color-ink-faint)' }}
                    />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      disabled={isSubmitting}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl focus-ring transition-all"
                      style={{ 
                        background: 'var(--color-paper)',
                        border: '1px solid var(--color-ink-faint)',
                        color: 'var(--color-ink)',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm px-1"
                    style={{ color: 'var(--color-relationship)' }}
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium transition-all"
                  style={{ 
                    background: isSubmitting 
                      ? 'var(--color-ink-muted)' 
                      : 'linear-gradient(135deg, var(--color-gold) 0%, var(--color-gold-deep) 100%)',
                    color: 'white',
                    boxShadow: isSubmitting ? 'none' : 'var(--shadow-gold)',
                    opacity: !email ? 0.6 : 1,
                    cursor: isSubmitting || !email ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white"
                      />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send magic link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                  className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
                  style={{ 
                    background: 'linear-gradient(135deg, var(--color-gold) 0%, var(--color-gold-deep) 100%)',
                    boxShadow: 'var(--shadow-gold)'
                  }}
                >
                  <Check className="w-8 h-8 text-white" />
                </motion.div>
                
                <h2 
                  className="text-xl mb-2"
                  style={{ 
                    fontFamily: 'var(--font-display)',
                    fontWeight: 500,
                    color: 'var(--color-ink)'
                  }}
                >
                  Check your email
                </h2>
                
                <p 
                  className="mb-1"
                  style={{ color: 'var(--color-ink-muted)' }}
                >
                  We&apos;ve sent a magic link to
                </p>
                
                <p 
                  className="font-medium mb-6"
                  style={{ color: 'var(--color-ink-soft)' }}
                >
                  {email}
                </p>
                
                <p 
                  className="text-sm"
                  style={{ 
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    color: 'var(--color-ink-faint)'
                  }}
                >
                  Click the link to sign in — no password needed
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer text */}
        <p 
          className="text-center mt-8 text-sm"
          style={{ color: 'var(--color-ink-faint)' }}
        >
          By continuing, you agree to our terms of service
        </p>
      </motion.div>
    </div>
  )
}
