import { prisma } from '@/lib/prisma'

const DEFAULTS = {
  bgMain: '#0D0D0D', bgSurface: '#141414', bgSurfaceBorder: 'rgba(255,255,255,0.06)',
  logoAccent: '#CCFF00',
  ctaBg: '#CCFF00', ctaBgHover: '#B8E600', ctaText: '#000000',
  textPrimary: '#FFFFFF', textMuted: 'rgba(255,255,255,0.4)',
}

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  let t = DEFAULTS
  let branding = { name: '', logoUrl: null as string | null }

  try {
    const [saved, program] = await Promise.all([
      prisma.themeSettings.findFirst(),
      prisma.loyaltyProgram.findFirst({
        where: { isActive: true },
        select: { name: true, logoUrl: true },
      }),
    ])
    if (saved) t = { ...DEFAULTS, ...saved }
    if (program) branding = { name: program.name, logoUrl: program.logoUrl ?? null }
  } catch {}

  const cssVars = `
    --bg-main:${t.bgMain};--bg-surface:${t.bgSurface};--bg-surface-border:${t.bgSurfaceBorder};
    --logo-accent:${t.logoAccent};
    --cta-bg:${t.ctaBg};--cta-bg-hover:${t.ctaBgHover};--cta-text:${t.ctaText};
    --text-primary:${t.textPrimary};--text-muted:${t.textMuted};
  `

  return (
    <>
      <style>{`:root{${cssVars}}`}</style>
      <script
        id="__branding__"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(branding) }}
      />
      {children}
    </>
  )
}
