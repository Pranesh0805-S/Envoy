import { useState } from 'react'

const CATEGORY_OPTIONS = ['Urgent', 'Important', 'Job/Career', 'Security', 'Newsletter/Promotional', 'Social', 'Spam-like']

function VipRulesPanel({ rules, onCreate, onDelete, onClose }) {
  const [ruleType, setRuleType] = useState('sender')
  const [ruleValue, setRuleValue] = useState('')
  const [action, setAction] = useState('Urgent')
  const [submitting, setSubmitting] = useState(false)

  async function handleAdd() {
    if (!ruleValue.trim()) return
    setSubmitting(true)
    await onCreate(ruleType, ruleValue.trim(), action)
    setRuleValue('')
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md rounded-xl border p-5 space-y-4" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--glass-border)' }}>
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">VIP Rules</h3>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-lg leading-none">×</button>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Rules override AI categorization. Emails matching a rule always go to the chosen category.
        </p>

        <div className="space-y-2 p-3 rounded-lg border" style={{ borderColor: 'var(--glass-border)' }}>
          <div className="flex gap-2">
            <select
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value)}
              className="text-xs px-2 py-1.5 rounded border bg-transparent text-[var(--text-primary)]"
              style={{ borderColor: 'var(--glass-border)' }}
            >
              <option value="sender">Sender contains</option>
              <option value="keyword">Keyword contains</option>
            </select>
            <input
              value={ruleValue}
              onChange={(e) => setRuleValue(e.target.value)}
              placeholder={ruleType === 'sender' ? 'e.g. boss@company.com' : 'e.g. invoice'}
              className="flex-1 text-xs px-2 py-1.5 rounded border bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              style={{ borderColor: 'var(--glass-border)' }}
            />
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-[var(--text-secondary)]">→ Always mark as</span>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="text-xs px-2 py-1.5 rounded border bg-transparent text-[var(--text-primary)] flex-1"
              style={{ borderColor: 'var(--glass-border)' }}
            >
              {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={submitting || !ruleValue.trim()}
            className="w-full text-xs font-semibold px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 transition disabled:opacity-40"
          >
            {submitting ? 'Adding...' : '+ Add Rule'}
          </button>
        </div>

        <div className="space-y-1.5 max-h-52 overflow-y-auto">
          {rules.length === 0 && (
            <p className="text-xs text-center py-4 text-[var(--text-muted)]">No rules yet</p>
          )}
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between text-xs px-3 py-2 rounded-md"
              style={{ background: 'var(--glass-fill-strong)' }}
            >
              <span className="text-[var(--text-primary)]">
                {rule.rule_type === 'sender' ? 'Sender' : 'Keyword'} "{rule.rule_value}" → {rule.action}
              </span>
              <button
                onClick={() => onDelete(rule.id)}
                className="text-[var(--accent-danger)] hover:opacity-70 transition ml-2 shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default VipRulesPanel