import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  title:       z.string().min(1).max(191),
  description: z.string().optional().nullable(),
  imageUrl:    z.string().url().max(500).optional().nullable().or(z.literal('')),
  couponCode:  z.string().max(191).optional().nullable().or(z.literal('')),
  buttonLabel: z.string().max(191).optional().nullable().or(z.literal('')),
  buttonUrl:   z.string().url().max(500).optional().nullable().or(z.literal('')),
  active:      z.boolean().optional().default(true),
  expiresAt:   z.string().datetime().optional().nullable(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }
    const promotions = await prisma.promotion.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(promotions)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }
    const body = createSchema.parse(await req.json())
    const promotion = await prisma.promotion.create({
      data: {
        title:       body.title,
        description: body.description,
        imageUrl:    body.imageUrl    || null,
        couponCode:  body.couponCode  || null,
        buttonLabel: body.buttonLabel || null,
        buttonUrl:   body.buttonUrl   || null,
        active:      body.active,
        expiresAt:   body.expiresAt ? new Date(body.expiresAt) : null,
      },
    })
    return NextResponse.json(promotion, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
