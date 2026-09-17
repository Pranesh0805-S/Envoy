const express = require('express')
const router = express.Router()
const verifyAuth = require('../middleware/auth')
const resolveLinkedAccount = require('../middleware/linkedAccount')
const { createCalendarEvent } = require('../services/calendarService')

router.post('/create-event', verifyAuth, resolveLinkedAccount, async (req, res) => {
  try {
    const { summary, description, startTime, endTime } = req.body
    const event = await createCalendarEvent(req.linkedAccount, { summary, description, startTime, endTime })
    res.json({ event })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router