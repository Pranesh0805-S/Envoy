const express = require('express')
const router = express.Router()
const verifyAuth = require('../middleware/auth')
const resolveLinkedAccount = require('../middleware/linkedAccount')
const { createPendingAction, getPendingActions, updateActionStatus } = require('../services/approvalQueue')
const { deleteEmail, archiveEmail } = require('../services/gmailService')

router.post('/propose', verifyAuth, async (req, res) => {
  try {
    const { actionType, emailId, payload } = req.body
    const action = await createPendingAction(req.user.id, actionType, emailId, payload)
    res.json({ action })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/pending', verifyAuth, async (req, res) => {
  try {
    const actions = await getPendingActions(req.user.id)
    res.json({ actions })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/approve', verifyAuth, resolveLinkedAccount, async (req, res) => {
  try {
    const action = await updateActionStatus(req.user.id, req.params.id, 'approved')

    if (action.action_type === 'delete') {
      await deleteEmail(req.linkedAccount, action.target_email_id)
    } else if (action.action_type === 'archive') {
      await archiveEmail(req.linkedAccount, action.target_email_id)
    }

    res.json({ success: true, action })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/reject', verifyAuth, async (req, res) => {
  try {
    const action = await updateActionStatus(req.user.id, req.params.id, 'rejected')
    res.json({ success: true, action })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/execute', verifyAuth, resolveLinkedAccount, async (req, res) => {
  try {
    const { actionType, emailId, payload } = req.body
    const action = await createPendingAction(req.user.id, actionType, emailId, payload)

    if (actionType === 'delete') {
      await deleteEmail(req.linkedAccount, emailId)
    } else if (actionType === 'archive') {
      await archiveEmail(req.linkedAccount, emailId)
    }

    await updateActionStatus(req.user.id, action.id, 'approved')
    res.json({ success: true, action })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router