import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/promotions
 * Public — returns active promotions + program quick links.
 */
export async function GET() {
  try {
    const now = new Date()
    const [promotions, program] = await Promise.all([
      prisma.promotion.findMany({
        where: { active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.loyaltyProgram.findFirst({
        where: { isActive: true },
        select: { phoneNumber: true, uberEatsUrl: true, deliverooUrl: true },
      }),
    ])
    return NextResponse.json({
      items: promotions,
      quickLinks: {
        phone:     program?.phoneNumber  ?? null,
        uberEats:  program?.uberEatsUrl  ?? null,
        deliveroo: program?.deliverooUrl ?? null,
      },
    }, {
      headers: { 'Cache-Control': 'no-cache, no-store' },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
