import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { id } = await params

    const client = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isBlocked: true,
        createdAt: true,
        cards: {
          include: {
            program: true,
            stampLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
            rewards: { orderBy: { redeemedAt: 'desc' } },
          },
        },
      },
    })

    if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

    return NextResponse.json(client)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { id } = await params
    const { isBlocked } = await req.json()

    if (typeof isBlocked !== 'boolean') {
      return NextResponse.json({ error: 'Paramètre invalide' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { isBlocked },
      select: { id: true, isBlocked: true },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
