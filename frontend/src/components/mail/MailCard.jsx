import { useState } from 'react'

function MailCard({ mail, onExecute, onAddToCalendar }) {
  const [showWhy, setShowWhy] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [executing, setExecuting] = useState(false)

  // Extract a fallback 1-letter monogram from the brand name or summary
  const brandLetter = (mail.from || mail.summary || 'E').trim().charAt(0).toUpperCase()

  async function handleConfirm() {
    setExecuting(true)
    await onExecute(mail.gmailId, pendingAction, mail.summary)
    setExecuting(false)
    setPendingAction(null)
  }

  if (pendingAction) {
    return (
      <div
        className="glass-panel rounded-lg p-4 flex items-center justify-between border shadow-sm"
        style={{ borderColor: pendingAction === 'delete' ? 'var(--accent-danger)' : 'var(--accent-primary)' }}
      >
        <div className="space-y-0.5 pr-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-danger)]">
            Confirm {pendingAction}
          </span>
          <p className="text-sm font-medium text-[var(--text-primary)]">{mail.summary}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleConfirm}
            disabled={executing}
            className="text-xs px-3 py-1.5 rounded-md font-semibold text-white bg-red-500 hover:bg-red-600 transition"
          >
            {executing ? 'Processing...' : `Yes, ${pendingAction}`}
          </button>
          <button
            onClick={() => setPendingAction(null)}
            className="text-xs px-3 py-1.5 rounded-md font-medium border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-fill-strong)] transition"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group glass-panel rounded-lg p-4 transition-all duration-150 hover:border-slate-400/40 hover:shadow-sm flex items-start justify-between gap-4 border border-[var(--glass-border)]">
      {/* Monogram Icon */}
      <div className="w-8 h-8 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
        {brandLetter}
      </div>

      {/* Content Area */}
      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {mail.needsAction && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/10 text-red-500">
              Needs Action
            </span>
          )}
          {mail.isMeeting && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500">
              Meeting
            </span>
          )}
          {typeof mail.confidence === 'number' && (
            <button
              onClick={() => setShowWhy((v) => !v)}
              className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
            >
              {mail.confidence}% match · Why?
            </button>
          )}
          <span className="text-[11px] text-[var(--text-muted)] ml-auto sm:ml-0">
            {mail.receivedAgo || 'Recently'}
          </span>
        </div>

        <p className="text-sm font-medium leading-relaxed text-[var(--text-primary)] break-words">
          {mail.summary}
        </p>

        {showWhy && mail.reasoning && (
          <p className="text-xs p-2.5 rounded-md bg-[var(--bg-subtle)] text-[var(--text-secondary)] mt-2 leading-relaxed">
            {mail.reasoning}
          </p>
        )}
      </div>

      {/* Action Controls: Faded until row is hovered */}
      <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity pt-0.5">
        <button
          onClick={() => setPendingAction('archive')}
          className="text-xs font-medium px-2.5 py-1 rounded text-[var(--text-secondary)] hover:bg-[var(--glass-fill-strong)] hover:text-[var(--text-primary)] transition"
        >
          Archive
        </button>
        <button
          onClick={() => setPendingAction('delete')}
          className="text-xs font-medium px-2.5 py-1 rounded text-[var(--accent-danger)] hover:bg-red-500/10 transition"
        >
          Delete
        </button>
        {mail.isMeeting && (
          <button
            onClick={() => onAddToCalendar(mail)}
            className="text-xs font-medium px-2.5 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-500 transition"
          >
            Schedule
          </button>
        )}
      </div>
    </div>
  )
}

export default MailCard