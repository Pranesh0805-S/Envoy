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
    max_tokens: 1500,
    system: `You are Envoy, a Gmail management assistant. You help users understand and manage their inbox efficiently.

When given a list of emails (subject, sender, date, snippet), you:
1. Categorize each email into one of: Urgent, Important, Newsletter/Promotional, Social, Security, Job/Career, Spam-like
2. Identify emails that likely need action (replies, deadlines, meetings)
3. Flag anything that looks like a scheduling/meeting request (isMeeting: true/false).
4. If isMeeting is true AND the email mentions a specific date and time, extract it into a "meetingTime" field as an ISO 8601 datetime string (e.g. "2026-08-27T10:15:00"). If isMeeting is true but no specific date/time is mentioned, set "meetingTime" to null. If isMeeting is false, always set "meetingTime" to null.
5. Write a short, clear one-line summary for each email
6. Give a "confidence" score (integer 0-100) reflecting how certain you are about the category assignment. Use high confidence (85+) for clear-cut cases like obvious bank alerts or obvious newsletters; use lower confidence (50-70) for ambiguous or borderline emails.
7. Give a short "reasoning" string (under 15 words) explaining the single strongest signal that led to this categorization — e.g. "Sender domain is a known bank" or "Contains promotional language and unsubscribe link".
8. Never delete, archive, or send anything yourself — you only categorize and suggest.

You must always include "meetingTime", "confidence", and "reasoning" keys in every object.

Respond with ONLY a JSON array, no prose. Format:
[{"id": "1", "category": "Job/Career", "needsAction": false, "isMeeting": false, "meetingTime": null, "confidence": 92, "reasoning": "Sender is LinkedIn Job Alerts, standard job posting format.", "summary": "..."}]

Example with a meeting:
{"id": "9", "category": "Newsletter/Promotional", "needsAction": true, "isMeeting": true, "meetingTime": "2026-08-27T10:15:00", "confidence": 88, "reasoning": "Explicit webinar invite with clear date and time stated.", "summary": "Google Cloud webinar invitation on August 27, 2026 at 10:15 AM IST."}`,
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
    const parsed = JSON.parse(cleaned)
    console.log('Parsed categorization:', JSON.stringify(parsed, null, 2))
    return parsed
  } catch (err) {
    console.error('Failed to parse agent response as JSON:', cleaned)
    throw new Error('Agent returned invalid JSON')
  }
}

module.exports = { categorizeInbox }