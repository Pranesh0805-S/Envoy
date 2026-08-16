import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function Dashboard() {
  const [status, setStatus] = useState('Checking session...')
  const [digest, setDigest] = useState(null)
  const [digestError, setDigestError] = useState(null)

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session) {
          setStatus('No active session found.')
          return
        }

        const { provider_token, provider_refresh_token, expires_at, access_token } = session

        if (!provider_token) {
          setStatus('Signed in, but no Google token found (may already be saved).')
          return
        }

        try {
          const res = await fetch('http://localhost:5000/api/auth/save-google-tokens', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${access_token}`,
            },
            body: JSON.stringify({ provider_token, provider_refresh_token, expires_at }),
          })

          const result = await res.json()
          setStatus(res.ok ? 'Google tokens saved successfully.' : `Error: ${result.error}`)
        } catch (err) {
          setStatus(`Network error: ${err.message}`)
        }
      }
    )

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  async function fetchDigest() {
    setDigestError(null)
    setDigest(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setDigestError('No session — sign in first.')
      return
    }

    try {
      const res = await fetch('http://localhost:5000/api/mail/digest', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const result = await res.json()

      if (!res.ok) {
        setDigestError(result.error)
      } else {
        setDigest(result.digest)
      }
    } catch (err) {
      setDigestError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 p-8">
      <p className="text-xl">{status}</p>

      <button
        onClick={fetchDigest}
        className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
      >
        Fetch Inbox Digest
      </button>

      {digestError && <p className="text-red-400">Error: {digestError}</p>}

      {digest && (
        <div className="w-full max-w-2xl space-y-3">
          {digest.map((mail) => (
            <div key={mail.id} className="border border-gray-700 rounded-lg p-4">
              <p className="font-semibold">{mail.subject || '(no subject)'}</p>
              <p className="text-sm text-gray-400">{mail.from}</p>
              <p className="text-sm text-gray-500">{mail.date}</p>
              <p className="text-sm mt-2">{mail.snippet}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard