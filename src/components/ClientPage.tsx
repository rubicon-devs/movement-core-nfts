'use client'

import { useEffect, useState, useCallback } from 'react'
import { Header } from './Header'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, Send, Vote, Trophy, ExternalLink, Twitter, Check, 
  Loader2, X, AlertCircle, CheckCircle, Search, SortAsc, SortDesc 
} from 'lucide-react'
import Image from 'next/image'

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

// Helper to format time
function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Ended'
  
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

// Phase Banner Component with progress bar
function PhaseBanner({ phase, timeRemaining }: { phase: PhaseInfo; timeRemaining: number }) {
  const getPhaseIcon = () => {
    switch (phase.phase) {
      case 'submission': return <Send className="w-5 h-5" />
      case 'voting': return <Vote className="w-5 h-5" />
      case 'display': return <Trophy className="w-5 h-5" />
      default: return <Clock className="w-5 h-5" />
    }
  }

  const getPhaseColor = () => {
    switch (phase.phase) {
      case 'submission': return 'from-blue-500/20 to-blue-600/20 border-blue-500/30'
      case 'voting': return 'from-movement-yellow/20 to-amber-500/20 border-movement-yellow/30'
      case 'display': return 'from-green-500/20 to-emerald-500/20 border-green-500/30'
      default: return 'from-movement-gray-700/20 to-movement-gray-800/20 border-movement-gray-600/30'
    }
  }

  const getPhaseTextColor = () => {
    switch (phase.phase) {
      case 'submission': return 'text-blue-400'
      case 'voting': return 'text-movement-yellow'
      case 'display': return 'text-green-400'
      default: return 'text-movement-gray-400'
    }
  }

  const getProgressBarColor = () => {
    switch (phase.phase) {
      case 'submission': return 'bg-blue-500'
      case 'voting': return 'bg-movement-yellow'
      case 'display': return 'bg-green-500'
      default: return 'bg-movement-gray-500'
    }
  }

  const getPhaseBannerClass = () => {
    switch (phase.phase) {
      case 'submission': return 'phase-banner phase-banner-submission'
      case 'voting': return 'phase-banner phase-banner-voting'
      case 'display': return 'phase-banner phase-banner-display'
      default: return 'phase-banner'
    }
  }

  // Calculate progress percentage and day info
  // Phase durations:
  // - Submission: 3 days (days 24-26 in a 31-day month)
  // - Voting: 4 days (days 27-30 in a 31-day month)
  // - Display: ~23 days (last day of month through day 23 of next month)
  const getPhaseDuration = () => {
    switch (phase.phase) {
      case 'submission': return 3 * 24 * 60 * 60 * 1000 // 3 days
      case 'voting': return 4 * 24 * 60 * 60 * 1000 // 4 days
      case 'display': return 23 * 24 * 60 * 60 * 1000 // ~23 days
      default: return 3 * 24 * 60 * 60 * 1000
    }
  }

  const phaseDuration = getPhaseDuration()
  const elapsed = phaseDuration - timeRemaining
  const progressPercent = Math.min(100, Math.max(0, (elapsed / phaseDuration) * 100))
  const daysTotal = Math.ceil(phaseDuration / (24 * 60 * 60 * 1000))
  const daysCurrent = Math.max(1, Math.min(daysTotal, Math.ceil(elapsed / (24 * 60 * 60 * 1000))))

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${getPhaseBannerClass()} relative overflow-hidden bg-gradient-to-r ${getPhaseColor()} border rounded-xl p-4 sm:p-6`}
    >
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-movement-gray-900/50 ${getPhaseTextColor()}`}>
            {getPhaseIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-xl font-bold ${getPhaseTextColor()}`}>
                {phase.phaseLabel}
              </h2>
              {phase.isOverridden && (
                <span className="badge badge-yellow text-xs">Override</span>
              )}
            </div>
            <p className="text-movement-gray-400 text-sm">
              {phase.monthLabel} Core Collections
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:text-right">
          <Clock className="w-5 h-5 text-movement-gray-500 sm:hidden" />
          <div>
            <p className="text-xs text-movement-gray-500 uppercase tracking-wider">
              {timeRemaining > 0 ? 'Time Remaining' : 'Phase Ended'}
            </p>
            <p className="text-2xl font-mono font-bold text-white">
              {formatTimeRemaining(timeRemaining)}
            </p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-movement-gray-500 mb-1">
          <span>Day {daysCurrent} of {daysTotal}</span>
          <span>{Math.round(progressPercent)}% complete</span>
        </div>
        <div className="h-1.5 bg-movement-gray-800 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full ${getProgressBarColor()} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  )
}

// Submission Form Component
function SubmissionForm({ monthYear, onSuccess, user, userSubmission }: { 
  monthYear: string
  onSuccess: () => void
  user: User | null
  userSubmission: UserSubmission | null
}) {
  const [contractAddress, setContractAddress] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contractAddress.trim() || !user) return

    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractAddress: contractAddress.trim(), monthYear })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit collection')
      }

      setSuccess(true)
      setContractAddress('')
      onSuccess()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="card p-6 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-movement-gray-500 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Connect Discord to Submit</h3>
        <p className="text-movement-gray-400 mb-4">You need to connect your Discord account to submit collections.</p>
        <a href="/api/auth/login" className="btn-primary inline-block">
          Sign in with Discord
        </a>
      </div>
    )
  }

  if (!user.hasRequiredRole) {
    return (
      <div className="card p-6 border-red-500/30">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Missing Required Role</h3>
            <p className="text-movement-gray-400 text-sm">
              You need to have one of the required roles in the Movement Discord server to submit collections.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (userSubmission) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6 border-green-500/30">
        <div className="flex items-start gap-4">
          <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Submission Complete</h3>
            <p className="text-movement-gray-400 text-sm mb-3">
              You have already submitted a collection this month:
            </p>
            <div className="p-3 bg-movement-gray-900/50 rounded-lg">
              <p className="font-semibold text-white">{userSubmission.collection.name}</p>
              <p className="text-xs font-mono text-movement-gray-500 mt-1 break-all">
                {userSubmission.collection.contractAddress}
              </p>
            </div>
            <p className="text-xs text-movement-gray-500 mt-3">
              Each user can only submit one collection per month.
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Submit a Collection</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="contractAddress" className="block text-sm text-movement-gray-400 mb-2">
            Contract Address
          </label>
          <div className="relative">
            <input
              id="contractAddress"
              type="text"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="0x..."
              className="input pr-10 font-mono text-sm"
              disabled={isSubmitting}
            />
            {contractAddress && (
              <button
                type="button"
                onClick={() => setContractAddress('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-movement-gray-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-movement-gray-500">
            Enter the Movement blockchain contract address of the NFT collection
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
            >
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
            >
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-400">Collection submitted successfully!</p>
            </motion.div>
          )}
        </AnimatePresence>

        <button type="submit" disabled={!contractAddress.trim() || isSubmitting} className="btn-primary w-full">
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting...</>
          ) : (
            <><Send className="w-4 h-4 mr-2" />Submit Collection</>
          )}
        </button>
      </form>
    </motion.div>
  )
}

// Collection Card Component with glow effect
function CollectionCard({ 
  collection, 
  phase, 
  canVote, 
  userVoteCount, 
  onVote,
  rank,
  hideVoteCounts = false
}: { 
  collection: Collection
  phase: string
  canVote: boolean
  userVoteCount: number
  onVote: (id: string) => void
  rank?: number
  hideVoteCounts?: boolean
}) {
  const [isVoting, setIsVoting] = useState(false)

  const handleVote = async () => {
    // Allow voting if: can vote AND (hasn't voted OR has voted to remove it) AND not at max (unless removing)
    if (!canVote || isVoting) return
    if (!collection.hasVoted && userVoteCount >= MAX_VOTES) return
    setIsVoting(true)
    await onVote(collection.id)
    setIsVoting(false)
  }

  const getRankClass = () => {
    if (!rank) return ''
    if (rank === 1) return 'rank-badge-gold'
    if (rank === 2) return 'rank-badge-silver'
    if (rank === 3) return 'rank-badge-bronze'
    return ''
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className={`card p-4 flex flex-col gap-3 ${
        collection.hasVoted ? 'border-movement-yellow/50 shadow-lg shadow-movement-yellow/10' : ''
      } ${rank && rank <= 3 ? getRankClass() : ''} ${rank && rank <= 15 ? 'border-green-500/30' : ''}`}
    >
      {rank && (
        <div className="absolute -top-2 -left-2 z-10">
          <div className={`rank-badge w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
            rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-movement-black rank-badge-gold' :
            rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-movement-black rank-badge-silver' :
            rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white rank-badge-bronze' :
            rank <= 15 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            'bg-movement-gray-700 text-movement-gray-400'
          }`}>
            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
          </div>
        </div>
      )}

      <div className="relative aspect-square rounded-lg overflow-hidden bg-movement-gray-900">
        {collection.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={collection.imageUrl.startsWith('ipfs://') 
              ? collection.imageUrl.replace('ipfs://', 'https://dweb.link/ipfs/') 
              : collection.imageUrl
            } 
            alt={collection.name} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl text-movement-gray-700">?</span>
          </div>
        )}
        {collection.hasVoted && (
          <div className="absolute inset-0 bg-movement-yellow/20 flex items-center justify-center">
            <div className="bg-movement-yellow rounded-full p-2 success-animation">
              <Check className="w-6 h-6 text-movement-black" />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-white truncate flex-1">{collection.name}</h3>
        <div className="flex items-center gap-1">
          {collection.twitterUrl && (
            <a href={collection.twitterUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-movement-gray-500 hover:text-movement-yellow transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
          )}
          {collection.tradeportUrl && (
            <a href={collection.tradeportUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-movement-gray-500 hover:text-movement-yellow transition-colors">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      <p className="text-xs font-mono text-movement-gray-500 truncate">{collection.contractAddress}</p>

      {phase === 'voting' && (
        <div className="flex items-center justify-between pt-2 border-t border-movement-gray-700">
          {!hideVoteCounts ? (
            <div className="flex items-center gap-2">
              <span className="vote-count text-2xl font-bold text-movement-yellow">{collection.voteCount}</span>
              <span className="text-sm text-movement-gray-500">votes</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-movement-gray-500">Votes hidden until results</span>
            </div>
          )}
          {canVote && (
            <button
              onClick={handleVote}
              disabled={isVoting || (!collection.hasVoted && userVoteCount >= MAX_VOTES)}
              className={`vote-btn ${
                collection.hasVoted ? 'vote-btn-active' :
                userVoteCount >= MAX_VOTES ? 'vote-btn-disabled' : 'vote-btn-inactive'
              }`}
              title={collection.hasVoted ? 'Click to remove vote' : userVoteCount >= MAX_VOTES ? 'Remove a vote first' : 'Click to vote'}
            >
              {isVoting ? <Loader2 className="w-4 h-4 animate-spin" /> :
               collection.hasVoted ? <><Check className="w-4 h-4" /><span>Voted</span></> : <span>Vote</span>}
            </button>
          )}
        </div>
      )}

      {phase === 'display' && (
        <div className="flex items-center gap-2 pt-2 border-t border-movement-gray-700">
          <span className="vote-count text-2xl font-bold text-movement-yellow">{collection.voteCount}</span>
          <span className="text-sm text-movement-gray-500">total votes</span>
        </div>
      )}
    </motion.div>
  )
}

// Main Client Page Component
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
          setWinners(winnersData.winners || [])
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