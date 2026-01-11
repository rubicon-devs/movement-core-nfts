import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  console.log('=== COLLECTIONS API CALLED ===')
  
  try {
    const { searchParams } = new URL(request.url)
    const monthYear = searchParams.get('monthYear')

    if (!monthYear) {
      return NextResponse.json({ error: 'monthYear required' }, { status: 400 })
    }

    // Get current user session
    const session = await getSession()

    console.log('Fetching submissions for:', monthYear)

    const submissions = await prisma.submission.findMany({
      where: { monthYear },
      include: {
        collection: {
          include: {
            votes: {
              where: { monthYear }
            }
          }
        }
      }
    })

    console.log('Found submissions:', submissions.length)

    // Get user's votes if logged in
    let userVotes: string[] = []
    let userSubmission = null
    
    if (session) {
      // Get the actual database user by discordId
      const dbUser = await prisma.user.findUnique({
        where: { discordId: session.discordId }
      })

      if (dbUser) {
        const votes = await prisma.vote.findMany({
          where: { userId: dbUser.id, monthYear }
        })
        userVotes = votes.map(v => v.collectionId)

        // Get user's submission
        const submission = await prisma.submission.findFirst({
          where: { userId: dbUser.id, monthYear },
          include: { collection: true }
        })
        if (submission) {
          userSubmission = {
            id: submission.id,
            collectionId: submission.collectionId,
            collection: {
              name: submission.collection.name,
              contractAddress: submission.collection.contractAddress
            }
          }
        }
      }
    }

    const collections = submissions.map(sub => ({
      id: sub.collection.id,
      contractAddress: sub.collection.contractAddress,
      name: sub.collection.name,
      imageUrl: sub.collection.imageUrl,
      description: sub.collection.description,
      twitterUrl: sub.collection.twitterUrl,
      tradeportUrl: sub.collection.tradeportUrl,
      voteCount: sub.collection.votes.length,
      hasVoted: userVotes.includes(sub.collection.id)
    }))

    return NextResponse.json({
      collections,
      userVoteCount: userVotes.length,
      userSubmission
    })
  } catch (error) {
    console.error('Collections error:', error)
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 })
  }
}