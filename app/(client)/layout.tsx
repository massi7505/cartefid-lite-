import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ClientNav from '@/components/client/ClientNav'
import { prisma } from '@/lib/prisma'

// Always render fresh — theme changes from admin must appear immediately
export const dynamic = 'force-dynamic'

const DEFAULTS = {
  bgMain: '#0D0D0D', bgSurface: '#141414', bgSurfaceBorder: 'rgba(255,255,255,0.06)',
  headerBg: '#111111', headerText: '#FFFFFF', headerIcon: 'rgba(255,255,255,0.6)',
  avatarBg: '#CCFF00', logoAccent: '#CCFF00',
  bannerBg: 'rgba(123,47,190,0.18)', bannerBorder: 'rgba(123,47,190,0.3)',
  bannerIconBg: 'rgba(123,47,190,0.3)', bannerTextTitle: '#FFFFFF',
  bannerTextSub: 'rgba(255,255,255,0.5)',
  statsBg: '#141414', statsBorder: 'rgba(255,255,255,0.06)',
  statsValue: '#FFFFFF', statsLabel: 'rgba(255,255,255,0.4)', statsAccent: '#CCFF00',
  ctaBg: '#CCFF00', ctaBgHover: '#B8E600', ctaText: '#000000',
  ctaSubtext: 'rgba(255,255,255,0.3)',
  textPrimary: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.4)', textGreeting: 'rgba(255,255,255,0.4)',
}

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role === 'ADMIN' || session.user.role === 'STAFF') redirect('/admin/dashboard')

  // Fetch theme server-side to avoid FOUC
  let t = DEFAULTS
  try {
    const saved = await prisma.themeSettings.findFirst()
    if (saved) t = { ...DEFAULTS, ...saved }
  } catch {}

  const cssVars = `
    --bg-main:${t.bgMain};--bg-surface:${t.bgSurface};--bg-surface-border:${t.bgSurfaceBorder};
    --header-bg:${t.headerBg};--header-text:${t.headerText};--header-icon:${t.headerIcon};
    --avatar-bg:${t.avatarBg};--logo-accent:${t.logoAccent};
    --banner-bg:${t.bannerBg};--banner-border:${t.bannerBorder};--banner-icon-bg:${t.bannerIconBg};
    --banner-text-title:${t.bannerTextTitle};--banner-text-sub:${t.bannerTextSub};
    --stats-bg:${t.statsBg};--stats-border:${t.statsBorder};--stats-value:${t.statsValue};
    --stats-label:${t.statsLabel};--stats-accent:${t.statsAccent};
    --cta-bg:${t.ctaBg};--cta-bg-hover:${t.ctaBgHover};--cta-text:${t.ctaText};--cta-subtext:${t.ctaSubtext};
    --text-primary:${t.textPrimary};--text-secondary:${t.textSecondary};
    --text-muted:${t.textMuted};--text-greeting:${t.textGreeting};
  `

  return (
    <>
      <style>{`:root{${cssVars}}`}</style>
      <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--bg-main)' }}>
        <ClientNav />
        <main
          className="lg:ml-64 min-h-screen lg:!pt-0 overflow-x-hidden w-full"
          style={{ paddingTop: 'calc(3.5rem + env(safe-area-inset-top))' }}
        >
          {children}
        </main>
      </div>
    </>
  )
}
