import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export interface PushPayload {
  title: string
  body: string
  icon?: string
  url?: string
  badge?: string
  sound?: string   // URL of custom sound (used by client page when open)
  silent?: boolean // true = no system sound/vibration
}

/**
 * Send a push notification to all subscriptions of a user.
 * Silently removes expired/invalid subscriptions.
 */
export async function sendPushToUser(userId: number, payload: PushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  })

  if (subscriptions.length === 0) return

  const data = JSON.stringify(payload)
  const expired: number[] = []

  await Promise.all(
    subscriptions.map(async sub => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          data,
        )
      } catch (err: unknown) {
        // 404 or 410 = subscription expired/unsubscribed
        if (err && typeof err === 'object' && 'statusCode' in err) {
          const code = (err as { statusCode: number }).statusCode
          if (code === 404 || code === 410) expired.push(sub.id)
        }
      }
    })
  )

  if (expired.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: expired } } })
  }
}
