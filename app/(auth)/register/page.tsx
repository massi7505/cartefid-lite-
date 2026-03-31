'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

const LIME = '#CCFF00'
const INPUT_STYLE = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
}

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', phone: '' })

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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0D0D0D' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-black text-2xl mb-4"
            style={{ background: LIME }}
          >
            S
          </div>
          <h1 className="text-white text-2xl font-bold">Créer un compte</h1>
          <p className="text-white/40 text-sm mt-1">Rejoignez notre programme de fidélité</p>
        </div>

        {/* Form card */}
        <div
          className="rounded-2xl p-6"
          style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)' }}
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
              className="w-full py-3 rounded-xl font-bold text-sm text-black transition disabled:opacity-50"
              style={{ background: LIME }}
            >
              {loading ? 'Création du compte…' : 'Créer mon compte'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-white/40 mt-4">
          Déjà un compte ?{' '}
          <Link href="/login" className="font-semibold hover:underline" style={{ color: LIME }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
