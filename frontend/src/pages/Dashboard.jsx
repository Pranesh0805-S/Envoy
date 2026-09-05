import { useEffect, useState } from 'react'
import { useInboxData } from '../hooks/useInboxData'
import MailCard from '../components/mail/MailCard'
import { supabase } from '../lib/supabaseClient'
import Toast from '../components/ui/Toast'
import ApprovalCard from '../components/mail/ApprovalCard'
import FloatingAvatar from '../components/avatar/FloatingAvatar'
import { useTheme } from '../hooks/useTheme'
import { AnimatePresence, motion } from 'framer-motion'

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
    executeAction,
    approveAction,
    rejectAction,
  } = useInboxData()

  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('Newsletter/Promotional')
  const [toastMessage, setToastMessage] = useState(null)
  const [searchFilter, setSearchFilter] = useState('')
  const [bulkProcessing, setBulkProcessing] = useState(false)

  const [primaryOpen, setPrimaryOpen] = useState(true)
  const [secondaryOpen, setSecondaryOpen] = useState(true)

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
    return () => authListener?.subscription?.unsubscribe()
  }, [])

  useEffect(() => {
    fetchDigest()
    fetchPendingActions()
    fetchAwaitingReplies()
    fetchUnsubscribeCandidates()
  }, [fetchDigest, fetchPendingActions, fetchAwaitingReplies, fetchUnsubscribeCandidates])

  function handleCycleTheme() {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  async function handleBulkAction(mails, actionType) {
    if (!mails.length || bulkProcessing) return
    setBulkProcessing(true)
    try {
      await Promise.all(mails.map((mail) => executeAction(mail.gmailId, actionType, mail.summary)))
      setToastMessage(`Successfully ${actionType}d ${mails.length} emails.`)
    } catch (err) {
      setToastMessage(`Bulk ${actionType} failed: ${err.message}`)
    } finally {
      setBulkProcessing(false)
    }
  }

  async function handleApproveAllPending() {
    const actions = [...pendingActions]
    for (const action of actions) await approveAction(action.id)
    setToastMessage(`Approved all ${actions.length} actions.`)
  }

  async function handleRejectAllPending() {
    const actions = [...pendingActions]
    for (const action of actions) await rejectAction(action.id)
    setToastMessage(`Dismissed all pending actions.`)
  }

  async function handleAddToCalendar(mail) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const start = new Date(mail.meetingTime)
    const end = new Date(start.getTime() + 60 * 60 * 1000)

    try {
      const res = await fetch('http://localhost:5000/api/calendar/create-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
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
    if (candidate.unsubscribeUrl) window.open(candidate.unsubscribeUrl, '_blank')
    else if (candidate.unsubscribeMailto) window.location.href = `mailto:${candidate.unsubscribeMailto}`
  }

  const activeMails = (grouped[activeTab] || []).filter((m) =>
    searchFilter
      ? (m.summary?.toLowerCase().includes(searchFilter.toLowerCase()) ||
         m.subject?.toLowerCase().includes(searchFilter.toLowerCase()))
      : true
  )

  function renderTabContent() {
    if (activeTab === 'Awaiting Reply') {
      if (awaitingReplies.length === 0) {
        return <div className="py-20 text-center text-xs text-[var(--text-muted)]">No pending replies</div>
      }
      return awaitingReplies.map((mail) => (
        <div key={mail.id} className="glass-panel rounded-lg p-4 flex items-center justify-between transition hover:border-indigo-400/30">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{mail.subject || '(No Subject)'}</p>
            <p className="text-xs text-[var(--text-muted)]">Recipient: {mail.to}</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-[var(--glass-fill-strong)] text-[var(--text-secondary)] border border-[var(--glass-border)]">
            {mail.daysSince} days no reply
          </span>
        </div>
      ))
    }

    if (activeTab === 'Unsubscribe') {
      if (unsubCandidates.length === 0) {
        return <div className="py-20 text-center text-xs text-[var(--text-muted)]">No unsubscribe candidates found</div>
      }
      return unsubCandidates.map((c) => (
        <div key={c.id} className="glass-panel rounded-lg p-4 flex items-center justify-between gap-4 transition hover:border-indigo-400/30">
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
    }

    if (activeMails.length === 0) {
      return <div className="py-20 text-center text-xs text-[var(--text-muted)]">All caught up! No emails in this category.</div>
    }

    return activeMails.map((mail, i) => (
      <MailCard key={mail.gmailId || i} mail={mail} onExecute={executeAction} onAddToCalendar={handleAddToCalendar} />
    ))
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-base)] text-[var(--text-primary)] relative">
      {!primaryOpen && !secondaryOpen && (
        <button
          onClick={() => { setPrimaryOpen(true); setSecondaryOpen(true) }}
          title="Open Sidebar"
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-md transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* PRIMARY SLIM SIDEBAR */}
      <AnimatePresence initial={false}>
        {primaryOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 64, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="border-r border-[var(--glass-border)] bg-[var(--bg-elevated)] flex flex-col items-center justify-between py-4 shrink-0 z-40 sticky top-0 h-screen overflow-hidden"
          >
            <div className="flex flex-col items-center gap-4 w-full">
              <button
                onClick={() => setPrimaryOpen(false)}
                title="Collapse slim bar"
                className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm hover:opacity-90 transition"
              >
                E
              </button>

              <button
                onClick={() => setSecondaryOpen((v) => !v)}
                title={secondaryOpen ? 'Hide segment drawer' : 'Show segment drawer'}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition ${
                  secondaryOpen ? 'bg-[var(--glass-fill-strong)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-fill-strong)]'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="w-full flex flex-col items-center gap-2 pt-2 border-t border-[var(--glass-border)]">
                <button
                  onClick={() => { setActiveTab('Newsletter/Promotional'); if (!secondaryOpen) setSecondaryOpen(true) }}
                  title="Workbench"
                  className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-600 text-white shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                </button>
                <button
                  onClick={() => { setActiveTab('Awaiting Reply'); if (!secondaryOpen) setSecondaryOpen(true) }}
                  title="Awaiting Replies"
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-fill-strong)] transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
                <button
                  onClick={() => { setActiveTab('Unsubscribe'); if (!secondaryOpen) setSecondaryOpen(true) }}
                  title="Unsubscribe Cleaner"
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-fill-strong)] transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <button
              onClick={handleCycleTheme}
              title={`Theme: ${theme.toUpperCase()} (Click to cycle)`}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-fill-strong)] transition relative"
            >
              <span className="text-[10px] font-bold uppercase">{theme === 'system' ? 'SYS' : theme === 'light' ? 'LT' : 'DK'}</span>
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* SECONDARY COLLAPSIBLE SIDEBAR */}
      <AnimatePresence initial={false}>
        {secondaryOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="border-r border-[var(--glass-border)] bg-[var(--bg-elevated)] flex flex-col justify-between shrink-0 sticky top-0 h-screen overflow-hidden z-30"
          >
            <div className="w-64 p-5 flex flex-col h-full justify-between">
              <div className="space-y-5 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {!primaryOpen && (
                      <button onClick={() => setPrimaryOpen(true)} title="Expand Slim Bar" className="p-1 rounded hover:bg-[var(--glass-fill-strong)] text-[var(--text-secondary)] transition">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                    <span className="font-bold text-sm tracking-tight text-[var(--text-primary)]">Inbox Segments</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--glass-fill-strong)] text-[var(--text-muted)] border border-[var(--glass-border)]">
                    Smart AI
                  </span>
                </div>

                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search filters..."
                  className="w-full text-xs px-2.5 py-1.5 rounded-md border border-[var(--glass-border)] bg-[var(--bg-base)] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                />

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1 block mb-2">
                    Priority Categories
                  </span>
                  {PRIMARY_CATEGORIES.map((cat) => {
                    const count = (grouped[cat] || []).length
                    const isActive = activeTab === cat
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition ${
                          isActive ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-fill-strong)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <span>{cat}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          isActive ? 'bg-indigo-700 text-white' : count > 0 ? 'bg-[var(--glass-border)] text-[var(--text-primary)]' : 'opacity-40 text-[var(--text-muted)]'
                        }`}>
                          {count}
                        </span>
                      </button>
                    )
                  })}

                  <div className="pt-4 mt-2 border-t border-[var(--glass-border)]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1 block mb-2">
                      Triage Streams
                    </span>
                    <button
                      onClick={() => setActiveTab('Awaiting Reply')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition ${
                        activeTab === 'Awaiting Reply' ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-fill-strong)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span>Awaiting Reply</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${activeTab === 'Awaiting Reply' ? 'bg-indigo-700 text-white' : 'bg-[var(--glass-border)]'}`}>
                        {awaitingReplies.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab('Unsubscribe')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition ${
                        activeTab === 'Unsubscribe' ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-fill-strong)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span>Unsubscribe Candidates</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${activeTab === 'Unsubscribe' ? 'bg-indigo-700 text-white' : 'bg-[var(--glass-border)]'}`}>
                        {unsubCandidates.length}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--glass-border)] text-[10px] text-[var(--text-muted)] flex items-center justify-between">
                <span>Envoy Engine v1.0</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* CENTER FEED */}
      <main className="flex-1 min-w-0 px-8 py-5 flex flex-col h-screen overflow-y-auto">
        <div className="w-full max-w-5xl mx-auto flex-1">
          <header className="flex justify-between items-center pb-4 border-b border-[var(--glass-border)] mb-5">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">{activeTab}</h1>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">AI triage summaries and actionable recommendations.</p>
            </div>

            <div className="flex items-center gap-2.5">
              {activeTab === 'Newsletter/Promotional' && activeMails.length > 1 && (
                <button
                  onClick={() => handleBulkAction(activeMails, 'archive')}
                  disabled={bulkProcessing}
                  className="text-xs font-medium px-3 py-1.5 rounded-md border border-[var(--glass-border)] hover:bg-[var(--glass-fill-strong)] transition disabled:opacity-50"
                >
                  {bulkProcessing ? 'Archiving...' : `Archive all ${activeMails.length}`}
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

          <div className="space-y-3 pb-16">
            {renderTabContent()}
          </div>
        </div>

        {pendingActions.length > 0 && (
          <div className="fixed bottom-24 right-6 w-84 glass-panel-strong rounded-xl p-4 space-y-3 z-40 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--glass-border)]">
              <h3 className="font-semibold text-xs text-[var(--text-primary)]">Pending Approvals ({pendingActions.length})</h3>
              <div className="flex items-center gap-1.5">
                <button onClick={handleApproveAllPending} className="text-[10px] font-semibold px-2 py-1 rounded bg-emerald-500/15 text-[var(--accent-success)] hover:bg-emerald-500/25 transition">
                  Approve All
                </button>
                <button onClick={handleRejectAllPending} className="text-[10px] font-medium px-2 py-1 rounded hover:bg-[var(--glass-fill-strong)] text-[var(--text-muted)] transition">
                  Dismiss
                </button>
              </div>
            </div>
            <div className="space-y-2">
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
          </div>
        )}

        <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
      </main>

      <FloatingAvatar />
    </div>
  )
}

export default Dashboard