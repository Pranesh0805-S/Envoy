const express = require('express')
const router = express.Router()
const verifyAuth = require('../middleware/auth')
const { getInboxDigest, getAwaitingReplies } = require('../services/gmailService')
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

    const merged = categorized.map((item, i) => ({
      ...item,
      gmailId: digest[i]?.id,
    }))

    res.json({ digest, categorized: merged })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/awaiting-replies', verifyAuth, async (req, res) => {
  try {
    const replies = await getAwaitingReplies(req.user.id)
    res.json({ awaitingReplies: replies })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router