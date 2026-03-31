import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const schema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  password: z.string().min(8, 'Mot de passe trop court (8 caractères min)'),
})

const RATE_LIMIT = 5
const RATE_WINDOW_MS = 15 * 60 * 1000 // 15 min
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const now = Date.now()
    const entry = rateLimitMap.get(ip)
    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    } else {
      entry.count++
      if (entry.count > RATE_LIMIT) {
        return NextResponse.json({ error: 'Trop de tentatives, réessayez dans 15 minutes' }, { status: 429 })
      }
    }

    const { email, otp, password } = schema.parse(await req.json())

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !user.resetOtp || !user.resetOtpExpiry) {
      return NextResponse.json({ error: 'Code invalide ou expiré' }, { status: 400 })
    }

    if (user.resetOtp !== otp) {
      return NextResponse.json({ error: 'Code incorrect' }, { status: 400 })
    }

    if (new Date() > user.resetOtpExpiry) {
      return NextResponse.json({ error: 'Code expiré' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetOtp: null, resetOtpExpiry: null, passwordChangedAt: new Date() },
    })

    rateLimitMap.delete(ip)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
