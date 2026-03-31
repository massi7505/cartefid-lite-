'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const LIME = '#CCFF00'
const INPUT_STYLE = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }
const CARD_STYLE = { background: '#141414', border: '1px solid rgba(255,255,255,0.07)' }

type Step = 'email' | 'otp'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setLoading(false)
    if (res.ok) {
      setStep('otp')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Erreur serveur')
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    setLoading(true)
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, password }),
    })
    setLoading(false)
    if (res.ok) {
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Erreur serveur')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0D0D0D' }}>
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ background: 'rgba(204,255,0,0.15)' }}
          >✓</div>
          <h2 className="text-xl font-bold text-white mb-2">Mot de passe modifié !</h2>
          <p className="text-white/40 text-sm">Redirection vers la connexion…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0D0D0D' }}>
      <div className="w-full max-w-sm">

        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-black text-2xl mb-4"
            style={{ background: LIME }}
          >
            S
          </div>
          <h1 className="text-white text-2xl font-bold">
            {step === 'email' ? 'Mot de passe oublié' : 'Entrez votre code'}
          </h1>
          <p className="text-white/40 text-sm mt-1 text-center">
            {step === 'email' ? 'Recevez un code de réinitialisation par email' : `Code envoyé à ${email}`}
          </p>
        </div>

        <div className="rounded-2xl p-6" style={CARD_STYLE}>
          {error && (
            <div className="rounded-xl p-3 text-sm text-red-400 mb-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Votre email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com"
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
                {loading ? 'Envoi…' : 'Recevoir le code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Code OTP (6 chiffres)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white text-center text-2xl font-bold tracking-widest focus:outline-none transition"
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Nouveau mot de passe</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
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
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none transition"
                  style={INPUT_STYLE}
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-3 rounded-xl font-bold text-sm text-black transition disabled:opacity-50"
                style={{ background: LIME }}
              >
                {loading ? 'Réinitialisation…' : 'Réinitialiser'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('email'); setOtp(''); setError('') }}
                className="w-full text-white/40 text-sm hover:text-white/60 transition"
              >
                ← Changer d&apos;email
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-white/40 mt-4">
          <Link href="/login" className="font-semibold hover:underline" style={{ color: LIME }}>
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  )
}
