function ApprovalCard({ action, onApprove, onReject }) {
  const subject = action.payload?.subject || 'this email'

  return (
    <div
      className="rounded-lg p-3 space-y-2"
      style={{ background: 'var(--glass-fill)', color: 'var(--text-primary)' }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded-full capitalize"
          style={{
            background: action.action_type === 'delete' ? 'rgba(224, 113, 110, 0.15)' : 'rgba(200, 168, 118, 0.15)',
            color: action.action_type === 'delete' ? 'var(--accent-danger)' : 'var(--accent-primary)',
          }}
        >
          {action.action_type}
        </span>
      </div>
      <p className="text-xs leading-snug" style={{ color: 'var(--text-secondary)' }}>
        {subject}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onApprove(action.id)}
          className="flex-1 text-xs px-2 py-1.5 rounded glass-btn"
          style={{ background: 'rgba(126, 201, 143, 0.15)', color: 'var(--accent-success)' }}
        >
          Approve
        </button>
        <button
          onClick={() => onReject(action.id)}
          className="flex-1 text-xs px-2 py-1.5 rounded glass-btn"
          style={{ background: 'var(--glass-fill-strong)', color: 'var(--text-secondary)' }}
        >
          Reject
        </button>
      </div>
    </div>
  )
}

export default ApprovalCard