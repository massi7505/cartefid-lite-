'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'

const BRAND = '#4318FF'
const BRAND_LIGHT = '#EEF2FF'

// ── Icons ──────────────────────────────────────────────────────────────────────
function IconGrid() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
}
function IconScan() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>
}
function IconUsers() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
}
function IconGift() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>
}
function IconMega() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 010 7.07"/><path d="M19.07 4.93a10 10 0 010 14.14"/></svg>
}
function IconCog() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M2 12h2M20 12h2"/></svg>
}
function IconSliders() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
}
function IconStaff() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
}
function IconQr() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3" rx="0.5"/><rect x="18" y="14" width="3" height="3" rx="0.5"/><rect x="14" y="18" width="3" height="3" rx="0.5"/><rect x="18" y="18" width="3" height="3" rx="0.5"/></svg>
}
function IconLogout() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
}
function IconLogo() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
}

const ADMIN_NAV = [
  { href: '/admin/dashboard',   label: 'Dashboard',   Icon: IconGrid },
  { href: '/admin/scanner',     label: 'Scanner',     Icon: IconScan },
  { href: '/admin/clients',     label: 'Clients',     Icon: IconUsers },
  { href: '/admin/recompenses', label: 'Récompenses', Icon: IconGift },
  { href: '/admin/promotions',  label: 'Promotions',  Icon: IconMega },
  { href: '/admin/programme',   label: 'Programme',   Icon: IconCog },
  { href: '/admin/qrcodes',     label: 'QR Codes',    Icon: IconQr },
  { href: '/admin/parametres',  label: 'Paramètres',  Icon: IconSliders },
  { href: '/admin/staff',       label: 'Staff',       Icon: IconStaff },
]

const STAFF_NAV = [
  { href: '/admin/dashboard',   label: 'Dashboard',   Icon: IconGrid },
  { href: '/admin/scanner',     label: 'Scanner',     Icon: IconScan },
  { href: '/admin/clients',     label: 'Clients',     Icon: IconUsers },
  { href: '/admin/recompenses', label: 'Récompenses', Icon: IconGift },
]

export default function AdminSidebar({
  userName,
  userRole,
  programName,
}: {
  userName?: string | null
  userRole?: string | null
  programName?: string
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isAdmin = userRole === 'ADMIN'
  const navItems = isAdmin ? ADMIN_NAV : STAFF_NAV
  const roleLabel = isAdmin ? 'Administrateur' : 'Staff'
  const displayName = programName ?? 'Fidélité'

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 bg-white"
        style={{
          boxShadow: '0 2px 20px rgba(112,144,176,0.12)',
          paddingTop: 'env(safe-area-inset-top)',
          height: 'calc(3.5rem + env(safe-area-inset-top))',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #868CFF 0%, #4318FF 100%)' }}
          >
            <IconLogo />
          </div>
          <span className="font-black text-sm truncate max-w-[140px]" style={{ color: '#2B3674' }}>{displayName}</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ color: '#A3AED0', background: '#F4F7FE' }}
          aria-label="Ouvrir le menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 z-50 flex flex-col bg-white transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
        style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.08)' }}
      >
        {/* Logo */}
        <div className="px-6 flex items-center gap-3" style={{ paddingTop: 'calc(1.75rem + env(safe-area-inset-top))', paddingBottom: '1.75rem' }}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #868CFF 0%, #4318FF 100%)' }}
          >
            <IconLogo />
          </div>
          <div className="min-w-0">
            <p className="font-black text-sm leading-tight truncate" style={{ color: '#2B3674' }}>{displayName}</p>
            <p className="text-[11px]" style={{ color: '#A3AED0' }}>Administration</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 pb-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                style={active ? { background: BRAND_LIGHT, color: BRAND } : { color: '#A3AED0' }}
              >
                <span className={active ? '' : 'opacity-70'}><Icon /></span>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-4 mx-4 rounded-2xl" style={{ background: '#F4F7FE', marginBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #868CFF 0%, #4318FF 100%)' }}
            >
              {userName?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: '#2B3674' }}>{userName ?? 'Admin'}</p>
              <p className="text-xs" style={{ color: '#A3AED0' }}>{roleLabel}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              title="Déconnexion"
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition hover:bg-red-50"
              style={{ color: '#A3AED0' }}
            >
              <IconLogout />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
