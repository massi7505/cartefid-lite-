'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'

const navItems = [
  {
    href: '/carte',
    label: 'Mes Cartes',
    icon: (active: boolean) => (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="6" width="20" height="14" rx="3"
          stroke={active ? '#000' : 'rgba(255,255,255,0.45)'} strokeWidth="2"/>
        <path d="M2 10h20"
          stroke={active ? '#000' : 'rgba(255,255,255,0.45)'} strokeWidth="2"/>
      </svg>
    ),
  },
  {
    href: '/historique',
    label: 'Rechercher',
    icon: (active: boolean) => (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7"
          stroke={active ? '#000' : 'rgba(255,255,255,0.45)'} strokeWidth="2"/>
        <path d="M16.5 16.5L21 21"
          stroke={active ? '#000' : 'rgba(255,255,255,0.45)'} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/profil',
    label: 'Paramètres',
    icon: (active: boolean) => (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="3"
          stroke={active ? '#000' : 'rgba(255,255,255,0.45)'} strokeWidth="2"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
          stroke={active ? '#000' : 'rgba(255,255,255,0.45)'} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
]

function SidebarContent({ onClose, branding }: { onClose?: () => void; branding: { name: string; logoUrl: string | null } }) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const name = session?.user?.name ?? 'Utilisateur'
  const email = session?.user?.email ?? ''
  const initial = name[0]?.toUpperCase() ?? 'U'

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-3">
          {branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logoUrl}
              alt={branding.name}
              className="w-9 h-9 rounded-xl object-contain"
              style={{ background: '#CCFF00' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-black text-base flex-shrink-0"
              style={{ background: '#CCFF00' }}
            >
              {branding.name[0]?.toUpperCase() ?? 'S'}
            </div>
          )}
          <span className="text-white font-bold text-base tracking-tight truncate">{branding.name}</span>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-black text-sm font-bold flex-shrink-0"
            style={{ background: '#CCFF00' }}
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-semibold truncate leading-tight">{name}</p>
            <p className="text-white/40 text-xs truncate">{email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={
                active
                  ? { background: '#CCFF00', color: '#000' }
                  : { color: 'rgba(255,255,255,0.5)' }
              }
            >
              {item.icon(active)}
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-left"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Déconnexion
        </button>
      </div>
    </div>
  )
}

export default function ClientNav() {
  const [open, setOpen] = useState(false)
  const [branding, setBranding] = useState<{ name: string; logoUrl: string | null }>({ name: 'Stampy', logoUrl: null })

  useEffect(() => {
    fetch('/api/branding').then(r => r.json()).then(data => {
      setBranding({ name: data.name ?? 'Stampy', logoUrl: data.logoUrl ?? null })
    }).catch(() => {})
  }, [])

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4"
        style={{
          background: '#111111',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 'env(safe-area-inset-top)',
          height: 'calc(3.5rem + env(safe-area-inset-top))',
        }}
      >
        <div className="flex items-center gap-2.5">
          {branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logoUrl}
              alt={branding.name}
              className="w-7 h-7 rounded-lg object-contain"
              style={{ background: '#CCFF00' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-black text-sm flex-shrink-0"
              style={{ background: '#CCFF00' }}
            >
              {branding.name[0]?.toUpperCase() ?? 'S'}
            </div>
          )}
          <span className="text-white font-bold text-sm truncate">{branding.name}</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white transition"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          style={{ backdropFilter: 'blur(4px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 z-50 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
        style={{ background: '#111111', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        <SidebarContent onClose={() => setOpen(false)} branding={branding} />
      </aside>
    </>
  )
}
