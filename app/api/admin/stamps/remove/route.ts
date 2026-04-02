import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  userId: z.number(),
  note: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { userId, note } = schema.parse(await req.json())

    const card = await prisma.loyaltyCard.findFirst({
      where: { userId },
      include: { user: true },
    })

    if (!card) {
      return NextResponse.json({ error: 'Carte introuvable' }, { status: 404 })
    }

    if (card.stamps === 0) {
      return NextResponse.json({ error: 'Aucun tampon à retirer' }, { status: 400 })
    }

    const newStamps = card.stamps - 1

    await prisma.$transaction([
      prisma.loyaltyCard.update({
        where: { id: card.id },
        data: { stamps: newStamps },
      }),
      prisma.stamp.create({
        data: {
          cardId: card.id,
          userId,
          grantedBy: Number(session.user.id),
          note: note ? `[CORRECTION] ${note}` : '[CORRECTION] Tampon retiré par erreur',
        },
      }),
    ])

    return NextResponse.json({ success: true, stampsNow: newStamps })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
