const Anthropic = require('@anthropic-ai/sdk')
const supabase = require('../config/supabase')

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

async function categorizeWithHaiku(emails) {
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

// emails: array with .id = gmail message id, matching digest order
// linkedAccountId: which Gmail account these emails belong to
async function categorizeInbox(emails, linkedAccountId) {
  const gmailIds = emails.map((m) => m.id)

  const { data: cached, error: cacheErr } = await supabase
    .from('email_categorizations')
    .select('*')
    .eq('linked_account_id', linkedAccountId)
    .in('gmail_message_id', gmailIds)

  if (cacheErr) console.error('Cache lookup failed, falling back to full categorization:', cacheErr.message)

  const cachedMap = new Map((cached || []).map((c) => [c.gmail_message_id, c]))
  const uncached = emails.filter((m) => !cachedMap.has(m.id))

  let freshResults = []
  if (uncached.length > 0) {
    const raw = await categorizeWithHaiku(uncached)
    // raw[i].id is a 1-based index into `uncached`, not the gmail id — map it back
    freshResults = raw.map((r, i) => ({
      ...r,
      gmailMessageId: uncached[i].id,
    }))

    await supabase.from('email_categorizations').insert(
      freshResults.map((r) => ({
        linked_account_id: linkedAccountId,
        gmail_message_id: r.gmailMessageId,
        category: r.category,
        confidence: r.confidence,
        reasoning: r.reasoning,
        is_meeting: r.isMeeting,
        meeting_time: r.meetingTime,
        needs_action: r.needsAction,
        summary: r.summary,
      }))
    )
  }

  // Return in the same order as the original `emails` array
  return emails.map((mail) => {
    const c = cachedMap.get(mail.id)
    if (c) {
      return {
        id: mail.id,
        category: c.category,
        needsAction: c.needs_action,
        isMeeting: c.is_meeting,
        meetingTime: c.meeting_time,
        confidence: c.confidence,
        reasoning: c.reasoning,
        summary: c.summary,
      }
    }
    const fresh = freshResults.find((r) => r.gmailMessageId === mail.id)
    return { ...fresh, id: mail.id }
  })
}

module.exports = { categorizeInbox }