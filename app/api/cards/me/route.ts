import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const userId = Number(session.user.id)

    const card = await prisma.loyaltyCard.findFirst({
      where: { userId },
      include: {
        program: true,
        rewards: { orderBy: { redeemedAt: 'desc' } },
        user: { select: { qrToken: true, name: true, shortCode: true } },
      },
    })

    if (!card) return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 })

    return NextResponse.json(card)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
