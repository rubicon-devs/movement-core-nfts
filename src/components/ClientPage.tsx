'use client'

import { useEffect, useState, useCallback } from 'react'
import { Header } from './Header'
import { AlertCircle, Search, SortAsc, SortDesc, Trophy } from 'lucide-react'
import Image from 'next/image'
import { PhaseBanner } from './PhaseBanner'
import { SubmissionForm } from './SubmissionForm'
import { CollectionCard } from './CollectionCard'

// Types
interface User {
  id: string
  discordId: string
  username: string
  avatar: string | null
  isAdmin: boolean
  hasRequiredRole: boolean
}

interface PhaseInfo {
  phase: 'submission' | 'voting' | 'display'
  phaseLabel: string
  monthYear: string
  monthLabel: string
  startTime: string
  endTime: string
  timeRemaining: number
  isOverridden: boolean
}

interface Collection {
  id: string
  contractAddress: string
  name: string
  imageUrl: string | null
  description: string | null
  twitterUrl: string | null
  tradeportUrl: string | null
  voteCount: number | null
  hasVoted: boolean
}

interface Winner {
  id: string
  rank: number
  voteCount: number
  collection: Collection
}

interface UserSubmission {
  id: string
  collectionId: string
  collection: {
    name: string
    contractAddress: string
  }
}

const MAX_VOTES = 5

