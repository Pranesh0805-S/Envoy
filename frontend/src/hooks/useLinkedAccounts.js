import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const API_BASE = 'http://localhost:5000/api'

export function useLinkedAccounts() {
  const [accounts, setAccounts] = useState([])
  const [activeAccountId, setActiveAccountId] = useState(
    () => localStorage.getItem('envoy-active-account') || null
  )
  const [loading, setLoading] = useState(false)

  const getAuthHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('No active session')
    return { Authorization: `Bearer ${session.access_token}` }
  }

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    try {
      const headers = await getAuthHeader()
      const res = await fetch(`${API_BASE}/auth/linked-accounts`, { headers })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      setAccounts(result)

      // If no active account chosen yet, or the stored one no longer exists, pick primary/first
      setActiveAccountId((current) => {
        const stillExists = result.some((a) => a.id === current)
        if (stillExists) return current
        const primary = result.find((a) => a.is_primary) || result[0]
        return primary?.id || null
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const selectAccount = useCallback((id) => {
    setActiveAccountId(id)
    localStorage.setItem('envoy-active-account', id)
  }, [])

  return { accounts, activeAccountId, selectAccount, fetchAccounts, loading }
}