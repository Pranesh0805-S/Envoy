import { supabase } from './supabaseClient'

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: 'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar',
      queryParams: {
        access_type: 'offline',  // needed to get a refresh_token
        prompt: 'consent',       // forces consent screen so refresh_token is always issued
      },
      redirectTo: `${window.location.origin}/dashboard`,
    },
  })

  if (error) console.error('Google sign-in error:', error.message)
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  return { session: data?.session, error }
}