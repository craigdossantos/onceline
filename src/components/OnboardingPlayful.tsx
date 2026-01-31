'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, MapPin, Calendar, User, ArrowRight, PartyPopper } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface OnboardingProps {
  onComplete: () => void
}

const STEPS = [
  {
    id: 'welcome',
    icon: Sparkles,
    title: "Let's map your adventure! ✨",
    subtitle: "We'll create a beautiful timeline of your life story",
    input: false,
    color: 'from-violet-500 to-purple-600'
  },
  {
    id: 'birthplace',
    icon: MapPin,
    title: 'Where did your journey begin?',
    subtitle: 'The place you were born',
    input: true,
    placeholder: 'e.g., Tokyo, Japan 🗼',
    color: 'from-emerald-400 to-teal-500'
  },
  {
    id: 'birthdate',
    icon: Calendar,
    title: 'When did it all start?',
    subtitle: 'Your birthday anchors your timeline',
    input: true,
    inputType: 'date',
    color: 'from-amber-400 to-orange-500'
  },
  {
    id: 'name',
    icon: User,
    title: "What's your name?",
    subtitle: "I'd love to know what to call you!",
    input: true,
    placeholder: 'Your name or nickname',
    color: 'from-pink-400 to-rose-500'
  },
  {
    id: 'complete',
    icon: PartyPopper,
    title: 'You did it! 🎉',
    subtitle: 'Your timeline is ready to grow',
    input: false,
    color: 'from-blue-500 to-indigo-600'
  }
]

export function OnboardingPlayful({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showConfetti, setShowConfetti] = useState(false)
  const { addEvent, timeline } = useStore()

  const currentStep = STEPS[step]
  const Icon = currentStep.icon
  const progress = (step / (STEPS.length - 1)) * 100

  const handleNext = async () => {
    if (currentStep.input && inputValue) {
      setAnswers(prev => ({ ...prev, [currentStep.id]: inputValue }))
    }
    
    if (step === STEPS.length - 2) {
      // Create birth event
      const birthdate = answers.birthdate || inputValue
      const birthplace = answers.birthplace
      
      if (birthdate && birthplace && timeline) {
        await addEvent({
          timeline_id: timeline.id,
          title: `Born in ${birthplace}`,
          description: `The start of ${answers.name || 'your'} adventure! 🌟`,
          start_date: birthdate,
          date_precision: 'day',
          category: 'birth',
          tags: ['origin', 'beginning'],
          source: 'chat',
          sort_order: 0,
          is_private: false
        })
      }
      setShowConfetti(true)
    }
    
    if (step === STEPS.length - 1) {
      onComplete()
    } else {
      setStep(s => s + 1)
      setInputValue('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (inputValue || !currentStep.input)) {
      handleNext()
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/10 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{ 
              y: [null, -100],
              opacity: [0.3, 0]
            }}
            transition={{ 
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              repeatDelay: Math.random() * 2
            }}
          />
        ))}
      </div>

      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ 
                x: '50%', 
                y: '50%',
                scale: 0
              }}
              animate={{ 
                x: `${Math.random() * 100}%`,
                y: `${Math.random() * 100}%`,
                scale: [0, 1, 1],
                rotate: Math.random() * 360
              }}
              transition={{ 
                duration: 1,
                ease: 'easeOut'
              }}
            >
              <span className="text-2xl">
                {['🎉', '⭐', '✨', '🌟', '💫', '🎊'][Math.floor(Math.random() * 6)]}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
        <motion.div 
          className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Main content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="max-w-md w-full text-center relative z-10"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className={cn(
              'w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-xl',
              currentStep.color
            )}
          >
            <Icon className="w-10 h-10 text-white" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white mb-3"
          >
            {currentStep.title}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-white/70 mb-8"
          >
            {currentStep.subtitle}
          </motion.p>

          {/* Input */}
          {currentStep.input && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-8"
            >
              <input
                type={currentStep.inputType || 'text'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={currentStep.placeholder}
                autoFocus
                className="w-full px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 
                           rounded-2xl text-white text-center text-lg placeholder:text-white/40
                           focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent
                           transition-all"
              />
            </motion.div>
          )}

          {/* Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNext}
            disabled={currentStep.input && !inputValue}
            className={cn(
              'px-8 py-4 rounded-2xl font-semibold text-white flex items-center gap-2 mx-auto',
              'bg-gradient-to-r shadow-lg',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'hover:shadow-xl transition-shadow',
              currentStep.color
            )}
          >
            {step === STEPS.length - 1 ? 'Start exploring!' : 'Continue'}
            <ArrowRight className="w-5 h-5" />
          </motion.button>

          {/* Step counter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 flex justify-center gap-2"
          >
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-300',
                  i <= step ? 'bg-white' : 'bg-white/30',
                  i === step && 'w-6'
                )}
              />
            ))}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Skip button */}
      {step > 0 && step < STEPS.length - 1 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-8 text-white/50 hover:text-white text-sm transition-colors"
          onClick={onComplete}
        >
          Skip for now
        </motion.button>
      )}
    </div>
  )
}
