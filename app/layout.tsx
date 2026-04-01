import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import { prisma } from '@/lib/prisma'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export async function generateMetadata(): Promise<Metadata> {
  let appName     = 'Fidélité'
  let shortName   = 'Fidélité'
  let description = 'Votre carte de fidélité numérique'
  let themeColor  = '#0D0D0D'
  let logoUrl: string | null = null
  let faviconUrl: string | null = null

  try {
    const pwa = await prisma.pwaSettings.findFirst()
    if (pwa) {
      appName     = pwa.appName
      shortName   = pwa.shortName
      description = pwa.description
      themeColor  = pwa.themeColor
      logoUrl     = pwa.logoUrl ?? null
      faviconUrl  = pwa.faviconUrl ?? null
    }
  } catch {
    // PwaSettings table may not exist yet — fallback to LoyaltyProgram
    try {
      const program = await prisma.loyaltyProgram.findFirst({
        where: { isActive: true },
        select: { name: true, faviconUrl: true, logoUrl: true },
      })
      if (program) {
        appName    = program.name
        shortName  = program.name.slice(0, 12)
        logoUrl    = program.logoUrl ?? null
        faviconUrl = program.faviconUrl ?? null
      }
    } catch {}
  }

  return {
    title: { default: appName, template: `%s | ${appName}` },
    description,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: shortName,
      ...(logoUrl ? { startupImage: logoUrl } : {}),
    },
    other: {
      'mobile-web-app-capable': 'yes',
      'theme-color': themeColor,
    },
    ...(faviconUrl || logoUrl
      ? { icons: { icon: faviconUrl ?? logoUrl!, apple: logoUrl ?? faviconUrl! } }
      : {}),
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/api/manifest" />
      </head>
      <body>
        <Providers>{children}</Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}`,
          }}
        />
      </body>
    </html>
  )
}
