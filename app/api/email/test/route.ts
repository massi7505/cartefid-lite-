import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendEmail, welcomeEmailTemplate } from '@/lib/email'
import { z } from 'zod'

const schema = z.object({ to: z.string().email() })

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await req.json()
    const { to } = schema.parse(body)

    await sendEmail({
      to,
      subject: '[Test] Email de bienvenue — Fidélité',
      html: welcomeEmailTemplate('Utilisateur Test', 'Programme Fidélité', 10),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 })
  }
}
