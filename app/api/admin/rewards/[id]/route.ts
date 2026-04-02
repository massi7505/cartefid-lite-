import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { id } = await params

    const existing = await prisma.reward.findUnique({ where: { id: Number(id) } })
    if (!existing) {
      return NextResponse.json({ error: 'Récompense introuvable' }, { status: 404 })
    }
    if (existing.isUsed) {
      return NextResponse.json({ error: 'Récompense déjà utilisée' }, { status: 409 })
    }
    if (existing.expiresAt && existing.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Récompense expirée' }, { status: 410 })
    }

    const reward = await prisma.reward.update({
      where: { id: Number(id) },
      data: { isUsed: true, redeemedAt: new Date() },
    })

    return NextResponse.json(reward)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
