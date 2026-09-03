import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const hexPaths = {
  a: "M50 4 L90 27 L90 73 L50 96 L10 73 L10 27 Z",
  b: "M50 7 L87 28 L88 72 L50 93 L13 72 L12 28 Z",
}

export function BlobAvatar({ state, size = 40 }) {
  const [blink, setBlink] = useState(false)
  const [wink, setWink] = useState(false)

  useEffect(() => {
    if (state !== 'idle') return
    const interval = setInterval(() => {
      if (Math.random() < 0.25) {
        setWink(true)
        setTimeout(() => setWink(false), 220)
      } else {
        setBlink(true)
        setTimeout(() => setBlink(false), 160)
      }
    }, 3200)
    return () => clearInterval(interval)
  }, [state])

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
      <motion.path
        fill="url(#blobGradient)"
        animate={{ d: [hexPaths.a, hexPaths.b, hexPaths.a] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <defs>
        <linearGradient id="blobGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4f8ff0" />
          <stop offset="100%" stopColor="#2f5fd0" />
        </linearGradient>
      </defs>

      <AnimatePresence mode="wait">
        {state === 'thinking' ? (
          <motion.g key="dots">
            {[38, 50, 62].map((x, i) => (
              <motion.circle
                key={x} cx={x} cy={50} r={5} fill="white"
                animate={{ cy: [50, 42, 50] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </motion.g>
        ) : state === 'alert' ? (
          <motion.g key="alert">
            <ellipse cx="38" cy="46" rx="9" ry="10" fill="white" />
            <ellipse cx="62" cy="46" rx="9" ry="10" fill="white" />
            <motion.circle
              cx="86" cy="16" r="9" fill="#f0a35e" stroke="white" strokeWidth="2.5"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ duration: 0.45 }}
            />
          </motion.g>
        ) : state === 'greet' ? (
          <motion.g key="greet">
            <motion.rect x="34" y="40" width="8" height="18" rx="4" fill="white"
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{ duration: 0.5, times: [0, 0.5, 1] }}
              style={{ transformOrigin: '38px 49px' }}
            />
            <rect x="58" y="40" width="8" height="18" rx="4" fill="white" />
          </motion.g>
        ) : (
          <motion.g key="normal">
            <motion.rect x="34" y="40" width="8" height="18" rx="4" fill="white"
              animate={{ scaleY: blink || wink ? 0.1 : 1 }}
              transition={{ duration: 0.12 }}
              style={{ transformOrigin: '38px 49px' }}
            />
            <motion.rect x="58" y="40" width="8" height="18" rx="4" fill="white"
              animate={{ scaleY: blink ? 0.1 : 1 }}
              transition={{ duration: 0.12 }}
              style={{ transformOrigin: '62px 49px' }}
            />
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  )
}

export default BlobAvatar