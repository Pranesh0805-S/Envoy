import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

function ChatPanel({ onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi, I'm Envoy. Ask me about your inbox — what's urgent, what needs a reply, or anything else." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      const history = newMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(0, -1)
        .map((m) => ({ role: m.role, content: m.content }))

      const res = await fetch('http://localhost:5000/api/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message: text, history }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      setMessages((prev) => [...prev, { role: 'assistant', content: result.reply }])
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-black/40 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50">
      <div className="flex justify-between items-center px-4 py-3 border-b border-white/10">
        <span className="font-semibold text-white text-sm">Envoy</span>
        <button onClick={onClose} className="text-white/50 hover:text-white text-lg leading-none">×</button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
              m.role === 'user'
                ? 'ml-auto bg-purple-500/30 text-white'
                : 'mr-auto bg-white/10 text-white/90'
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="mr-auto bg-white/10 text-white/60 px-3 py-2 rounded-xl text-sm">
            Thinking...
          </div>
        )}
      </div>

      <div className="p-3 border-t border-white/10 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Envoy..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-purple-400/50"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-purple-500/30 hover:bg-purple-500/50 text-white px-4 py-2 rounded-lg text-sm transition disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default ChatPanel