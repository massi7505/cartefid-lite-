import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import { prisma } from '@/lib/prisma'

export const viewport: Viewport = {
  themeColor: '#0D0D0D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export async function generateMetadata(): Promise<Metadata> {
  let name = 'Fidélité'
  let faviconUrl: string | null = null
  let logoUrl: string | null = null

  try {
    const program = await prisma.loyaltyProgram.findFirst({
      where: { isActive: true },
      select: { name: true, faviconUrl: true, logoUrl: true },
    })
    if (program) {
      name = program.name
      faviconUrl = program.faviconUrl
      logoUrl = program.logoUrl
    }
  } catch {}

  return {
    title: { default: name, template: `%s | ${name}` },
    description: `Carte de fidélité numérique — ${name}`,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: name,
      ...(logoUrl ? { startupImage: logoUrl } : {}),
    },
    other: { 'mobile-web-app-capable': 'yes' },
    ...(faviconUrl
      ? { icons: { icon: faviconUrl, apple: logoUrl ?? faviconUrl } }
      : logoUrl
      ? { icons: { apple: logoUrl } }
      : {}),
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
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
