import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { id } = await params
    const targetId = Number(id)

    // Cannot delete yourself
    if (String(session.user.id) === id) {
      return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 })
    }

    // Cannot delete the last ADMIN
    const target = await prisma.user.findUnique({ where: { id: targetId }, select: { role: true } })
    if (!target) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }
    if (target.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Impossible de supprimer le dernier administrateur' }, { status: 400 })
      }
    }

    await prisma.user.delete({ where: { id: targetId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
