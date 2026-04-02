'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'

interface Promotion {
  id: number
  title: string
  description: string | null
  imageUrl: string | null
  couponCode: string | null
  buttonLabel: string | null
  buttonUrl: string | null
  active: boolean
  expiresAt: string | null
  createdAt: string
}

const emptyForm = {
  title: '',
  description: '',
  imageUrl: '',
  couponCode: '',
  buttonLabel: '',
  buttonUrl: '',
  active: true,
  expiresAt: '',
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  async function handleImageUpload(file: File) {
    setUploadingImage(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    if (res.ok) {
      const data = await res.json()
      setForm(f => ({ ...f, imageUrl: data.url }))
      toast.success('Image uploadée !')
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error || 'Erreur upload')
    }
    setUploadingImage(false)
  }

  const fetchPromotions = useCallback(async () => {
    const res = await fetch('/api/admin/promotions')
    if (res.ok) setPromotions(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchPromotions() }, [fetchPromotions])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(p: Promotion) {
    setEditingId(p.id)
    setForm({
      title: p.title,
      description: p.description ?? '',
      imageUrl: p.imageUrl ?? '',
      couponCode: p.couponCode ?? '',
      buttonLabel: p.buttonLabel ?? '',
      buttonUrl: p.buttonUrl ?? '',
      active: p.active,
      expiresAt: p.expiresAt ? p.expiresAt.slice(0, 16) : '',
    })
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      title: form.title,
      description: form.description || undefined,
      imageUrl: form.imageUrl || undefined,
      couponCode: form.couponCode || null,
      buttonLabel: form.buttonLabel || null,
      buttonUrl: form.buttonUrl || null,
      active: form.active,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    }
    try {
      let res: Response
      if (editingId !== null) {
        res = await fetch(`/api/admin/promotions/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/admin/promotions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Erreur')
      } else {
        toast.success(editingId !== null ? 'Promotion mise à jour' : 'Promotion créée')
        cancelForm()
        fetchPromotions()
      }
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(p: Promotion) {
    const res = await fetch(`/api/admin/promotions/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !p.active }),
    })
    if (res.ok) {
      setPromotions(prev => prev.map(x => x.id === p.id ? { ...x, active: !x.active } : x))
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Supprimer cette promotion ?')) return
    setDeletingId(id)
    const res = await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setPromotions(prev => prev.filter(p => p.id !== id))
      toast.success('Promotion supprimée')
    } else {
      toast.error('Erreur lors de la suppression')
    }
    setDeletingId(null)
  }

  function isExpired(expiresAt: string | null) {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black" style={{ color: '#2B3674' }}>Promotions</h1>
          <p className="text-sm mt-0.5" style={{ color: '#A3AED0' }}>Gérez vos offres et promotions</p>
        </div>
        <button
          onClick={openCreate}
          className="text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition hover:opacity-90"
          style={{ background: '#4318FF' }}
        >
          + Nouvelle promotion
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {editingId !== null ? 'Modifier la promotion' : 'Nouvelle promotion'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    required
                    maxLength={191}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ex: -20% sur toute la carte ce weekend"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Détails de l'offre..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={form.imageUrl}
                      onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="https://... ou uploader ci-contre"
                    />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="flex-shrink-0 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 hover:border-gray-400 transition disabled:opacity-50 whitespace-nowrap"
                    >
                      {uploadingImage ? 'Upload...' : form.imageUrl ? 'Changer' : '📎 Uploader'}
                    </button>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = '' }}
                    />
                  </div>
                  {form.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                      className="text-xs text-red-500 hover:text-red-700 mt-1 transition"
                    >
                      Supprimer l&apos;image
                    </button>
                  )}
                </div>

                {/* Coupon code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code promo</label>
                  <input
                    type="text"
                    value={form.couponCode}
                    onChange={e => setForm(f => ({ ...f, couponCode: e.target.value }))}
                    maxLength={191}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase"
                    placeholder="Ex: PROMO20"
                  />
                  <p className="text-xs text-gray-400 mt-1">Les clients pourront copier ce code depuis l&apos;app</p>
                </div>

                {/* CTA button */}
                <div className="rounded-lg border border-gray-200 p-3 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Bouton d&apos;action (optionnel)</p>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Texte du bouton</label>
                    <input
                      type="text"
                      value={form.buttonLabel}
                      onChange={e => setForm(f => ({ ...f, buttonLabel: e.target.value }))}
                      maxLength={191}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Ex: Commander maintenant"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">URL du bouton</label>
                    <input
                      type="url"
                      value={form.buttonUrl}
                      onChange={e => setForm(f => ({ ...f, buttonUrl: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expire le</label>
                  <input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={form.active}
                    onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <label htmlFor="active" className="text-sm font-medium text-gray-700">Active (visible par les clients)</label>
                </div>

                {/* Image preview */}
                {form.imageUrl && (
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.imageUrl} alt="Aperçu" className="w-full h-40 object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50 transition hover:opacity-90"
                    style={{ background: '#4318FF' }}
                  >
                    {saving ? 'Enregistrement...' : editingId !== null ? 'Mettre à jour' : 'Créer'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Promotions list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : promotions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
          <p className="text-4xl mb-3">📢</p>
          <p className="text-sm" style={{ color: '#A3AED0' }}>Aucune promotion créée</p>
          <button onClick={openCreate} className="mt-4 font-semibold text-sm hover:underline" style={{ color: '#4318FF' }}>
            Créer la première promotion
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {promotions.map(p => {
            const expired = isExpired(p.expiresAt)
            return (
              <div key={p.id} className={`bg-white rounded-2xl overflow-hidden ${expired ? 'opacity-70' : ''}`} style={{ boxShadow: expired ? '0 2px 8px rgba(239,68,68,0.12)' : '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
                <div className="flex">
                  {p.imageUrl && (
                    <div className="w-32 flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }} />
                    </div>
                  )}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{p.title}</h3>
                          {expired && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Expirée</span>}
                          {!expired && p.active && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>}
                          {!expired && !p.active && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>}
                        </div>
                        {p.description && <p className="text-sm text-gray-600 mt-1">{p.description}</p>}

                        {/* Code promo */}
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-xs font-medium text-gray-400 w-24 flex-shrink-0">Code promo</span>
                          {p.couponCode
                            ? <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded font-mono tracking-wide">{p.couponCode}</span>
                            : <span className="text-xs text-gray-300 italic">—</span>
                          }
                        </div>

                        {/* Expire le */}
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs font-medium text-gray-400 w-24 flex-shrink-0">Expire le</span>
                          {p.expiresAt
                            ? <span className={`text-xs font-medium ${expired ? 'text-red-500' : 'text-gray-600'}`}>{formatDate(p.expiresAt)}</span>
                            : <span className="text-xs text-gray-300 italic">—</span>
                          }
                        </div>

                        {/* Bouton d'action */}
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs font-medium text-gray-400 w-24 flex-shrink-0">Bouton</span>
                          {p.buttonLabel && p.buttonUrl
                            ? <a href={p.buttonUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate max-w-[200px]">→ {p.buttonLabel}</a>
                            : <span className="text-xs text-gray-300 italic">—</span>
                          }
                        </div>

                        <p className="text-xs text-gray-300 mt-2">Créée le {formatDate(p.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => toggleActive(p)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${p.active ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'border-green-200 text-green-700 hover:bg-green-50'}`}
                        >
                          {p.active ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          onClick={() => openEdit(p)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === p.id ? '...' : 'Supprimer'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
