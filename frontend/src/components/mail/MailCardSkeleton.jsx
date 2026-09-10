function MailCardSkeleton() {
  return (
    <div className="rounded-lg p-4 border flex items-start gap-4" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--glass-border)' }}>
      <div className="skeleton w-8 h-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex gap-2 items-center">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-3 w-16 rounded ml-auto" />
        </div>
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
      </div>
    </div>
  )
}

export default MailCardSkeleton