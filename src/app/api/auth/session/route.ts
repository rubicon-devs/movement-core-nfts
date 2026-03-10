import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SessionUser } from '@/lib/discord'
import { verifyJWT } from '@/lib/session'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) {
      return NextResponse.json({ user: null })
    }

    const payload = await verifyJWT(token)

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