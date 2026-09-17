const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')
const verifyAuth = require('../middleware/auth')

router.post('/save-google-tokens', verifyAuth, async (req, res) => {
  const { provider_token, provider_refresh_token, expires_at } = req.body
  const userId = req.user.id
  const email = req.user.email

  await supabase.from('users').upsert({ id: userId, email })

  const { data: existing } = await supabase
    .from('linked_accounts')
    .select('id')
    .eq('user_id', userId)
    .eq('google_email', email)
    .maybeSingle()

  const { error } = await supabase
    .from('linked_accounts')
    .upsert({
      id: existing?.id,
      user_id: userId,
      google_email: email,
      google_access_token: provider_token,
      google_refresh_token: provider_refresh_token,
      token_expires_at: expires_at ? new Date(expires_at * 1000) : null,
      is_primary: !existing,
    })

  if (error) return res.status(500).json({ error: error.message })

  res.json({ success: true })
})

router.get('/linked-accounts', verifyAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('linked_accounts')
    .select('id, google_email, is_primary, created_at')
    .eq('user_id', req.user.id)
    .order('created_at')

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

module.exports = router