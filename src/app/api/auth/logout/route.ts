import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  cookieStore.delete('session')
  return NextResponse.redirect(new URL('/', request.url))
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  cookieStore.delete('session')
  return NextResponse.json({ success: true })
}
