const express = require('express')
const router = express.Router()
const verifyAuth = require('../middleware/auth')
const { createCalendarEvent } = require('../services/calendarService')

router.post('/create-event', verifyAuth, async (req, res) => {
  try {
    const { summary, description, startTime, endTime } = req.body
    const event = await createCalendarEvent(req.user.id, { summary, description, startTime, endTime })
    res.json({ event })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router