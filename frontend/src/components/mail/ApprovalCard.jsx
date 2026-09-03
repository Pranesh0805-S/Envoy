function ApprovalCard({ action, onApprove, onReject }) {
  const subject = action.payload?.subject || action.payload?.summary || 'Email action pending approval'
  const isDelete = action.action_type === 'delete'

  return (
    <div
      className="rounded-lg p-3 space-y-2 border border-[var(--glass-border)] bg-[var(--bg-subtle)] transition hover:border-slate-400/30"
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
          style={{
            background: isDelete ? 'rgba(239, 68, 68, 0.12)' : 'rgba(99, 102, 241, 0.12)',
            color: isDelete ? 'var(--accent-danger)' : 'var(--accent-primary)',
          }}
        >
          {action.action_type}
        </span>
      </div>

      <p className="text-xs leading-snug font-medium line-clamp-2 text-[var(--text-primary)]">
        {subject}
      </p>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onApprove(action.id)}
          className="flex-1 text-xs py-1.5 rounded font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition"
        >
          Approve
        </button>
        <button
          onClick={() => onReject(action.id)}
          className="flex-1 text-xs py-1.5 rounded font-medium border border-[var(--glass-border)] hover:bg-[var(--glass-fill-strong)] text-[var(--text-secondary)] transition"
        >
          Reject
        </button>
      </div>
    </div>
  )
}

export default ApprovalCard