import { motion } from 'framer-motion'

interface Props {
  current: number  // cents
  target: number   // cents
}

export default function ProgressBar({ current, target }: Props) {
  const pct = target > 0 ? Math.min(current / target, 1) : 0
  const displayPct = Math.round(pct * 100)

  return (
    <div className="progress-bar-wrapper">
      <div className="progress-labels">
        <span className="progress-label-left">Weekly goal</span>
        <span className="progress-label-right">{displayPct}%</span>
      </div>
      <div className="progress-track">
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        <div className="progress-shimmer" />
      </div>
    </div>
  )
}
