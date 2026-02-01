import { prisma } from './prisma'

export interface PhaseInfo {
  phase: 'submission' | 'voting' | 'display'
  phaseLabel: string
  monthYear: string       // The month the winners represent (e.g., "2026-02" for February winners)
  monthLabel: string      // Human readable (e.g., "February 2026")
  startTime: Date
  endTime: Date
  timeRemaining: number
  isOverridden: boolean
}

// Phase schedule (happens at END of each month, for the NEXT month's winners):
// Submission: 8 days before end of month, runs for 3 days
// Voting: 5 days before end of month, runs for 4 days  
// Display: Last day of month until next submission phase
//
// Example for January (31 days):
// Jan 24-26: Submission for FEBRUARY winners
// Jan 27-30: Voting for FEBRUARY winners
// Jan 31 - Feb 23: Display FEBRUARY winners
// Feb 24-26: Submission for MARCH winners
// ...

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getNextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 11) {
    return { year: year + 1, month: 0 }
  }
  return { year, month: month + 1 }
}

function formatMonthYear(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

function formatMonthLabel(year: number, month: number): string {
  const date = new Date(year, month, 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
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
  const displayStartEndOfMonth = daysInMonth  // Last day of month (e.g., day 31)
  
  // Determine phase and the target month (what month the winners represent)
  let phase: 'submission' | 'voting' | 'display'
  let startTime: Date
  let endTime: Date
  let targetYear: number
  let targetMonth: number

  if (day >= submissionStart && day <= submissionEnd) {
    // Submission phase: nominating for NEXT month
    phase = 'submission'
    startTime = new Date(year, month, submissionStart)
    endTime = new Date(year, month, submissionEnd, 23, 59, 59)
    const next = getNextMonth(year, month)
    targetYear = next.year
    targetMonth = next.month
  } else if (day >= votingStart && day <= votingEnd) {
    // Voting phase: voting for NEXT month
    phase = 'voting'
    startTime = new Date(year, month, votingStart)
    endTime = new Date(year, month, votingEnd, 23, 59, 59)
    const next = getNextMonth(year, month)
    targetYear = next.year
    targetMonth = next.month
  } else if (day >= displayStartEndOfMonth) {
    // Display phase at END of month: showing NEXT month's winners
    phase = 'display'
    startTime = new Date(year, month, displayStartEndOfMonth)
    // End when next month's submission starts
    const next = getNextMonth(year, month)
    const daysInNextMonth = getDaysInMonth(next.year, next.month)
    const nextSubmissionStart = daysInNextMonth - 7
    endTime = new Date(next.year, next.month, nextSubmissionStart - 1, 23, 59, 59)
    targetYear = next.year
    targetMonth = next.month
  } else {
    // Display phase at BEGINNING of month (day 1 through before submission starts)
    // We're IN the month that was voted on, showing THIS month's winners
    phase = 'display'
    startTime = new Date(year, month, 1)
    endTime = new Date(year, month, submissionStart - 1, 23, 59, 59)
    targetYear = year
    targetMonth = month
  }

  const monthYear = formatMonthYear(targetYear, targetMonth)
  const monthLabel = formatMonthLabel(targetYear, targetMonth)

  // Check for override
  try {
    const override = await prisma.phaseOverride.findUnique({ where: { monthYear } })
    if (override) {
      // Check if override has expired
      if (override.expiresAt && new Date(override.expiresAt) < now) {
        // Delete expired override
        await prisma.phaseOverride.delete({ where: { monthYear } })
      } else {
        const overridePhase = override.phase as 'submission' | 'voting' | 'display'
        const overrideEndTime = override.expiresAt ? new Date(override.expiresAt) : endTime
        return {
          phase: overridePhase,
          phaseLabel: getPhaseLabel(overridePhase),
          monthYear,
          monthLabel,
          startTime: now,
          endTime: overrideEndTime,
          timeRemaining: Math.max(0, overrideEndTime.getTime() - now.getTime()),
          isOverridden: true
        }
      }
    }
  } catch (e) {
    console.error('Phase override check failed:', e)
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

export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Ended'
  const days = Math.floor(ms / (24 * 60 * 60 * 1000))
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000))
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}