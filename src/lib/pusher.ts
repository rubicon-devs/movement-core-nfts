import Pusher from 'pusher'

let pusherServer: Pusher | null = null

export function getPusherServer(): Pusher | null {
  if (pusherServer) return pusherServer

  const appId = process.env.PUSHER_APP_ID
  const key = process.env.PUSHER_KEY
  const secret = process.env.PUSHER_SECRET
  const cluster = process.env.PUSHER_CLUSTER

  if (!appId || !key || !secret || !cluster) {
    console.warn('Pusher not configured - real-time updates disabled')
    return null
  }

  pusherServer = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true
  })

  return pusherServer
}

export async function triggerVoteUpdate(
  collectionId: string,
  voteCount: number,
  monthYear: string
): Promise<void> {
  const pusher = getPusherServer()
  if (!pusher) return

  try {
    await pusher.trigger('votes', 'vote-update', {
      collectionId,
      voteCount,
      monthYear
    })
  } catch (error) {
    console.error('Error triggering vote update:', error)
  }
}

export async function triggerSubmissionUpdate(
  collectionId: string,
  monthYear: string
): Promise<void> {
  const pusher = getPusherServer()
  if (!pusher) return

  try {
    await pusher.trigger('submissions', 'new-submission', {
      collectionId,
      monthYear
    })
  } catch (error) {
    console.error('Error triggering submission update:', error)
  }
}

export async function triggerPhaseUpdate(
  phase: string,
  monthYear: string
): Promise<void> {
  const pusher = getPusherServer()
  if (!pusher) return

  try {
    await pusher.trigger('phase', 'phase-change', {
      phase,
      monthYear
    })
  } catch (error) {
    console.error('Error triggering phase update:', error)
  }
}
