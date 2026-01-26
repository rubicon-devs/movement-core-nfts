// Discord OAuth configuration
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/auth/callback` : 'http://localhost:3000/api/auth/callback')
const MOVEMENT_GUILD_ID = process.env.DISCORD_GUILD_ID || ''
const ADMIN_DISCORD_IDS = process.env.ADMIN_DISCORD_IDS?.split(',').map(id => id.trim()).filter(Boolean) || []
const ALLOWED_ROLE_IDS = process.env.ALLOWED_ROLE_IDS?.split(',').map(id => id.trim()).filter(Boolean) || []

// SECURITY: Accept state parameter for CSRF protection
export function getDiscordAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify email guilds guilds.members.read'
  })
  
  if (state) {
    params.set('state', state)
  }
  
  return `https://discord.com/api/oauth2/authorize?${params}`
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
} | null> {
  try {
    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: DISCORD_REDIRECT_URI
      })
    })
    
    if (!response.ok) return null
    return response.json()
  } catch (e) {
    console.error('Token exchange error:', e)
    return null
  }
}

export async function getDiscordUser(accessToken: string): Promise<{
  id: string
  username: string
  email: string | null
  avatar: string | null
} | null> {
  try {
    const response = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    
    if (!response.ok) return null
    
    const data = await response.json()
    return {
      id: data.id,
      username: data.username,
      email: data.email || null,
      avatar: data.avatar ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png` : null
    }
  } catch (e) {
    console.error('Get user error:', e)
    return null
  }
}

export async function getGuildMemberRoles(accessToken: string): Promise<string[]> {
  if (!MOVEMENT_GUILD_ID) return []
  
  try {
    const response = await fetch(
      `https://discord.com/api/users/@me/guilds/${MOVEMENT_GUILD_ID}/member`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    
    if (!response.ok) return []
    
    const data = await response.json()
    return data.roles || []
  } catch (e) {
    console.error('Get guild member error:', e)
    return []
  }
}

export function isAdmin(discordId: string): boolean {
  return ADMIN_DISCORD_IDS.includes(discordId)
}

export function hasRequiredRole(roles: string[]): boolean {
  if (ALLOWED_ROLE_IDS.length === 0) return true
  return roles.some(role => ALLOWED_ROLE_IDS.includes(role))
}

export interface SessionUser {
  id: string
  discordId: string
  username: string
  email: string | null
  avatar: string | null
  roles: string[]
  isAdmin: boolean
  hasRequiredRole: boolean
}