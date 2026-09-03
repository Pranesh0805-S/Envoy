import { useState } from 'react'

function MailCard({ mail, onExecute, onAddToCalendar }) {
  const [showWhy, setShowWhy] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [manualDate, setManualDate] = useState('')
  const [manualTime, setManualTime] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const [executing, setExecuting] = useState(false)

  function handleCalendarClick() {
    if (mail.meetingTime) {
      onAddToCalendar(mail)
    } else {
      setShowDatePicker((v) => !v)
    }
  }

  function handleManualConfirm() {
    if (!manualDate || !manualTime) return
    const combined = `${manualDate}T${manualTime}:00`
    onAddToCalendar({ ...mail, meetingTime: combined })
    setShowDatePicker(false)
  }

  async function handleConfirm() {
    setExecuting(true)
    await onExecute(mail.gmailId, pendingAction, mail.summary)
    setExecuting(false)
    setPendingAction(null)
  }

  if (pendingAction) {
    return (
      <div
        className="glass-panel rounded-lg p-4 flex items-center justify-between border"
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
    <div className="group glass-panel rounded-lg p-4 transition-all duration-150 hover:border-slate-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Left Content Area (Contains all text; protected from overlapping) */}
      <div className="space-y-2 flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2">
          {mail.needsAction && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/10 text-red-500 shrink-0">
              Needs Action
            </span>
          )}
          {mail.isMeeting && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 shrink-0">
              Meeting
            </span>
          )}
          {typeof mail.confidence === 'number' && (
            <button
              onClick={() => setShowWhy((v) => !v)}
              className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition shrink-0"
            >
              {mail.confidence}% match · Why?
            </button>
          )}
        </div>

        <p className="text-sm font-medium leading-relaxed text-[var(--text-primary)] break-words">
          {mail.summary}
        </p>

        {showWhy && mail.reasoning && (
          <p className="text-xs p-2.5 rounded-md bg-[var(--bg-subtle)] text-[var(--text-secondary)] mt-2 leading-relaxed">
            {mail.reasoning}
          </p>
        )}

        {showDatePicker && (
          <div className="flex items-center gap-2 pt-2">
            <input
              type="date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="text-xs px-2 py-1.5 rounded border border-[var(--glass-border)] bg-transparent text-[var(--text-primary)]"
            />
            <input
              type="time"
              value={manualTime}
              onChange={(e) => setManualTime(e.target.value)}
              className="text-xs px-2 py-1.5 rounded border border-[var(--glass-border)] bg-transparent text-[var(--text-primary)]"
            />
            <button
              onClick={handleManualConfirm}
              className="text-xs px-3 py-1.5 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-500"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Right Action Controls (Pinned on the right side) */}
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <button
          onClick={() => setPendingAction('archive')}
          className="text-xs font-medium px-3 py-1.5 rounded text-[var(--text-secondary)] hover:bg-[var(--glass-fill-strong)] hover:text-[var(--text-primary)] transition"
        >
          Archive
        </button>
        <button
          onClick={() => setPendingAction('delete')}
          className="text-xs font-medium px-3 py-1.5 rounded text-[var(--accent-danger)] hover:bg-red-500/10 transition"
        >
          Delete
        </button>
        {mail.isMeeting && (
          <button
            onClick={handleCalendarClick}
            className="text-xs font-medium px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-500 transition"
          >
            {mail.meetingTime ? 'Add to Cal' : 'Schedule'}
          </button>
        )}
      </div>
    </div>
  )
}

export default MailCard