const express = require('express')
const router = express.Router()
const verifyAuth = require('../middleware/auth')
const { getInboxDigest, getAwaitingReplies, getUnsubscribeCandidates } = require('../services/gmailService')
const { categorizeInbox } = require('../services/agentService')
const { getVipRules, applyVipRules } = require('../services/vipRulesService')

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
    const pageToken = req.query.pageToken || null
    const { digest, nextPageToken } = await getInboxDigest(req.user.id, pageToken)
    const categorized = await categorizeInbox(digest)

    const merged = categorized.map((item, i) => ({
      ...item,
      gmailId: digest[i]?.id,
      from: digest[i]?.from,
      subject: digest[i]?.subject,
      date: digest[i]?.date,
    }))

    const rules = await getVipRules(req.user.id)
    const final = applyVipRules(merged, digest, rules)

    res.json({ digest, categorized: final, nextPageToken })
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

router.get('/unsubscribe-candidates', verifyAuth, async (req, res) => {
  try {
    const candidates = await getUnsubscribeCandidates(req.user.id)
    res.json({ candidates })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router