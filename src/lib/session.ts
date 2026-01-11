import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { SessionUser } from './discord'

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) return null

    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    return {
      id: payload.id as string,
      discordId: payload.discordId as string,
      username: payload.username as string,
      email: null,
      avatar: payload.avatar as string | null,
      roles: payload.roles as string[],
      isAdmin: payload.isAdmin as boolean,
      hasRequiredRole: payload.hasRequiredRole as boolean
    }
  } catch {
    return null
  }
}
