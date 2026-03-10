import { cookies } from 'next/headers'
import { jwtVerify, SignJWT } from 'jose'
import { SessionUser } from './discord'

// SECURITY: Never use fallback secret in production
const JWT_SECRET_STRING = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET
if (!JWT_SECRET_STRING && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production')
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING || 'dev-only-fallback-secret')
// NOTE: Discord roles are baked into the JWT at login time and NOT re-validated
// on each request. Role changes in Discord won't take effect until the user's
// JWT expires (7 days) or they log out and log back in.
// To fix: call Discord API on each action to re-check roles (adds latency).

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) return null

    const { payload } = await jwtVerify(token, JWT_SECRET)

    // Validate payload has required fields
    if (!payload.discordId || !payload.username) {
      return null
    }

    return {
      id: payload.id as string,
      discordId: payload.discordId as string,
      username: payload.username as string,
      email: null,
      avatar: payload.avatar as string | null,
      roles: (payload.roles as string[]) || [],
      isAdmin: payload.isAdmin as boolean || false,
      hasRequiredRole: payload.hasRequiredRole as boolean || false
    }
  } catch {
    return null
  }
}

export async function signJWT(payload: Record<string, unknown>, expirationTime = '7d'): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(JWT_SECRET)
}

export async function verifyJWT(token: string) {
  const { payload } = await jwtVerify(token, JWT_SECRET)
  return payload
}