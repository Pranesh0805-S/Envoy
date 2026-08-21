import { useState } from 'react'
import { useTheme } from '../../hooks/useTheme'

const NAV_ITEMS = [
  { label: 'Workbench', href: '/dashboard', active: true },
  // Future pages go here as you build them, e.g.:
  // { label: 'Settings', href: '/settings' },
  // { label: 'VIP Rules', href: '/vip-rules' },
]

function Sidebar() {
  const [open, setOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-6 left-6 z-40 w-10 h-10 rounded-xl glass-panel glass-btn flex items-center justify-center"
        style={{ color: 'var(--text-primary)' }}
      >
        <span className="text-lg">☰</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-64 glass-panel-strong z-50 p-5 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center mb-8">
          <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Envoy</span>
          <button
            onClick={() => setOpen(false)}
            className="text-xl glass-btn"
            style={{ color: 'var(--text-secondary)' }}
          >
            ×
          </button>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-3 py-2.5 rounded-lg text-sm glass-btn"
              style={{
                color: item.active ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: item.active ? 'var(--glass-fill-strong)' : 'transparent',
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="pt-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Appearance</p>
          <div className="flex gap-1.5">
            {['light', 'dark', 'system'].map((mode) => (
              <button
                key={mode}
                onClick={() => setTheme(mode)}
                className="flex-1 px-2 py-1.5 rounded-lg text-xs capitalize glass-btn"
                style={{
                  background: theme === mode ? 'var(--glass-fill-strong)' : 'transparent',
                  color: theme === mode ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar