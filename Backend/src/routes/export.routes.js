const express = require('express')
const router = express.Router()
const verifyAuth = require('../middleware/auth')
const { generateMailPdf } = require('../services/exportService')

router.post('/pdf', verifyAuth, (req, res) => {
  try {
    const { mails } = req.body
    if (!mails || !mails.length) {
      return res.status(400).json({ error: 'No emails provided for export' })
    }
    generateMailPdf(mails, res)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router