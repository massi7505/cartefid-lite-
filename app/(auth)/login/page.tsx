'use client'

import { Suspense, useState, useEffect } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

const INPUT_STYLE = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
}

function readBrandingScript(): { name: string; logoUrl: string | null } | null {
  if (typeof window === 'undefined') return null
  try {
    const el = document.getElementById('__branding__')
    return el ? JSON.parse(el.textContent ?? '') : null
  } catch { return null }
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [branding, setBranding] = useState<{ name: string; logoUrl: string | null } | null>(readBrandingScript)

  useEffect(() => {
    if (!branding) {
      fetch('/api/branding').then(r => r.json()).then(setBranding).catch(() => {})
    }
  }, [branding])
  // NextAuth adds ?callbackUrl=..., our old code used ?redirect=... — handle both
  const rawCallback = searchParams.get('callbackUrl') ?? searchParams.get('redirect') ?? '/carte'
  // Extract only the path (strip domain) to avoid open-redirect with absolute URLs
  let redirect = '/carte'
  try {
    redirect = new URL(rawCallback).pathname
  } catch {
    redirect = rawCallback.startsWith('/') ? rawCallback : '/carte'
  }
  const verified = searchParams.get('verified') === '1'
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    if (res?.error) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
      return
    }

    toast.success('Connexion réussie !')
    const session = await getSession()
    const role = session?.user?.role
    if (role === 'ADMIN' || role === 'STAFF') {
      router.push('/admin/dashboard')
    } else {
      router.push(redirect)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-main)' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          {branding?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logoUrl}
              alt={branding.name}
              className="w-14 h-14 rounded-2xl object-contain mb-4"
              style={{ background: 'var(--logo-accent)' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl mb-4"
              style={{ background: 'var(--logo-accent)', color: 'var(--cta-text)' }}
            >
              {branding?.name?.[0]?.toUpperCase() ?? 'S'}
            </div>
          )}
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{branding?.name ?? ''}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Connectez-vous à votre compte</p>
        </div>

        {verified && (
          <div
            className="rounded-xl p-3 mb-4 text-sm text-center font-medium"
            style={{ background: 'rgba(204,255,0,0.1)', border: '1px solid rgba(204,255,0,0.2)', color: 'var(--logo-accent)' }}
          >
            ✓ Email vérifié — vous pouvez vous connecter
          </div>
        )}

        {/* Form card */}
        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-border)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl p-3 text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="votre@email.com"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none transition"
                style={INPUT_STYLE}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Mot de passe</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none transition"
                style={INPUT_STYLE}
              />
            </div>

            <div className="text-right">
              <Link href="/mot-de-passe-oublie" className="text-xs text-white/35 hover:text-white/60 transition">
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'var(--cta-bg)', color: 'var(--cta-text)' }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Connexion…
                </>
              ) : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
          Pas encore de compte ?{' '}
          <Link href="/register" className="font-semibold hover:underline" style={{ color: 'var(--logo-accent)' }}>
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-main)' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--cta-bg) transparent var(--cta-bg) var(--cta-bg)' }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
