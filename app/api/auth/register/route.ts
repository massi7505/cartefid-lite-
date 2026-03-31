import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { sendEmail, welcomeEmailTemplate, verifyEmailTemplate } from '@/lib/email'

const registerSchema = z.object({
  name: z.string().min(2, 'Nom trop court'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe trop court (8 caractères min)'),
  phone: z.string().optional(),
})

// Simple in-memory rate limit: 10 registrations per hour per IP
const regRateLimitMap = new Map<string, { count: number; resetAt: number }>()
function isRegRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = regRateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    regRateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return false
  }
  if (entry.count >= 10) return true
  entry.count++
  return false
}

async function generateUniqueShortCode(): Promise<string> {
  for (;;) {
    const code = Math.floor(10000000 + Math.random() * 90000000).toString()
    const existing = await prisma.user.findUnique({ where: { shortCode: code } })
    if (!existing) return code
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRegRateLimited(ip)) {
    return NextResponse.json({ error: 'Trop de tentatives, réessayez plus tard' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const data = registerSchema.parse(body)

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 })
    }

    const program = await prisma.loyaltyProgram.findFirst({ where: { isActive: true } })
    if (!program) {
      return NextResponse.json({ error: 'Aucun programme actif trouvé' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(data.password, 12)
    const requireVerification = program.emailVerificationEnabled
    const verifyToken = requireVerification ? randomUUID() : null

    const shortCode = await generateUniqueShortCode()

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        emailVerified: !requireVerification,
        verifyToken,
        shortCode,
        cards: {
          create: { programId: program.id, stamps: 0 },
        },
      },
    })

    try {
      if (requireVerification) {
        const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verifyToken}`
        await sendEmail({
          to: user.email,
          subject: 'Vérifiez votre adresse email',
          html: verifyEmailTemplate(user.name, verifyUrl),
        })
      } else {
        await sendEmail({
          to: user.email,
          subject: 'Bienvenue dans notre programme de fidélité 🎉',
          html: welcomeEmailTemplate(user.name, program.name, program.stampsRequired),
        })
      }
    } catch {
      // Email non-blocking
    }

    return NextResponse.json(
      { success: true, userId: user.id, requiresVerification: requireVerification },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
