import { useEffect } from 'react'
import { motion } from 'framer-motion'

interface Props {
  amount: number  // in dollars
  onDismiss: () => void
}

const MILESTONE_MESSAGES: Record<number, string> = {
  50:   '🥇 $50 — You\'re off to the races!',
  100:  '🏅 $100 saved. The momentum is real.',
  250:  '🏆 $250! This is becoming a habit.',
  500:  '💎 $500 reached! The Freedom Fund is REAL.',
  1000: '🚀 $1,000!! You\'re unstoppable.',
  2000: '🌟 $2,000! Freedom is getting closer.',
  5000: '👑 $5,000!! You are the master of skips.',
}

export default function MilestoneToast({ amount, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  const message = MILESTONE_MESSAGES[amount] ?? `🏆 $${amount} milestone reached!`

  return (
    <motion.div
      className="milestone-toast"
      initial={{ opacity: 0, y: -60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -60, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 380, damping: 25 }}
      onClick={onDismiss}
    >
      {message}
    </motion.div>
  )
}
