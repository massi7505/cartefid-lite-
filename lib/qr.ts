import { v4 as uuidv4 } from 'uuid'
import { createHmac } from 'crypto'

export function generateToken(): string {
  return uuidv4()
}

export function buildScanUrl(token: string): string {
  return `${process.env.NEXTAUTH_URL}/scan?token=${token}`
}

// ── Dynamic QR tokens (60 second HMAC-signed tokens) ─────────────────────────

const PREFIX = 'dyn'

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET ?? ''
  if (!s) throw new Error('NEXTAUTH_SECRET is not set')
  return s
}

/**
 * Generate a time-limited signed QR token for a client.
 * Format: dyn_{userId}_{expiresAt}_{hmac20}
 */
export function generateDynamicToken(userId: number): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + 65_000 // 65 s (5 s clock-drift buffer)
  const payload = `${userId}:${expiresAt}`
  const sig = createHmac('sha256', secret()).update(payload).digest('hex').slice(0, 20)
  return { token: `${PREFIX}_${userId}_${expiresAt}_${sig}`, expiresAt }
}

/**
 * Verify a dynamic QR token. Returns the userId on success, null otherwise.
 */
export function verifyDynamicToken(token: string): { userId: number } | null {
  try {
    if (!token.startsWith(`${PREFIX}_`)) return null
    // strip prefix
    const body = token.slice(PREFIX.length + 1) // "userId_expiresAt_sig"
    const lastUs = body.lastIndexOf('_')
    if (lastUs === -1) return null
    const sig = body.slice(lastUs + 1)
    const inner = body.slice(0, lastUs)          // "userId_expiresAt"
    const firstUs = inner.indexOf('_')
    if (firstUs === -1) return null
    const userId    = parseInt(inner.slice(0, firstUs), 10)
    const expiresAt = parseInt(inner.slice(firstUs + 1), 10)
    if (isNaN(userId) || isNaN(expiresAt)) return null
    if (Date.now() > expiresAt) return null        // expired
    const expected = createHmac('sha256', secret())
      .update(`${userId}:${expiresAt}`)
      .digest('hex')
      .slice(0, 20)
    if (sig !== expected) return null
    return { userId }
  } catch {
    return null
  }
}

/** Returns true if the token looks like a dynamic token (not a static UUID). */
export function isDynamicToken(token: string): boolean {
  return token.startsWith(`${PREFIX}_`)
}
