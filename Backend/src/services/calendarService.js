const { google } = require('googleapis')
const { getFreshAccessToken } = require('./gmailService')

async function createCalendarEvent(linkedAccount, { summary, description, startTime, endTime }) {
  const oAuth2Client = await getFreshAccessToken(linkedAccount.id, linkedAccount.google_access_token, linkedAccount.google_refresh_token)
  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })

  const event = {
    summary,
    description,
    start: { dateTime: startTime },
    end: { dateTime: endTime },
  }

  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
  })

  return res.data
}

module.exports = { createCalendarEvent }