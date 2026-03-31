import { EventEmitter } from 'events'

// Singleton — shared across all API routes in the same Node.js process
const globalEvents = globalThis as typeof globalThis & { _stampEmitter?: EventEmitter }

if (!globalEvents._stampEmitter) {
  globalEvents._stampEmitter = new EventEmitter()
  globalEvents._stampEmitter.setMaxListeners(500)
}

export const stampEmitter = globalEvents._stampEmitter

export interface StampEvent {
  userId: number
  stampsNow: number
  stampsRequired: number
  rewardUnlocked: boolean
  rewardLabel?: string | null
}

export function emitStamp(event: StampEvent) {
  stampEmitter.emit(`stamp:${event.userId}`, event)
}
