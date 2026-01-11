import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCurrentPhase } from '@/lib/phase'
import { Header } from '@/components/Header'
import { MainContent } from '@/components/MainContent'

export const dynamic = 'force-dynamic'

async function getPageData() {
  const session = await getServerSession(authOptions)
  const phase = await getCurrentPhase()

  // Get collections for this month
  const submissions = await prisma.submission.findMany({
    where: { monthYear: phase.monthYear },
    include: {
      collection: {
        include: {
          votes: {
            where: { monthYear: phase.monthYear }
          }
        }
      }
    }
  })

  // Get user's votes if authenticated
  let userVoteIds: string[] = []
  if (session) {
    const userVotes = await prisma.vote.findMany({
      where: {
        userId: session.user.id,
        monthYear: phase.monthYear
      },
      select: { collectionId: true }
    })
    userVoteIds = userVotes.map((v) => v.collectionId)
  }

  // Serialize dates and ensure proper types for client components
  const serializedCollections = submissions.map((sub) => ({
    id: sub.collection.id,
    contractAddress: sub.collection.contractAddress,
    name: sub.collection.name,
    imageUrl: sub.collection.imageUrl,
    description: sub.collection.description,
    twitterUrl: sub.collection.twitterUrl,
    tradeportUrl: sub.collection.tradeportUrl,
    floorPrice: sub.collection.floorPrice,
    volume: sub.collection.volume,
    createdAt: sub.collection.createdAt.toISOString(),
    updatedAt: sub.collection.updatedAt.toISOString(),
    voteCount: sub.collection.votes.length,
    hasVoted: userVoteIds.includes(sub.collectionId), // Always boolean
    votes: sub.collection.votes.map(v => ({
      id: v.id,
      collectionId: v.collectionId,
      userId: v.userId,
      monthYear: v.monthYear,
      createdAt: v.createdAt.toISOString()
    })),
    submission: {
      id: sub.id,
      collectionId: sub.collectionId,
      userId: sub.userId,
      monthYear: sub.monthYear,
      createdAt: sub.createdAt.toISOString()
    }
  }))

  // Sort by vote count
  serializedCollections.sort((a, b) => b.voteCount - a.voteCount)

  // Serialize phase
  const serializedPhase = {
    phase: phase.phase,
    phaseLabel: phase.phaseLabel,
    monthYear: phase.monthYear,
    monthLabel: phase.monthLabel,
    startTime: phase.startTime.toISOString(),
    endTime: phase.endTime.toISOString(),
    timeRemaining: phase.timeRemaining,
    isOverridden: phase.isOverridden,
  }

  // Get winners for display phase
  let serializedWinners = null
  if (phase.phase === 'display') {
    const winners = await prisma.winner.findMany({
      where: { monthYear: phase.monthYear },
      include: { collection: true },
      orderBy: { rank: 'asc' }
    })

    serializedWinners = winners.map(w => ({
      id: w.id,
      collectionId: w.collectionId,
      monthYear: w.monthYear,
      rank: w.rank,
      voteCount: w.voteCount,
      createdAt: w.createdAt.toISOString(),
      collection: {
        id: w.collection.id,
        contractAddress: w.collection.contractAddress,
        name: w.collection.name,
        imageUrl: w.collection.imageUrl,
        description: w.collection.description,
        twitterUrl: w.collection.twitterUrl,
        tradeportUrl: w.collection.tradeportUrl,
        floorPrice: w.collection.floorPrice,
        volume: w.collection.volume,
        createdAt: w.collection.createdAt.toISOString(),
        updatedAt: w.collection.updatedAt.toISOString()
      }
    }))
  }

  return {
    phase: serializedPhase,
    collections: serializedCollections,
    userVoteCount: userVoteIds.length,
    winners: serializedWinners
  }
}

export default async function HomePage() {
  const { phase, collections, userVoteCount, winners } = await getPageData()

  return (
    <div className="min-h-screen">
      <Header />

      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <section className="py-8 sm:py-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl sm:text-6xl font-display tracking-wider text-white mb-4">
                MOVEMENT
                <span className="text-gradient"> CORE</span>
              </h1>
              <p className="text-lg text-movement-gray-400 max-w-2xl mx-auto">
                Community-driven selection of the top NFT collections on Movement blockchain.
                Submit, vote, and discover the best collections each month.
              </p>
            </div>
          </section>

          {/* Main Content - Client Component */}
          <MainContent
            initialPhase={phase}
            initialCollections={collections}
            userVoteCount={userVoteCount}
            winners={winners}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-movement-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-movement-yellow rounded flex items-center justify-center">
                <span className="font-display text-movement-black">M</span>
              </div>
              <span className="text-movement-gray-500 text-sm">
                Movement Core Collections
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-movement-gray-500">
              <a
                href="https://movementnetwork.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-movement-yellow transition-colors"
              >
                Movement Network
              </a>
              <a
                href="https://tradeport.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-movement-yellow transition-colors"
              >
                Tradeport
              </a>
              <a
                href="https://discord.gg/moveindustries"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-movement-yellow transition-colors"
              >
                Discord
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}