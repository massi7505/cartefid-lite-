'use client'

import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'

interface ClientRow {
  id: number
  name: string
  email: string
  phone?: string
  createdAt: string
  cards: Array<{ stamps: number; rewards: Array<{ id: number }> }>
}

interface ClientDetail {
  id: number
  name: string
  email: string
  phone?: string
  createdAt: string
  cards: Array<{
    id: number
    stamps: number
    program: { name: string; stampsRequired: number; rewardLabel: string }
    stampLogs: Array<{ id: number; note?: string; createdAt: string }>
    rewards: Array<{ id: number; label: string; isUsed: boolean; expiresAt: string | null; redeemedAt: string }>
  }>
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtTime(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Detail panel
  const [selected, setSelected] = useState<ClientDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [addingStamp, setAddingStamp] = useState(false)
  const [removingStamp, setRemovingStamp] = useState(false)
  const [stampNote, setStampNote] = useState('')
  const [activeTab, setActiveTab] = useState<'tampons' | 'recompenses'>('tampons')

  const fetchClients = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), search })
    const res = await fetch(`/api/admin/clients?${params}`)
    const data = await res.json()
    setClients(data.clients ?? [])
    setTotal(data.total ?? 0)
    setPages(data.pages ?? 1)
    setLoading(false)
  }, [page, search])

  useEffect(() => { fetchClients() }, [fetchClients])

  async function openDetail(id: number) {
    setDetailLoading(true)
    setSelected(null)
    setActiveTab('tampons')
    const res = await fetch(`/api/admin/clients/${id}`)
    if (res.ok) setSelected(await res.json())
    setDetailLoading(false)
  }

  async function handleAddStamp() {
    if (!selected) return
    setAddingStamp(true)
    const res = await fetch('/api/admin/stamps/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: selected.id, note: stampNote || undefined }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'Erreur')
    } else {
      if (data.rewardUnlocked) {
        toast.success(`🎁 Récompense débloquée : ${data.rewardLabel}`)
      } else {
        toast.success(`Tampon ajouté — ${data.stampsNow} tampon(s) maintenant`)
      }
      setStampNote('')
      // Refresh detail
      const r2 = await fetch(`/api/admin/clients/${selected.id}`)
      if (r2.ok) setSelected(await r2.json())
      fetchClients()
    }
    setAddingStamp(false)
  }

  async function handleRemoveStamp() {
    if (!selected) return
    setRemovingStamp(true)
    const res = await fetch('/api/admin/stamps/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: selected.id, note: stampNote || undefined }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'Erreur')
    } else {
      toast.success(`Tampon retiré — ${data.stampsNow} tampon(s) maintenant`)
      setStampNote('')
      const r2 = await fetch(`/api/admin/clients/${selected.id}`)
      if (r2.ok) setSelected(await r2.json())
      fetchClients()
    }
    setRemovingStamp(false)
  }

  const card = selected?.cards[0] ?? null
  const stampCount = card?.stamps ?? 0
  const stampsRequired = card?.program.stampsRequired ?? 10
  const pct = Math.min(100, Math.round((stampCount / stampsRequired) * 100))
  const pendingRewards = card?.rewards.filter(r => !r.isUsed) ?? []
  const usedRewards = card?.rewards.filter(r => r.isUsed) ?? []

  return (
    <div className="flex gap-6 h-full">

      {/* ── Left: list — hidden on mobile when detail is open ── */}
      <div className={`flex-1 min-w-0 ${selected || detailLoading ? 'hidden lg:block' : 'block'}`}>
        <div className="mb-6">
          <h1 className="text-2xl font-black" style={{ color: '#2B3674' }}>Clients</h1>
          <p className="text-sm mt-1" style={{ color: '#A3AED0' }}>{total} client{total !== 1 ? 's' : ''} inscrit{total !== 1 ? 's' : ''}</p>
        </div>

        <div className="mb-4">
          <input
            type="search"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
          />
        </div>

        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Nom', 'Email', 'Tampons', 'Récompenses', 'Inscrit le'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm">Chargement...</td></tr>
                ) : clients.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm">Aucun client trouvé</td></tr>
                ) : clients.map(client => (
                  <tr
                    key={client.id}
                    onClick={() => openDetail(client.id)}
                    className={`hover:bg-gray-50 cursor-pointer transition ${selected?.id === client.id ? 'bg-gray-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {client.name[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{client.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{client.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-gray-900">{client.cards[0]?.stamps ?? 0}</span>
                      <span className="text-xs text-gray-400">/{client.cards[0] ? stampsRequired : '–'}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {client.cards.reduce((s, c) => s + c.rewards.length, 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{fmt(client.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 transition"
              >
                ← Précédent
              </button>
              <span className="text-sm text-gray-500">Page {page}/{pages}</span>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 transition"
              >
                Suivant →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: detail panel — full width on mobile ── */}
      <div className={`flex-shrink-0 ${selected || detailLoading ? 'w-full lg:w-80' : 'hidden lg:block lg:w-80'}`}>
        {/* Mobile back button */}
        {(selected || detailLoading) && (
          <button
            className="lg:hidden flex items-center gap-1.5 text-sm font-semibold mb-4"
            style={{ color: '#4318FF' }}
            onClick={() => { setSelected(null); setDetailLoading(false) }}
          >
            ← Retour aux clients
          </button>
        )}
        {detailLoading ? (
          <div className="bg-white rounded-2xl p-8 flex items-center justify-center" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4318FF transparent #4318FF #4318FF' }} />
          </div>
        ) : !selected ? (
          <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
            <p className="text-3xl mb-2">👤</p>
            <p className="text-sm" style={{ color: '#A3AED0' }}>Cliquez sur un client pour voir ses détails</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>

            {/* Header */}
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                  {selected.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 truncate">{selected.name}</p>
                  <p className="text-xs text-gray-500 truncate">{selected.email}</p>
                </div>
              </div>
              {selected.phone && (
                <p className="text-xs text-gray-400 mt-2">📞 {selected.phone}</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">Inscrit le {fmt(selected.createdAt)}</p>
            </div>

            {/* Stats */}
            {card && (
              <div className="p-5 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{card.program.name}</p>

                {/* Progress */}
                <div className="flex items-end justify-between mb-1.5">
                  <span className="text-3xl font-black text-gray-900">{stampCount}</span>
                  <span className="text-sm text-gray-400 mb-1">/ {stampsRequired} tampons</span>
                </div>
                <div className="h-2 rounded-full mb-3" style={{ background: '#F4F7FE' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: '#4318FF' }}
                  />
                </div>

                {/* Reward */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Récompense :</span>
                  <span className="font-medium text-gray-700 truncate ml-2">{card.program.rewardLabel}</span>
                </div>
                {pendingRewards.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5">
                    <span>🎁</span>
                    <span>{pendingRewards.length} récompense{pendingRewards.length > 1 ? 's' : ''} à utiliser</span>
                  </div>
                )}
              </div>
            )}

            {/* Stamp actions */}
            <div className="p-5 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Correction manuelle</p>
              <input
                type="text"
                value={stampNote}
                onChange={e => setStampNote(e.target.value)}
                placeholder="Note (optionnel)"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 mb-3 transition"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddStamp}
                  disabled={addingStamp || removingStamp}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-sm font-semibold transition disabled:opacity-50 hover:opacity-90" style={{ background: '#4318FF' }}
                >
                  {addingStamp ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                      Ajouter
                    </>
                  )}
                </button>
                <button
                  onClick={handleRemoveStamp}
                  disabled={addingStamp || removingStamp || stampCount === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-40"
                >
                  {removingStamp ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                      Retirer
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {(['tampons', 'recompenses'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 text-xs font-semibold transition border-b-2 ${
                    activeTab === tab
                      ? 'border-indigo-600'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                  style={activeTab === tab ? { color: '#4318FF' } : {}}
                >
                  {tab === 'tampons' ? `Tampons (${card?.stampLogs.length ?? 0})` : `Récompenses (${card?.rewards.length ?? 0})`}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="overflow-y-auto" style={{ maxHeight: 300 }}>
              {activeTab === 'tampons' ? (
                card?.stampLogs.length ? (
                  <div className="divide-y divide-gray-50">
                    {card.stampLogs.map(log => {
                      const isCorrection = log.note?.startsWith('[CORRECTION]')
                      return (
                        <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                              isCorrection ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {isCorrection ? '−' : '+'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-600 truncate">
                              {log.note?.replace('[CORRECTION] ', '') || 'Tampon validé'}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{fmtTime(log.createdAt)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 text-xs py-8">Aucun tampon</p>
                )
              ) : (
                card?.rewards.length ? (
                  <div className="divide-y divide-gray-50">
                    {/* Pending first */}
                    {[...pendingRewards, ...usedRewards].map(r => {
                      const expired = r.expiresAt && new Date(r.expiresAt) < new Date()
                      return (
                        <div key={r.id} className="flex items-start gap-3 px-4 py-3">
                          <div className={`text-base flex-shrink-0 ${r.isUsed ? 'opacity-40' : ''}`}>🎁</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700 truncate">{r.label}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {r.isUsed
                                ? 'Utilisée'
                                : expired
                                ? 'Expirée'
                                : r.expiresAt
                                ? `Expire le ${fmt(r.expiresAt)}`
                                : 'Disponible'}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                            r.isUsed ? 'bg-gray-100 text-gray-400'
                            : expired ? 'bg-red-50 text-red-500'
                            : 'bg-green-50 text-green-700'
                          }`}>
                            {r.isUsed ? 'Utilisée' : expired ? 'Expirée' : '✓'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 text-xs py-8">Aucune récompense</p>
                )
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
