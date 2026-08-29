import { useState } from 'react'

function MailCard({ mail, onExecute, onAddToCalendar }) {
  const [showWhy, setShowWhy] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [manualDate, setManualDate] = useState('')
  const [manualTime, setManualTime] = useState('')
  const [pendingAction, setPendingAction] = useState(null) // 'archive' | 'delete' | null
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
        className="glass-panel rounded-xl p-4 space-y-3"
        style={{ color: 'var(--text-primary)', borderColor: pendingAction === 'delete' ? 'var(--accent-danger)' : 'var(--accent-primary)' }}
      >
        <p className="text-sm font-medium">
          {pendingAction === 'delete' ? 'Delete this email?' : 'Archive this email?'}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {mail.summary}
        </p>
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleConfirm}
            disabled={executing}
            className="flex-1 text-xs px-3 py-2 rounded-lg glass-btn disabled:opacity-50"
            style={
              pendingAction === 'delete'
                ? { background: 'var(--accent-danger)', color: 'white' }
                : { background: 'var(--accent-primary)', color: 'var(--accent-primary-text)' }
            }
          >
            {executing ? 'Working...' : `Yes, ${pendingAction}`}
          </button>
          <button
            onClick={() => setPendingAction(null)}
            disabled={executing}
            className="flex-1 text-xs px-3 py-2 rounded-lg glass-btn"
            style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="glass-panel rounded-xl p-4 space-y-3 transition-all duration-200 hover:-translate-y-0.5"
      style={{ color: 'var(--text-primary)' }}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {mail.needsAction && (
            <span
              className="text-[11px] font-medium px-2 py-0.5 rounded-md"
              style={{ background: 'var(--glass-fill-strong)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}
            >
              Needs Action
            </span>
          )}
          {mail.isMeeting && (
            <span
              className="text-[11px] font-medium px-2 py-0.5 rounded-md"
              style={{ background: 'var(--glass-fill-strong)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}
            >
              Meeting
            </span>
          )}
        </div>
        {typeof mail.confidence === 'number' && (
          <button
            onClick={() => setShowWhy((v) => !v)}
            className="text-[11px] px-2 py-0.5 rounded-md glass-btn shrink-0"
            style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }}
          >
            {mail.confidence}% · Why?
          </button>
        )}
      </div>

      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {mail.summary}
      </p>

      {showWhy && mail.reasoning && (
        <p
          className="text-xs px-3 py-2 rounded-lg font-medium"
          style={{ background: 'var(--glass-fill-strong)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
        >
          {mail.reasoning}
        </p>
      )}

      {showDatePicker && (
        <div
          className="flex flex-col gap-2 p-3 rounded-lg"
          style={{ background: 'var(--glass-fill-strong)', border: '1px solid var(--glass-border)' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            No date/time detected — pick one:
          </p>
          <div className="flex gap-2">
            <input
              type="date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="flex-1 text-xs px-2 py-2 rounded-lg outline-none border"
              style={{ color: 'var(--text-primary)', background: 'var(--bg-elevated)', borderColor: 'var(--glass-border)' }}
            />
            <input
              type="time"
              value={manualTime}
              onChange={(e) => setManualTime(e.target.value)}
              className="flex-1 text-xs px-2 py-2 rounded-lg outline-none border"
              style={{ color: 'var(--text-primary)', background: 'var(--bg-elevated)', borderColor: 'var(--glass-border)' }}
            />
          </div>
          <button
            onClick={handleManualConfirm}
            disabled={!manualDate || !manualTime}
            className="text-xs px-3 py-1.5 rounded-lg transition glass-btn disabled:opacity-40"
            style={{ background: 'var(--accent-primary)', color: 'var(--accent-primary-text)' }}
          >
            Confirm & Add
          </button>
        </div>
      )}

      <div className="flex gap-2 pt-1 flex-wrap">
        <button
          onClick={() => setPendingAction('archive')}
          className="text-xs px-3 py-1.5 rounded-lg transition glass-btn glass-panel"
          style={{ color: 'var(--text-secondary)' }}
        >
          Archive
        </button>
        <button
          onClick={() => setPendingAction('delete')}
          className="text-xs px-3 py-1.5 rounded-lg transition glass-btn"
          style={{ background: 'transparent', color: 'var(--accent-danger)', border: '1px solid var(--glass-border)' }}
        >
          Delete
        </button>
        {mail.isMeeting && (
          <button
            onClick={handleCalendarClick}
            className="text-xs px-3 py-1.5 rounded-lg transition glass-btn"
            style={{ background: 'var(--accent-primary)', color: 'var(--accent-primary-text)' }}
          >
            {mail.meetingTime ? 'Add to Calendar' : 'Mark Date & Add'}
          </button>
        )}
      </div>
    </div>
  )
}

export default MailCard