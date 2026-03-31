import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

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
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: { role: true },
    })

    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    if (user.role !== 'STAFF') return NextResponse.json({ error: 'Utilisateur non staff' }, { status: 400 })

    await prisma.user.delete({ where: { id: Number(id) } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const resetSchema = z.object({
  password: z.string().min(8, 'Min 8 caractères'),
})

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
    const body = await req.json()
    const { password } = resetSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: { role: true },
    })

    if (!user || user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: Number(id) },
      data: { passwordHash, passwordChangedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
