'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const LIME = '#CCFF00'

interface UserProfile {
  id: number
  name: string
  email: string
  phone?: string
}

const CARD_STYLE = { background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }
const INPUT_STYLE = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }

export default function ProfilPage() {
  const { data: session, update } = useSession()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [stats, setStats] = useState({ totalStamps: 0, totalRewards: 0 })
  const [form, setForm] = useState({ name: '', phone: '' })

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwEditing, setPwEditing] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      const [userRes, stampsRes, cardRes] = await Promise.all([
        fetch('/api/users/me'),
        fetch('/api/stamps/me'),
        fetch('/api/cards/me'),
      ])
      if (userRes.ok) {
        const user: UserProfile = await userRes.json()
        setForm({ name: user.name, phone: user.phone ?? '' })
      }
      const stamps = stampsRes.ok ? await stampsRes.json() : []
      const card = cardRes.ok ? await cardRes.json() : null
      setStats({
        totalStamps: Array.isArray(stamps) ? stamps.length : 0,
        totalRewards: card?.rewards?.length ?? 0,
      })
      setProfileLoading(false)
    }
    loadProfile()
  }, [])

  async function handlePasswordChange() {
    if (pwForm.next !== pwForm.confirm) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    setPwLoading(true)
    const res = await fetch('/api/users/me/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
    })
    if (res.ok) {
      toast.success('Mot de passe modifié — reconnexion requise')
      setPwEditing(false)
      setPwForm({ current: '', next: '', confirm: '' })
      // Force sign-out since existing JWT is now invalid
      setTimeout(() => signOut({ callbackUrl: '/login' }), 1500)
    } else {
      const data = await res.json()
      toast.error(data.error ?? 'Erreur lors du changement de mot de passe')
    }
    setPwLoading(false)
  }

  async function handleSave() {
    setLoading(true)
    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      await update({ name: form.name })
      toast.success('Profil mis à jour !')
      setEditing(false)
    } else {
      toast.error('Erreur lors de la mise à jour')
    }
    setLoading(false)
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0D0D0D' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `${LIME} transparent ${LIME} ${LIME}` }} />
      </div>
    )
  }

  const initials = (form.name || session?.user?.name || '?')[0]?.toUpperCase()

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 pb-10" style={{ background: '#0D0D0D' }}>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-white text-xl font-bold">Paramètres</h1>
        <p className="text-white/40 text-sm mt-0.5">Gérez votre profil et préférences</p>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-7">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-black mb-3 shadow-xl"
          style={{ background: LIME }}
        >
          {initials}
        </div>
        <h2 className="text-white text-lg font-bold">{form.name || session?.user?.name}</h2>
        <p className="text-white/40 text-sm">{session?.user?.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl p-5 text-center" style={CARD_STYLE}>
          <p className="text-3xl font-black" style={{ color: LIME }}>{stats.totalStamps}</p>
          <p className="text-white/40 text-xs mt-1">Tampons reçus</p>
        </div>
        <div className="rounded-2xl p-5 text-center" style={CARD_STYLE}>
          <p className="text-3xl font-black text-purple-400">{stats.totalRewards}</p>
          <p className="text-white/40 text-xs mt-1">Récompenses</p>
        </div>
      </div>

      {/* Info card */}
      <div className="rounded-2xl p-5 mb-4" style={CARD_STYLE}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-sm">Informations personnelles</h3>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition text-black"
              style={{ background: LIME }}
            >
              Modifier
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Nom complet</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none transition"
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Téléphone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="06 12 34 56 78"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none transition"
                style={INPUT_STYLE}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-white/60 transition"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-black transition disabled:opacity-50"
                style={{ background: LIME }}
              >
                {loading ? '…' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {[
              { label: 'Nom', value: form.name },
              { label: 'Email', value: session?.user?.email },
              ...(form.phone ? [{ label: 'Téléphone', value: form.phone }] : []),
            ].map((row, i, arr) => (
              <div key={row.label}>
                <div className="flex items-center justify-between py-3">
                  <span className="text-white/40 text-sm">{row.label}</span>
                  <span className="text-white text-sm font-medium">{row.value}</span>
                </div>
                {i < arr.length - 1 && <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Password card */}
      <div className="rounded-2xl p-5 mb-4" style={CARD_STYLE}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-sm">Mot de passe</h3>
          {!pwEditing && (
            <button
              onClick={() => setPwEditing(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}
            >
              Modifier
            </button>
          )}
        </div>

        {pwEditing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Mot de passe actuel</label>
              <input
                type="password"
                value={pwForm.current}
                onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none transition"
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Nouveau mot de passe</label>
              <input
                type="password"
                value={pwForm.next}
                onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                placeholder="8 caractères minimum"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none transition"
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none transition"
                style={INPUT_STYLE}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setPwEditing(false); setPwForm({ current: '', next: '', confirm: '' }) }}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-white/60 transition"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Annuler
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={pwLoading || !pwForm.current || !pwForm.next || !pwForm.confirm}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-black transition disabled:opacity-50"
                style={{ background: LIME }}
              >
                {pwLoading ? '…' : 'Changer'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-white/30 text-sm">••••••••••••</p>
        )}
      </div>

      {/* Actions */}
      <div className="rounded-2xl overflow-hidden mb-4" style={CARD_STYLE}>
        <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-5 py-4 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/5 transition text-left"
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
