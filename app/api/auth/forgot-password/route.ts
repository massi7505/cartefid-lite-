import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendEmail, otpEmailTemplate } from '@/lib/email'

const schema = z.object({ email: z.string().email() })

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

// Simple in-memory rate limit: 5 requests per 15 min per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 15 * 60 * 1000

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  if (entry.count >= RATE_LIMIT) return true
  entry.count++
  return false
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ success: true }) // silent — don't reveal rate limiting
  }

  try {
    const { email } = schema.parse(await req.json())

    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success to avoid user enumeration
    if (!user) {
      return NextResponse.json({ success: true })
    }

    const program = await prisma.loyaltyProgram.findFirst({ where: { isActive: true } })
    const validityMinutes = program?.otpValidityMinutes ?? 15

    const otp = generateOtp()
    const expiry = new Date(Date.now() + validityMinutes * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: { resetOtp: otp, resetOtpExpiry: expiry },
    })

    try {
      await sendEmail({
        to: user.email,
        subject: 'Code de réinitialisation de mot de passe',
        html: otpEmailTemplate(user.name, otp, validityMinutes),
      })
    } catch {
      // non-blocking
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
