'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { fadeIn, fadeInUp, popIn } from '@/lib/animations'

interface OnboardingProps {
  onComplete: () => void
}

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Every life is a story worth telling',
    subtitle: null,
    input: false
  },
  {
    id: 'birthplace',
    title: 'Where does your story begin?',
    subtitle: 'The city or town where you were born',
    input: true,
    placeholder: 'San Francisco, CA',
    category: 'birth'
  },
  {
    id: 'birthdate',
    title: 'When did your journey start?',
    subtitle: 'Your birthday — this anchors your timeline',
    input: true,
    inputType: 'date',
    category: 'birth'
  },
  {
    id: 'name',
    title: "What should I call you?",
    subtitle: 'Your name or nickname',
    input: true,
    placeholder: 'Alex'
  }
]

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isTransitioning, setIsTransitioning] = useState(false)
  const { addEvent, timeline } = useStore()

  const currentStep = ONBOARDING_STEPS[step]
  const isLastStep = step === ONBOARDING_STEPS.length - 1

  const handleNext = async () => {
    if (isTransitioning) return
    
    // Save answer if there was input
    if (currentStep.input && inputValue) {
      setAnswers(prev => ({ ...prev, [currentStep.id]: inputValue }))
      
      // Create event for birth location
      if (currentStep.id === 'birthplace') {
        // We'll combine this with birthdate later
      }
    }
    
    setIsTransitioning(true)
    
    // Small delay for smooth transition
    await new Promise(r => setTimeout(r, 300))
    
    if (isLastStep) {
      // Create the birth event with combined data
      const birthdate = answers.birthdate || inputValue
      const birthplace = answers.birthplace
      
      if (birthdate && birthplace) {
        await addEvent({
          timeline_id: timeline?.id || '',
          title: `Born in ${birthplace}`,
          description: `The beginning of ${answers.name || 'your'} story`,
          start_date: birthdate,
          date_precision: 'day',
          category: 'birth',
          tags: ['origin'],
          source: 'chat',
          sort_order: 0,
          is_private: false
        })
      }
      
      onComplete()
    } else {
      setStep(s => s + 1)
      setInputValue('')
    }
    
    setIsTransitioning(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (inputValue || !currentStep.input)) {
      handleNext()
    }
  }

  // Auto-advance welcome screen
  useEffect(() => {
    if (step === 0) {
      const timer = setTimeout(() => handleNext(), 2500)
      return () => clearTimeout(timer)
    }
  }, [step])

  return (
    <div className="fixed inset-0 bg-stone-50 flex items-center justify-center p-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={fadeIn}
          className="max-w-xl w-full text-center"
        >
          {/* Step indicator */}
          {step > 0 && (
            <motion.div 
              variants={fadeInUp}
              className="flex justify-center gap-2 mb-12"
            >
              {ONBOARDING_STEPS.slice(1).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    i < step ? 'bg-amber-500' : i === step - 1 ? 'bg-amber-400' : 'bg-stone-200'
                  }`}
                />
              ))}
            </motion.div>
          )}

          {/* Title */}
          <motion.h1
            variants={fadeInUp}
            className={`font-serif ${
              step === 0 ? 'text-4xl md:text-5xl' : 'text-2xl md:text-3xl'
            } text-stone-800 mb-4`}
          >
            {currentStep.title}
          </motion.h1>

          {/* Subtitle */}
          {currentStep.subtitle && (
            <motion.p
              variants={fadeInUp}
              className="text-stone-500 mb-8"
            >
              {currentStep.subtitle}
            </motion.p>
          )}

          {/* Input */}
          {currentStep.input && (
            <motion.div variants={popIn} className="mt-8">
              <input
                type={currentStep.inputType || 'text'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={currentStep.placeholder}
                autoFocus
                className="w-full max-w-sm mx-auto bg-transparent border-b-2 border-stone-200 
                           focus:border-amber-400 text-center text-xl py-3 outline-none
                           placeholder:text-stone-300 text-stone-700 transition-colors"
              />
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                disabled={!inputValue}
                className="mt-8 px-8 py-3 bg-stone-800 text-white rounded-full
                           disabled:opacity-30 disabled:cursor-not-allowed
                           hover:bg-stone-700 transition-colors"
              >
                {isLastStep ? 'Begin your timeline' : 'Continue'}
              </motion.button>
            </motion.div>
          )}

          {/* Decorative element for welcome */}
          {step === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
              className="mt-12"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Skip button */}
      {step > 0 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-8 right-8 text-stone-400 hover:text-stone-600 text-sm"
          onClick={onComplete}
        >
          Skip for now
        </motion.button>
      )}
    </div>
  )
}
