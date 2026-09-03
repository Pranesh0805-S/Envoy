import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

const SUGGESTED_PROMPTS = [
  "Summarize today's urgent mail",
  "Clean up newsletters",
  "Find unreplied threads"
]

function ChatPanel({ messages, onSend, onClose, loading, isDocked, onToggleDock }) {
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  function handleSend(textToSend) {
    const text = (textToSend || input).trim()
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
      initial={{ opacity: 0, scale: isDocked ? 1 : 0.96, y: isDocked ? 0 : 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: isDocked ? 1 : 0.96, y: isDocked ? 0 : 12 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={
        isDocked
          ? "h-full w-full flex flex-col overflow-hidden bg-[var(--bg-elevated)] border-l border-[var(--glass-border)]"
          : "fixed bottom-20 right-6 w-96 h-[530px] rounded-xl flex flex-col overflow-hidden z-50 border shadow-2xl bg-[var(--bg-elevated)] border-[var(--glass-border)]"
      }
    >
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--glass-border)] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="font-semibold text-xs uppercase tracking-wider text-[var(--text-primary)]">
            Envoy Copilot
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleDock}
            type="button"
            title={isDocked ? "Float window" : "Expand to sidebar"}
            className="p-1 rounded text-xs opacity-60 hover:opacity-100 hover:bg-[var(--glass-fill-strong)] transition text-[var(--text-secondary)]"
          >
            {isDocked ? (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4 4m0 0l5 0m-5 0l0 5M15 15l5 5m0 0l-5 0m5 0l0-5" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>

          <button
            onClick={onClose}
            type="button"
            title="Close chat"
            className="p-1 rounded text-xs opacity-60 hover:opacity-100 hover:bg-[var(--glass-fill-strong)] transition text-[var(--text-secondary)]"
          >
            ✕
          </button>
        </div>
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
            {/* Organic Asymmetrical Bubble */}
            <div
              className={`p-3 rounded-2xl ${
                m.role === 'user'
                  ? 'rounded-br-sm font-medium'
                  : 'rounded-tl-sm border'
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
                <div className="text-[11px] pb-1 border-b border-[var(--glass-border)]">
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

        {/* Quick Suggestion Chips (Visible on intro state) */}
        {messages.length === 1 && (
          <div className="pt-2 space-y-1.5">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block px-1">
              Suggested Actions
            </span>
            <div className="flex flex-col gap-1.5">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="text-left text-xs px-3 py-2 rounded-lg border border-[var(--glass-border)] bg-[var(--bg-subtle)] hover:bg-[var(--glass-fill-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                >
                  {prompt} →
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="mr-auto px-3 py-2 text-xs opacity-50 flex items-center gap-1.5 text-[var(--text-secondary)]">
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0.4s]"></span>
          </div>
        )}
      </div>

      {/* Input Field */}
      <div className="p-3 border-t border-[var(--glass-border)] flex gap-2 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question or request an action..."
          className="flex-1 rounded-md px-3 py-2 text-xs outline-none border border-[var(--glass-border)] bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="px-3.5 py-2 rounded-md text-xs font-semibold tracking-wide uppercase transition disabled:opacity-40"
          style={{ background: 'var(--accent-primary)', color: 'var(--accent-primary-text)' }}
        >
          Send
        </button>
      </div>
    </motion.div>
  )
}

export default ChatPanel