import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Real data from database
    const winners = await prisma.winner.findMany({
      include: {
        collection: true
      },
      orderBy: [
        { monthYear: 'asc' },
        { rank: 'asc' }
      ]
    })

    // Group by month
    const monthsSet = new Set<string>()
    winners.forEach(w => monthsSet.add(w.monthYear))
    const months = Array.from(monthsSet).sort()

    // Format month labels
    const monthLabels = months.map(m => {
      const [year, month] = m.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1)
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    })

    // Build collections data
    const collectionsMap = new Map<string, {
      id: string
      name: string
      contractAddress: string
      imageUrl: string | null
      color: string
      votes: (number | null)[]
    }>()

    // Initialize all collections with null votes for each month
    winners.forEach(w => {
      if (!collectionsMap.has(w.collectionId)) {
        // Assign a color based on hash of collection id
        const colors = ['#facc15', '#a855f7', '#f97316', '#3b82f6', '#22c55e', '#ec4899', '#14b8a6', '#8b5cf6', '#ef4444', '#06b6d4']
        const colorIdx = w.collectionId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
        
        collectionsMap.set(w.collectionId, {
          id: w.collectionId,
          name: w.collection.name,
          contractAddress: w.collection.contractAddress,
          imageUrl: w.collection.imageUrl,
          color: colors[colorIdx],
          votes: new Array(months.length).fill(null)
        })
      }
    })

    // Fill in vote counts
    winners.forEach(w => {
      const col = collectionsMap.get(w.collectionId)
      if (col) {
        const monthIdx = months.indexOf(w.monthYear)
        if (monthIdx !== -1) {
          col.votes[monthIdx] = w.voteCount
        }
      }
    })

    // Convert to array and sort by most recent month's votes
    const collections = Array.from(collectionsMap.values())
      .sort((a, b) => {
        const aLastVotes = a.votes[a.votes.length - 1] || 0
        const bLastVotes = b.votes[b.votes.length - 1] || 0
        return bLastVotes - aLastVotes
      })

    return NextResponse.json({
      months,
      monthLabels,
      collections
    })
  } catch (error) {
    console.error('History error:', error)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}
