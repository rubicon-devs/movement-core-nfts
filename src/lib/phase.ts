import { prisma } from './prisma'

export interface PhaseInfo {
  phase: 'submission' | 'voting' | 'display'
  phaseLabel: string
  monthYear: string
  monthLabel: string
  startTime: Date
  endTime: Date
  timeRemaining: number
  isOverridden: boolean
}

const SUBMISSION_START = 1
const SUBMISSION_END = 7
const VOTING_START = 8
const VOTING_END = 14

export async function getCurrentPhase(): Promise<PhaseInfo> {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const day = now.getDate()
  
  const monthYear = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Check for override
  try {
    const override = await prisma.phaseOverride.findUnique({ where: { monthYear } })
    if (override) {
      // Check if override has expired
      if (override.expiresAt && new Date(override.expiresAt) < now) {
        // Delete expired override
        await prisma.phaseOverride.delete({ where: { monthYear } })
      } else {
        const phase = override.phase as 'submission' | 'voting' | 'display'
        const endTime = override.expiresAt ? new Date(override.expiresAt) : getPhaseEndDate(phase, year, month)
        return {
          phase,
          phaseLabel: getPhaseLabel(phase),
          monthYear,
          monthLabel,
          startTime: now,
          endTime,
          timeRemaining: Math.max(0, endTime.getTime() - now.getTime()),
          isOverridden: true
        }
      }
    }
  } catch (e) {
    console.error('Phase override check failed:', e)
  }

  // Determine phase by day
  let phase: 'submission' | 'voting' | 'display'
  let startTime: Date
  let endTime: Date

  if (day >= SUBMISSION_START && day <= SUBMISSION_END) {
    phase = 'submission'
    startTime = new Date(year, month, SUBMISSION_START)
    endTime = new Date(year, month, SUBMISSION_END, 23, 59, 59)
  } else if (day >= VOTING_START && day <= VOTING_END) {
    phase = 'voting'
    startTime = new Date(year, month, VOTING_START)
    endTime = new Date(year, month, VOTING_END, 23, 59, 59)
  } else {
    phase = 'display'
    startTime = new Date(year, month, VOTING_END + 1)
    endTime = new Date(year, month + 1, 0, 23, 59, 59)
  }

  return {
    phase,
    phaseLabel: getPhaseLabel(phase),
    monthYear,
    monthLabel,
    startTime,
    endTime,
    timeRemaining: Math.max(0, endTime.getTime() - now.getTime()),
    isOverridden: false
  }
}

function getPhaseLabel(phase: string): string {
  switch (phase) {
    case 'submission': return 'Submission Phase'
    case 'voting': return 'Voting Phase'
    case 'display': return 'Winners Display'
    default: return 'Unknown'
  }
}

function getPhaseEndDate(phase: string, year: number, month: number): Date {
  switch (phase) {
    case 'submission': return new Date(year, month, SUBMISSION_END, 23, 59, 59)
    case 'voting': return new Date(year, month, VOTING_END, 23, 59, 59)
    default: return new Date(year, month + 1, 0, 23, 59, 59)
  }
}

export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Ended'
  const days = Math.floor(ms / (24 * 60 * 60 * 1000))
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000))
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}