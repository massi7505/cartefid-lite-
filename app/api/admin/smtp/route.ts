import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }
    const settings = await prisma.smtpSettings.findFirst()
    return NextResponse.json(settings ?? { host: '', port: 587, user: '', pass: '', from: '' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const smtpSchema = z.object({
  host: z.string(),
  port: z.number().int().min(1).max(65535),
  user: z.string(),
  pass: z.string(),
  from: z.string(),
})

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await req.json()
    const data = smtpSchema.parse(body)

    const existing = await prisma.smtpSettings.findFirst()
    const settings = existing
      ? await prisma.smtpSettings.update({ where: { id: existing.id }, data })
      : await prisma.smtpSettings.create({ data })

    return NextResponse.json(settings)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
