'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ExternalLink, Loader2, Twitter } from 'lucide-react'

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

const MAX_VOTES = 5

export function CollectionCard({ 
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