export function ClientPage() {
  const [user, setUser] = useState<User | null>(null)
  const [phase, setPhase] = useState<PhaseInfo | null>(null)
  const [collections, setCollections] = useState<Collection[]>([])
  const [winners, setWinners] = useState<Winner[]>([])
  const [userVoteCount, setUserVoteCount] = useState(0)
  const [userSubmission, setUserSubmission] = useState<UserSubmission | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'votes-desc' | 'votes-asc' | 'name'>('name')
  const [hideVoteCounts, setHideVoteCounts] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      // Fetch session
      const sessionRes = await fetch('/api/auth/session')
      const sessionData = await sessionRes.json()
      setUser(sessionData.user)

      // Fetch phase
      const phaseRes = await fetch('/api/phase')
      const phaseData = await phaseRes.json()
      setPhase(phaseData)
      setTimeRemaining(phaseData.timeRemaining)

      // Fetch collections
      const collectionsRes = await fetch(`/api/collections?monthYear=${phaseData.monthYear}`)
      const collectionsData = await collectionsRes.json()
      setCollections(collectionsData.collections || [])
      setUserVoteCount(collectionsData.userVoteCount || 0)
      setUserSubmission(collectionsData.userSubmission || null)
      setHideVoteCounts(collectionsData.hideVoteCounts || false)

      // Fetch winners if display phase
      if (phaseData.phase === 'display') {
        const winnersRes = await fetch(`/api/winners?monthYear=${phaseData.monthYear}`)
        if (winnersRes.ok) {
          const winnersData = await winnersRes.json()
          setWinners((winnersData.winners || []).slice(0, 15))
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleVote = async (collectionId: string) => {
    if (!phase) return

    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId, monthYear: phase.monthYear })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.action === 'added') {
          // Vote was added
          setCollections(prev => prev.map(c => 
            c.id === collectionId ? { ...c, voteCount: (c.voteCount || 0) + 1, hasVoted: true } : c
          ))
          setUserVoteCount(prev => prev + 1)
        } else if (data.action === 'removed') {
          // Vote was removed
          setCollections(prev => prev.map(c => 
            c.id === collectionId ? { ...c, voteCount: (c.voteCount || 0) - 1, hasVoted: false } : c
          ))
          setUserVoteCount(prev => prev - 1)
        }
      }
    } catch (error) {
      console.error('Vote error:', error)
    }
  }

  const filteredCollections = collections
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                 c.contractAddress.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      switch (sortOrder) {
        case 'votes-desc': return (b.voteCount || 0) - (a.voteCount || 0)
        case 'votes-asc': return (a.voteCount || 0) - (b.voteCount || 0)
        case 'name': return a.name.localeCompare(b.name)
        default: return 0
      }
    })

  const canVote = Boolean(user?.hasRequiredRole) && phase?.phase === 'voting'

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-20 h-20 animate-bounce">
          <Image src="/logo.png" alt="Loading" width={80} height={80} className="w-full h-full object-contain" />
        </div>
        <p className="text-movement-gray-400 text-sm">Loading collections...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <Header />

      <main className="pt-20 pb-12 spotlight">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Hero */}
          <section className="py-8 sm:py-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl sm:text-6xl font-display tracking-wider text-white mb-4">
                MOVEMENT<span className="text-gradient-shimmer"> CORE NFTs</span>
              </h1>
              <p className="text-lg text-movement-gray-400 max-w-2xl mx-auto">
                Each month the Movement Community votes for the top NFT collections!
              </p>
            </div>

            {phase && <PhaseBanner phase={phase} timeRemaining={timeRemaining} />}
          </section>

          {/* Content */}
          <section className="py-8">
            {phase?.phase === 'submission' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <SubmissionForm 
                    monthYear={phase.monthYear} 
                    onSuccess={fetchData} 
                    user={user}
                    userSubmission={userSubmission}
                  />
                </div>
                <div className="lg:col-span-2">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Submitted Collections ({collections.length})
                  </h2>
                  {collections.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {collections.map(collection => (
                        <CollectionCard
                          key={collection.id}
                          collection={collection}
                          phase={phase.phase}
                          canVote={false}
                          userVoteCount={0}
                          onVote={() => {}}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="card p-12 text-center">
                      <div className="w-24 h-24 mx-auto mb-4 animate-bounce">
                        <Image src="/logo.png" alt="Be the first!" width={96} height={96} className="w-full h-full object-contain" />
                      </div>
                      <p className="text-xl text-white font-semibold mb-2">Be the first to submit! 🚀</p>
                      <p className="text-movement-gray-400">No collections have been submitted yet this month.</p>
                      <p className="text-movement-gray-500 text-sm mt-1">Your favorite NFT collection could be #1!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {phase?.phase === 'voting' && (
              <>
                {user && (
                  <div className="card p-4 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Your Votes</h3>
                        <p className="text-sm text-movement-gray-400">Vote for up to {MAX_VOTES} collections. Click again to remove a vote.</p>
                      </div>
                      <div className="flex gap-2">
                        {[...Array(MAX_VOTES)].map((_, i) => (
                          <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                            i < userVoteCount ? 'bg-movement-yellow text-movement-black scale-100' : 'bg-movement-gray-700 text-movement-gray-500 scale-90'
                          }`}>
                            {i + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                    {user && !user.hasRequiredRole && (
                      <div className="mt-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <p className="text-sm text-red-400">You need a required Discord role to vote</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-movement-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search collections..."
                      className="input pl-10"
                    />
                  </div>
                  {!hideVoteCounts && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSortOrder('votes-desc')} className={`btn-ghost ${sortOrder === 'votes-desc' ? 'text-movement-yellow' : ''}`}>
                        <SortDesc className="w-4 h-4 mr-1" />Most Votes
                      </button>
                      <button onClick={() => setSortOrder('votes-asc')} className={`btn-ghost ${sortOrder === 'votes-asc' ? 'text-movement-yellow' : ''}`}>
                        <SortAsc className="w-4 h-4 mr-1" />Least Votes
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredCollections.map(collection => (
                    <CollectionCard
                      key={collection.id}
                      collection={collection}
                      phase={phase.phase}
                      canVote={canVote}
                      userVoteCount={userVoteCount}
                      onVote={handleVote}
                      hideVoteCounts={hideVoteCounts}
                    />
                  ))}
                </div>

                {filteredCollections.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-4 opacity-50">
                      <Image src="/logo.png" alt="No results" width={96} height={96} className="w-full h-full object-contain" />
                    </div>
                    {searchQuery ? (
                      <>
                        <p className="text-movement-gray-400">No collections found matching "{searchQuery}"</p>
                        <p className="text-movement-gray-500 text-sm mt-1">Try a different search term</p>
                      </>
                    ) : (
                      <>
                        <p className="text-movement-gray-400">No collections to vote on yet!</p>
                        <p className="text-movement-gray-500 text-sm mt-1">Collections from the submission phase will appear here</p>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {phase?.phase === 'display' && (
              <div>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-movement-yellow/10 border border-movement-yellow/30 rounded-full mb-4">
                    <Trophy className="w-6 h-6 text-movement-yellow" />
                    <span className="text-movement-yellow font-semibold">{phase.monthLabel} Winners</span>
                  </div>
                </div>

                {winners.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {winners.map(winner => (
                      <CollectionCard
                        key={winner.id}
                        collection={{ ...winner.collection, voteCount: winner.voteCount, hasVoted: false }}
                        phase={phase.phase}
                        canVote={false}
                        userVoteCount={0}
                        onVote={() => {}}
                        rank={winner.rank}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-4 opacity-50">
                      <Image src="/logo.png" alt="Waiting" width={96} height={96} className="w-full h-full object-contain" />
                    </div>
                    <p className="text-movement-gray-400">Winners have not been calculated yet.</p>
                    <p className="text-movement-gray-500 text-sm mt-1">Check back after the voting phase ends!</p>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="border-t border-movement-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded overflow-hidden">
                <Image src="/logo.png" alt="Movement Core NFTs" width={32} height={32} className="w-full h-full object-contain" />
              </div>
              <span className="text-movement-gray-500 text-sm">Movement Core NFTs</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-movement-gray-500">
              <a href="https://movementnetwork.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-movement-yellow transition-colors">Movement Network</a>
              <a href="https://tradeport.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-movement-yellow transition-colors">Tradeport</a>
              <a href="https://discord.gg/moveindustries" target="_blank" rel="noopener noreferrer" className="hover:text-movement-yellow transition-colors">Discord</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}