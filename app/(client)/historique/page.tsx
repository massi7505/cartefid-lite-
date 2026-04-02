'use client'

import { useEffect, useState } from 'react'

const LIME = '#CCFF00'

interface Stamp {
  id: number
  note?: string
  createdAt: string
  card: { program: { name: string; stampsRequired: number } }
}

interface Reward {
  id: number
  label: string
  isUsed: boolean
  expiresAt: string | null
  redeemedAt: string
}

interface CardInfo {
  id: number
  stamps: number
  program: { id: number; name: string; description?: string; stampsRequired: number; rewardLabel: string }
  rewards: Reward[]
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatShort(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function daysLeft(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
}

const CARD_STYLE = { background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }

function RewardCard({ reward }: { reward: Reward }) {
  const now = new Date()
  const expired = reward.expiresAt ? new Date(reward.expiresAt) < now : false
  const days = reward.expiresAt && !expired ? daysLeft(reward.expiresAt) : null

  let statusBg = 'rgba(204,255,0,0.1)'
  let statusColor = LIME
  let statusLabel = 'Disponible'

  if (reward.isUsed) {
    statusBg = 'rgba(255,255,255,0.06)'
    statusColor = 'rgba(255,255,255,0.3)'
    statusLabel = 'Utilisée'
  } else if (expired) {
    statusBg = 'rgba(239,68,68,0.12)'
    statusColor = '#F87171'
    statusLabel = 'Expirée'
  } else if (days !== null && days <= 7) {
    statusBg = 'rgba(251,146,60,0.12)'
    statusColor = '#FB923C'
    statusLabel = `${days}j restants`
  }

  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-4"
      style={{
        ...CARD_STYLE,
        opacity: reward.isUsed ? 0.55 : 1,
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: reward.isUsed ? 'rgba(255,255,255,0.06)' : 'rgba(123,47,190,0.2)' }}
      >
        🎁
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{reward.label}</p>
        <p className="text-white/30 text-xs mt-0.5">
          Obtenue le {formatDate(reward.redeemedAt)}
        </p>
        {!reward.isUsed && !expired && reward.expiresAt && (
          <p className="text-xs mt-0.5" style={{ color: days !== null && days <= 7 ? '#FB923C' : 'rgba(255,255,255,0.3)' }}>
            Expire le {formatShort(reward.expiresAt)}
          </p>
        )}
      </div>
      <span
        className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
        style={{ background: statusBg, color: statusColor }}
      >
        {statusLabel}
      </span>
    </div>
  )
}

export default function HistoriquePage() {
  const [stamps, setStamps] = useState<Stamp[]>([])
  const [card, setCard] = useState<CardInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'progress' | 'stamps' | 'rewards'>('progress')
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/stamps/me').then(r => r.json()),
      fetch('/api/cards/me').then(r => r.json()),
    ]).then(([s, c]) => {
      setStamps(Array.isArray(s) ? s : [])
      setCard(c?.id ? c : null)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0D0D0D' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `${LIME} transparent ${LIME} ${LIME}` }} />
      </div>
    )
  }

  const rewards = card?.rewards ?? []

  const filteredStamps = stamps.filter(s =>
    !search || s.card.program.name.toLowerCase().includes(search.toLowerCase()) || (s.note ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const filteredRewards = rewards.filter(r =>
    !search || r.label.toLowerCase().includes(search.toLowerCase())
  )
  const availableRewards = filteredRewards.filter(r => !r.isUsed && !(r.expiresAt && new Date(r.expiresAt) < new Date()))
  const usedOrExpired = filteredRewards.filter(r => r.isUsed || (r.expiresAt && new Date(r.expiresAt) < new Date()))

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 pb-10" style={{ background: '#0D0D0D' }}>

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-white text-xl font-bold">Rechercher</h1>
        <p className="text-white/40 text-sm mt-0.5">Historique et récompenses</p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
          width="16" height="16" viewBox="0 0 24 24" fill="none"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
          <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          placeholder="Rechercher…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none transition"
          style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)' }}
        />
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl p-1 mb-5" style={{ background: '#141414' }}>
        {([
          { key: 'progress', label: 'Ma carte' },
          { key: 'stamps',   label: search ? `Tampons (${filteredStamps.length})` : `Tampons (${stamps.length})` },
          { key: 'rewards',  label: search ? `Récompenses (${filteredRewards.length})` : `Récompenses (${rewards.length})` },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition"
            style={
              tab === t.key
                ? { background: LIME, color: '#000' }
                : { color: 'rgba(255,255,255,0.4)' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Progress tab ── */}
      {tab === 'progress' && (
        <div className="space-y-3">
          {!card ? (
            <div className="text-center py-16 text-white/30">
              <div className="text-4xl mb-3">🃏</div>
              <p className="text-sm">Aucune carte active</p>
            </div>
          ) : (
            <div className="rounded-2xl p-5" style={CARD_STYLE}>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: 'rgba(204,255,0,0.12)' }}
                >
                  ⭐
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{card.program.name}</p>
                  {card.program.description && (
                    <p className="text-white/40 text-xs truncate">{card.program.description}</p>
                  )}
                </div>
                <span className="text-sm font-bold flex-shrink-0" style={{ color: LIME }}>
                  {card.stamps}/{card.program.stampsRequired}
                </span>
              </div>

              <div className="h-2.5 rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (card.stamps / card.program.stampsRequired) * 100)}%`,
                    background: LIME,
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-white/30 text-xs">{card.stamps} tampon{card.stamps > 1 ? 's' : ''} collecté{card.stamps > 1 ? 's' : ''}</p>
                {card.stamps >= card.program.stampsRequired && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold text-black"
                    style={{ background: LIME }}
                  >
                    🎁 Récompense dispo !
                  </span>
                )}
              </div>

              <div
                className="mt-4 rounded-xl p-3 flex items-center gap-3"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <span className="text-base">🎁</span>
                <div className="flex-1">
                  <p className="text-white/60 text-xs">Récompense :</p>
                  <p className="text-white text-sm font-medium">{card.program.rewardLabel}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Stamps tab ── */}
      {tab === 'stamps' && (
        <div className="space-y-2">
          {filteredStamps.length === 0 ? (
            <div className="text-center py-16 text-white/30">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-sm">{search ? 'Aucun résultat' : 'Aucun tampon reçu'}</p>
            </div>
          ) : filteredStamps.map((stamp, i) => (
            <div key={stamp.id} className="rounded-2xl p-4 flex items-center gap-3" style={CARD_STYLE}>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: 'rgba(204,255,0,0.12)', color: LIME }}
              >
                #{filteredStamps.length - i}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{stamp.card.program.name}</p>
                {stamp.note && <p className="text-white/40 text-xs truncate">{stamp.note}</p>}
              </div>
              <p className="text-white/30 text-xs flex-shrink-0">{formatDate(stamp.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Rewards tab ── */}
      {tab === 'rewards' && (
        <div className="space-y-4">

          {filteredRewards.length === 0 ? (
            <div className="text-center py-16 text-white/30">
              <div className="text-4xl mb-3">🎁</div>
              <p className="text-sm">{search ? 'Aucun résultat' : 'Aucune récompense encore'}</p>
              {!search && <p className="text-xs mt-1 text-white/20">Collectez vos tampons pour en débloquer</p>}
            </div>
          ) : (
            <>
              {/* Available rewards */}
              {availableRewards.length > 0 && (
                <div>
                  {/* Banner */}
                  <div
                    className="rounded-2xl p-4 mb-3 flex items-center gap-3"
                    style={{ background: 'rgba(123,47,190,0.18)', border: '1px solid rgba(123,47,190,0.3)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                      style={{ background: 'rgba(123,47,190,0.3)' }}
                    >
                      🎁
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {availableRewards.length} récompense{availableRewards.length > 1 ? 's' : ''} disponible{availableRewards.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-white/50 text-xs">Présentez votre QR code en caisse pour les échanger</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {availableRewards.map(r => <RewardCard key={r.id} reward={r} />)}
                  </div>
                </div>
              )}

              {/* Used / expired */}
              {usedOrExpired.length > 0 && (
                <div>
                  {availableRewards.length > 0 && (
                    <p className="text-white/30 text-xs font-medium uppercase tracking-wider mb-2 px-1">
                      Historique
                    </p>
                  )}
                  <div className="space-y-2">
                    {usedOrExpired.map(r => <RewardCard key={r.id} reward={r} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
