'use client'

import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'

interface Reward {
  id: number
  label: string
  isUsed: boolean
  expiresAt: string | null
  redeemedAt: string
  card: {
    user: { name: string; email: string }
    program: { name: string }
  }
}

type Filter = 'all' | 'available' | 'expiring' | 'expired' | 'used'

function fmt(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isExpired(r: Reward) {
  return !r.isUsed && r.expiresAt !== null && new Date(r.expiresAt) < new Date()
}

function daysLeft(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000)
}

function StatusBadge({ reward }: { reward: Reward }) {
  if (reward.isUsed) {
    return <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">Utilisée</span>
  }
  if (isExpired(reward)) {
    return <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-600">Expirée</span>
  }
  if (reward.expiresAt) {
    const days = daysLeft(reward.expiresAt)
    if (days <= 7) {
      return <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">⚠️ {days}j restants</span>
    }
    return <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">Disponible</span>
  }
  return <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">Disponible</span>
}

const PER_PAGE = 15

export default function RecompensesPage() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [markingId, setMarkingId] = useState<number | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const fetchRewards = useCallback(async () => {
    const res = await fetch('/api/admin/rewards')
    if (res.ok) setRewards(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchRewards() }, [fetchRewards])

  // Reset page when filter/search changes
  useEffect(() => { setPage(1) }, [filter, search])

  async function markUsed(id: number) {
    setMarkingId(id)
    const res = await fetch(`/api/admin/rewards/${id}`, { method: 'PATCH' })
    if (res.ok) {
      toast.success('Récompense marquée comme utilisée')
      setRewards(r => r.map(rw => rw.id === id ? { ...rw, isUsed: true } : rw))
    } else {
      toast.error('Erreur')
    }
    setMarkingId(null)
  }

  // Counts
  const available  = rewards.filter(r => !r.isUsed && !isExpired(r)).length
  const expiring   = rewards.filter(r => !r.isUsed && !isExpired(r) && r.expiresAt && daysLeft(r.expiresAt) <= 7).length
  const expired    = rewards.filter(isExpired).length
  const used       = rewards.filter(r => r.isUsed).length

  const FILTERS: { key: Filter; label: string; count?: number; alert?: boolean }[] = [
    { key: 'all',       label: 'Toutes',       count: rewards.length },
    { key: 'available', label: 'Disponibles',  count: available },
    { key: 'expiring',  label: 'Urgentes',     count: expiring, alert: expiring > 0 },
    { key: 'expired',   label: 'Expirées',     count: expired,  alert: expired > 0 },
    { key: 'used',      label: 'Utilisées',    count: used },
  ]

  const filtered = rewards.filter(r => {
    const matchSearch = !search
      || r.card.user.name.toLowerCase().includes(search.toLowerCase())
      || r.card.user.email.toLowerCase().includes(search.toLowerCase())
      || r.label.toLowerCase().includes(search.toLowerCase())

    if (!matchSearch) return false
    if (filter === 'available') return !r.isUsed && !isExpired(r)
    if (filter === 'expiring')  return !r.isUsed && !isExpired(r) && !!r.expiresAt && daysLeft(r.expiresAt) <= 7
    if (filter === 'expired')   return isExpired(r)
    if (filter === 'used')      return r.isUsed
    return true
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className="max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black" style={{ color: '#2B3674' }}>Récompenses</h1>
          <p className="text-sm mt-1" style={{ color: '#A3AED0' }}>
            <span className="font-semibold text-gray-900">{available}</span> disponible{available !== 1 ? 's' : ''}
            {expiring > 0 && <span className="text-orange-600 ml-2 font-medium">· {expiring} expire bientôt</span>}
            {expired > 0 && <span className="text-red-500 ml-2">· {expired} expirée{expired !== 1 ? 's' : ''}</span>}
          </p>
        </div>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition ${
                filter === f.key
                  ? 'text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
              style={filter === f.key ? { background: '#4318FF' } : {}}
            >
              {f.label}
              {f.count !== undefined && f.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  filter === f.key
                    ? 'bg-white/20 text-white'
                    : f.alert
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative sm:ml-auto">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
            <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher client..."
            className="pl-8 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition w-full sm:w-56" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Client', 'Récompense', 'Attribuée le', 'Expire le', 'Statut', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">Chargement...</td></tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <p className="text-3xl mb-2">🎁</p>
                    <p className="text-gray-400 text-sm">{search ? 'Aucun résultat' : 'Aucune récompense'}</p>
                  </td>
                </tr>
              ) : paginated.map(reward => (
                <tr key={reward.id} className={`transition hover:bg-gray-50 ${reward.isUsed || isExpired(reward) ? 'opacity-55' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                        {reward.card.user.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{reward.card.user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{reward.card.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{reward.label}</p>
                    <p className="text-xs text-gray-400">{reward.card.program.name}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{fmt(reward.redeemedAt)}</td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {reward.expiresAt ? (
                      <span className={isExpired(reward) ? 'text-red-500 font-medium' : !reward.isUsed && daysLeft(reward.expiresAt) <= 7 ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                        {fmt(reward.expiresAt)}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge reward={reward} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!reward.isUsed && !isExpired(reward) && (
                      <button onClick={() => markUsed(reward.id)} disabled={markingId === reward.id}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg text-white transition disabled:opacity-50 whitespace-nowrap hover:opacity-90" style={{ background: '#4318FF' }}>
                        {markingId === reward.id ? '...' : 'Marquer utilisée'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {filtered.length} résultat{filtered.length !== 1 ? 's' : ''} · page {page}/{totalPages}
            </p>
            <div className="flex gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition disabled:opacity-30">
                ←
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page - 2 + i
                if (p < 1 || p > totalPages) return null
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                      p === page ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                    style={p === page ? { background: '#4318FF' } : {}}>
                    {p}
                  </button>
                )
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition disabled:opacity-30">
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
