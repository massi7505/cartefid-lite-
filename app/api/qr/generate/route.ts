import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/qr'
import { z } from 'zod'

const generateSchema = z.object({
  programId: z.number().int().positive(),
  multiUse: z.boolean().default(false),
  expiresIn: z.enum(['none', '24h', '7d']).default('none'),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await req.json()
    const { programId, multiUse, expiresIn } = generateSchema.parse(body)

    let expiresAt: Date | null = null
    if (expiresIn === '24h') {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    } else if (expiresIn === '7d') {
      expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }

    const token = generateToken()
    const qrCode = await prisma.qRCode.create({
      data: {
        token,
        programId,
        multiUse,
        expiresAt,
      },
    })

    const scanUrl = `${process.env.NEXTAUTH_URL}/scan?token=${token}`

    return NextResponse.json({ success: true, qrCode, scanUrl }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
