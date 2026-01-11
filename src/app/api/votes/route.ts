import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentPhase } from '@/lib/phase'
import { getSession } from '@/lib/session'

const MAX_VOTES = 5

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user is blocked
    const blockedUser = await prisma.blockedUser.findUnique({
      where: { discordId: session.discordId }
    })

    if (blockedUser) {
      return NextResponse.json({ error: 'Your account has been blocked from voting' }, { status: 403 })
    }

    if (!session.hasRequiredRole) {
      return NextResponse.json({ error: 'Missing required Discord role' }, { status: 403 })
    }

    // Get the actual database user by discordId
    const dbUser = await prisma.user.findUnique({
      where: { discordId: session.discordId }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const phase = await getCurrentPhase()

    if (phase.phase !== 'voting') {
      return NextResponse.json({ error: 'Voting is only allowed during the voting phase' }, { status: 400 })
    }

    const body = await request.json()
    const { collectionId, monthYear } = body
    const targetMonthYear = monthYear || phase.monthYear

    if (!collectionId) {
      return NextResponse.json({ error: 'Collection ID is required' }, { status: 400 })
    }

    // Check vote count
    const existingVotes = await prisma.vote.count({
      where: { userId: dbUser.id, monthYear: targetMonthYear }
    })

    if (existingVotes >= MAX_VOTES) {
      return NextResponse.json({ error: `You have already used all ${MAX_VOTES} votes` }, { status: 400 })
    }

    // Check if already voted for this collection
    const existingVote = await prisma.vote.findFirst({
      where: { userId: dbUser.id, collectionId, monthYear: targetMonthYear }
    })

    if (existingVote) {
      return NextResponse.json({ error: 'You have already voted for this collection' }, { status: 400 })
    }

    // Create vote
    const vote = await prisma.vote.create({
      data: {
        userId: dbUser.id,
        collectionId,
        monthYear: targetMonthYear
      }
    })

    return NextResponse.json({ success: true, vote, votesRemaining: MAX_VOTES - existingVotes - 1 })
  } catch (error) {
    console.error('Error creating vote:', error)
    return NextResponse.json({ error: 'Failed to create vote' }, { status: 500 })
  }
}