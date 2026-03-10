import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentPhase } from '@/lib/phase'
import { getSession } from '@/lib/session'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Helper to convert data to CSV
function toCSV(headers: string[], rows: string[][]): string {
  const escapeField = (field: string) => {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`
    }
    return field
  }

  const headerLine = headers.map(escapeField).join(',')
  const dataLines = rows.map(row => row.map(escapeField).join(','))
  return [headerLine, ...dataLines].join('\n')
}

function isValidMonthYear(value: string | null): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}$/.test(value)
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const monthYear = searchParams.get('monthYear')

    switch (action) {
      case 'phase':
        const phase = await getCurrentPhase()
        return NextResponse.json(phase)

      case 'winners':
        if (!isValidMonthYear(monthYear)) {
          return NextResponse.json({ error: 'monthYear must be in YYYY-MM format' }, { status: 400 })
        }
        const winners = await prisma.winner.findMany({
          where: { monthYear },
          include: { collection: true },
          orderBy: { rank: 'asc' }
        })
        return NextResponse.json({ winners, monthYear, exportedAt: new Date().toISOString() })

      case 'export-winners':
        if (!isValidMonthYear(monthYear)) {
          return NextResponse.json({ error: 'monthYear must be in YYYY-MM format' }, { status: 400 })
        }
        const winnersData = await prisma.winner.findMany({
          where: { monthYear },
          include: { collection: true },
          orderBy: { rank: 'asc' }
        })
        
        const winnersCSV = toCSV(
          ['rank', 'vote_count', 'collection_name', 'contract_address'],
          winnersData.map(w => [
            String(w.rank),
            String(w.voteCount),
            w.collection.name,
            w.collection.contractAddress
          ])
        )
        
        return new NextResponse(winnersCSV, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="winners-${monthYear}.csv"`
          }
        })

      case 'submissions':
        if (!isValidMonthYear(monthYear)) {
          return NextResponse.json({ error: 'monthYear must be in YYYY-MM format' }, { status: 400 })
        }
        const submissions = await prisma.submission.findMany({
          where: { monthYear },
          include: {
            collection: true,
            user: {
              select: { id: true, username: true, discordId: true, avatar: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json({ submissions, monthYear, exportedAt: new Date().toISOString() })

      case 'export-submissions':
        if (!isValidMonthYear(monthYear)) {
          return NextResponse.json({ error: 'monthYear must be in YYYY-MM format' }, { status: 400 })
        }
        const submissionsData = await prisma.submission.findMany({
          where: { monthYear },
          include: {
            collection: true,
            user: {
              select: { id: true, username: true, discordId: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        })
        
        const submissionsCSV = toCSV(
          ['submission_id', 'submitted_at', 'collection_name', 'username', 'discord_id'],
          submissionsData.map(s => [
            s.id,
            s.createdAt.toISOString(),
            s.collection.name,
            s.user.username,
            s.user.discordId
          ])
        )
        
        return new NextResponse(submissionsCSV, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="submissions-${monthYear}.csv"`
          }
        })

      case 'export-votes':
        if (!isValidMonthYear(monthYear)) {
          return NextResponse.json({ error: 'monthYear must be in YYYY-MM format' }, { status: 400 })
        }
        const votesData = await prisma.vote.findMany({
          where: { monthYear },
          include: {
            collection: { select: { id: true, name: true, contractAddress: true } },
            user: { select: { id: true, username: true, discordId: true } }
          },
          orderBy: { createdAt: 'desc' }
        })
        
        const votesCSV = toCSV(
          ['vote_id', 'voted_at', 'collection_name', 'username', 'discord_id'],
          votesData.map(v => [
            v.id,
            v.createdAt.toISOString(),
            v.collection.name,
            v.user.username,
            v.user.discordId
          ])
        )
        
        return new NextResponse(votesCSV, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="votes-${monthYear}.csv"`
          }
        })

      case 'export-all':
        if (!isValidMonthYear(monthYear)) {
          return NextResponse.json({ error: 'monthYear must be in YYYY-MM format' }, { status: 400 })
        }
        const [allSubmissions, allVotes, allWinners] = await Promise.all([
          prisma.submission.findMany({
            where: { monthYear },
            include: {
              collection: true,
              user: { select: { id: true, username: true, discordId: true } }
            }
          }),
          prisma.vote.findMany({
            where: { monthYear },
            include: {
              collection: { select: { id: true, name: true, contractAddress: true } },
              user: { select: { id: true, username: true, discordId: true } }
            }
          }),
          prisma.winner.findMany({
            where: { monthYear },
            include: { collection: true },
            orderBy: { rank: 'asc' }
          })
        ])
        
        return NextResponse.json({
          monthYear,
          exportedAt: new Date().toISOString(),
          submissions: allSubmissions.map(s => ({
            submission_id: s.id,
            submitted_at: s.createdAt.toISOString(),
            collection_name: s.collection.name,
            contract_address: s.collection.contractAddress,
            username: s.user.username,
            discord_id: s.user.discordId
          })),
          votes: allVotes.map(v => ({
            vote_id: v.id,
            voted_at: v.createdAt.toISOString(),
            collection_name: v.collection.name,
            contract_address: v.collection.contractAddress,
            username: v.user.username,
            discord_id: v.user.discordId
          })),
          winners: allWinners.map(w => ({
            rank: w.rank,
            vote_count: w.voteCount,
            collection_name: w.collection.name,
            contract_address: w.collection.contractAddress
          }))
        }, {
          headers: {
            'Content-Disposition': `attachment; filename="all-data-${monthYear}.json"`
          }
        })

      case 'stats':
        if (!isValidMonthYear(monthYear)) {
          return NextResponse.json({ error: 'monthYear must be in YYYY-MM format' }, { status: 400 })
        }
        const [submissionCount, voteCount, uniqueVoters] = await Promise.all([
          prisma.submission.count({ where: { monthYear } }),
          prisma.vote.count({ where: { monthYear } }),
          prisma.vote.groupBy({
            by: ['userId'],
            where: { monthYear }
          }).then(r => r.length)
        ])
        return NextResponse.json({
          submissions: submissionCount,
          votes: voteCount,
          uniqueVoters
        })

      case 'blocked-users':
        const blockedUsers = await prisma.blockedUser.findMany({
          orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json({ blockedUsers })

      case 'submissions-list':
        if (!isValidMonthYear(monthYear)) {
          return NextResponse.json({ error: 'monthYear must be in YYYY-MM format' }, { status: 400 })
        }
        const submissionsList = await prisma.submission.findMany({
          where: { monthYear },
          include: {
            collection: true,
            user: {
              select: { id: true, username: true, discordId: true, avatar: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json({ submissions: submissionsList })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'calculate-winners': {
        const { monthYear, topN = 50 } = body

        if (!isValidMonthYear(monthYear)) {
          return NextResponse.json({ error: 'monthYear must be in YYYY-MM format' }, { status: 400 })
        }

        const submissions = await prisma.submission.findMany({
          where: { monthYear },
          include: {
            collection: {
              include: {
                votes: { where: { monthYear } }
              }
            }
          }
        })

        const sorted = submissions
          .map(s => ({
            collectionId: s.collectionId,
            voteCount: s.collection.votes.length
          }))
          .sort((a, b) => b.voteCount - a.voteCount)
          .slice(0, topN)

        // Assign ranks with competition ranking (ties get same rank)
        let currentRank = 1
        const rankedWinners = sorted.map((s, index) => {
          if (index > 0 && sorted[index - 1].voteCount !== s.voteCount) {
            currentRank = index + 1
          }
          return { ...s, rank: currentRank }
        })

        await prisma.winner.deleteMany({ where: { monthYear } })

        await prisma.winner.createMany({
          data: rankedWinners.map(s => ({
            collectionId: s.collectionId,
            monthYear,
            rank: s.rank,
            voteCount: s.voteCount
          }))
        })

        // Fetch back with collection data to return
        const winners = await prisma.winner.findMany({
          where: { monthYear },
          include: { collection: true },
          orderBy: { rank: 'asc' }
        })

        return NextResponse.json({ success: true, winners })
      }

      case 'override-phase': {
        const { monthYear, phase, durationHours } = body

        if (!isValidMonthYear(monthYear) || !phase) {
          return NextResponse.json({ error: 'monthYear must be in YYYY-MM format, phase required' }, { status: 400 })
        }

        if (!['submission', 'voting', 'display'].includes(phase)) {
          return NextResponse.json({ error: 'Invalid phase' }, { status: 400 })
        }

        // Calculate expiration time if duration provided
        const expiresAt = durationHours 
          ? new Date(Date.now() + durationHours * 60 * 60 * 1000)
          : null

        await prisma.phaseOverride.upsert({
          where: { monthYear },
          update: { phase, expiresAt },
          create: { monthYear, phase, expiresAt }
        })

        return NextResponse.json({ success: true, expiresAt })
      }

      case 'clear-override': {
        const { monthYear } = body

        if (!isValidMonthYear(monthYear)) {
          return NextResponse.json({ error: 'monthYear must be in YYYY-MM format' }, { status: 400 })
        }

        await prisma.phaseOverride.deleteMany({ where: { monthYear } })
        return NextResponse.json({ success: true })
      }

      case 'clear-data': {
        const { monthYear, target, confirm } = body

        if (!isValidMonthYear(monthYear)) {
          return NextResponse.json({ error: 'monthYear must be in YYYY-MM format' }, { status: 400 })
        }
        if (confirm !== true) {
          return NextResponse.json({ error: 'confirm: true is required for clear-data to prevent accidental deletion' }, { status: 400 })
        }

        const deleted: { submissions?: number; votes?: number; winners?: number } = {}

        if (target === 'all' || target === 'winners') {
          const result = await prisma.winner.deleteMany({ where: { monthYear } })
          deleted.winners = result.count
        }

        if (target === 'all' || target === 'votes') {
          const result = await prisma.vote.deleteMany({ where: { monthYear } })
          deleted.votes = result.count
        }

        if (target === 'all' || target === 'submissions') {
          // Delete votes first if clearing submissions (due to cascade)
          if (target === 'submissions') {
            const subs = await prisma.submission.findMany({ where: { monthYear } })
            const collectionIds = subs.map(s => s.collectionId)
            await prisma.vote.deleteMany({ where: { monthYear, collectionId: { in: collectionIds } } })
          }
          const result = await prisma.submission.deleteMany({ where: { monthYear } })
          deleted.submissions = result.count
        }

        return NextResponse.json({ success: true, deleted })
      }

      case 'delete-submission': {
        const { submissionId } = body
        
        if (!submissionId) {
          return NextResponse.json({ error: 'submissionId required' }, { status: 400 })
        }

        const submission = await prisma.submission.findUnique({
          where: { id: submissionId },
          include: { collection: true }
        })

        if (!submission) {
          return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
        }

        // Delete votes for this collection in this month
        await prisma.vote.deleteMany({
          where: {
            collectionId: submission.collectionId,
            monthYear: submission.monthYear
          }
        })

        // Delete the submission
        await prisma.submission.delete({ where: { id: submissionId } })

        return NextResponse.json({ success: true })
      }

      case 'block-user': {
        const { discordId, reason } = body
        
        if (!discordId) {
          return NextResponse.json({ error: 'discordId required' }, { status: 400 })
        }

        // Check if already blocked
        const existing = await prisma.blockedUser.findUnique({
          where: { discordId }
        })

        if (existing) {
          return NextResponse.json({ error: 'User is already blocked' }, { status: 400 })
        }

        const blocked = await prisma.blockedUser.create({
          data: {
            discordId,
            reason: reason || null,
            blockedBy: session.discordId
          }
        })

        return NextResponse.json({ success: true, blocked })
      }

      case 'unblock-user': {
        const { discordId } = body
        
        if (!discordId) {
          return NextResponse.json({ error: 'discordId required' }, { status: 400 })
        }

        await prisma.blockedUser.deleteMany({
          where: { discordId }
        })

        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}