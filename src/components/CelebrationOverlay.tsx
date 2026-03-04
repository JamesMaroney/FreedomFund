import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateParticles } from '../utils/confetti'
import { formatCents } from '../utils/currency'

interface Props {
  amount: number
  label: string
  isMilestone: boolean
  onComplete: () => void
}

const PARTICLES = generateParticles(30)
const MILESTONE_PARTICLES = generateParticles(55)

export default function CelebrationOverlay({ amount, label, isMilestone, onComplete }: Props) {
  const particles = isMilestone ? MILESTONE_PARTICLES : PARTICLES
  // Pin onComplete in a ref so the timer never resets if parent re-renders
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    const timer = setTimeout(() => onCompleteRef.current(), 1600)
    return () => clearTimeout(timer)
  }, []) // empty deps — fire once on mount only

  return (
    <motion.div
      className="screen celebration-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, pointerEvents: 'none' }}
      transition={{ duration: 0.2 }}
    >
      {/* Screen flash for milestones */}
      {isMilestone && (
        <motion.div
          className="milestone-flash"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.35, 0] }}
          transition={{ duration: 0.5, times: [0, 0.3, 1] }}
        />
      )}

      {/* Confetti particles */}
      <div className="particles-container">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="particle"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: p.shape === 'circle' ? '50%' : '2px',
                position: 'absolute',
                left: '50%',
                top: '50%',
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
              animate={{
                x: p.x,
                y: p.y,
                opacity: 0,
                scale: 1,
                rotate: p.rotate,
              }}
              transition={{ duration: p.duration, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Center content */}
      <div className="celebration-content">
        <motion.div
          className="celebration-amount"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.05 }}
        >
          +{formatCents(amount)}
        </motion.div>

        <motion.div
          className="celebration-label"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {label}
        </motion.div>

        <motion.div
          className="celebration-emoji"
          animate={{ rotate: [-8, 8, -8], scale: [1, 1.2, 1] }}
          transition={{ repeat: 3, duration: 0.4 }}
        >
          🎉
        </motion.div>
      </div>
    </motion.div>
  )
}
