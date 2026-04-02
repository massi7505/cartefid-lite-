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
          stroke={active ? 'var(--cta-text)' : 'var(--header-icon)'} strokeWidth="2"/>
        <path d="M2 10h20"
          stroke={active ? 'var(--cta-text)' : 'var(--header-icon)'} strokeWidth="2"/>
      </svg>
    ),
  },
  {
    href: '/historique',
    label: 'Rechercher',
    icon: (active: boolean) => (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7"
          stroke={active ? 'var(--cta-text)' : 'var(--header-icon)'} strokeWidth="2"/>
        <path d="M16.5 16.5L21 21"
          stroke={active ? 'var(--cta-text)' : 'var(--header-icon)'} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/profil',
    label: 'Paramètres',
    icon: (active: boolean) => (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="3"
          stroke={active ? 'var(--cta-text)' : 'var(--header-icon)'} strokeWidth="2"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
          stroke={active ? 'var(--cta-text)' : 'var(--header-icon)'} strokeWidth="2" strokeLinecap="round"/>
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
      <div className="px-5 pb-5" style={{ borderBottom: '1px solid var(--bg-surface-border)', paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-3">
          {branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logoUrl}
              alt={branding.name}
              className="w-9 h-9 rounded-xl object-contain"
              style={{ background: 'var(--logo-accent)' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0"
              style={{ background: 'var(--logo-accent)', color: 'var(--cta-text)' }}
            >
              {branding.name[0]?.toUpperCase() ?? 'S'}
            </div>
          )}
          <span className="font-bold text-base tracking-tight truncate" style={{ color: 'var(--header-text)' }}>{branding.name}</span>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--bg-surface-border)' }}>
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: 'var(--avatar-bg)', color: 'var(--cta-text)' }}
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate leading-tight" style={{ color: 'var(--text-primary)' }}>{name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{email}</p>
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
                  ? { background: 'var(--logo-accent)', color: 'var(--cta-text)' }
                  : { color: 'var(--header-icon)' }
              }
            >
              {item.icon(active)}
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Notifications + Logout */}
      <div className="px-3 pt-4 space-y-1" style={{ borderTop: '1px solid var(--bg-surface-border)', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
        <BellButton expanded />
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

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

type PushState = 'unsupported' | 'denied' | 'default' | 'subscribed'

function BellButton({ expanded = false }: { expanded?: boolean }) {
  const [pushState, setPushState] = useState<PushState>('default')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushState('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setPushState('denied')
      return
    }
    navigator.serviceWorker.register('/sw.js')
      .then(reg => reg.pushManager.getSubscription())
      .then(sub => { if (sub) setPushState('subscribed') })
      .catch(() => {})
  }, [])

  async function toggle() {
    if (pushState === 'unsupported' || pushState === 'denied' || loading) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      if (pushState === 'subscribed') {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          })
          await sub.unsubscribe()
        }
        setPushState('default')
      } else {
        const perm = await Notification.requestPermission()
        if (perm !== 'granted') { setPushState(perm === 'denied' ? 'denied' : 'default'); return }
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidKey) return
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })
        const json = sub.toJSON()
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
        })
        setPushState('subscribed')
      }
    } catch {}
    finally { setLoading(false) }
  }

  if (pushState === 'unsupported') return null

  const subscribed = pushState === 'subscribed'
  const denied = pushState === 'denied'
  const color = denied ? 'rgba(255,255,255,0.2)' : subscribed ? 'var(--logo-accent)' : 'var(--header-icon)'

  const icon = loading ? (
    <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin flex-shrink-0"
      style={{ borderColor: `${color} transparent ${color} ${color}` }} />
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill={subscribed ? color : 'none'} className="flex-shrink-0">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      {denied && <line x1="4" y1="4" x2="20" y2="20" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>}
    </svg>
  )

  if (expanded) {
    return (
      <button
        onClick={toggle}
        disabled={loading || denied}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
        style={{ color, opacity: denied ? 0.5 : 1 }}
      >
        {icon}
        <span>{denied ? 'Notifications bloquées' : subscribed ? 'Désactiver notifications' : 'Activer notifications'}</span>
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      disabled={loading || denied}
      title={denied ? 'Notifications bloquées dans le navigateur' : subscribed ? 'Désactiver les notifications' : 'Activer les notifications'}
      className="w-9 h-9 rounded-xl flex items-center justify-center transition active:scale-90"
      style={{ background: 'rgba(255,255,255,0.05)' }}
    >
      {icon}
    </button>
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
          background: 'var(--header-bg)',
          borderBottom: '1px solid var(--bg-surface-border)',
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
              style={{ background: 'var(--logo-accent)' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0"
              style={{ background: 'var(--logo-accent)', color: 'var(--cta-text)' }}
            >
              {branding.name[0]?.toUpperCase() ?? 'S'}
            </div>
          )}
          <span className="font-bold text-sm truncate" style={{ color: 'var(--header-text)' }}>{branding.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <BellButton />
          <button
            onClick={() => setOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--header-icon)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
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
        style={{ background: 'var(--header-bg)', borderRight: '1px solid var(--bg-surface-border)' }}
      >
        <SidebarContent onClose={() => setOpen(false)} branding={branding} />
      </aside>
    </>
  )
}
