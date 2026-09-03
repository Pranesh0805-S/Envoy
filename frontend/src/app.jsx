import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { signInWithGoogle } from './lib/auth'
import Dashboard from './pages/Dashboard'
import { useTheme } from './hooks/useTheme'

function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <button
        onClick={signInWithGoogle}
        className="glass-panel glass-btn px-6 py-3 rounded-lg font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        Sign in with Google
      </button>
    </div>
  )
}

function App() {
  useTheme() // applies theme globally on mount + listens for changes

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App