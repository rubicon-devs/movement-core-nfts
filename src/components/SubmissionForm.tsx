'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle, Loader2, Send, X } from 'lucide-react'

interface User {
  id: string
  discordId: string
  username: string
  avatar: string | null
  isAdmin: boolean
  hasRequiredRole: boolean
}

interface UserSubmission {
  id: string
  collectionId: string
  collection: {
    name: string
    contractAddress: string
  }
}

export function SubmissionForm({ monthYear, onSuccess, user, userSubmission }: { 
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
