import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const monthYear = searchParams.get('monthYear')

    if (!monthYear) {
      return NextResponse.json({ error: 'monthYear required' }, { status: 400 })
    }

    const winners = await prisma.winner.findMany({
      where: { monthYear },
      include: {
        collection: true
      },
      orderBy: { rank: 'asc' }
    })

    return NextResponse.json({
      winners: winners.map(w => ({
        id: w.id,
        rank: w.rank,
        voteCount: w.voteCount,
        collection: {
          id: w.collection.id,
          contractAddress: w.collection.contractAddress,
          name: w.collection.name,
          imageUrl: w.collection.imageUrl,
          description: w.collection.description,
          twitterUrl: w.collection.twitterUrl,
          tradeportUrl: w.collection.tradeportUrl
        }
      }))
    })
  } catch (error) {
    console.error('Winners error:', error)
    return NextResponse.json({ error: 'Failed to fetch winners' }, { status: 500 })
  }
}
