import { signInWithGoogle } from '../../lib/auth'

function AccountSwitcher({ accounts, activeAccountId, onSelect }) {
  return (
    <div className="space-y-1 px-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-2">
        Gmail Accounts
      </span>
      {accounts.map((acc) => (
        <button
          key={acc.id}
          onClick={() => onSelect(acc.id)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition ${
            activeAccountId === acc.id
              ? 'bg-indigo-600 text-white font-semibold shadow-sm'
              : 'text-[var(--text-secondary)] hover:bg-[var(--glass-fill-strong)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span className="truncate">{acc.google_email}</span>
          {acc.is_primary && (
            <span className="text-[9px] opacity-70 ml-2 shrink-0">Primary</span>
          )}
        </button>
      ))}
      <button
        onClick={signInWithGoogle}
        className="w-full text-left px-3 py-2 rounded-md text-xs font-medium text-indigo-500 hover:bg-[var(--glass-fill-strong)] transition"
      >
        + Add Gmail account
      </button>
    </div>
  )
}

export default AccountSwitcher