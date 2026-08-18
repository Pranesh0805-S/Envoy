const express = require('express')
const router = express.Router()
const verifyAuth = require('../middleware/auth')
const { createPendingAction, getPendingActions, updateActionStatus } = require('../services/approvalQueue')
const { deleteEmail, archiveEmail } = require('../services/gmailService')

// Propose an action (goes into pending queue, nothing executes yet)
router.post('/propose', verifyAuth, async (req, res) => {
  try {
    const { actionType, emailId, payload } = req.body
    const action = await createPendingAction(req.user.id, actionType, emailId, payload)
    res.json({ action })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// List pending actions awaiting approval
router.get('/pending', verifyAuth, async (req, res) => {
  try {
    const actions = await getPendingActions(req.user.id)
    res.json({ actions })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Approve — actually executes the Gmail action
router.post('/:id/approve', verifyAuth, async (req, res) => {
  try {
    console.log('Approve called with id:', req.params.id, 'user:', req.user.id)
    const action = await updateActionStatus(req.user.id, req.params.id, 'approved')

    if (action.action_type === 'delete') {
      await deleteEmail(req.user.id, action.target_email_id)
    } else if (action.action_type === 'archive') {
      await archiveEmail(req.user.id, action.target_email_id)
    }

    res.json({ success: true, action })
  } catch (err) {
    console.error('Approve error:', err.message, 'for id:', req.params.id)
    res.status(500).json({ error: err.message })
  }
})

// Reject — just marks it rejected, no Gmail call
router.post('/:id/reject', verifyAuth, async (req, res) => {
  try {
    const action = await updateActionStatus(req.user.id, req.params.id, 'rejected')
    res.json({ success: true, action })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router