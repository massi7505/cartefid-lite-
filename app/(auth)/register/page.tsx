'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', phone: '' })
  const [branding, setBranding] = useState<{ name: string; logoUrl: string | null } | null>(readBrandingScript)

  useEffect(() => {
    if (!branding) {
      fetch('/api/branding').then(r => r.json()).then(setBranding).catch(() => {})
    }
  }, [branding])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password, phone: form.phone || undefined }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? "Erreur lors de l'inscription")
      setLoading(false)
      return
    }

    if (data.requiresVerification) {
      await signIn('credentials', { email: form.email, password: form.password, redirect: false })
      router.push('/verifier-email')
      return
    }

    await signIn('credentials', { email: form.email, password: form.password, redirect: false })
    toast.success('Compte créé avec succès !')
    router.push('/carte')
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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Créer un compte</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Rejoignez notre programme de fidélité</p>
        </div>

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
              <label className="block text-xs font-medium text-white/50 mb-1.5">Nom complet</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Marie Dupont"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none transition"
                style={INPUT_STYLE}
              />
            </div>

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
              <label className="block text-xs font-medium text-white/50 mb-1.5">
                Téléphone <span className="text-white/25 font-normal">(optionnel)</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="06 12 34 56 78"
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
                placeholder="8 caractères minimum"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none transition"
                style={INPUT_STYLE}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Confirmer le mot de passe</label>
              <input
                type="password"
                required
                value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none transition"
                style={INPUT_STYLE}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm transition disabled:opacity-50"
              style={{ background: 'var(--cta-bg)', color: 'var(--cta-text)' }}
            >
              {loading ? 'Création du compte…' : 'Créer mon compte'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
          Déjà un compte ?{' '}
          <Link href="/login" className="font-semibold hover:underline" style={{ color: 'var(--logo-accent)' }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
