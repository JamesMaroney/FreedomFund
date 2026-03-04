import { useRef, useEffect, useCallback, useState } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import type { Deposit } from '../types'
import { formatCents } from '../utils/currency'

interface Props {
  deposits: Deposit[]
}

const COLLAPSED_COUNT = 3
const EXPANDED_VH = 0.75

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

function DepositItem({ deposit, index }: { deposit: Deposit; index: number }) {
  return (
    <motion.li
      className="history-item"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.18 }}
    >
      <span className="history-label">{deposit.label}</span>
      <div className="history-right">
        <span className="history-amount">{formatCents(deposit.amount)}</span>
        <span className="history-time">{formatRelativeTime(deposit.timestamp)}</span>
        {deposit.transferred && <span className="history-transferred" title="Transferred">✓</span>}
      </div>
    </motion.li>
  )
}

export default function DepositHistory({ deposits }: Props) {
  const expandedH  = () => window.innerHeight * EXPANDED_VH
  const collapsedH = () => 44 + Math.min(deposits.length, COLLAPSED_COUNT) * 57

  // Initialise directly to collapsed height — window is available in browser
  const height      = useMotionValue(typeof window !== 'undefined' ? collapsedH() : 0)
  const isOpen      = useRef(false)
  const [isOpenState, setIsOpenState] = useState(false)
  const pointerDown = useRef(false)
  const startY      = useRef(0)
  const startH      = useRef(0)
  const lastVY      = useRef(0)
  const lastT       = useRef(0)

  // Keep height in sync if deposit count changes while collapsed
  useEffect(() => {
    if (!isOpen.current) height.set(collapsedH())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deposits.length])

  const listWrapRef = useRef<HTMLDivElement>(null)

  const snapTo = useCallback((open: boolean) => {
    isOpen.current = open
    setIsOpenState(open)
    // Reset scroll when collapsing so top items are always visible
    if (!open && listWrapRef.current) {
      listWrapRef.current.scrollTop = 0
    }
    animate(height, open ? expandedH() : collapsedH(), {
      type: 'spring', stiffness: 340, damping: 36, mass: 0.9,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Derived transforms: map height → visual properties
  const eH = expandedH()
  const cH = collapsedH()
  const borderRadius    = useTransform(height, [cH, eH], [16, 20])
  const chevronOpacity  = useTransform(height, [cH, cH + (eH - cH) * 0.4], [0, 1])
  const fadeOpacity     = useTransform(height, [cH, cH + (eH - cH) * 0.3], [1, 0])

  const hasMore = deposits.length > COLLAPSED_COUNT

  // Manual pointer handlers — directly set the height motion value
  const onPointerDown = (e: React.PointerEvent) => {
    // Don't hijack scroll events inside an open list
    if (isOpen.current && (e.target as HTMLElement).closest('.history-list-wrap')) return
    pointerDown.current = true
    startY.current = e.clientY
    startH.current = height.get()
    lastVY.current = 0
    lastT.current  = e.timeStamp
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointerDown.current) return
    const dy = startY.current - e.clientY   // upward = positive
    const newH = Math.max(cH * 0.85, Math.min(eH * 1.04, startH.current + dy))
    // velocity
    const dt = e.timeStamp - lastT.current
    if (dt > 0) lastVY.current = (e.clientY - (startY.current + (startH.current - height.get()))) / dt * -1
    height.set(newH)
    lastT.current = e.timeStamp
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (!pointerDown.current) return
    pointerDown.current = false
    const dy = startY.current - e.clientY
    const vy = lastVY.current   // px/ms, positive = upward

    if (dy > 40  || vy >  0.4) { snapTo(true);         return }
    if (dy < -40 || vy < -0.4) { snapTo(false);        return }
    snapTo(isOpen.current)  // snap back to current state
  }

  return (
    <motion.div
      className="deposit-history"
      style={{
        height,
        borderRadius,
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-elevated)',
        overflow: 'hidden',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Header — tap to toggle */}
      <button
        className="history-header"
        onClick={() => snapTo(!isOpen.current)}
        aria-label="Toggle history"
      >
        <h3 className="history-heading">Recent Funds</h3>
        <motion.span className="history-chevron" style={{ opacity: chevronOpacity }}>
          ⌄
        </motion.span>
      </button>

      {/* Scrollable list — pointer events pass through when open */}
      <div
        className="history-list-wrap"
        ref={listWrapRef}
        style={{ touchAction: isOpenState ? 'pan-y' : 'none' }}
      >
        <ul className="history-list">
          {deposits.map((deposit, i) => (
            <DepositItem key={deposit.id} deposit={deposit} index={i} />
          ))}
        </ul>

        {hasMore && (
          <motion.div
            className="history-fade"
            style={{ opacity: fadeOpacity }}
            aria-hidden="true"
          />
        )}
      </div>
    </motion.div>
  )
}
