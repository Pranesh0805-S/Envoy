const express = require('express')
const router = express.Router()
const verifyAuth = require('../middleware/auth')
const resolveLinkedAccount = require('../middleware/linkedAccount')
const { getInboxDigest, getAwaitingReplies, getUnsubscribeCandidates, createDraft } = require('../services/gmailService')
const { categorizeInbox } = require('../services/agentService')
const { getVipRules, applyVipRules } = require('../services/vipRulesService')

router.get('/digest', verifyAuth, resolveLinkedAccount, async (req, res) => {
  try {
    const digest = await getInboxDigest(req.linkedAccount)
    res.json({ digest })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/digest-smart', verifyAuth, resolveLinkedAccount, async (req, res) => {
  try {
    const digest = await getInboxDigest(req.linkedAccount)
    const categorized = await categorizeInbox(digest, req.linkedAccount.id)

    const merged = categorized.map((item, i) => ({
      ...item,
      gmailId: digest[i]?.id,
      from: digest[i]?.from,
      subject: digest[i]?.subject,
      date: digest[i]?.date,
    }))

    const rules = await getVipRules(req.user.id)
    const final = applyVipRules(merged, digest, rules)

    res.json({ digest, categorized: final })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/awaiting-replies', verifyAuth, resolveLinkedAccount, async (req, res) => {
  try {
    const replies = await getAwaitingReplies(req.linkedAccount)
    res.json({ awaitingReplies: replies })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/unsubscribe-candidates', verifyAuth, resolveLinkedAccount, async (req, res) => {
  try {
    const candidates = await getUnsubscribeCandidates(req.linkedAccount)
    res.json({ candidates })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/draft', verifyAuth, resolveLinkedAccount, async (req, res) => {
  try {
    const { to, subject, body } = req.body
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'to, subject, and body are all required' })
    }
    const draft = await createDraft(req.linkedAccount, to, subject, body)
    res.json({ draft })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router