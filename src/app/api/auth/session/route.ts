import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { SessionUser } from '@/lib/discord'

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')

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
      roles: payload.roles as string[],
      isAdmin: payload.isAdmin as boolean,
      hasRequiredRole: payload.hasRequiredRole as boolean
    }

    return NextResponse.json({ user })
  } catch (e) {
    // Invalid token
    return NextResponse.json({ user: null })
  }
}
