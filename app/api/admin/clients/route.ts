import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page') ?? '1')
    const search = searchParams.get('search') ?? ''
    const perPage = 20

    const where = search
      ? { role: 'CLIENT' as const, OR: [{ name: { contains: search } }, { email: { contains: search } }] }
      : { role: 'CLIENT' as const }

    const [clients, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isBlocked: true,
          createdAt: true,
          cards: {
            select: {
              stamps: true,
              rewards: { select: { id: true } },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({ clients, total, page, pages: Math.ceil(total / perPage) })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
