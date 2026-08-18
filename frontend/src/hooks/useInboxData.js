import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const API_BASE = 'http://localhost:5000/api'

export function useInboxData() {
  const [categorized, setCategorized] = useState([])
  const [pendingActions, setPendingActions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getAuthHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('No active session')
    return { Authorization: `Bearer ${session.access_token}` }
  }

  const fetchDigest = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const headers = await getAuthHeader()
      const res = await fetch(`${API_BASE}/mail/digest-smart`, { headers })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      setCategorized(result.categorized)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPendingActions = useCallback(async () => {
    try {
      const headers = await getAuthHeader()
      const res = await fetch(`${API_BASE}/actions/pending`, { headers })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      setPendingActions(result.actions)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  const proposeAction = useCallback(async (gmailId, actionType) => {
    try {
      const headers = await getAuthHeader()
      const res = await fetch(`${API_BASE}/actions/propose`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType, emailId: gmailId }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      await fetchPendingActions()
      return result.action
    } catch (err) {
      setError(err.message)
    }
  }, [fetchPendingActions])

  const approveAction = useCallback(async (actionId) => {
    try {
      const headers = await getAuthHeader()
      const res = await fetch(`${API_BASE}/actions/${actionId}/approve`, {
        method: 'POST',
        headers,
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      await fetchPendingActions()
    } catch (err) {
      setError(err.message)
    }
  }, [fetchPendingActions])

  const rejectAction = useCallback(async (actionId) => {
    try {
      const headers = await getAuthHeader()
      const res = await fetch(`${API_BASE}/actions/${actionId}/reject`, {
        method: 'POST',
        headers,
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      await fetchPendingActions()
    } catch (err) {
      setError(err.message)
    }
  }, [fetchPendingActions])

  // Group categorized emails by category
  const grouped = categorized.reduce((acc, mail) => {
    const key = mail.category || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(mail)
    return acc
  }, {})

  return {
    categorized,
    grouped,
    pendingActions,
    loading,
    error,
    fetchDigest,
    fetchPendingActions,
    proposeAction,
    approveAction,
    rejectAction,
  }
}