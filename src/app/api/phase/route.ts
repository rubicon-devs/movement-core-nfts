import { NextResponse } from 'next/server'
import { getCurrentPhase } from '@/lib/phase'

export const dynamic = 'force-dynamic'

export async function GET() {
  console.log('=== PHASE API CALLED ===')
  
  try {
    const phase = await getCurrentPhase()
    console.log('Phase result:', phase.phase, phase.monthYear)
    return NextResponse.json(phase)
  } catch (error: any) {
    console.error('Phase API error:', error.message)
    
    // Return a default phase so the site doesn't break
    const now = new Date()
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    
    return NextResponse.json({
      phase: 'submission',
      phaseLabel: 'Submission Phase',
      monthYear,
      monthLabel,
      startTime: now.toISOString(),
      endTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      timeRemaining: 7 * 24 * 60 * 60 * 1000,
      isOverridden: false
    })
  }
}