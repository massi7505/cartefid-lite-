'use client'

import { usePathname } from 'next/navigation'

const PAGE_LABELS: Record<string, { title: string; sub: string }> = {
  '/admin/dashboard':   { title: 'Dashboard',    sub: 'Tableau de bord' },
  '/admin/scanner':     { title: 'Scanner',       sub: 'Scanner un client' },
  '/admin/clients':     { title: 'Clients',       sub: 'Gestion des clients' },
  '/admin/recompenses': { title: 'Récompenses',   sub: 'Suivi des récompenses' },
  '/admin/promotions':  { title: 'Promotions',    sub: 'Offres et promotions' },
  '/admin/programme':   { title: 'Programme',     sub: 'Configuration du programme' },
  '/admin/parametres':  { title: 'Paramètres',    sub: 'Configuration générale' },
  '/admin/staff':       { title: 'Staff',         sub: 'Gestion des comptes staff' },
  '/admin/qrcodes':     { title: 'QR Codes',      sub: 'Gestion des QR codes' },
}

export default function AdminHeader({ userName }: { userName?: string | null }) {
  const pathname = usePathname()
  const info = PAGE_LABELS[pathname] ?? { title: 'Admin', sub: 'Administration' }

  return (
    <header
      className="lg:!h-20 bg-transparent flex items-center justify-between px-4 lg:px-8 flex-shrink-0"
      style={{ height: 'calc(3.5rem + env(safe-area-inset-top))' }}
    >
      {/* Page title — desktop only */}
      <div className="hidden lg:block">
        <p className="text-xs font-semibold" style={{ color: '#A3AED0' }}>
          Pages&nbsp;&nbsp;/&nbsp;&nbsp;<span style={{ color: '#2B3674' }}>{info.title}</span>
        </p>
        <h1 className="text-xl font-black mt-0.5" style={{ color: '#2B3674' }}>{info.title}</h1>
      </div>

      {/* Right: search + actions — desktop only */}
      <div className="hidden lg:flex items-center gap-3 ml-auto">
        {/* Search */}
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

        {/* Notification bell */}
        <button className="w-10 h-10 rounded-full flex items-center justify-center transition hover:bg-white/80 relative"
          style={{ background: 'white', boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.08)' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#A3AED0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
        </button>

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-default select-none"
          style={{ background: 'linear-gradient(135deg, #868CFF 0%, #4318FF 100%)', boxShadow: '0 4px 12px rgba(67,24,255,0.35)' }}>
          {userName?.[0]?.toUpperCase() ?? 'A'}
        </div>
      </div>
    </header>
  )
}
