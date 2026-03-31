'use client'

import { usePathname } from 'next/navigation'

const PAGE_LABELS: Record<string, { title: string }> = {
  '/admin/dashboard':   { title: 'Dashboard' },
  '/admin/scanner':     { title: 'Scanner' },
  '/admin/clients':     { title: 'Clients' },
  '/admin/recompenses': { title: 'Récompenses' },
  '/admin/promotions':  { title: 'Promotions' },
  '/admin/programme':   { title: 'Programme' },
  '/admin/parametres':  { title: 'Paramètres' },
  '/admin/staff':       { title: 'Staff' },
  '/admin/qrcodes':     { title: 'QR Codes' },
}

function IconLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
  )
}

export default function AdminHeader({
  userName,
  programName,
}: {
  userName?: string | null
  programName?: string
}) {
  const pathname = usePathname()
  const info = PAGE_LABELS[pathname] ?? { title: 'Admin' }

  return (
    <header
      className="flex-shrink-0 flex items-center justify-between px-4 md:px-5 lg:px-8 bg-transparent"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        height: 'calc(3.5rem + env(safe-area-inset-top))',
      }}
    >
      {/* ── Mobile: brand logo + page title (no sidebar top bar) ────────── */}
      <div className="md:hidden flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #868CFF 0%, #4318FF 100%)' }}
        >
          <IconLogo />
        </div>
        <div>
          <p className="text-[11px] font-medium leading-none" style={{ color: '#A3AED0' }}>
            {programName ?? 'Fidélité'}
          </p>
          <h1 className="text-base font-black leading-tight" style={{ color: '#2B3674' }}>
            {info.title}
          </h1>
        </div>
      </div>

      {/* ── Tablet: page title only ──────────────────────────────────────── */}
      <div className="hidden md:block lg:hidden">
        <h1 className="text-lg font-black" style={{ color: '#2B3674' }}>{info.title}</h1>
      </div>

      {/* ── Desktop: breadcrumb + title ───────────────────────────────────── */}
      <div className="hidden lg:block">
        <p className="text-xs font-semibold" style={{ color: '#A3AED0' }}>
          Pages&nbsp;&nbsp;/&nbsp;&nbsp;<span style={{ color: '#2B3674' }}>{info.title}</span>
        </p>
        <h1 className="text-xl font-black mt-0.5" style={{ color: '#2B3674' }}>{info.title}</h1>
      </div>

      {/* ── Desktop right: search + bell + avatar ─────────────────────────── */}
      <div className="hidden lg:flex items-center gap-3 ml-auto">
        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-gray-400">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Rechercher..."
            className="pl-10 pr-4 py-2.5 rounded-2xl text-sm outline-none transition w-48 focus:w-60"
            style={{
              background: 'white',
              border: '1px solid #E0E5F2',
              color: '#2B3674',
              boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.08)',
            }}
          />
        </div>

        <button
          className="w-10 h-10 rounded-full flex items-center justify-center transition hover:bg-white/80 relative"
          style={{ background: 'white', boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.08)' }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#A3AED0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
        </button>

        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-default select-none"
          style={{ background: 'linear-gradient(135deg, #868CFF 0%, #4318FF 100%)', boxShadow: '0 4px 12px rgba(67,24,255,0.35)' }}
        >
          {userName?.[0]?.toUpperCase() ?? 'A'}
        </div>
      </div>
    </header>
  )
}
