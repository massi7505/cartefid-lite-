import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  title:       z.string().min(1).max(191).optional(),
  description: z.string().optional().nullable(),
  imageUrl:    z.string().url().max(500).optional().nullable().or(z.literal('')),
  couponCode:  z.string().max(191).optional().nullable().or(z.literal('')),
  buttonLabel: z.string().max(191).optional().nullable().or(z.literal('')),
  buttonUrl:   z.string().url().max(500).optional().nullable().or(z.literal('')),
  active:      z.boolean().optional(),
  expiresAt:   z.string().datetime().optional().nullable(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }
    const { id } = await params
    const body = updateSchema.parse(await req.json())
    const promotion = await prisma.promotion.update({
      where: { id: Number(id) },
      data: {
        ...body,
        imageUrl:    body.imageUrl    === '' ? null : body.imageUrl,
        couponCode:  body.couponCode  === '' ? null : body.couponCode,
        buttonLabel: body.buttonLabel === '' ? null : body.buttonLabel,
        buttonUrl:   body.buttonUrl   === '' ? null : body.buttonUrl,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : body.expiresAt === null ? null : undefined,
      },
    })
    return NextResponse.json(promotion)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }
    const { id } = await params
    await prisma.promotion.delete({ where: { id: Number(id) } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
