'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'

interface OnboardingData {
  birthplace: string
  birthdate: string
  name: string
}

const steps = [
  {
    id: 'welcome',
    headline: 'Every life is a story worth telling.',
    subheadline: 'Let\'s create yours.',
  },
  {
    id: 'name',
    headline: 'What should we call you?',
    subheadline: 'Your name will anchor your story.',
    field: 'name',
    placeholder: 'Your name',
  },
  {
    id: 'birthplace',
    headline: 'Where does your story begin?',
    subheadline: 'The place where it all started.',
    field: 'birthplace',
    placeholder: 'City, Country',
  },
  {
    id: 'birthdate',
    headline: 'When did your journey start?',
    subheadline: 'This will anchor your timeline.',
    field: 'birthdate',
    type: 'date',
    placeholder: 'Your birthdate',
  },
  {
    id: 'ready',
    headline: 'Your timeline awaits.',
    subheadline: 'Let\'s fill it with memories.',
  },
]

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({
    birthplace: '',
    birthdate: '',
    name: '',
  })
  const [isVisible, setIsVisible] = useState(false)
  const { addEvent, timeline } = useStore()

  useEffect(() => {
    // Fade in after mount
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const step = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1
  const hasField = 'field' in step

  const canProceed = isFirstStep || isLastStep || (hasField && data[step.field as keyof OnboardingData])

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Create birth event
      if (timeline && data.birthdate && data.birthplace) {
        await addEvent({
          timeline_id: timeline.id,
          title: `Born in ${data.birthplace}`,
          description: data.name ? `${data.name}'s story begins` : 'The beginning',
          start_date: data.birthdate,
          date_precision: 'day',
          category: 'birth',
          tags: ['origin', 'beginning'],
          source: 'manual',
          sort_order: 0,
          is_private: false,
        })
      }
      onComplete()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canProceed) {
      handleNext()
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="onboarding"
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)] paper-texture"
      >
        <div className="w-full max-w-xl px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="text-center"
            >
              {/* Headline */}
              <motion.h1
                className="text-headline text-4xl md:text-5xl text-[var(--color-text)] mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                {step.headline}
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                className="text-story text-xl text-[var(--color-text-muted)] mb-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {step.subheadline}
              </motion.p>

              {/* Input field (if applicable) */}
              {hasField && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="mb-12"
                >
                  <input
                    type={step.type || 'text'}
                    value={data[step.field as keyof OnboardingData]}
                    onChange={(e) =>
                      setData({ ...data, [step.field as keyof OnboardingData]: e.target.value })
                    }
                    onKeyDown={handleKeyDown}
                    placeholder={step.placeholder}
                    autoFocus
                    className="input-minimal text-center text-2xl font-serif max-w-md mx-auto"
                  />
                </motion.div>
              )}

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="flex justify-center gap-4"
              >
                {!isFirstStep && (
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="btn-ghost"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={!canProceed}
                  className={`btn-accent ${!canProceed ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLastStep ? 'Begin My Story' : 'Continue'}
                </button>
              </motion.div>

              {/* Progress indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="flex justify-center gap-2 mt-12"
              >
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentStep
                        ? 'w-8 bg-[var(--color-accent)]'
                        : index < currentStep
                        ? 'w-2 bg-[var(--color-accent-muted)]'
                        : 'w-2 bg-[var(--color-border)]'
                    }`}
                  />
                ))}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-8 left-8 text-[var(--color-text-light)] text-sm">
          onceline
        </div>
        <div className="absolute bottom-8 right-8 text-[var(--color-text-light)] text-sm">
          {currentStep + 1} / {steps.length}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
