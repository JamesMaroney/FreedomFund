interface Props {
  streak: number
  activeToday: boolean
}

export default function StreakCounter({ streak, activeToday }: Props) {
  if (streak === 0) return null

  return (
    <div className={`streak-counter${activeToday ? ' streak-counter--pulse' : ''}`}>
      <span className="streak-fire">🔥</span>
      <span className="streak-count">{streak}</span>
      <span className="streak-label">-day streak</span>
    </div>
  )
}
