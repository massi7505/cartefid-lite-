import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const rewards = await prisma.reward.findMany({
      orderBy: { redeemedAt: 'desc' },
      include: {
        card: {
          include: {
            user: { select: { name: true, email: true } },
            program: { select: { name: true } },
          },
        },
      },
    })

    return NextResponse.json(rewards)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
