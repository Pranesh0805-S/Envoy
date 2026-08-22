import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

function ChatPanel({ messages, onSend, onClose, loading }) {
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    onSend(text)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="fixed bottom-32 right-6 w-96 h-[500px] glass-panel-strong shadow-2xl rounded-2xl flex flex-col overflow-hidden z-50"
    >
      <div className="flex justify-between items-center px-4 py-3 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Envoy</span>
        <button onClick={onClose} className="text-lg leading-none glass-btn" style={{ color: 'var(--text-secondary)' }}>×</button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-[85%] px-3 py-2 rounded-xl text-sm"
            style={
              m.role === 'user'
                ? { marginLeft: 'auto', background: 'var(--accent-primary)', color: 'white' }
                : { marginRight: 'auto', background: 'var(--glass-fill-strong)', color: 'var(--text-primary)' }
            }
          >
            {m.content}
          </motion.div>
        ))}
        {loading && (
          <div className="mr-auto px-3 py-2 rounded-xl text-sm" style={{ background: 'var(--glass-fill-strong)', color: 'var(--text-secondary)' }}>
            Thinking...
          </div>
        )}
      </div>

      <div className="p-3 border-t flex gap-2" style={{ borderColor: 'var(--glass-border)' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Envoy..."
          className="flex-1 rounded-lg px-3 py-2 text-sm outline-none glass-panel"
          style={{ color: 'var(--text-primary)' }}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm transition disabled:opacity-40 glass-btn"
          style={{ background: 'var(--accent-primary)', color: 'white' }}
        >
          Send
        </button>
      </div>
    </motion.div>
  )
}

export default ChatPanel