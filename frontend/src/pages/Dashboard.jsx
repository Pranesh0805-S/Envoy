import { useEffect, useState } from 'react'
import { useInboxData } from '../hooks/useInboxData'
import MailCard from '../components/mail/MailCard'
import { supabase } from '../lib/supabaseClient'
import FloatingAvatar from '../components/avatar/FloatingAvatar'
import Toast from '../components/ui/Toast'
import ApprovalCard from '../components/mail/ApprovalCard'

const PRIMARY_CATEGORIES = [
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
    unsubCandidates,
    loading,
    error,
    fetchDigest,
    fetchPendingActions,
    fetchAwaitingReplies,
    fetchUnsubscribeCandidates,
    proposeAction,
    executeAction,
    approveAction,
    rejectAction,
  } = useInboxData()

  const [activeTab, setActiveTab] = useState('Newsletter/Promotional')
  const [toastMessage, setToastMessage] = useState(null)

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session?.provider_token) return

        try {
          await fetch('http://localhost:5000/api/auth/save-google-tokens', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              provider_token: session.provider_token,
              provider_refresh_token: session.provider_refresh_token,
              expires_at: session.expires_at,
            }),
          })
        } catch (err) {
          console.error('Failed to save Google tokens:', err.message)
        }
      }
    )

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    fetchDigest()
    fetchPendingActions()
    fetchAwaitingReplies()
    fetchUnsubscribeCandidates()
  }, [fetchDigest, fetchPendingActions, fetchAwaitingReplies, fetchUnsubscribeCandidates])

  async function handleBulkAction(mails, actionType) {
    for (const mail of mails) {
      await proposeAction(mail.gmailId, actionType, mail.summary)
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

  function handleUnsubscribe(candidate) {
    if (candidate.unsubscribeUrl) {
      window.open(candidate.unsubscribeUrl, '_blank')
    } else if (candidate.unsubscribeMailto) {
      window.location.href = `mailto:${candidate.unsubscribeMailto}`
    }
  }

  const activeMails = grouped[activeTab] || []

  return (
    <div className="min-h-screen flex bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* Left Vertical Navigation Sidebar */}
      <aside className="w-64 border-r border-[var(--glass-border)] bg-[var(--bg-elevated)] p-5 flex flex-col justify-between shrink-0 sticky top-0 h-screen">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              E
            </div>
            <span className="font-bold text-base tracking-tight">Envoy</span>
          </div>

          {/* Navigation Category Links */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-2 block mb-2">
              Categories
            </span>
            {PRIMARY_CATEGORIES.map((cat) => {
              const count = (grouped[cat] || []).length
              const isActive = activeTab === cat
              return (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--glass-fill-strong)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      isActive
                        ? 'bg-indigo-700 text-white'
                        : count > 0
                        ? 'bg-[var(--glass-border)] text-[var(--text-primary)]'
                        : 'opacity-40 text-[var(--text-muted)]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}

            <div className="pt-4 mt-2 border-t border-[var(--glass-border)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-2 block mb-2">
                Triage & Actions
              </span>
              <button
                onClick={() => setActiveTab('Awaiting Reply')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition ${
                  activeTab === 'Awaiting Reply'
                    ? 'bg-indigo-600 text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--glass-fill-strong)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>Awaiting Reply</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--glass-border)]">
                  {awaitingReplies.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('Unsubscribe')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition ${
                  activeTab === 'Unsubscribe'
                    ? 'bg-indigo-600 text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--glass-fill-strong)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>Unsubscribe Candidates</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--glass-border)]">
                  {unsubCandidates.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* User Account / Workspace Footer */}
        <div className="pt-4 border-t border-[var(--glass-border)] px-2 text-xs text-[var(--text-muted)] flex items-center justify-between">
          <span>Envoy AI v1.0</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-8 max-w-5xl">
        {/* Sticky Header Bar */}
        <header className="flex justify-between items-center pb-6 border-b border-[var(--glass-border)] mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{activeTab}</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              AI summaries with actionable recommendations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'Newsletter/Promotional' && activeMails.length > 1 && (
              <button
                onClick={() => handleBulkAction(activeMails, 'archive')}
                className="text-xs font-medium px-3 py-1.5 rounded-md border border-[var(--glass-border)] hover:bg-[var(--glass-fill-strong)] transition"
              >
                Archive all {activeMails.length}
              </button>
            )}

            <button
              onClick={fetchDigest}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh Inbox'}
            </button>
          </div>
        </header>

        {error && <p className="mb-4 text-xs text-[var(--accent-danger)]">Error: {error}</p>}

        {/* Spacious Single-Column Card Feed */}
        <div className="space-y-3">
          {activeTab === 'Awaiting Reply' ? (
            awaitingReplies.length === 0 ? (
              <div className="py-20 text-center text-xs text-[var(--text-muted)]">No pending replies</div>
            ) : (
              awaitingReplies.map((mail) => (
                <div
                  key={mail.id}
                  className="glass-panel rounded-lg p-4 flex items-center justify-between transition hover:border-slate-400/30"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{mail.subject || '(No Subject)'}</p>
                    <p className="text-xs text-[var(--text-muted)]">Recipient: {mail.to}</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded bg-[var(--glass-fill-strong)] text-[var(--text-secondary)] border border-[var(--glass-border)]">
                    {mail.daysSince} days no reply
                  </span>
                </div>
              ))
            )
          ) : activeTab === 'Unsubscribe' ? (
            unsubCandidates.length === 0 ? (
              <div className="py-20 text-center text-xs text-[var(--text-muted)]">No unsubscribe candidates found</div>
            ) : (
              unsubCandidates.map((c) => (
                <div
                  key={c.id}
                  className="glass-panel rounded-lg p-4 flex items-center justify-between gap-4 transition hover:border-slate-400/30"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{c.subject || '(No Subject)'}</p>
                    <p className="text-xs text-[var(--text-muted)]">{c.from}</p>
                  </div>
                  <button
                    onClick={() => handleUnsubscribe(c)}
                    className="text-xs font-medium px-3 py-1.5 rounded-md border border-[var(--accent-danger)] text-[var(--accent-danger)] hover:bg-red-500/10 transition shrink-0"
                  >
                    Unsubscribe
                  </button>
                </div>
              ))
            )
          ) : (
            <>
              {activeMails.map((mail, i) => (
                <MailCard
                  key={mail.gmailId || i}
                  mail={mail}
                  onExecute={executeAction}
                  onAddToCalendar={handleAddToCalendar}
                />
              ))}
              {activeMails.length === 0 && (
                <div className="py-20 text-center text-xs text-[var(--text-muted)]">
                  All caught up! No emails in this category.
                </div>
              )}
            </>
          )}
        </div>

        {pendingActions.length > 0 && (
          <div className="fixed bottom-24 right-6 w-80 glass-panel-strong rounded-xl p-4 space-y-3 z-40 max-h-[60vh] overflow-y-auto">
            <h3 className="font-semibold text-xs text-[var(--text-primary)]">
              Pending Approvals ({pendingActions.length})
            </h3>
            {pendingActions.map((action) => {
              if (!action?.id) return null
              return (
                <ApprovalCard
                  key={action.id}
                  action={action}
                  onApprove={(id) => approveAction(id)}
                  onReject={(id) => rejectAction(id)}
                />
              )
            })}
          </div>
        )}

        <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
        <FloatingAvatar />
      </main>
    </div>
  )
}

export default Dashboard