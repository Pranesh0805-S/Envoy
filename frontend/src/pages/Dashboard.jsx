import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function Dashboard() {
  const [status, setStatus] = useState('Checking session...')

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

    // Also check immediately in case session already exists (e.g. page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.auth.onAuthStateChange // no-op, handled above
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-xl">{status}</p>
    </div>
  )
}

export default Dashboard