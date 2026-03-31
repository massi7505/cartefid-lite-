import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, welcomeEmailTemplate } from '@/lib/email'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', req.url))
  }

  try {
    const user = await prisma.user.findUnique({ where: { verifyToken: token } })

    if (!user) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', req.url))
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verifyToken: null },
    })

    // Send welcome email now that account is verified
    try {
      const program = await prisma.loyaltyProgram.findFirst({ where: { isActive: true } })
      if (program) {
        await sendEmail({
          to: user.email,
          subject: 'Bienvenue dans notre programme de fidélité 🎉',
          html: welcomeEmailTemplate(user.name, program.name, program.stampsRequired),
        })
      }
    } catch {
      // non-blocking
    }

    return NextResponse.redirect(new URL('/login?verified=1', req.url))
  } catch (error) {
    console.error(error)
    return NextResponse.redirect(new URL('/login?error=server_error', req.url))
  }
}
