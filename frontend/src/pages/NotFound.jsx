import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <span className="text-6xl font-bold" style={{ color: 'var(--accent-primary)' }}>404</span>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>This page doesn't exist.</p>
      <Link
        to="/dashboard"
        className="mt-2 text-xs font-semibold px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 transition"
      >
        Back to Workbench
      </Link>
    </div>
  )
}

export default NotFound