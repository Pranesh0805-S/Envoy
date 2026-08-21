import MailCard from './MailCard'

function WorkbenchColumn({ title, mails, onPropose, onBulkAction, onAddToCalendar }) {
  return (
    <div className="flex flex-col gap-3 min-w-[290px] max-w-[320px]">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-sm font-semibold text-white/60 tracking-wide uppercase text-[11px]">{title}</h3>
        <span className="text-xs text-white/30 font-medium">{mails.length}</span>
      </div>

      {mails.length > 1 && onBulkAction && (
        <button
          onClick={() => onBulkAction(mails, 'archive')}
          className="text-xs px-3 py-2.5 glass-panel rounded-xl transition text-white/50 hover:text-white/80 hover:bg-white/[0.1]"
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
          <p className="text-xs text-white/20 text-center py-8">Nothing here</p>
        )}
      </div>
    </div>
  )
}

export default WorkbenchColumn