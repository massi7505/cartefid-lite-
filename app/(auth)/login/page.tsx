'use client'

import { Suspense, useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

const LIME = '#CCFF00'
const INPUT_STYLE = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/carte'
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
    if (session?.user?.role === 'ADMIN') {
      router.push('/admin/dashboard')
    } else {
      router.push(redirect)
    }
    router.refresh()
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
          <h1 className="text-white text-2xl font-bold">Stampy</h1>
          <p className="text-white/40 text-sm mt-1">Connectez-vous à votre compte</p>
        </div>

        {verified && (
          <div
            className="rounded-xl p-3 mb-4 text-sm text-center font-medium"
            style={{ background: 'rgba(204,255,0,0.1)', border: '1px solid rgba(204,255,0,0.2)', color: LIME }}
          >
            ✓ Email vérifié — vous pouvez vous connecter
          </div>
        )}

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
              className="w-full py-3 rounded-xl font-bold text-sm text-black transition disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: LIME }}
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

        <p className="text-center text-sm text-white/40 mt-4">
          Pas encore de compte ?{' '}
          <Link href="/register" className="font-semibold hover:underline" style={{ color: LIME }}>
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D0D' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `${LIME} transparent ${LIME} ${LIME}` }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
