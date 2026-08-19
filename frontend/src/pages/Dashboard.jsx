import { useEffect } from 'react'
import { useInboxData } from '../hooks/useInboxData'
import WorkbenchColumn from '../components/mail/WorkbenchColumn'
import { supabase } from '../lib/supabaseClient'

const CATEGORY_ORDER = [
  'Urgent',
  'Important',
  'Job/Career',
  'Security',
  'Newsletter/Promotional',
  'Social',
  'Spam-like',
]

function Dashboard() {
  const {
    grouped,
    pendingActions,
    loading,
    error,
    fetchDigest,
    fetchPendingActions,
    proposeAction,
    approveAction,
    rejectAction,
  } = useInboxData()

  useEffect(() => {
    fetchDigest()
    fetchPendingActions()
  }, [fetchDigest, fetchPendingActions])

  async function handleBulkAction(mails, actionType) {
    for (const mail of mails) {
      await proposeAction(mail.gmailId, actionType)
    }
  }

  async function handleAddToCalendar(mail) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const start = new Date(mail.meetingTime)
    const end = new Date(start.getTime() + 60 * 60 * 1000) // default 1hr duration

    try {
      const res = await fetch('http://localhost:5000/api/calendar/create-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          summary: mail.summary,
          description: `Auto-created by Envoy from a detected meeting email.`,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      alert('Event added to your calendar!')
    } catch (err) {
      alert(`Failed to add event: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Envoy Workbench</h1>
        <button
          onClick={fetchDigest}
          disabled={loading}
          className="px-4 py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh Inbox'}
        </button>
      </div>

      {error && <p className="text-red-400 mb-4">Error: {error}</p>}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {CATEGORY_ORDER.map((cat) => (
          <WorkbenchColumn
            key={cat}
            title={cat}
            mails={grouped[cat] || []}
            onPropose={proposeAction}
            onBulkAction={cat === 'Newsletter/Promotional' ? handleBulkAction : null}
            onAddToCalendar={handleAddToCalendar}
          />
        ))}
      </div>

      {pendingActions.length > 0 && (
        <div className="fixed bottom-4 right-4 w-80 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-sm">Pending Approvals ({pendingActions.length})</h3>
          {pendingActions.map((action) => {
            if (!action?.id) return null
            return (
              <div key={action.id} className="flex justify-between items-center text-sm bg-white/5 rounded-lg p-2">
                <span className="capitalize">{action.action_type}</span>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.currentTarget.disabled = true
                      approveAction(action.id)
                    }}
                    className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded disabled:opacity-40"
                  >
                    Approve
                  </button>
                  <button
                    onClick={(e) => {
                      e.currentTarget.disabled = true
                      rejectAction(action.id)
                    }}
                    className="text-xs px-2 py-1 bg-white/10 rounded disabled:opacity-40"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Dashboard