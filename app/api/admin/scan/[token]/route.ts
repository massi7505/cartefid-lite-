import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isDynamicToken, verifyDynamicToken } from '@/lib/qr'

const includeCard = {
  cards: {
    include: {
      program: true,
      rewards: { where: { isUsed: false }, orderBy: { redeemedAt: 'desc' } },
    },
    take: 1,
  },
} as const

function buildResponse(user: { id: number; name: string; email: string; phone?: string | null; cards: { id: number; stamps: number; program: object; rewards: object[] }[] }) {
  const card = user.cards[0]
  if (!card) return null
  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    cardId: card.id,
    stamps: card.stamps,
    program: card.program,
    pendingRewards: card.rewards,
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { token } = await params

    // ── Dynamic token (new secure flow) ──────────────────────────────────────
    if (isDynamicToken(token)) {
      const verified = verifyDynamicToken(token)
      if (!verified) {
        return NextResponse.json(
          { error: 'QR code expiré ou invalide — demandez au client de rafraîchir sa carte.' },
          { status: 401 }
        )
      }
      const user = await prisma.user.findUnique({
        where: { id: verified.userId },
        include: includeCard,
      })
      if (!user) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
      const resp = buildResponse(user)
      if (!resp) return NextResponse.json({ error: 'Aucune carte pour ce client' }, { status: 404 })
      return NextResponse.json(resp)
    }

    // ── Short code (8 digits) ─────────────────────────────────────────────────
    if (/^\d{8}$/.test(token)) {
      const userByCode = await prisma.user.findUnique({ where: { shortCode: token }, include: includeCard })
      if (!userByCode) return NextResponse.json({ error: 'Code client introuvable' }, { status: 404 })
      const resp2 = buildResponse(userByCode)
      if (!resp2) return NextResponse.json({ error: 'Aucune carte pour ce client' }, { status: 404 })
      return NextResponse.json(resp2)
    }

    // ── Legacy static qrToken (backward compat) ───────────────────────────────
    const user = await prisma.user.findUnique({
      where: { qrToken: token },
      include: includeCard,
    })
    if (!user) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
    const resp = buildResponse(user)
    if (!resp) return NextResponse.json({ error: 'Aucune carte pour ce client' }, { status: 404 })
    return NextResponse.json(resp)

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
