import MailCard from './MailCard'

function WorkbenchColumn({ title, mails, onPropose, onBulkAction, onAddToCalendar }) {
  return (
    <div className="flex flex-col gap-3 min-w-[280px] max-w-[320px]">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-sm font-semibold text-white/70">{title}</h3>
        <span className="text-xs text-white/40">{mails.length}</span>
      </div>

      {mails.length > 1 && onBulkAction && (
        <button
          onClick={() => onBulkAction(mails, 'archive')}
          className="text-xs px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition text-white/60"
        >
          Archive all {mails.length}
        </button>
      )}

      <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-1">
        {mails.map((mail, i) => (
          <MailCard
            key={mail.gmailId || i}
            mail={mail}
            onPropose={onPropose}
            onAddToCalendar={onAddToCalendar}
          />
        ))}
        {mails.length === 0 && (
          <p className="text-xs text-white/30 text-center py-6">Nothing here</p>
        )}
      </div>
    </div>
  )
}

export default WorkbenchColumn