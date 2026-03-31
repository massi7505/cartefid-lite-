import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stampEmitter, StampEvent } from '@/lib/events'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const userId = Number(session.user.id)
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Send initial ping so the client knows the connection is open
      controller.enqueue(encoder.encode('event: connected\ndata: {}\n\n'))

      const onStamp = (event: StampEvent) => {
        try {
          controller.enqueue(encoder.encode(`event: stamp\ndata: ${JSON.stringify(event)}\n\n`))
        } catch {}
      }

      // Keep-alive ping every 25s (prevents proxy/browser timeouts)
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'))
        } catch {
          clearInterval(keepAlive)
        }
      }, 25_000)

      stampEmitter.on(`stamp:${userId}`, onStamp)

      // Cleanup when client disconnects
      return () => {
        clearInterval(keepAlive)
        stampEmitter.off(`stamp:${userId}`, onStamp)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // disable nginx buffering
    },
  })
}
