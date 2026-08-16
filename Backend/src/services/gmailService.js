const { google } = require('googleapis')
const { getOAuthClient } = require('../config/googleApis')
const supabase = require('../config/supabase')

// Refreshes and persists a new access token if needed
async function getFreshAccessToken(userId, accessToken, refreshToken) {
  const oAuth2Client = getOAuthClient(accessToken, refreshToken)

  try {
    const { credentials } = await oAuth2Client.refreshAccessToken()
    // Save the refreshed token back to Supabase
    await supabase
      .from('users')
      .update({
        google_access_token: credentials.access_token,
        token_expires_at: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : null,
      })
      .eq('id', userId)

    oAuth2Client.setCredentials(credentials)
    return oAuth2Client
  } catch (err) {
    console.error('Token refresh failed:', err.message)
    throw new Error('Failed to refresh Google token — user may need to re-authenticate')
  }
}

async function getInboxDigest(userId) {
  const { data: user, error } = await supabase
    .from('users')
    .select('google_access_token, google_refresh_token')
    .eq('id', userId)
    .single()

  if (error || !user?.google_refresh_token) {
    throw new Error('No Google account linked for this user')
  }

  const oAuth2Client = await getFreshAccessToken(
    userId,
    user.google_access_token,
    user.google_refresh_token
  )

  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client })

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    maxResults: 10,
    q: 'in:inbox',
  })

  const messages = listRes.data.messages || []

  const digest = await Promise.all(
    messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date'],
      })

      const headers = detail.data.payload.headers
      const getHeader = (name) =>
        headers.find((h) => h.name === name)?.value || ''

      return {
        id: msg.id,
        subject: getHeader('Subject'),
        from: getHeader('From'),
        date: getHeader('Date'),
        snippet: detail.data.snippet,
      }
    })
  )

  return digest
}

module.exports = { getInboxDigest, getFreshAccessToken }