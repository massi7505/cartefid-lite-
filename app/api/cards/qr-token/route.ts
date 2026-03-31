import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateDynamicToken } from '@/lib/qr'

/**
 * GET /api/cards/qr-token
 * Returns a short-lived (65 s) signed QR token for the authenticated client.
 * The admin scanner verifies the token server-side — no static UUID is exposed.
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { token, expiresAt } = generateDynamicToken(Number(session.user.id))
  return NextResponse.json({ token, expiresAt })
}
