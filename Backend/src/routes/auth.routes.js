const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')
const verifyAuth = require('../middleware/auth')

// Called once from frontend right after Google OAuth redirect completes
router.post('/save-google-tokens', verifyAuth, async (req, res) => {
  const { provider_token, provider_refresh_token, expires_at } = req.body
  const userId = req.user.id
  const email = req.user.email

  const { error } = await supabase
    .from('users')
    .upsert({
      id: userId,
      email,
      google_access_token: provider_token,
      google_refresh_token: provider_refresh_token,
      token_expires_at: expires_at ? new Date(expires_at * 1000) : null,
    })

  if (error) return res.status(500).json({ error: error.message })

  res.json({ success: true })
})

module.exports = router