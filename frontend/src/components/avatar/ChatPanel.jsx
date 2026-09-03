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
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 12 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="fixed bottom-20 right-6 w-96 h-[520px] rounded-xl flex flex-col overflow-hidden z-50 border shadow-2xl"
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--glass-border)' }}
    >
      {/* Copilot Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Envoy Copilot</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-xs opacity-60 hover:opacity-100 transition"
          style={{ color: 'var(--text-secondary)' }}
        >
          ✕
        </button>
      </div>

      {/* Messages Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[88%] text-xs leading-relaxed ${
              m.role === 'user' ? 'ml-auto' : 'mr-auto'
            }`}
          >
            <div
              className={`p-3 rounded-lg ${
                m.role === 'user' ? 'font-medium' : 'border'
              }`}
              style={
                m.role === 'user'
                  ? { background: 'var(--accent-primary)', color: 'var(--accent-primary-text)' }
                  : { background: 'var(--bg-subtle)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }
              }
            >
              {m.content}
            </div>

            {m.draft && (
              <div
                className="mt-2 p-3 rounded-lg border space-y-1.5"
                style={{ background: 'var(--bg-base)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
              >
                <div className="text-[11px] pb-1 border-b" style={{ borderColor: 'var(--glass-border)' }}>
                  <p><span className="opacity-60">To:</span> {m.draft.to}</p>
                  <p><span className="opacity-60">Subject:</span> {m.draft.subject}</p>
                </div>
                <p className="whitespace-pre-wrap text-[11px] opacity-90">{m.draft.body}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(m.draft.body)}
                  className="mt-2 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded transition"
                  style={{ background: 'var(--accent-primary)', color: 'var(--accent-primary-text)' }}
                >
                  Copy Draft
                </button>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="mr-auto px-3 py-2 text-xs opacity-50 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0.4s]"></span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 border-t flex gap-2" style={{ borderColor: 'var(--glass-border)' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question or request an action..."
          className="flex-1 rounded-md px-3 py-2 text-xs outline-none border bg-transparent"
          style={{ borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-3 py-2 rounded-md text-xs font-semibold tracking-wide uppercase transition disabled:opacity-40"
          style={{ background: 'var(--accent-primary)', color: 'var(--accent-primary-text)' }}
        >
          Send
        </button>
      </div>
    </motion.div>
  )
}

export default ChatPanel