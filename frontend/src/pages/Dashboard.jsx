import { useEffect, useState } from 'react'
import { useInboxData } from '../hooks/useInboxData'
import MailCard from '../components/mail/MailCard'
import { supabase } from '../lib/supabaseClient'
import FloatingAvatar from '../components/avatar/FloatingAvatar'
import Sidebar from '../components/ui/Sidebar'
import Toast from '../components/ui/Toast'

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
    awaitingReplies,
    loading,
    error,
    fetchDigest,
    fetchPendingActions,
    fetchAwaitingReplies,
    proposeAction,
    approveAction,
    rejectAction,
  } = useInboxData()

  const [activeTab, setActiveTab] = useState('Newsletter/Promotional')
  const [toastMessage, setToastMessage] = useState(null)

  useEffect(() => {
    fetchDigest()
    fetchPendingActions()
    fetchAwaitingReplies()
  }, [fetchDigest, fetchPendingActions, fetchAwaitingReplies])

  async function handleBulkAction(mails, actionType) {
    for (const mail of mails) {
      await proposeAction(mail.gmailId, actionType)
    }
  }

  async function handleAddToCalendar(mail) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const start = new Date(mail.meetingTime)
    const end = new Date(start.getTime() + 60 * 60 * 1000)

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
      setToastMessage('Event added to your calendar!')
    } catch (err) {
      setToastMessage(`Failed to add event: ${err.message}`)
    }
  }

  const activeMails = grouped[activeTab] || []

  return (
    <div className="min-h-screen p-6 pb-32 pl-24" style={{ color: 'var(--text-primary)' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight ml-2">Envoy Workbench</h1>
        <button
          onClick={fetchDigest}
          disabled={loading}
          className="px-4 py-2 rounded-xl font-semibold transition disabled:opacity-50 glass-btn"
          style={{ background: 'var(--accent-primary)', color: 'white' }}
        >
          {loading ? 'Refreshing...' : 'Refresh Inbox'}
        </button>
      </div>

      {error && <p className="mb-4" style={{ color: 'var(--accent-danger)' }}>Error: {error}</p>}

      {/* Tab bar */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {CATEGORY_ORDER.map((cat) => {
          const count = (grouped[cat] || []).length
          const isActive = activeTab === cat
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className="shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition glass-btn"
              style={
                isActive
                  ? { background: 'var(--text-primary)', color: 'var(--bg-base)' }
                  : { background: 'var(--glass-fill)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }
              }
            >
              {cat} <span className="opacity-60 ml-1">{count}</span>
            </button>
          )
        })}
        <button
          onClick={() => setActiveTab('Awaiting Reply')}
          className="shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition glass-btn"
          style={
            activeTab === 'Awaiting Reply'
              ? { background: 'var(--text-primary)', color: 'var(--bg-base)' }
              : { background: 'var(--glass-fill)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }
          }
        >
          Awaiting Reply <span className="opacity-60 ml-1">{awaitingReplies.length}</span>
        </button>
      </div>

      {/* Bulk action for current tab, if Newsletter/Promotional */}
      {activeTab === 'Newsletter/Promotional' && activeMails.length > 1 && (
        <button
          onClick={() => handleBulkAction(activeMails, 'archive')}
          className="mb-4 text-xs px-4 py-2.5 rounded-xl transition glass-panel glass-btn"
          style={{ color: 'var(--text-secondary)' }}
        >
          Archive all {activeMails.length}
        </button>
      )}

      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {activeTab === 'Awaiting Reply' ? (
          awaitingReplies.length === 0 ? (
            <p className="text-sm col-span-full text-center py-16" style={{ color: 'var(--text-muted)' }}>
              Nothing here
            </p>
          ) : (
            awaitingReplies.map((mail) => (
              <div
                key={mail.id}
                className="glass-panel rounded-2xl p-4 space-y-2"
                style={{ color: 'var(--text-primary)' }}
              >
                <span
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full inline-block"
                  style={{ background: 'rgba(240, 163, 94, 0.15)', color: 'var(--accent-warm)' }}
                >
                  {mail.daysSince} day{mail.daysSince !== 1 ? 's' : ''} no reply
                </span>
                <p className="text-sm font-medium">{mail.subject || '(no subject)'}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>To: {mail.to}</p>
              </div>
            ))
          )
        ) : (
          <>
            {activeMails.map((mail, i) => (
              <MailCard
                key={mail.gmailId || i}
                mail={mail}
                onPropose={proposeAction}
                onAddToCalendar={handleAddToCalendar}
              />
            ))}
            {activeMails.length === 0 && (
              <p className="text-sm col-span-full text-center py-16" style={{ color: 'var(--text-muted)' }}>
                Nothing here
              </p>
            )}
          </>
        )}
      </div>

      {pendingActions.length > 0 && (
        <div className="fixed bottom-24 right-6 w-80 glass-panel-strong rounded-2xl p-4 space-y-3 z-40 max-h-[60vh] overflow-y-auto">
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Pending Approvals ({pendingActions.length})
          </h3>
          {pendingActions.map((action) => {
            if (!action?.id) return null
            return (
              <div
                key={action.id}
                className="flex justify-between items-center text-sm rounded-lg p-2"
                style={{ background: 'var(--glass-fill)', color: 'var(--text-primary)' }}
              >
                <span className="capitalize">{action.action_type}</span>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.currentTarget.disabled = true
                      approveAction(action.id)
                    }}
                    className="text-xs px-2 py-1 rounded glass-btn"
                    style={{ background: 'rgba(126, 201, 143, 0.15)', color: 'var(--accent-success)' }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={(e) => {
                      e.currentTarget.disabled = true
                      rejectAction(action.id)
                    }}
                    className="text-xs px-2 py-1 rounded glass-btn"
                    style={{ background: 'var(--glass-fill-strong)', color: 'var(--text-secondary)' }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
      <Sidebar />
      <FloatingAvatar />
    </div>
  )
}

export default Dashboard