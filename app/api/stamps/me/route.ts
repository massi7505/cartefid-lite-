import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const stamps = await prisma.stamp.findMany({
      where: { userId: Number(session.user.id) },
      orderBy: { createdAt: 'desc' },
      include: { card: { include: { program: true } } },
    })

    return NextResponse.json(stamps)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
