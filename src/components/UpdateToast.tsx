import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  needRefresh: boolean
  onUpdate: () => void
  onDismiss: () => void
}

export default function UpdateToast({ needRefresh, onUpdate, onDismiss }: Props) {
  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          className="update-toast"
          initial={{ opacity: 0, y: -24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        >
          <span className="update-toast-text">New update available</span>
          <div className="update-toast-actions">
            <button className="update-toast-btn update-toast-btn--dismiss" onClick={onDismiss}>
              Not now
            </button>
            <button className="update-toast-btn update-toast-btn--update" onClick={onUpdate}>
              Update &amp; reload
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
