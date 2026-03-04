import { motion } from 'framer-motion'

interface Props {
  streak: number
  activeToday: boolean
}

export default function StreakCounter({ streak, activeToday }: Props) {
  if (streak === 0) return null

  return (
    <motion.div
      className="streak-counter"
      animate={
        activeToday
          ? { scale: [1, 1.12, 1], transition: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' } }
          : {}
      }
    >
      <span className="streak-fire">🔥</span>
      <span className="streak-count">{streak}</span>
      <span className="streak-label">-day streak</span>
    </motion.div>
  )
}
