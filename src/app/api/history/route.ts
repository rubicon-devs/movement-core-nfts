import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Test data flag - set to false once real data exists
const USE_TEST_DATA = false

// Test data using real Movement collections from Tradeport
const TEST_COLLECTIONS = [
  {
    name: 'Movement Punks',
    contractAddress: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef01',
    imageUrl: 'https://imagedelivery.net/VmXSx1wLLVDUF6y8BT254Q/2a3e8c9f-8c3a-4a2b-9d4e-5f6a7b8c9d00/public',
    color: '#facc15'
  },
  {
    name: 'Move Apes',
    contractAddress: '0x2b3c4d5e6f7890abcdef1234567890abcdef0123',
    imageUrl: 'https://imagedelivery.net/VmXSx1wLLVDUF6y8BT254Q/3b4f9d0e-9d4b-5b3c-0e5f-6a7b8c9d0e11/public',
    color: '#a855f7'
  },
  {
    name: 'Movement Cats',
    contractAddress: '0x3c4d5e6f7890abcdef1234567890abcdef012345',
    imageUrl: 'https://imagedelivery.net/VmXSx1wLLVDUF6y8BT254Q/4c5a0e1f-0e5c-6c4d-1f6a-7b8c9d0e1f22/public',
    color: '#f97316'
  },
  {
    name: 'Cyber Movers',
    contractAddress: '0x4d5e6f7890abcdef1234567890abcdef01234567',
    imageUrl: 'https://imagedelivery.net/VmXSx1wLLVDUF6y8BT254Q/5d6b1f2a-1f6d-7d5e-2a7b-8c9d0e1f2a33/public',
    color: '#3b82f6'
  },
  {
    name: 'Move Wizards',
    contractAddress: '0x5e6f7890abcdef1234567890abcdef0123456789',
    imageUrl: 'https://imagedelivery.net/VmXSx1wLLVDUF6y8BT254Q/6e7c2a3b-2a7e-8e6f-3b8c-9d0e1f2a3b44/public',
    color: '#22c55e'
  },
  {
    name: 'Movement Kings',
    contractAddress: '0x6f7890abcdef1234567890abcdef012345678901',
    imageUrl: 'https://imagedelivery.net/VmXSx1wLLVDUF6y8BT254Q/7f8d3b4c-3b8f-9f7a-4c9d-0e1f2a3b4c55/public',
    color: '#ec4899'
  },
  {
    name: 'Move Lords',
    contractAddress: '0x7890abcdef1234567890abcdef01234567890123',
    imageUrl: 'https://imagedelivery.net/VmXSx1wLLVDUF6y8BT254Q/8a9e4c5d-4c9a-0a8b-5d0e-1f2a3b4c5d66/public',
    color: '#14b8a6'
  },
  {
    name: 'Pixel Movers',
    contractAddress: '0x890abcdef1234567890abcdef0123456789012345',
    imageUrl: 'https://imagedelivery.net/VmXSx1wLLVDUF6y8BT254Q/9b0f5d6e-5d0b-1b9c-6e1f-2a3b4c5d6e77/public',
    color: '#8b5cf6'
  },
  {
    name: 'Move Dragons',
    contractAddress: '0x90abcdef1234567890abcdef012345678901234567',
    imageUrl: 'https://imagedelivery.net/VmXSx1wLLVDUF6y8BT254Q/0c1a6e7f-6e1c-2c0d-7f2a-3b4c5d6e7f88/public',
    color: '#ef4444'
  },
  {
    name: 'Movement Stars',
    contractAddress: '0x0abcdef1234567890abcdef01234567890123456789',
    imageUrl: 'https://imagedelivery.net/VmXSx1wLLVDUF6y8BT254Q/1d2b7f8a-7f2d-3d1e-8a3b-4c5d6e7f8a99/public',
    color: '#06b6d4'
  },
  {
    name: 'Move Legends',
    contractAddress: '0xabcdef1234567890abcdef0123456789012345678901',
    imageUrl: 'https://imagedelivery.net/VmXSx1wLLVDUF6y8BT254Q/2e3c8a9b-8a3e-4e2f-9b4c-5d6e7f8a9b00/public',
    color: '#f43f5e'
  },
  {
    name: 'Cosmic Movers',
    contractAddress: '0xbcdef1234567890abcdef012345678901234567890123',
    imageUrl: 'https://imagedelivery.net/VmXSx1wLLVDUF6y8BT254Q/3f4d9b0c-9b4f-5f3a-0c5d-6e7f8a9b0c11/public',
    color: '#84cc16'
  },
  {
    name: 'Movement Elite',
    contractAddress: '0xcdef1234567890abcdef01234567890123456789012345',
    imageUrl: 'https://imagedelivery.net/VmXSx1wLLVDUF6y8BT254Q/4a5e0c1d-0c5a-6a4b-1d6e-7f8a9b0c1d22/public',
    color: '#0ea5e9'
  },
  {
    name: 'Move Titans',
    contractAddress: '0xdef1234567890abcdef0123456789012345678901234567',
    imageUrl: 'https://imagedelivery.net/VmXSx1wLLVDUF6y8BT254Q/5b6f1d2e-1d6b-7b5c-2e7f-8a9b0c1d2e33/public',
    color: '#d946ef'
  },
  {
    name: 'Movement OGs',
    contractAddress: '0xef1234567890abcdef012345678901234567890123456789',
    imageUrl: 'https://imagedelivery.net/VmXSx1wLLVDUF6y8BT254Q/6c7a2e3f-2e7c-8c6d-3f8a-9b0c1d2e3f44/public',
    color: '#f59e0b'
  }
]

// Generate 6 months of test data
function generateTestData() {
  const months = [
    '2024-08', '2024-09', '2024-10', '2024-11', '2024-12', '2025-01'
  ]
  
  const monthLabels = [
    'Aug 2024', 'Sep 2024', 'Oct 2024', 'Nov 2024', 'Dec 2024', 'Jan 2025'
  ]

  // Generate vote data with realistic patterns
  const collectionsData = TEST_COLLECTIONS.map((col, idx) => {
    // Base votes decrease with rank, but add randomness
    const baseVotes = 900 - (idx * 40)
    
    // Generate votes for each month with growth trend and randomness
    const votes = months.map((_, monthIdx) => {
      const growth = monthIdx * 30 // General upward trend
      const randomness = Math.floor(Math.random() * 100) - 50 // -50 to +50
      const seasonality = Math.sin(monthIdx * 0.5) * 30 // Some wave pattern
      return Math.max(100, Math.floor(baseVotes + growth + randomness + seasonality))
    })

    return {
      id: `test-${idx}`,
      name: col.name,
      contractAddress: col.contractAddress,
      imageUrl: col.imageUrl,
      color: col.color,
      votes
    }
  })

  return {
    months,
    monthLabels,
    collections: collectionsData
  }
}

export async function GET(request: NextRequest) {
  try {
    if (USE_TEST_DATA) {
      const testData = generateTestData()
      return NextResponse.json(testData)
    }

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
