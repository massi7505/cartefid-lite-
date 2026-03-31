import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const q = new URL(req.url).searchParams.get('q')?.trim() ?? ''
    if (q.length < 2) return NextResponse.json([])

    const users = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
          { phone: { contains: q } },
        ],
      },
      take: 8,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cards: {
          include: {
            program: true,
            rewards: { where: { isUsed: false }, orderBy: { redeemedAt: 'desc' } },
          },
          take: 1,
        },
      },
    })

    const results = users
      .filter(u => u.cards[0])
      .map(u => ({
        userId: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        cardId: u.cards[0].id,
        stamps: u.cards[0].stamps,
        program: u.cards[0].program,
        pendingRewards: u.cards[0].rewards,
      }))

    return NextResponse.json(results)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
