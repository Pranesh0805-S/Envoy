const supabase = require('../config/supabase')

async function resolveLinkedAccount(req, res, next) {
  const linkedAccountId = req.query.linkedAccountId || req.headers['x-linked-account-id']

  if (!linkedAccountId) {
    return res.status(400).json({ error: 'linkedAccountId is required' })
  }

  const { data, error } = await supabase
    .from('linked_accounts')
    .select('*')
    .eq('id', linkedAccountId)
    .eq('user_id', req.user.id)
    .single()

  if (error || !data) {
    return res.status(404).json({ error: 'Linked account not found' })
  }

  req.linkedAccount = data
  next()
}

module.exports = resolveLinkedAccount