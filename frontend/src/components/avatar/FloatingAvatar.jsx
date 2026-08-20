import { useState } from 'react'
import ChatPanel from './ChatPanel'

function FloatingAvatar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/80 to-blue-500/80 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center justify-center text-2xl hover:scale-105 transition z-50"
      >
        {open ? '×' : '✦'}
      </button>

      {open && <ChatPanel onClose={() => setOpen(false)} />}
    </>
  )
}

export default FloatingAvatar