const { google } = require('googleapis')
const { getFreshAccessToken } = require('./gmailService')
const supabase = require('../config/supabase')

async function createCalendarEvent(userId, { summary, description, startTime, endTime }) {
  const { data: user } = await supabase
    .from('users')
    .select('google_access_token, google_refresh_token')
    .eq('id', userId)
    .single()

  const oAuth2Client = await getFreshAccessToken(userId, user.google_access_token, user.google_refresh_token)
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