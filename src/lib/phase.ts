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

// Phase schedule:
// Submission: 8 days before end of month, runs for 3 days
// Voting: 5 days before end of month, runs for 4 days  
// Display: Last day of month until next submission phase

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export async function getCurrentPhase(): Promise<PhaseInfo> {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const day = now.getDate()
  const daysInMonth = getDaysInMonth(year, month)
  
  // Calculate phase boundaries based on days from end of month
  const submissionStart = daysInMonth - 7  // 8 days before end (e.g., day 24 in 31-day month)
  const submissionEnd = daysInMonth - 5    // 5 days before end (e.g., day 26)
  const votingStart = daysInMonth - 4      // 5 days before end (e.g., day 27)
  const votingEnd = daysInMonth - 1        // 1 day before end (e.g., day 30)
  const displayStart = daysInMonth         // Last day of month (e.g., day 31)
  
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
        const endTime = override.expiresAt ? new Date(override.expiresAt) : getPhaseEndDate(phase, year, month, daysInMonth)
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

  if (day >= submissionStart && day <= submissionEnd) {
    // Submission phase: 3 days (8-6 days before end of month)
    phase = 'submission'
    startTime = new Date(year, month, submissionStart)
    endTime = new Date(year, month, submissionEnd, 23, 59, 59)
  } else if (day >= votingStart && day <= votingEnd) {
    // Voting phase: 4 days (5-2 days before end of month)
    phase = 'voting'
    startTime = new Date(year, month, votingStart)
    endTime = new Date(year, month, votingEnd, 23, 59, 59)
  } else {
    // Display phase: last day of month through beginning of next month
    phase = 'display'
    if (day >= displayStart) {
      // Last day(s) of current month
      startTime = new Date(year, month, displayStart)
      // End when next month's submission starts
      const nextMonth = month + 1
      const nextYear = nextMonth > 11 ? year + 1 : year
      const nextMonthActual = nextMonth > 11 ? 0 : nextMonth
      const daysInNextMonth = getDaysInMonth(nextYear, nextMonthActual)
      const nextSubmissionStart = daysInNextMonth - 7
      endTime = new Date(nextYear, nextMonthActual, nextSubmissionStart - 1, 23, 59, 59)
    } else {
      // Beginning of month (before submission starts)
      startTime = new Date(year, month, 1)
      endTime = new Date(year, month, submissionStart - 1, 23, 59, 59)
    }
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

function getPhaseEndDate(phase: string, year: number, month: number, daysInMonth: number): Date {
  const submissionEnd = daysInMonth - 5
  const votingEnd = daysInMonth - 1
  
  switch (phase) {
    case 'submission': return new Date(year, month, submissionEnd, 23, 59, 59)
    case 'voting': return new Date(year, month, votingEnd, 23, 59, 59)
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