'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Settings,
  Download,
  Trash2,
  Play,
  RefreshCw,
  Clock,
  Users,
  Vote,
  Trophy,
  AlertCircle,
  Check,
  Loader2,
  ArrowLeft,
  FileDown,
  Calendar,
  Ban,
  UserX,
  UserCheck
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { format, addMonths, startOfMonth } from 'date-fns'

interface User {
  id: string
  discordId: string
  username: string
  isAdmin: boolean
}

interface AdminStats {
  submissions: number
  votes: number
  uniqueVoters: number
}

interface PhaseInfo {
  phase: string
  phaseLabel: string
  monthYear: string
  monthLabel: string
  isOverridden: boolean
}

interface Submission {
  id: string
  monthYear: string
  createdAt: string
  collection: {
    id: string
    name: string
    contractAddress: string
    imageUrl: string | null
  }
  user: {
    id: string
    username: string
    discordId: string
    avatar: string | null
  }
}

interface BlockedUser {
  id: string
  discordId: string
  reason: string | null
  blockedBy: string
  createdAt: string
}

export default function AdminPage() {
  const router = useRouter()
  
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [phase, setPhase] = useState<PhaseInfo | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Phase override form
  const [overridePhase, setOverridePhase] = useState<'submission' | 'voting' | 'display'>('submission')
  const [overrideMonthYear, setOverrideMonthYear] = useState('')
  const [overrideDuration, setOverrideDuration] = useState(24)

  // Clear data form
  const [clearMonthYear, setClearMonthYear] = useState('')
  const [clearTarget, setClearTarget] = useState<'all' | 'submissions' | 'votes' | 'winners'>('all')

  // Block user form
  const [blockDiscordId, setBlockDiscordId] = useState('')
  const [blockReason, setBlockReason] = useState('')

  // Active tab
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'blocked'>('overview')

  const fetchStats = useCallback(async () => {
    try {
      const sessionRes = await fetch('/api/auth/session')
      const sessionData = await sessionRes.json()
      
      if (!sessionData.user?.isAdmin) {
        router.push('/')
        return
      }
      setUser(sessionData.user)

      const phaseRes = await fetch('/api/phase')
      if (phaseRes.ok) {
        const phaseData = await phaseRes.json()
        setPhase(phaseData)
        if (!overrideMonthYear) {
          setOverrideMonthYear(phaseData.monthYear)
          setClearMonthYear(phaseData.monthYear)
        }

        const statsRes = await fetch(`/api/admin?action=stats&monthYear=${phaseData.monthYear}`)
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }

        const subsRes = await fetch(`/api/admin?action=submissions-list&monthYear=${phaseData.monthYear}`)
        if (subsRes.ok) {
          const subsData = await subsRes.json()
          setSubmissions(subsData.submissions || [])
        }
      }

      const blockedRes = await fetch('/api/admin?action=blocked-users')
      if (blockedRes.ok) {
        const blockedData = await blockedRes.json()
        setBlockedUsers(blockedData.blockedUsers || [])
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }, [router, overrideMonthYear])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleSetPhase = async () => {
    setActionLoading('set-phase')
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'override-phase',
          phase: overridePhase,
          monthYear: overrideMonthYear,
          durationHours: overrideDuration
        })
      })
      if (response.ok) {
        showMessage('success', `Phase set to ${overridePhase} for ${overrideDuration} hours`)
        fetchStats()
      } else {
        const data = await response.json()
        showMessage('error', data.error || 'Failed to set phase')
      }
    } catch {
      showMessage('error', 'Failed to set phase')
    } finally {
      setActionLoading(null)
    }
  }

  const handleResetPhase = async () => {
    setActionLoading('reset-phase')
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-override', monthYear: overrideMonthYear })
      })
      if (response.ok) {
        showMessage('success', 'Phase reset to natural schedule')
        fetchStats()
      } else {
        showMessage('error', 'Failed to reset phase')
      }
    } catch {
      showMessage('error', 'Failed to reset phase')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCalculateWinners = async () => {
    if (!phase) return
    setActionLoading('calculate-winners')
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'calculate-winners', monthYear: phase.monthYear })
      })
      if (response.ok) {
        const data = await response.json()
        showMessage('success', `Calculated ${data.winners?.length || 0} winners`)
      } else {
        showMessage('error', 'Failed to calculate winners')
      }
    } catch {
      showMessage('error', 'Failed to calculate winners')
    } finally {
      setActionLoading(null)
    }
  }

  const handleClearData = async () => {
    const targetLabel = clearTarget === 'all' ? 'all data' : clearTarget
    if (!window.confirm(`Clear ${targetLabel} for ${clearMonthYear}? This cannot be undone.`)) return

    setActionLoading('clear-data')
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-data', target: clearTarget, monthYear: clearMonthYear })
      })
      if (response.ok) {
        showMessage('success', `Cleared ${targetLabel} successfully`)
        fetchStats()
      } else {
        showMessage('error', 'Failed to clear data')
      }
    } catch {
      showMessage('error', 'Failed to clear data')
    } finally {
      setActionLoading(null)
    }
  }

  const handleExport = async (type: 'winners' | 'submissions' | 'votes' | 'all') => {
    setActionLoading(`export-${type}`)
    try {
      const monthYear = phase?.monthYear || format(new Date(), 'yyyy-MM')
      const response = await fetch(`/api/admin?action=export-${type}&monthYear=${monthYear}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}-${monthYear}.csv`
        a.click()
        URL.revokeObjectURL(url)
        showMessage('success', `Exported ${type} successfully`)
      } else {
        showMessage('error', 'Failed to export data')
      }
    } catch {
      showMessage('error', 'Failed to export data')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteSubmission = async (submissionId: string, collectionName: string) => {
    if (!window.confirm(`Delete "${collectionName}"? This will also delete all votes.`)) return
    setActionLoading(`delete-${submissionId}`)
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-submission', submissionId })
      })
      if (response.ok) {
        showMessage('success', `Deleted "${collectionName}"`)
        setSubmissions(prev => prev.filter(s => s.id !== submissionId))
        fetchStats()
      } else {
        showMessage('error', 'Failed to delete submission')
      }
    } catch {
      showMessage('error', 'Failed to delete submission')
    } finally {
      setActionLoading(null)
    }
  }

  const handleBlockUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!blockDiscordId.trim()) return
    setActionLoading('block-user')
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'block-user', discordId: blockDiscordId.trim(), reason: blockReason.trim() || null })
      })
      if (response.ok) {
        showMessage('success', `Blocked user ${blockDiscordId}`)
        setBlockDiscordId('')
        setBlockReason('')
        fetchStats()
      } else {
        const data = await response.json()
        showMessage('error', data.error || 'Failed to block user')
      }
    } catch {
      showMessage('error', 'Failed to block user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnblockUser = async (discordId: string) => {
    if (!window.confirm(`Unblock user ${discordId}?`)) return
    setActionLoading(`unblock-${discordId}`)
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unblock-user', discordId })
      })
      if (response.ok) {
        showMessage('success', `Unblocked user ${discordId}`)
        setBlockedUsers(prev => prev.filter(u => u.discordId !== discordId))
      } else {
        showMessage('error', 'Failed to unblock user')
      }
    } catch {
      showMessage('error', 'Failed to unblock user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleBlockFromSubmission = async (discordId: string, username: string) => {
    const reason = window.prompt(`Block ${username}? Enter reason (optional):`)
    if (reason === null) return
    setActionLoading(`block-${discordId}`)
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'block-user', discordId, reason: reason.trim() || null })
      })
      if (response.ok) {
        showMessage('success', `Blocked ${username}`)
        fetchStats()
      } else {
        const data = await response.json()
        showMessage('error', data.error || 'Failed to block user')
      }
    } catch {
      showMessage('error', 'Failed to block user')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-movement-yellow" />
      </div>
    )
  }

  if (!user?.isAdmin) return null

  const monthOptions = []
  const now = new Date()
  for (let i = -6; i <= 2; i++) {
    const date = addMonths(startOfMonth(now), i)
    monthOptions.push({ value: format(date, 'yyyy-MM'), label: format(date, 'MMMM yyyy') })
  }

  return (
    <div className="min-h-screen pb-12">
      <header className="bg-movement-gray-900 border-b border-movement-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 text-movement-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-movement-yellow" />
                <h1 className="text-xl font-bold text-white">Admin Panel</h1>
              </div>
            </div>
            <button onClick={fetchStats} className="btn-ghost flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="bg-movement-gray-900 border-b border-movement-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {(['overview', 'submissions', 'blocked'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === tab ? 'text-movement-yellow border-b-2 border-movement-yellow' : 'text-movement-gray-400 hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'submissions' && <span className="text-xs bg-movement-gray-700 px-2 py-0.5 rounded-full">{submissions.length}</span>}
                {tab === 'blocked' && blockedUsers.length > 0 && (
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{blockedUsers.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success' ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
            }`}
          >
            {message.type === 'success' ? <Check className="w-5 h-5 text-green-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
            <span className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>{message.text}</span>
          </motion.div>
        )}

        {activeTab === 'overview' && (
          <>
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="card p-4"><div className="flex items-center gap-3"><Calendar className="w-5 h-5 text-blue-400" /><div><p className="text-sm text-movement-gray-400">Submissions</p><p className="text-2xl font-bold text-white">{stats?.submissions || 0}</p></div></div></div>
              <div className="card p-4"><div className="flex items-center gap-3"><Vote className="w-5 h-5 text-green-400" /><div><p className="text-sm text-movement-gray-400">Votes</p><p className="text-2xl font-bold text-white">{stats?.votes || 0}</p></div></div></div>
              <div className="card p-4"><div className="flex items-center gap-3"><Users className="w-5 h-5 text-purple-400" /><div><p className="text-sm text-movement-gray-400">Unique Voters</p><p className="text-2xl font-bold text-white">{stats?.uniqueVoters || 0}</p></div></div></div>
              <div className="card p-4"><div className="flex items-center gap-3"><Clock className="w-5 h-5 text-movement-yellow" /><div><p className="text-sm text-movement-gray-400">Phase</p><p className="text-lg font-bold text-white">{phase?.phaseLabel}</p>{phase?.isOverridden && <span className="badge badge-yellow text-xs">Override</span>}</div></div></div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section className="card p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-movement-yellow" />Phase Control</h2>
                <div className="space-y-4">
                  <div><label className="block text-sm text-movement-gray-400 mb-2">Phase</label><select value={overridePhase} onChange={(e) => setOverridePhase(e.target.value as any)} className="input"><option value="submission">Submission</option><option value="voting">Voting</option><option value="display">Display</option></select></div>
                  <div><label className="block text-sm text-movement-gray-400 mb-2">Target Month</label><select value={overrideMonthYear} onChange={(e) => setOverrideMonthYear(e.target.value)} className="input">{monthOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}</select></div>
                  <div><label className="block text-sm text-movement-gray-400 mb-2">Duration (hours)</label><input type="number" value={overrideDuration} onChange={(e) => setOverrideDuration(parseInt(e.target.value) || 1)} min={1} max={720} className="input" /></div>
                  <div className="flex gap-3">
                    <button onClick={handleSetPhase} disabled={actionLoading === 'set-phase'} className="btn-primary flex-1 flex items-center justify-center gap-2">{actionLoading === 'set-phase' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}Set Phase</button>
                    <button onClick={handleResetPhase} disabled={actionLoading === 'reset-phase'} className="btn-secondary flex items-center justify-center gap-2">{actionLoading === 'reset-phase' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}Reset</button>
                  </div>
                </div>
              </section>

              <section className="card p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-movement-yellow" />Winner Calculation</h2>
                <p className="text-movement-gray-400 mb-4">Calculate the top 15 collections by vote count.</p>
                <button onClick={handleCalculateWinners} disabled={actionLoading === 'calculate-winners'} className="btn-primary w-full flex items-center justify-center gap-2">{actionLoading === 'calculate-winners' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}Calculate Winners for {phase?.monthLabel}</button>
              </section>

              <section className="card p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Download className="w-5 h-5 text-movement-yellow" />Data Export</h2>
                <div className="grid grid-cols-2 gap-3">
                  {(['winners', 'submissions', 'votes', 'all'] as const).map((type) => (
                    <button key={type} onClick={() => handleExport(type)} disabled={actionLoading === `export-${type}`} className="btn-secondary flex items-center justify-center gap-2">{actionLoading === `export-${type}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}{type.charAt(0).toUpperCase() + type.slice(1)}</button>
                  ))}
                </div>
              </section>

              <section className="card p-6 border-red-500/30">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Trash2 className="w-5 h-5 text-red-400" />Clear Data</h2>
                <div className="space-y-4">
                  <div><label className="block text-sm text-movement-gray-400 mb-2">What to clear</label><select value={clearTarget} onChange={(e) => setClearTarget(e.target.value as any)} className="input"><option value="all">All Data</option><option value="submissions">Submissions only</option><option value="votes">Votes only</option><option value="winners">Winners only</option></select></div>
                  <div><label className="block text-sm text-movement-gray-400 mb-2">Month</label><select value={clearMonthYear} onChange={(e) => setClearMonthYear(e.target.value)} className="input">{monthOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}</select></div>
                  <button onClick={handleClearData} disabled={actionLoading === 'clear-data'} className="w-full py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg font-semibold hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2">{actionLoading === 'clear-data' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}Clear {clearTarget}</button>
                </div>
              </section>
            </div>
          </>
        )}

        {activeTab === 'submissions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Submissions for {phase?.monthLabel}</h2>
              <span className="text-movement-gray-400">{submissions.length} total</span>
            </div>
            {submissions.length === 0 ? (
              <div className="card p-8 text-center"><p className="text-movement-gray-400">No submissions yet.</p></div>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <div key={sub.id} className="card p-4 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-movement-gray-800 flex-shrink-0">
                      {sub.collection.imageUrl ? (
                        sub.collection.imageUrl.startsWith('ipfs://') ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={sub.collection.imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')} alt={sub.collection.name} className="w-full h-full object-cover" />
                        ) : (
                          <Image src={sub.collection.imageUrl} alt={sub.collection.name} width={64} height={64} className="object-cover" />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-movement-gray-600">?</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{sub.collection.name}</h3>
                      <p className="text-xs font-mono text-movement-gray-500 truncate">{sub.collection.contractAddress}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-movement-gray-400">by {sub.user.username}</span>
                        <span className="text-xs text-movement-gray-600">•</span>
                        <span className="text-xs text-movement-gray-500">{new Date(sub.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => handleBlockFromSubmission(sub.user.discordId, sub.user.username)} disabled={actionLoading === `block-${sub.user.discordId}`} className="p-2 text-movement-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title={`Block ${sub.user.username}`}>
                        {actionLoading === `block-${sub.user.discordId}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleDeleteSubmission(sub.id, sub.collection.name)} disabled={actionLoading === `delete-${sub.id}`} className="p-2 text-movement-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete submission">
                        {actionLoading === `delete-${sub.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'blocked' && (
          <div className="space-y-6">
            <section className="card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Ban className="w-5 h-5 text-red-400" />Block a User</h2>
              <form onSubmit={handleBlockUser} className="space-y-4">
                <div><label className="block text-sm text-movement-gray-400 mb-2">Discord ID</label><input type="text" value={blockDiscordId} onChange={(e) => setBlockDiscordId(e.target.value)} placeholder="123456789012345678" className="input font-mono" /></div>
                <div><label className="block text-sm text-movement-gray-400 mb-2">Reason (optional)</label><input type="text" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Spam, abuse, etc." className="input" /></div>
                <button type="submit" disabled={!blockDiscordId.trim() || actionLoading === 'block-user'} className="btn-primary flex items-center justify-center gap-2">{actionLoading === 'block-user' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}Block User</button>
              </form>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Blocked Users ({blockedUsers.length})</h2>
              {blockedUsers.length === 0 ? (
                <div className="card p-8 text-center"><UserCheck className="w-12 h-12 mx-auto text-movement-gray-600 mb-3" /><p className="text-movement-gray-400">No blocked users.</p></div>
              ) : (
                <div className="space-y-3">
                  {blockedUsers.map((blocked) => (
                    <div key={blocked.id} className="card p-4 flex items-center justify-between">
                      <div>
                        <p className="font-mono text-white">{blocked.discordId}</p>
                        {blocked.reason && <p className="text-sm text-movement-gray-400 mt-1">{blocked.reason}</p>}
                        <p className="text-xs text-movement-gray-500 mt-1">Blocked {new Date(blocked.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => handleUnblockUser(blocked.discordId)} disabled={actionLoading === `unblock-${blocked.discordId}`} className="btn-secondary flex items-center gap-2">{actionLoading === `unblock-${blocked.discordId}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}Unblock</button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}