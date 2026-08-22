import { motion, AnimatePresence } from 'framer-motion'

function Toast({ message, onDone }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onAnimationComplete={() => {
            if (message) setTimeout(onDone, 2200)
          }}
          className="toast"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Toast