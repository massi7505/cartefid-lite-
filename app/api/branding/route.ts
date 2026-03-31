import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/branding
 * Public — returns the active program's branding (name, logo, favicon).
 */
export async function GET() {
  try {
    const program = await prisma.loyaltyProgram.findFirst({
      where: { isActive: true },
      select: { name: true, logoUrl: true, faviconUrl: true },
    })
    return NextResponse.json({
      name: program?.name ?? 'Fidélité',
      logoUrl: program?.logoUrl ?? null,
      faviconUrl: program?.faviconUrl ?? null,
    })
  } catch {
    return NextResponse.json({ name: 'Fidélité', logoUrl: null, faviconUrl: null })
  }
}
