const Anthropic = require('@anthropic-ai/sdk')

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

async function categorizeInbox(emails) {
  const emailListText = emails
    .map(
      (mail, i) =>
        `${i + 1}. Subject: ${mail.subject}\nFrom: ${mail.from}\nDate: ${mail.date}\nSnippet: ${mail.snippet}`
    )
    .join('\n\n')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1000,
    system: `You are Envoy, a Gmail management assistant. You help users understand and manage their inbox efficiently.

When given a list of emails (subject, sender, date, snippet), you:
1. Categorize each email into one of: Urgent, Important, Newsletter/Promotional, Social, Security, Job/Career, Spam-like
2. Identify emails that likely need action (replies, deadlines, meetings)
3. Flag anything that looks like a scheduling/meeting request
4. Write a short, clear one-line summary for each email
5. Never delete, archive, or send anything yourself — you only categorize and suggest.

Respond with ONLY a JSON array, no prose. Format:
[{"id": "email_index", "category": "...", "needsAction": true/false, "isMeeting": true/false, "summary": "..."}]`,
    messages: [
      {
        role: 'user',
        content: `Categorize these emails:\n\n${emailListText}`,
      },
    ],
  })

  const responseText = message.content[0].text

  // Strip markdown code fences if present
  const cleaned = responseText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch (err) {
    console.error('Failed to parse agent response as JSON:', cleaned)
    throw new Error('Agent returned invalid JSON')
  }
}

module.exports = { categorizeInbox }