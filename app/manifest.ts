import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let name = 'Fidélité'
  let themeColor = '#0D0D0D'
  const icons: NonNullable<MetadataRoute.Manifest['icons']> = [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ]

  let shortName = name
  let pwaEnabled = true

  try {
    const program = await prisma.loyaltyProgram.findFirst({
      where: { isActive: true },
      select: { name: true, cardColor1: true, logoUrl: true, pwaShortName: true, pwaEnabled: true },
    })
    if (program) {
      name = program.name
      shortName = program.pwaShortName || program.name
      themeColor = program.cardColor1 ?? '#0D0D0D'
      pwaEnabled = program.pwaEnabled ?? true
      // Prepend uploaded logo as PWA icon if it's a raster image
      if (program.logoUrl && /\.(png|jpg|jpeg|webp)$/i.test(program.logoUrl)) {
        icons.unshift({ src: program.logoUrl, sizes: 'any', type: 'image/png', purpose: 'maskable' })
      }
    }
  } catch {}

  return {
    name,
    short_name: shortName,
    description: `Carte de fidélité ${name}`,
    start_url: '/carte',
    scope: '/',
    display: pwaEnabled ? 'standalone' : 'browser',
    orientation: 'portrait',
    background_color: '#0D0D0D',
    theme_color: themeColor,
    icons,
    shortcuts: [
      {
        name: 'Mon QR Code',
        short_name: 'QR Code',
        description: 'Accéder directement à votre QR code',
        url: '/carte',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Offres',
        short_name: 'Offres',
        description: 'Voir les promotions en cours',
        url: '/offres',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
  }
}
