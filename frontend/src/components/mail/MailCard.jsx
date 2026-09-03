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
        className="glass-panel rounded-lg p-4 flex flex-col justify-between"
        style={{ borderColor: pendingAction === 'delete' ? 'var(--accent-danger)' : 'var(--accent-primary)' }}
      >
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: pendingAction === 'delete' ? 'var(--accent-danger)' : 'var(--accent-primary)' }}>
            Confirm {pendingAction}
          </p>
          <p className="text-sm font-medium line-clamp-2" style={{ color: 'var(--text-primary)' }}>
            {mail.summary}
          </p>
        </div>
        <div className="flex gap-2 pt-3">
          <button
            onClick={handleConfirm}
            disabled={executing}
            className="flex-1 text-xs py-1.5 px-3 rounded-md font-medium transition disabled:opacity-50"
            style={
              pendingAction === 'delete'
                ? { background: 'var(--accent-danger)', color: 'white' }
                : { background: 'var(--accent-primary)', color: 'var(--accent-primary-text)' }
            }
          >
            {executing ? 'Processing...' : `Yes, ${pendingAction}`}
          </button>
          <button
            onClick={() => setPendingAction(null)}
            disabled={executing}
            className="flex-1 text-xs py-1.5 px-3 rounded-md font-medium border"
            style={{ borderColor: 'var(--glass-border)', color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group glass-panel rounded-lg p-4 flex flex-col justify-between transition-all duration-150 hover:border-slate-400/30">
      <div className="space-y-2">
        {/* Card Header: Tags & Confidence */}
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-1.5">
            {mail.needsAction && (
              <span
                className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
                style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)' }}
              >
                Action Required
              </span>
            )}
            {mail.isMeeting && (
              <span
                className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
                style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)' }}
              >
                Calendar
              </span>
            )}
          </div>

          {typeof mail.confidence === 'number' && (
            <button
              onClick={() => setShowWhy((v) => !v)}
              className="text-[11px] font-medium opacity-60 hover:opacity-100 transition"
              style={{ color: 'var(--text-secondary)' }}
            >
              {mail.confidence}% match
            </button>
          )}
        </div>

        {/* Email Content */}
        <div>
          <p className="text-sm font-medium leading-snug line-clamp-3" style={{ color: 'var(--text-primary)' }}>
            {mail.summary}
          </p>
        </div>

        {showWhy && mail.reasoning && (
          <div
            className="text-xs p-2.5 rounded-md leading-relaxed"
            style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}
          >
            {mail.reasoning}
          </div>
        )}

        {showDatePicker && (
          <div className="p-2.5 rounded-md space-y-2" style={{ background: 'var(--bg-subtle)' }}>
            <p className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>Select Meeting Schedule:</p>
            <div className="flex gap-2">
              <input
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="flex-1 text-xs px-2 py-1.5 rounded border bg-transparent"
                style={{ borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
              />
              <input
                type="time"
                value={manualTime}
                onChange={(e) => setManualTime(e.target.value)}
                className="flex-1 text-xs px-2 py-1.5 rounded border bg-transparent"
                style={{ borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
              />
            </div>
            <button
              onClick={handleManualConfirm}
              disabled={!manualDate || !manualTime}
              className="w-full text-xs py-1 rounded font-medium disabled:opacity-40"
              style={{ background: 'var(--accent-primary)', color: 'var(--accent-primary-text)' }}
            >
              Confirm
            </button>
          </div>
        )}
      </div>

      {/* Action Footer: Revealed on Card Hover */}
      <div className="flex justify-between items-center pt-3 mt-2 border-t" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setPendingAction('archive')}
            className="text-xs font-medium px-2.5 py-1 rounded hover:bg-slate-500/10 transition"
            style={{ color: 'var(--text-secondary)' }}
          >
            Archive
          </button>
          <button
            onClick={() => setPendingAction('delete')}
            className="text-xs font-medium px-2.5 py-1 rounded hover:bg-red-500/10 transition"
            style={{ color: 'var(--accent-danger)' }}
          >
            Delete
          </button>
        </div>

        {mail.isMeeting && (
          <button
            onClick={handleCalendarClick}
            className="text-xs font-medium px-2.5 py-1 rounded ml-auto transition"
            style={{ background: 'var(--accent-primary)', color: 'var(--accent-primary-text)' }}
          >
            {mail.meetingTime ? 'Add to Calendar' : 'Schedule'}
          </button>
        )}
      </div>
    </div>
  )
}

export default MailCard