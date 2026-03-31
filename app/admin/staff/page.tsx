'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

interface StaffUser {
  id: number
  name: string
  email: string
  createdAt: string
}

const HORIZON = '#4318FF'
const HORIZON_LIGHT = '#EEF2FF'

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [deleting, setDeleting] = useState<number | null>(null)
  const [resetting, setResetting] = useState<number | null>(null)
  const [resetForm, setResetForm] = useState<{ id: number; password: string } | null>(null)

  const fetchStaff = useCallback(async () => {
    const res = await fetch('/api/admin/staff')
    if (res.ok) setStaff(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchStaff() }, [fetchStaff])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const res = await fetch('/api/admin/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast.success('Compte staff créé !')
      setForm({ name: '', email: '', password: '' })
      setShowForm(false)
      fetchStaff()
    } else {
      const data = await res.json()
      toast.error(data.error ?? 'Erreur lors de la création')
    }
    setCreating(false)
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Supprimer le compte de ${name} ?`)) return
    setDeleting(id)
    const res = await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Compte supprimé')
      setStaff(s => s.filter(u => u.id !== id))
    } else {
      toast.error('Erreur lors de la suppression')
    }
    setDeleting(null)
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!resetForm) return
    setResetting(resetForm.id)
    const res = await fetch(`/api/admin/staff/${resetForm.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: resetForm.password }),
    })
    if (res.ok) {
      toast.success('Mot de passe réinitialisé')
      setResetForm(null)
    } else {
      const data = await res.json()
      toast.error(data.error ?? 'Erreur')
    }
    setResetting(null)
  }

  return (
    <div className="pt-4 lg:pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black" style={{ color: '#2B3674' }}>Gestion du Staff</h1>
          <p className="text-sm mt-0.5" style={{ color: '#A3AED0' }}>
            {staff.length} compte{staff.length !== 1 ? 's' : ''} staff
          </p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setResetForm(null) }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
          style={{ background: HORIZON }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouveau staff
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
          <h2 className="text-base font-bold mb-5" style={{ color: '#2B3674' }}>Créer un compte staff</h2>
          <form onSubmit={handleCreate} className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#A3AED0' }}>Nom complet</label>
              <input
                type="text" required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Jean Dupont"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition focus:border-indigo-400"
                style={{ borderColor: '#E0E5F2', color: '#2B3674' }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#A3AED0' }}>Email</label>
              <input
                type="email" required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="jean@commerce.fr"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition focus:border-indigo-400"
                style={{ borderColor: '#E0E5F2', color: '#2B3674' }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#A3AED0' }}>Mot de passe</label>
              <input
                type="password" required minLength={8}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min. 8 caractères"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition focus:border-indigo-400"
                style={{ borderColor: '#E0E5F2', color: '#2B3674' }}
              />
            </div>
            <div className="sm:col-span-3 flex gap-3 justify-end pt-1">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border transition hover:bg-gray-50"
                style={{ borderColor: '#E0E5F2', color: '#A3AED0' }}>
                Annuler
              </button>
              <button type="submit" disabled={creating}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-50 hover:opacity-90"
                style={{ background: HORIZON }}>
                {creating ? 'Création...' : 'Créer le compte'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reset password form */}
      {resetForm && (
        <div className="bg-white rounded-2xl p-6 mb-6 border-l-4" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)', borderLeftColor: '#FB923C' }}>
          <h2 className="text-base font-bold mb-5" style={{ color: '#2B3674' }}>Réinitialiser le mot de passe</h2>
          <form onSubmit={handleResetPassword} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#A3AED0' }}>Nouveau mot de passe</label>
              <input
                type="password" required minLength={8}
                value={resetForm.password}
                onChange={e => setResetForm(f => f ? { ...f, password: e.target.value } : null)}
                placeholder="Min. 8 caractères"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition"
                style={{ borderColor: '#E0E5F2', color: '#2B3674' }}
              />
            </div>
            <button type="button" onClick={() => setResetForm(null)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold border transition"
              style={{ borderColor: '#E0E5F2', color: '#A3AED0' }}>
              Annuler
            </button>
            <button type="submit" disabled={resetting !== null}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-50"
              style={{ background: '#FB923C' }}>
              {resetting !== null ? '...' : 'Réinitialiser'}
            </button>
          </form>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
        {loading ? (
          <div className="p-12 text-center text-sm" style={{ color: '#A3AED0' }}>Chargement...</div>
        ) : staff.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: HORIZON_LIGHT }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={HORIZON} strokeWidth="1.8" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <p className="text-sm font-semibold" style={{ color: '#2B3674' }}>Aucun compte staff</p>
            <p className="text-xs mt-1" style={{ color: '#A3AED0' }}>Créez des comptes pour votre équipe</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr style={{ borderBottom: '1px solid #F4F7FE' }}>
                  {['Membre', 'Email', 'Créé le', 'Actions'].map(h => (
                    <th key={h} className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: '#A3AED0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff.map((u, i) => (
                  <tr key={u.id} className="transition hover:bg-gray-50/50"
                    style={{ borderBottom: i < staff.length - 1 ? '1px solid #F4F7FE' : 'none' }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #868CFF 0%, #4318FF 100%)' }}>
                          {u.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#2B3674' }}>{u.name}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: HORIZON_LIGHT, color: HORIZON }}>Staff</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#A3AED0' }}>{u.email}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#A3AED0' }}>
                      {new Date(u.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setResetForm({ id: u.id, password: '' }); setShowForm(false) }}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                          style={{ color: '#FB923C', background: 'rgba(251,146,60,0.1)' }}
                        >
                          Réinit. mdp
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.name)}
                          disabled={deleting === u.id}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                          style={{ color: '#F87171', background: 'rgba(239,68,68,0.08)' }}
                        >
                          {deleting === u.id ? '...' : 'Supprimer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
