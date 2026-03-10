'use client'

import { motion } from 'framer-motion'
import { Clock, Send, Vote, Trophy } from 'lucide-react'

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

export function PhaseBanner({ phase, timeRemaining }: { phase: PhaseInfo; timeRemaining: number }) {
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

  const startMs = new Date(phase.startTime).getTime()
  const endMs = new Date(phase.endTime).getTime()
  const phaseDuration = Math.max(1, endMs - startMs)
  const elapsed = Math.max(0, phaseDuration - timeRemaining)
  const progressPercent = Math.min(100, Math.max(0, (elapsed / phaseDuration) * 100))
  const daysTotal = Math.max(1, Math.ceil(phaseDuration / (24 * 60 * 60 * 1000)))
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
