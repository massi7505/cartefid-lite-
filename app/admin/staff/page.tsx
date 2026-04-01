'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

interface AdminUser {
  id: number
  name: string
  email: string
  role: 'ADMIN' | 'STAFF'
  createdAt: string
}

const emptyForm = { name: '', email: '', password: '', role: 'ADMIN' as 'ADMIN' | 'STAFF' }
const INPUT = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'

export default function StaffPage() {
  const { data: session } = useSession()
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const fetchAdmins = useCallback(async () => {
    const res = await fetch('/api/admin/admins')
    if (res.ok) setAdmins(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchAdmins() }, [fetchAdmins])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success(`Compte ${form.role === 'ADMIN' ? 'administrateur' : 'staff'} créé !`)
      setAdmins(prev => [...prev, data])
      setShowForm(false)
      setForm(emptyForm)
    } else {
      toast.error(data.error || 'Erreur')
    }
    setSaving(false)
  }

  async function handleDelete(admin: AdminUser) {
    if (!confirm(`Supprimer ${admin.name} (${admin.email}) ?`)) return
    setDeletingId(admin.id)
    const res = await fetch(`/api/admin/admins/${admin.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) {
      setAdmins(prev => prev.filter(a => a.id !== admin.id))
      toast.success('Compte supprimé')
    } else {
      toast.error(data.error || 'Erreur')
    }
    setDeletingId(null)
  }

  const currentUserId = session?.user?.id ? Number(session.user.id) : null
  const adminCount = admins.filter(a => a.role === 'ADMIN').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black" style={{ color: '#2B3674' }}>Équipe</h1>
          <p className="text-sm mt-0.5" style={{ color: '#A3AED0' }}>
            {admins.filter(a => a.role === 'ADMIN').length} admin
            {admins.filter(a => a.role === 'STAFF').length > 0 && ` · ${admins.filter(a => a.role === 'STAFF').length} staff`}
          </p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setShowForm(true) }}
          className="text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition hover:opacity-90"
          style={{ background: '#4318FF' }}
        >
          + Ajouter
        </button>
      </div>

      {/* Modal création */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">Nouveau compte</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-400"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                {/* Rôle — en premier pour orienter le formulaire visuellement */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Rôle</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['ADMIN', 'STAFF'] as const).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, role: r }))}
                        className={`py-3 rounded-xl text-sm font-semibold border-2 transition ${
                          form.role === r
                            ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                            : 'border-gray-200 text-gray-500 bg-white hover:border-gray-300'
                        }`}
                      >
                        {r === 'ADMIN' ? '👑 Admin' : '🔧 Staff'}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {form.role === 'ADMIN'
                      ? 'Accès complet : paramètres, programme, équipe, PWA…'
                      : 'Accès limité : dashboard, scanner, clients, récompenses'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                    minLength={2}
                    className={INPUT}
                    placeholder="Ex: Sophie Martin"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                    className={INPUT}
                    placeholder="sophie@exemple.fr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      required
                      minLength={8}
                      className={INPUT + ' pr-12'}
                      placeholder="8 caractères minimum"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition hover:opacity-90"
                    style={{ background: '#4318FF' }}
                  >
                    {saving ? 'Création...' : 'Créer le compte'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Liste */}
      {admins.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">Aucun compte trouvé</div>
      ) : (
        <div className="space-y-3">
          {admins.map(admin => {
            const isSelf = admin.id === currentUserId
            const isLastAdmin = admin.role === 'ADMIN' && adminCount <= 1
            const canDelete = !isSelf && !isLastAdmin

            return (
              <div
                key={admin.id}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100"
                style={{ boxShadow: '0 2px 8px rgba(112,144,176,0.06)' }}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{
                    background: admin.role === 'ADMIN'
                      ? 'linear-gradient(135deg, #868CFF 0%, #4318FF 100%)'
                      : 'linear-gradient(135deg, #67d6a0 0%, #3DD68C 100%)',
                  }}
                >
                  {admin.name[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold truncate" style={{ color: '#2B3674' }}>{admin.name}</p>
                    {isSelf && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">vous</span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        admin.role === 'ADMIN'
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'bg-green-50 text-green-600'
                      }`}
                    >
                      {admin.role === 'ADMIN' ? '👑 Admin' : '🔧 Staff'}
                    </span>
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: '#A3AED0' }}>{admin.email}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#A3AED0' }}>
                    Créé le {new Date(admin.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </p>
                </div>

                {/* Delete */}
                {canDelete ? (
                  <button
                    onClick={() => handleDelete(admin)}
                    disabled={deletingId === admin.id}
                    className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-40"
                    title="Supprimer"
                  >
                    {deletingId === admin.id ? (
                      <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                      </svg>
                    )}
                  </button>
                ) : (
                  <div
                    className="flex-shrink-0 w-9 h-9 flex items-center justify-center"
                    title={isSelf ? 'Votre propre compte' : 'Dernier administrateur'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Info box */}
      <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-100">
        <p className="text-xs text-amber-700 font-medium">
          <strong>👑 Admin</strong> — accès complet à tous les paramètres.<br />
          <strong>🔧 Staff</strong> — accès limité : scanner, clients, récompenses uniquement.<br />
          Le dernier administrateur ne peut pas être supprimé. Vous ne pouvez pas supprimer votre propre compte.
        </p>
      </div>
    </div>
  )
}
