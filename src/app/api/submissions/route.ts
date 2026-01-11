import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentPhase } from '@/lib/phase'
import { validateAndFetchCollection, validateContractAddress } from '@/lib/tradeport'
import { getSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const monthYear = searchParams.get('monthYear')

    if (!monthYear) {
      return NextResponse.json({ error: 'monthYear required' }, { status: 400 })
    }

    const submissions = await prisma.submission.findMany({
      where: { monthYear },
      include: {
        collection: true,
        user: { select: { id: true, username: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
  }
}

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
      return NextResponse.json({ error: 'Your account has been blocked from submitting' }, { status: 403 })
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

    if (phase.phase !== 'submission') {
      return NextResponse.json({ error: 'Submissions are only allowed during the submission phase' }, { status: 400 })
    }

    const body = await request.json()
    const { contractAddress, monthYear } = body
    const targetMonthYear = monthYear || phase.monthYear

    if (!contractAddress) {
      return NextResponse.json({ error: 'Contract address is required' }, { status: 400 })
    }

    const normalizedAddress = contractAddress.trim().toLowerCase()

    const isValidFormat = await validateContractAddress(normalizedAddress)
    if (!isValidFormat) {
      return NextResponse.json({ error: 'Invalid contract address format' }, { status: 400 })
    }

    // Check if user already submitted this month
    const existingUserSubmission = await prisma.submission.findFirst({
      where: { userId: dbUser.id, monthYear: targetMonthYear },
      include: { collection: true }
    })

    if (existingUserSubmission) {
      return NextResponse.json({ 
        error: `You already submitted "${existingUserSubmission.collection.name}" this month` 
      }, { status: 400 })
    }

    // Check if collection already submitted
    const existingCollection = await prisma.submission.findFirst({
      where: { monthYear: targetMonthYear, collection: { contractAddress: normalizedAddress } },
      include: { collection: true }
    })

    if (existingCollection) {
      return NextResponse.json({ 
        error: `"${existingCollection.collection.name}" was already submitted this month` 
      }, { status: 400 })
    }

    // Validate on Tradeport
    const validation = await validateAndFetchCollection(normalizedAddress)

    if (!validation.exists) {
      return NextResponse.json({ error: 'Collection not found on Tradeport' }, { status: 400 })
    }

    if (!validation.verified) {
      return NextResponse.json({ error: 'Only verified collections can be submitted' }, { status: 400 })
    }

    const metadata = validation.metadata!

    // Create or update collection
    let collection = await prisma.collection.findUnique({ where: { contractAddress: normalizedAddress } })

    if (!collection) {
      collection = await prisma.collection.create({
        data: {
          contractAddress: normalizedAddress,
          name: metadata.name,
          imageUrl: metadata.imageUrl,
          description: metadata.description,
          twitterUrl: metadata.twitterUrl,
          tradeportUrl: metadata.tradeportUrl,
          floorPrice: metadata.floorPrice,
          volume: metadata.volume
        }
      })
    }

    // Create submission
    const submission = await prisma.submission.create({
      data: { collectionId: collection.id, userId: dbUser.id, monthYear: targetMonthYear },
      include: { collection: true }
    })

    return NextResponse.json({ success: true, submission })
  } catch (error) {
    console.error('Error creating submission:', error)
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 })
  }
}