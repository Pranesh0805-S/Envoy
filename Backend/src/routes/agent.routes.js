const express = require('express')
const router = express.Router()
const verifyAuth = require('../middleware/auth')
const Anthropic = require('@anthropic-ai/sdk')
const { getInboxDigest } = require('../services/gmailService')
const { categorizeInbox } = require('../services/agentService')

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

router.post('/chat', verifyAuth, async (req, res) => {
  try {
    const { message, history = [] } = req.body

    // Give the avatar current inbox context
    const digest = await getInboxDigest(req.user.id)
    const categorized = await categorizeInbox(digest)

    const contextSummary = categorized
      .map((m) => `- [${m.category}] ${m.summary}`)
      .join('\n')

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 500,
      system: `You are Envoy, a friendly Gmail assistant avatar. You help the user understand and manage their inbox. Be concise and conversational, not robotic. Here is the user's current inbox summary:\n\n${contextSummary}\n\nYou can reference these emails naturally. You cannot take actions directly — if the user wants to delete/archive something, tell them to use the workbench cards.`,
      messages: [
        ...history,
        { role: 'user', content: message },
      ],
    })

    res.json({ reply: response.content[0].text })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router