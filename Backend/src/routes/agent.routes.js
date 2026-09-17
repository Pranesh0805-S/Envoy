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

    const digest = await getInboxDigest(req.user.id)
    const categorized = await categorizeInbox(digest)

    const contextSummary = categorized
      .map((m, i) => `${i + 1}. [${m.category}] ${m.summary} (gmailId: ${digest[i]?.id}, from: ${digest[i]?.from || 'unknown'})`)
      .join('\n')

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 800,
      system: `You are Envoy, a friendly Gmail assistant avatar. You help the user understand and manage their inbox, and you can draft email replies when asked.

Current inbox summary:
${contextSummary}

Each inbox item includes a "from" field like "Sierra ODC <hr@sierraodc.com>" — the actual email address is inside the angle brackets.

Rules:
- If the user asks you to draft, write, or compose a reply/email, respond with a JSON object wrapped in [[DRAFT]] and [[/DRAFT]] tags containing: {"to": "...", "subject": "...", "body": "..."}.
- The "to" field MUST be a real, valid email address (e.g. "hr@sierraodc.com"), extracted from the relevant email's "from" field — never a display name, company name, or team name on its own. If a "from" field is "Name <email@domain.com>", use only the "email@domain.com" part.
- If you genuinely cannot find a matching email address in the inbox summary for what the user is asking about, do NOT output a [[DRAFT]] block — instead, reply in plain text asking the user to provide the recipient's email address.
- Write the draft body professionally and concisely based on context from the relevant email.
- For everything else, respond normally in plain conversational text.
- You cannot send emails directly — only draft them for the user to review and send themselves.`,
      messages: [
        ...history,
        { role: 'user', content: message },
      ],
    })

    const rawReply = response.content[0].text

    // Check if response contains a draft
    const draftMatch = rawReply.match(/\[\[DRAFT\]\]([\s\S]*?)\[\[\/DRAFT\]\]/)

    if (draftMatch) {
      try {
        const draft = JSON.parse(draftMatch[1].trim())
        const cleanReply = rawReply.replace(/\[\[DRAFT\]\][\s\S]*?\[\[\/DRAFT\]\]/, '').trim()
        return res.json({ reply: cleanReply || "Here's a draft for you:", draft })
      } catch {
        // fall through to plain text if parsing fails
      }
    }

    res.json({ reply: rawReply })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router