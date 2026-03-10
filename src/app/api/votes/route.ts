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
    // TODO: Add rate limiting. Vercel serverless functions are stateless, so
    // proper rate limiting requires external state (Redis/Upstash). At current
    // community scale, DB uniqueness constraints provide sufficient abuse protection.

    const { collectionId, monthYear } = body
    const targetMonthYear = monthYear || phase.monthYear

    if (!collectionId) {
      return NextResponse.json({ error: 'Collection ID is required' }, { status: 400 })
    }

    // Use a transaction to prevent race conditions on the 5-vote limit
    const result = await prisma.$transaction(async (tx) => {
      // Check if already voted for this collection
      const existingVote = await tx.vote.findFirst({
        where: { userId: dbUser.id, collectionId, monthYear: targetMonthYear }
      })

      if (existingVote) {
        // Remove the vote (toggle off)
        await tx.vote.delete({ where: { id: existingVote.id } })
        const remainingVotes = await tx.vote.count({
          where: { userId: dbUser.id, monthYear: targetMonthYear }
        })
        return { action: 'removed', votesRemaining: MAX_VOTES - remainingVotes, voteCount: remainingVotes, vote: null }
      }

      // Check vote count before adding new vote
      const existingVoteCount = await tx.vote.count({
        where: { userId: dbUser.id, monthYear: targetMonthYear }
      })

      if (existingVoteCount >= MAX_VOTES) {
        throw new Error(`VOTE_LIMIT: You have already used all ${MAX_VOTES} votes. Remove a vote first.`)
      }

      // Create vote
      const vote = await tx.vote.create({
        data: { userId: dbUser.id, collectionId, monthYear: targetMonthYear }
      })

      return {
        action: 'added',
        vote,
        votesRemaining: MAX_VOTES - existingVoteCount - 1,
        voteCount: existingVoteCount + 1
      }
    })

    // Handle vote limit error from transaction
    if (result === null) {
      return NextResponse.json({ error: `Vote limit reached` }, { status: 400 })
    }

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('VOTE_LIMIT:')) {
      return NextResponse.json({ error: error.message.replace('VOTE_LIMIT: ', '') }, { status: 400 })
    }
    console.error('Error toggling vote:', error)
    return NextResponse.json({ error: 'Failed to toggle vote' }, { status: 500 })
  }
}