import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { SessionUser } from '@/lib/discord'

// SECURITY: Use same secret as callback route
const JWT_SECRET_STRING = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET
if (!JWT_SECRET_STRING && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production')
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING || 'dev-only-fallback-secret')

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) {
      return NextResponse.json({ user: null })
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    const user: SessionUser = {
      id: payload.id as string,
      discordId: payload.discordId as string,
      username: payload.username as string,
      email: null,
      avatar: payload.avatar as string | null,
      roles: (payload.roles as string[]) || [],
      isAdmin: payload.isAdmin as boolean || false,
      hasRequiredRole: payload.hasRequiredRole as boolean || false
    }

    return NextResponse.json({ user })
  } catch (e) {
    console.error('Session verification error:', e)
    return NextResponse.json({ user: null })
  }
}