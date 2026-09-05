import { useState } from 'react'

function MailCard({ mail, onExecute, onAddToCalendar }) {
  const [showWhy, setShowWhy] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [manualDate, setManualDate] = useState('')
  const [manualTime, setManualTime] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const [executing, setExecuting] = useState(false)

  const summaryText = mail.summary || ''
  const firstWord = summaryText.split(' ')[0] || ''
  let brand = mail.from?.replace(/<.*>/, '').replace(/"/g, '').trim()
  if (!brand || brand.toLowerCase() === 'mail') brand = firstWord || 'Inbox'
  const brandInitial = brand.charAt(0).toUpperCase() || 'E'
  const relativeTime = mail.receivedAgo || mail.date || 'Today'

  function handleCalendarClick() {
    if (mail.meetingTime) onAddToCalendar(mail)
    else setShowDatePicker((v) => !v)
  }

  function handleManualConfirm() {
    if (!manualDate || !manualTime) return
    onAddToCalendar({ ...mail, meetingTime: `${manualDate}T${manualTime}:00` })
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
        className="rounded-lg p-4 flex items-center justify-between border bg-[var(--bg-elevated)] shadow-sm"
        style={{ borderColor: pendingAction === 'delete' ? 'var(--accent-danger)' : 'var(--accent-primary)' }}
      >
        <div className="space-y-0.5 pr-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-danger)]">
            Confirm {pendingAction}
          </span>
          <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-1">{summaryText}</p>
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
    <div className="group relative rounded-lg p-4 bg-[var(--bg-elevated)] border border-[var(--glass-border)] transition-all duration-150 hover:border-indigo-400/40 flex items-start gap-4">
      <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 select-none border border-indigo-500/20">
        {brandInitial}
      </div>

      <div className="space-y-1 flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[200px]">{brand}</span>
          {mail.needsAction && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/10 text-red-500 shrink-0">
              Action Required
            </span>
          )}
          {mail.isMeeting && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 shrink-0">
              Calendar
            </span>
          )}
          {typeof mail.confidence === 'number' && (
            <button
              onClick={() => setShowWhy((v) => !v)}
              className="text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition shrink-0"
            >
              {mail.confidence}% match · Why?
            </button>
          )}
          <span className="text-[11px] text-[var(--text-muted)] ml-auto">{relativeTime}</span>
        </div>

        <p className="text-sm font-medium leading-relaxed text-[var(--text-primary)] break-words pt-0.5">
          {summaryText}
        </p>

        {showWhy && mail.reasoning && (
          <p className="text-xs p-2.5 rounded-md bg-[var(--bg-subtle)] text-[var(--text-secondary)] mt-2 leading-relaxed border border-[var(--glass-border)]">
            {mail.reasoning}
          </p>
        )}

        {showDatePicker && (
          <div className="flex items-center gap-2 pt-2">
            <input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)}
              className="text-xs px-2 py-1.5 rounded border border-[var(--glass-border)] bg-transparent text-[var(--text-primary)]" />
            <input type="time" value={manualTime} onChange={(e) => setManualTime(e.target.value)}
              className="text-xs px-2 py-1.5 rounded border border-[var(--glass-border)] bg-transparent text-[var(--text-primary)]" />
            <button onClick={handleManualConfirm}
              className="text-xs px-3 py-1.5 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-500">
              Add
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pt-0.5">
        <button onClick={() => setPendingAction('archive')} title="Archive"
          className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-fill-strong)] transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </button>
        <button onClick={() => setPendingAction('delete')} title="Delete"
          className="p-1.5 rounded-md text-[var(--accent-danger)] hover:bg-red-500/10 transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        {mail.isMeeting && (
          <button onClick={handleCalendarClick} title="Add to Calendar"
            className="p-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 transition ml-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default MailCard