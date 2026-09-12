import { useNavigate } from 'react-router-dom'
import { BlobAvatar } from '../components/avatar/FloatingAvatar'

function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-6" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <div className="w-28 h-28">
        <BlobAvatar state="alert" size={112} />
      </div>

      <div className="text-center space-y-1">
        <span className="text-5xl font-bold block" style={{ color: 'var(--accent-primary)' }}>404</span>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Envoy couldn't find that page.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => navigate('/')}
          className="text-xs font-semibold px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 transition"
        >
          Go to Sign In
        </button>
        <button
          onClick={() => window.location.reload()}
          className="text-xs font-medium px-4 py-2 rounded-md border transition"
          style={{ borderColor: 'var(--glass-border)', color: 'var(--text-secondary)' }}
        >
          Reload App
        </button>
      </div>
    </div>
  )
}

export default NotFound