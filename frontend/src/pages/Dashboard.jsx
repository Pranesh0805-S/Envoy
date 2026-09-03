import { useEffect, useState } from 'react'
import { useInboxData } from '../hooks/useInboxData'
import MailCard from '../components/mail/MailCard'
import { supabase } from '../lib/supabaseClient'
import Toast from '../components/ui/Toast'
import ApprovalCard from '../components/mail/ApprovalCard'
import ChatPanel from '../components/avatar/ChatPanel'
import { BlobAvatar } from '../components/avatar/FloatingAvatar'
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

  // Sidebar Layout States
  const [primaryOpen, setPrimaryOpen] = useState(true)
  const [secondaryOpen, setSecondaryOpen] = useState(true)

  // Unified Copilot Chat State
  const [chatOpen, setChatOpen] = useState(false)
  const [isCopilotDocked, setIsCopilotDocked] = useState(false)
  const [avatarState, setAvatarState] = useState('idle')
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi, I'm Envoy. Ask me about your inbox — what's urgent, what needs a reply, or anything else." }
  ])

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

  function handleCycleTheme() {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  async function handleSendMessage(text) {
    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setAvatarState('thinking')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      const history = newMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(0, -1)
        .map((m) => ({ role: m.role, content: m.content }))

      const res = await fetch('http://localhost:5000/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ message: text, history }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.reply, draft: result.draft || null },
      ])
      setAvatarState('idle')
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${err.message}` }])
      setAvatarState('idle')
    }
  }

  // Direct batch execution: eliminates individual pending approval cards
  async function handleBulkAction(mails, actionType) {
    if (!mails.length || bulkProcessing) return
    setBulkProcessing(true)
    try {
      await Promise.all(
        mails.map((mail) => executeAction(mail.gmailId, actionType, mail.summary))
      )
      setToastMessage(`Successfully ${actionType}d ${mails.length} emails.`)
    } catch (err) {
      setToastMessage(`Bulk ${actionType} failed: ${err.message}`)
    } finally {
      setBulkProcessing(false)
    }
  }

  async function handleApproveAllPending() {
    const actions = [...pendingActions]
    for (const action of actions) {
      await approveAction(action.id)
    }
    setToastMessage(`Approved all ${actions.length} actions.`)
  }

  async function handleRejectAllPending() {
    const actions = [...pendingActions]
    for (const action of actions) {
      await rejectAction(action.id)
    }
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

  const activeMails = (grouped[activeTab] || []).filter((m) =>
    searchFilter ? (m.summary?.toLowerCase().includes(searchFilter.toLowerCase()) || m.subject?.toLowerCase().includes(searchFilter.toLowerCase())) : true
  )

  function renderTabContent() {
    if (activeTab === 'Awaiting Reply') {
      if (awaitingReplies.length === 0) {
        return <div className="py-20 text-center text-xs text-[var(--text-muted)]">No pending replies</div>
      }
      return awaitingReplies.map((mail) => (
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
    }

    if (activeTab === 'Unsubscribe') {
      if (unsubCandidates.length === 0) {
        return <div className="py-20 text-center text-xs text-[var(--text-muted)]">No unsubscribe candidates found</div>
      }
      return unsubCandidates.map((c) => (
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
    }

    if (activeMails.length === 0) {
      return (
        <div className="py-20 text-center text-xs text-[var(--text-muted)]">
          All caught up! No emails in this category.
        </div>
      )
    }

    return activeMails.map((mail, i) => (
      <MailCard
        key={mail.gmailId || i}
        mail={mail}
        onExecute={executeAction}
        onAddToCalendar={handleAddToCalendar}
      />
    ))
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-base)] text-[var(--text-primary)] relative">
      {/* Restore Sidebar Trigger - appears only if both sidebars are closed */}
      {!primaryOpen && !secondaryOpen && (
        <button
          onClick={() => {
            setPrimaryOpen(true)
            setSecondaryOpen(true)
          }}
          title="Open Sidebar"
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-md transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* 1. PRIMARY SLIM SIDEBAR */}
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
                title={secondaryOpen ? "Hide segment drawer" : "Show segment drawer"}
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
                  onClick={() => {
                    setActiveTab('Newsletter/Promotional')
                    if (!secondaryOpen) setSecondaryOpen(true)
                  }}
                  title="Workbench"
                  className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-600 text-white shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('Awaiting Reply')
                    if (!secondaryOpen) setSecondaryOpen(true)
                  }}
                  title="Awaiting Replies"
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-fill-strong)] transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('Unsubscribe')
                    if (!secondaryOpen) setSecondaryOpen(true)
                  }}
                  title="Unsubscribe Cleaner"
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-fill-strong)] transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <button
                onClick={handleCycleTheme}
                title={`Theme: ${theme.toUpperCase()} (Click to cycle)`}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-fill-strong)] transition relative"
              >
                {theme === 'light' && (
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
                {theme === 'dark' && (
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
                {theme === 'system' && (
                  <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
                <span className="absolute -bottom-1 right-1 text-[8px] font-bold uppercase opacity-60">
                  {theme === 'system' ? 'sys' : theme === 'light' ? 'lt' : 'dk'}
                </span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* 2. SECONDARY COLLAPSIBLE SIDEBAR */}
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
                      <button
                        onClick={() => setPrimaryOpen(true)}
                        title="Expand Slim Bar"
                        className="p-1 rounded hover:bg-[var(--glass-fill-strong)] text-[var(--text-secondary)] transition"
                      >
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

                <div className="relative">
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search filters..."
                    className="w-full text-xs px-2.5 py-1.5 rounded-md border border-[var(--glass-border)] bg-[var(--bg-base)] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                  />
                </div>

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
                          isActive
                            ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--glass-fill-strong)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <span>{cat}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
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
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1 block mb-2">
                      Triage Streams
                    </span>
                    <button
                      onClick={() => setActiveTab('Awaiting Reply')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition ${
                        activeTab === 'Awaiting Reply'
                          ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--glass-fill-strong)] hover:text-[var(--text-primary)]'
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
                        activeTab === 'Unsubscribe'
                          ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--glass-fill-strong)] hover:text-[var(--text-primary)]'
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

      {/* 3. CENTER DYNAMIC FEED */}
      <main className="flex-1 min-w-0 p-8 flex flex-col h-screen overflow-y-auto">
        <div className="w-full max-w-5xl mx-auto flex-1">
          <header className="flex justify-between items-center pb-5 border-b border-[var(--glass-border)] mb-6">
            <div>
              <h1 className="text-xl font-bold tracking-tight">{activeTab}</h1>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                AI triage summaries and recommendations.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {activeTab === 'Newsletter/Promotional' && activeMails.length > 1 && (
                <button
                  onClick={() => handleBulkAction(activeMails, 'archive')}
                  disabled={bulkProcessing}
                  className="text-xs font-medium px-3 py-1.5 rounded-md border border-[var(--glass-border)] hover:bg-[var(--glass-fill-strong)] transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {bulkProcessing ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                      Archiving...
                    </>
                  ) : (
                    `Archive all ${activeMails.length}`
                  )}
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

        {/* Improved Pending Approvals Popover with Batch Control */}
        {pendingActions.length > 0 && (
          <div className="fixed bottom-24 right-6 w-84 glass-panel-strong rounded-xl p-4 space-y-3 z-40 max-h-[60vh] overflow-y-auto border border-[var(--glass-border)] shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--glass-border)]">
              <h3 className="font-semibold text-xs text-[var(--text-primary)]">
                Pending Approvals ({pendingActions.length})
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleApproveAllPending}
                  className="text-[10px] font-semibold px-2 py-1 rounded bg-emerald-500/15 text-[var(--accent-success)] hover:bg-emerald-500/25 transition"
                >
                  Approve All
                </button>
                <button
                  onClick={handleRejectAllPending}
                  className="text-[10px] font-medium px-2 py-1 rounded hover:bg-[var(--glass-fill-strong)] text-[var(--text-muted)] transition"
                >
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

      {/* 4. DOCKED COPILOT WORKBENCH */}
      <AnimatePresence>
        {isCopilotDocked && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="h-screen shrink-0 sticky top-0 z-30 overflow-hidden border-l border-[var(--glass-border)]"
          >
            <div className="w-[400px] h-full">
              <ChatPanel
                messages={messages}
                onSend={handleSendMessage}
                onClose={() => {
                  setChatOpen(false)
                  setIsCopilotDocked(false)
                }}
                loading={avatarState === 'thinking'}
                isDocked={true}
                onToggleDock={() => setIsCopilotDocked(false)}
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* 5. FLOATING COPILOT TRIGGER & PANEL */}
      {!isCopilotDocked && (
        <>
          <motion.button
            onClick={() => setChatOpen((v) => !v)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full border shadow-xl backdrop-blur-md"
            style={{
              background: 'var(--bg-elevated)',
              borderColor: avatarState === 'alert' ? 'var(--accent-warm)' : 'var(--glass-border)',
            }}
          >
            <div className="relative flex items-center justify-center">
              <BlobAvatar state={avatarState} size={40} />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${avatarState === 'thinking' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${avatarState === 'thinking' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
              </span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Envoy</span>
              <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                {avatarState === 'thinking' ? 'Thinking...' : 'AI Copilot'}
              </span>
            </div>
          </motion.button>

          <AnimatePresence>
            {chatOpen && (
              <ChatPanel
                messages={messages}
                onSend={handleSendMessage}
                onClose={() => setChatOpen(false)}
                loading={avatarState === 'thinking'}
                isDocked={false}
                onToggleDock={() => {
                  setChatOpen(false)
                  setIsCopilotDocked(true)
                }}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}

export default Dashboard