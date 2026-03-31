import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const program = await prisma.loyaltyProgram.findFirst({
      where: { isActive: true },
      select: {
        name: true,
        pwaShortName: true,
        pwaEnabled: true,
        cardColor1: true,
        logoUrl: true,
        faviconUrl: true,
      },
    })

    if (program && program.pwaEnabled === false) {
      return new NextResponse(null, { status: 404 })
    }

    const appName = program?.name ?? 'Fidélité'
    const shortName = program?.pwaShortName || appName.slice(0, 12)
    const themeColor = program?.cardColor1 ?? '#0D0D0D'
    const iconUrl = program?.logoUrl ?? null

    const manifest = {
      name: appName,
      short_name: shortName,
      description: `Carte de fidélité numérique — ${appName}`,
      start_url: '/carte',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait-primary',
      theme_color: themeColor,
      background_color: '#0D0D0D',
      categories: ['food', 'lifestyle', 'shopping'],
      icons: iconUrl
        ? [
            { src: iconUrl, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: iconUrl, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ]
        : [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
      shortcuts: [
        {
          name: 'Ma carte',
          short_name: 'Carte',
          description: 'Voir ma carte de fidélité',
          url: '/carte',
          icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
        },
      ],
    }

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch {
    // Fallback manifest in case DB is unreachable
    return NextResponse.json({
      name: 'Fidélité',
      short_name: 'Fidélité',
      start_url: '/carte',
      display: 'standalone',
      theme_color: '#0D0D0D',
      background_color: '#0D0D0D',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    }, {
      headers: { 'Content-Type': 'application/manifest+json' },
    })
  }
}
