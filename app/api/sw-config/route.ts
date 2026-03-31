import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const pwa = await prisma.pwaSettings.findFirst()
    return NextResponse.json({
      offlineMessage: pwa?.offlineMessage ?? 'Vous êtes hors connexion. Reconnectez-vous pour scanner.',
      appName: pwa?.appName ?? 'Fidélité',
      themeColor: pwa?.themeColor ?? '#0D0D0D',
      logoUrl: pwa?.logoUrl ?? null,
    }, {
      headers: { 'Cache-Control': 'no-cache, no-store' },
    })
  } catch {
    return NextResponse.json({
      offlineMessage: 'Vous êtes hors connexion.',
      appName: 'Fidélité',
      themeColor: '#0D0D0D',
      logoUrl: null,
    })
  }
}
