import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { signInWithGoogle } from './lib/auth'
import Dashboard from './pages/Dashboard'

function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <button
        onClick={signInWithGoogle}
        className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
      >
        Sign in with Google
      </button>
    </div>
  )
}

function App() {
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