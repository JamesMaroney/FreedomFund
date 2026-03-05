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
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        >
          <span className="update-toast-text">Update available</span>
          <button className="update-toast-btn update-toast-btn--dismiss" onClick={onDismiss}>
            Not now
          </button>
          <button className="update-toast-btn update-toast-btn--update" onClick={onUpdate}>
            Update
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
