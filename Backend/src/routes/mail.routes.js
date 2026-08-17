const express = require('express')
const router = express.Router()
const verifyAuth = require('../middleware/auth')
const { getInboxDigest } = require('../services/gmailService')
const { categorizeInbox } = require('../services/agentService')

router.get('/digest', verifyAuth, async (req, res) => {
  try {
    const digest = await getInboxDigest(req.user.id)
    res.json({ digest })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/digest-smart', verifyAuth, async (req, res) => {
  try {
    const digest = await getInboxDigest(req.user.id)
    const categorized = await categorizeInbox(digest)
    res.json({ digest, categorized })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router