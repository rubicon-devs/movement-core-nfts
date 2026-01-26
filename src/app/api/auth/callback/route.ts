import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { 
  exchangeCodeForToken, 
  getDiscordUser, 
  getGuildMemberRoles,
  isAdmin,
  hasRequiredRole
} from '@/lib/discord'
import { SignJWT } from 'jose'

// SECURITY: Never use fallback secret in production
const JWT_SECRET_STRING = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET
if (!JWT_SECRET_STRING && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production')
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING || 'dev-only-fallback-secret')

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state')

  const cookieStore = await cookies()

  // SECURITY: Validate state parameter to prevent CSRF
  const savedState = cookieStore.get('oauth_state')?.value

  if (savedState && state !== savedState) {
    console.error('OAuth state mismatch - possible CSRF attack')
    return NextResponse.redirect(new URL('/?error=invalid_state', request.url))
  }

  // Clear the state cookie
  cookieStore.delete('oauth_state')

  if (error || !code) {
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }

  // Exchange code for token
  const tokenData = await exchangeCodeForToken(code)
  if (!tokenData) {
    return NextResponse.redirect(new URL('/?error=token_failed', request.url))
  }

  // Get user info
  const discordUser = await getDiscordUser(tokenData.access_token)
  if (!discordUser) {
    return NextResponse.redirect(new URL('/?error=user_failed', request.url))
  }

  // Get guild roles
  const roles = await getGuildMemberRoles(tokenData.access_token)

  // Upsert user in database
  const user = await prisma.user.upsert({
    where: { discordId: discordUser.id },
    update: {
      username: discordUser.username,
      email: discordUser.email,
      avatar: discordUser.avatar,
      roles,
      isAdmin: isAdmin(discordUser.id)
    },
    create: {
      discordId: discordUser.id,
      username: discordUser.username,
      email: discordUser.email,
      avatar: discordUser.avatar,
      roles,
      isAdmin: isAdmin(discordUser.id)
    }
  })

  // Create JWT session token
  const token = await new SignJWT({
    id: user.id,
    discordId: user.discordId,
    username: user.username,
    avatar: user.avatar,
    roles: user.roles,
    isAdmin: user.isAdmin,
    hasRequiredRole: hasRequiredRole(roles)
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // SECURITY: 7 day expiration
    .sign(JWT_SECRET)

  // Set cookie and redirect
  const response = NextResponse.redirect(new URL('/', request.url))
  
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  })

  return response
}