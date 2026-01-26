import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDiscordAuthUrl } from '@/lib/discord'
import crypto from 'crypto'

export async function GET() {
  // SECURITY: Generate random state to prevent CSRF attacks
  const state = crypto.randomBytes(32).toString('hex')
  
  // Store state in cookie for verification
  const cookieStore = await cookies()
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60, // 10 minutes
    path: '/'
  })

  const authUrl = getDiscordAuthUrl(state)
  return NextResponse.redirect(authUrl)
}