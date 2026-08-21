function MailCard({ mail, onPropose, onAddToCalendar }) {
  return (
    <div className="glass-panel rounded-2xl p-4 space-y-3 hover:bg-white/[0.09] transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex justify-between items-start gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {mail.needsAction && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(240, 163, 94, 0.15)', color: 'var(--color-accent-warm)' }}>
              Needs Action
            </span>
          )}
          {mail.isMeeting && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(139, 124, 246, 0.15)', color: 'var(--color-accent-primary)' }}>
              Meeting
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-white/85 leading-relaxed">{mail.summary}</p>

      <div className="flex gap-2 pt-1 flex-wrap">
        <button
          onClick={() => onPropose(mail.gmailId, 'archive')}
          className="text-xs px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 rounded-lg transition"
        >
          Archive
        </button>
        <button
          onClick={() => onPropose(mail.gmailId, 'delete')}
          className="text-xs px-3 py-1.5 rounded-lg transition"
          style={{ background: 'rgba(240, 97, 94, 0.12)', color: 'var(--color-accent-danger)', border: '1px solid rgba(240, 97, 94, 0.2)' }}
        >
          Delete
        </button>
        {mail.isMeeting && mail.meetingTime && (
          <button
            onClick={() => onAddToCalendar(mail)}
            className="text-xs px-3 py-1.5 rounded-lg transition"
            style={{ background: 'rgba(139, 124, 246, 0.15)', color: 'var(--color-accent-primary)', border: '1px solid rgba(139, 124, 246, 0.25)' }}
          >
            Add to Calendar
          </button>
        )}
      </div>
    </div>
  )
}

export default MailCard