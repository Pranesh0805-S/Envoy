function MailCard({ mail, onPropose, onAddToCalendar }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 space-y-2 hover:bg-white/10 transition">
      <div className="flex justify-between items-start gap-2">
        <div className="flex gap-1 flex-wrap">
          {mail.needsAction && (
            <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded-full">
              Needs Action
            </span>
          )}
          {mail.isMeeting && (
            <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full">
              Meeting
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-white/90">{mail.summary}</p>

      <div className="flex gap-2 pt-1 flex-wrap">
        <button
          onClick={() => onPropose(mail.gmailId, 'archive')}
          className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition"
        >
          Archive
        </button>
        <button
          onClick={() => onPropose(mail.gmailId, 'delete')}
          className="text-xs px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition"
        >
          Delete
        </button>
        {mail.isMeeting && mail.meetingTime && (
          <button
            onClick={() => onAddToCalendar(mail)}
            className="text-xs px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition"
          >
            Add to Calendar
          </button>
        )}
      </div>
    </div>
  )
}

export default MailCard