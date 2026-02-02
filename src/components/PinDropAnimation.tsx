'use client'

import { motion, useAnimation } from 'framer-motion'
import { useEffect, forwardRef } from 'react'

interface PinDropAnimationProps {
  color: string
  isSelected?: boolean
  onAnimationComplete?: () => void
  isNew?: boolean
  onClick?: () => void
}

export const PinDropAnimation = forwardRef<HTMLDivElement, PinDropAnimationProps>(
  function PinDropAnimation({ color, isSelected, onAnimationComplete, isNew = false, onClick }, ref) {
    const pinControls = useAnimation()
    const shadowControls = useAnimation()

    useEffect(() => {
      if (isNew) {
        // Start the drop animation sequence
        const animate = async () => {
          // Pin drops from above with bounce
          await pinControls.start({
            y: ['-120px', '0px', '-18px', '0px', '-6px', '0px'],
            scale: [0.8, 1, 1.1, 1, 1.05, 1],
            transition: {
              duration: 0.8,
              times: [0, 0.4, 0.55, 0.7, 0.85, 1],
              ease: [0.22, 1, 0.36, 1], // Custom ease for satisfying bounce
            },
          })
          onAnimationComplete?.()
        }

        // Shadow grows as pin "lands"
        shadowControls.start({
          scale: [0.3, 1.2, 1],
          opacity: [0, 0.3, 0.15],
          transition: {
            duration: 0.8,
            times: [0, 0.4, 1],
            ease: 'easeOut',
          },
        })

        animate()
      }
    }, [isNew, pinControls, shadowControls, onAnimationComplete])

    return (
      <div ref={ref} className="relative" onClick={onClick}>
        {/* Landing shadow - grows as pin approaches */}
        <motion.div
          initial={isNew ? { scale: 0.3, opacity: 0 } : { scale: 1, opacity: 0.15 }}
          animate={shadowControls}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-2 rounded-full blur-sm"
          style={{ backgroundColor: color }}
        />

        {/* The pin itself */}
        <motion.div
          initial={isNew ? { y: '-120px', scale: 0.8 } : { y: 0, scale: 1 }}
          animate={pinControls}
          whileHover={!isNew ? { scale: 1.4 } : undefined}
          whileTap={!isNew ? { scale: 0.95 } : undefined}
          className={`event-pin relative z-10 ${isSelected ? 'ring-2 ring-white shadow-lg scale-125' : ''}`}
          style={{ backgroundColor: color }}
        />

        {/* Ripple effect on landing */}
        {isNew && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0.6 }}
            animate={{
              scale: [0.5, 2.5],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 0.6,
              delay: 0.35, // Start when pin first hits
              ease: 'easeOut',
            }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
            style={{ backgroundColor: color }}
          />
        )}
      </div>
    )
  }
)
