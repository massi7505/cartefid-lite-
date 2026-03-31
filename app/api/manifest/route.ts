import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const pwa = await prisma.pwaSettings.findFirst()

    if (pwa && pwa.pwaEnabled === false) {
      return new NextResponse(null, { status: 404 })
    }

    const appName    = pwa?.appName       ?? 'Fidélité'
    const shortName  = pwa?.shortName     ?? appName.slice(0, 12)
    const themeColor = pwa?.themeColor    ?? '#0D0D0D'
    const bgColor    = pwa?.backgroundColor ?? '#0D0D0D'
    const display    = pwa?.display       ?? 'standalone'
    const orientation = pwa?.orientation  ?? 'portrait'
    const startUrl   = pwa?.startUrl      ?? '/carte'
    const description = pwa?.description  ?? `Carte de fidélité numérique — ${appName}`
    const iconUrl    = pwa?.logoUrl       ?? null
    const splashUrl  = pwa?.splashUrl     ?? iconUrl

    const icons = iconUrl
      ? [
          { src: iconUrl, sizes: '72x72',  type: 'image/png' },
          { src: iconUrl, sizes: '96x96',  type: 'image/png' },
          { src: iconUrl, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: iconUrl, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ]
      : [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ]

    const manifest = {
      name: appName,
      short_name: shortName,
      description,
      start_url: startUrl,
      scope: '/',
      display,
      orientation,
      theme_color: themeColor,
      background_color: bgColor,
      lang: 'fr',
      categories: ['food', 'lifestyle', 'shopping'],
      icons,
      ...(splashUrl ? {
        screenshots: [{
          src: splashUrl,
          sizes: '390x844',
          type: 'image/png',
          form_factor: 'narrow',
          label: appName,
        }],
      } : {}),
      shortcuts: [
        {
          name: 'Ma carte',
          short_name: 'Carte',
          description: 'Voir ma carte de fidélité',
          url: '/carte',
          icons: [{ src: iconUrl ?? '/icons/icon-192.png', sizes: '192x192' }],
        },
      ],
    }

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'no-cache, no-store',
      },
    })
  } catch {
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
