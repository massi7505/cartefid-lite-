'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'

const QrScanner = dynamic(() => import('@/components/client/QrScanner'), { ssr: false })

// ── Scan sound ────────────────────────────────────────────────────────────────
function playScanBeep(customUrl?: string | null) {
  if (customUrl) {
    try {
      const audio = new Audio(customUrl)
      audio.volume = 0.6
      audio.play().catch(() => {})
    } catch {}
    return
  }
  // Default beep via Web Audio API
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.25)
  } catch {}
}

interface ClientInfo {
  userId: number
  name: string
  email: string
  phone?: string | null
  cardId: number
  stamps: number
  program: { id: number; name: string; stampsRequired: number; rewardLabel: string; description?: string }
  pendingRewards: Array<{ id: number; label: string }>
}

interface RewardModal {
  rewardId: number
  rewardLabel: string
  clientName: string
  isNew?: boolean  // true = just unlocked now, false = already pending
}

// ── Search panel ──────────────────────────────────────────────────────────────
function SearchPanel({ onSelect }: { onSelect: (c: ClientInfo) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ClientInfo[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) { setResults([]); return }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/clients/search?q=${encodeURIComponent(query.trim())}`)
        if (res.ok) setResults(await res.json())
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  return (
    <div className="space-y-3">
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
          <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <input
          autoFocus
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Nom, email ou téléphone…"
          className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition bg-white"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
        )}
      </div>

      {query.trim().length >= 2 ? (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
          {results.length === 0 && !loading ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              Aucun client pour &ldquo;{query}&rdquo;
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {results.map(c => (
                <li key={c.userId}>
                  <button
                    onClick={() => onSelect(c)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition text-left"
                  >
                    <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {c.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{c.name}</p>
                      <p className="text-gray-400 text-xs truncate">{c.email}{c.phone ? ` · ${c.phone}` : ''}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs font-bold text-gray-900">{c.stamps}/{c.program.stampsRequired}</p>
                      {c.pendingRewards.length > 0 && (
                        <p className="text-xs text-amber-600">🎁 {c.pendingRewards.length}</p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="text-center text-gray-400 text-sm py-6">
          Tapez au moins 2 caractères pour rechercher
        </p>
      )}
    </div>
  )
}

// ── Correction modal ──────────────────────────────────────────────────────────
function CorrectionModal({ clientName, onConfirm, onCancel }: {
  clientName: string
  onConfirm: (note: string) => void
  onCancel: () => void
}) {
  const [note, setNote] = useState('')
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-7 w-full max-w-sm shadow-2xl">
        <div className="text-3xl mb-3">↩️</div>
        <h2 className="text-xl font-black text-gray-900 mb-1">Retirer un tampon</h2>
        <p className="text-gray-500 text-sm mb-5">Retirer 1 tampon de <strong>{clientName}</strong> ?</p>
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Raison <span className="text-gray-400 font-normal">(optionnel)</span>
          </label>
          <input
            autoFocus
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onConfirm(note)}
            placeholder="Ex: Tampon ajouté par erreur"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 transition"
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm">Annuler</button>
          <button onClick={() => onConfirm(note)} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm">Confirmer</button>
        </div>
      </div>
    </div>
  )
}

// ── Client card ───────────────────────────────────────────────────────────────
function ClientCard({
  client, addingStamp, redeemingId, onAddStamp, onRemoveStamp, onRedeemReward, onClose, onScanAnother,
}: {
  client: ClientInfo
  addingStamp: boolean
  redeemingId: number | null
  onAddStamp: () => void
  onRemoveStamp: () => void
  onRedeemReward: (r: { id: number; label: string }) => void
  onClose: () => void
  onScanAnother: () => void
}) {
  const pct = Math.min(100, Math.round((client.stamps / client.program.stampsRequired) * 100))
  const remaining = client.program.stampsRequired - client.stamps

  return (
    <div className="space-y-3">
      {/* Client info card */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
        <div className="flex items-center gap-4 p-5 border-b border-gray-50">
          <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {client.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-lg truncate">{client.name}</p>
            <p className="text-gray-500 text-xs truncate">{client.email}{client.phone ? ` · ${client.phone}` : ''}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Progress */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-900 truncate">{client.program.name}</p>
              <span className="text-sm font-black text-gray-900 flex-shrink-0 ml-2">{client.stamps}/{client.program.stampsRequired}</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gray-900 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {remaining === 0
                ? '🎉 Récompense disponible !'
                : `${remaining} tampon${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Pending rewards */}
          {client.pendingRewards.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span>🎁</span>
                <p className="text-amber-800 font-semibold text-sm">
                  {client.pendingRewards.length} récompense{client.pendingRewards.length > 1 ? 's' : ''} en attente
                </p>
              </div>
              {client.pendingRewards.map(r => (
                <div key={r.id} className="flex items-center justify-between mt-2">
                  <p className="text-amber-700 text-sm truncate flex-1 mr-3">{r.label}</p>
                  <button
                    onClick={() => onRedeemReward(r)}
                    disabled={redeemingId === r.id}
                    className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50"
                  >
                    {redeemingId === r.id ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    Encaisser
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Stamp buttons */}
          <div className="flex gap-3">
            <button
              onClick={onAddStamp}
              disabled={addingStamp}
              className="flex-1 text-white py-4 rounded-xl font-bold text-base active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90" style={{ background: '#4318FF' }}
            >
              {addingStamp ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Ajout...</>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                  Tampon
                </>
              )}
            </button>
            <button
              onClick={onRemoveStamp}
              disabled={addingStamp || client.stamps === 0}
              title={client.stamps === 0 ? 'Aucun tampon à retirer' : 'Retirer un tampon'}
              className="px-5 py-4 rounded-xl border-2 border-red-200 text-red-500 font-bold text-sm hover:bg-red-50 hover:border-red-400 active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ↩
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={onScanAnother}
        className="w-full border-2 border-dashed border-gray-200 text-gray-500 py-3 rounded-xl font-medium text-sm hover:border-gray-300 hover:text-gray-700 transition"
      >
        Scanner un autre client
      </button>
    </div>
  )
}

// ── Redeem confirmation modal ─────────────────────────────────────────────────
function RedeemConfirmModal({ label, clientName, loading, onConfirm, onCancel }: {
  label: string
  clientName: string
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-7 w-full max-w-sm shadow-2xl">
        <div className="text-3xl mb-3">🎁</div>
        <h2 className="text-xl font-black text-gray-900 mb-1">Encaisser la récompense</h2>
        <p className="text-gray-500 text-sm mb-4">
          Confirmer la remise de <strong>{label}</strong> à <strong>{clientName}</strong> ?
        </p>
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-5">
          Cette action est irréversible
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm disabled:opacity-50">
            Annuler
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-3 rounded-xl bg-gray-900 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : '✅ Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Short code input ──────────────────────────────────────────────────────────
function ShortCodeInput({ onSubmit }: { onSubmit: (code: string) => void }) {
  const [code, setCode] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cleaned = code.replace(/\s/g, '')
    if (cleaned.length === 8) onSubmit(cleaned)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        inputMode="numeric"
        pattern="\d{4}\s?\d{4}"
        maxLength={9}
        value={code}
        onChange={e => {
          const raw = e.target.value.replace(/\D/g, '').slice(0, 8)
          setCode(raw.length > 4 ? `${raw.slice(0,4)} ${raw.slice(4)}` : raw)
        }}
        placeholder="0000 0000"
        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
      />
      <button type="submit" disabled={code.replace(/\s/g,'').length !== 8}
        className="px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition">
        Chercher
      </button>
    </form>
  )
}

// ── QR tab component ──────────────────────────────────────────────────────────
function QrTab({ onScan }: { onScan: (token: string) => void }) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-start on mobile
  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) {
      setScanning(true)
    }
  }, [])

  const handleScan = useCallback((token: string) => {
    setScanning(false)
    onScan(token)
  }, [onScan])

  const handleError = useCallback((msg?: string) => {
    setScanning(false)
    setError(msg ?? 'Erreur caméra')
  }, [])

  if (error) {
    return (
      <div className="rounded-2xl border-2 border-red-100 bg-red-50 p-8 text-center">
        <div className="text-4xl mb-3">📷</div>
        <p className="font-semibold text-red-700 mb-1">{error}</p>
        <p className="text-red-500 text-sm mb-4">Vérifiez les autorisations de votre navigateur</p>
        <button onClick={() => { setError(null); setScanning(true) }}
          className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold">
          Réessayer
        </button>
      </div>
    )
  }

  if (!scanning) {
    return (
      <div
        onClick={() => setScanning(true)}
        className="border-2 border-dashed border-gray-200 rounded-2xl p-14 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition group select-none"
      >
        <div className="text-6xl mb-4 group-hover:scale-110 transition">📷</div>
        <p className="font-semibold text-gray-900 mb-1 text-lg">Scanner la carte client</p>
        <p className="text-gray-400 text-sm">Cliquez pour activer la caméra</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block" />
          Caméra active
        </p>
        <button onClick={() => setScanning(false)} className="text-sm text-red-500 hover:text-red-700 font-medium">
          Arrêter
        </button>
      </div>
      <QrScanner onScan={handleScan} onError={handleError} />
      <p className="text-center text-gray-400 text-sm mt-3">Pointez vers le QR code du client</p>

      {/* Manual short code fallback */}
      <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
        <p className="text-xs font-semibold text-gray-500 mb-2">QR code illisible ? Saisir le code client</p>
        <ShortCodeInput onSubmit={onScan} />
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ScannerPage() {
  const [tab, setTab] = useState<'qr' | 'search'>('qr')
  const [client, setClient] = useState<ClientInfo | null>(null)
  const [rewardModal, setRewardModal] = useState<RewardModal | null>(null)
  const [redeemConfirm, setRedeemConfirm] = useState<{ id: number; label: string } | null>(null)
  const [addingStamp, setAddingStamp] = useState(false)
  const [redeemingId, setRedeemingId] = useState<number | null>(null)
  const [showCorrectionModal, setShowCorrectionModal] = useState(false)
  const [scanSoundUrl, setScanSoundUrl] = useState<string | null>(null)

  // Fetch custom scan sound once at mount
  useEffect(() => {
    fetch('/api/admin/programs/active').then(r => r.json()).then(p => {
      if (p?.notificationSoundEnabled !== false && p?.notificationSoundUrl) {
        setScanSoundUrl(p.notificationSoundUrl)
      }
    }).catch(() => {})
  }, [])

  const handleScan = useCallback(async (rawToken: string) => {
    const toastId = toast.loading('Recherche du client...')
    const res = await fetch(`/api/admin/scan/${encodeURIComponent(rawToken)}`)
    toast.dismiss(toastId)

    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error ?? 'QR code invalide')
      return
    }
    playScanBeep(scanSoundUrl)
    setClient(await res.json())
  }, [scanSoundUrl])

  async function addStamp() {
    if (!client) return
    setAddingStamp(true)
    const toastId = toast.loading('Ajout du tampon...')

    const res = await fetch('/api/admin/stamps/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: client.userId }),
    })

    const data = await res.json()
    toast.dismiss(toastId)

    if (!res.ok) {
      toast.error(data.error ?? 'Erreur')
      setAddingStamp(false)
      return
    }

    if (data.rewardUnlocked) {
      setRewardModal({ rewardId: data.rewardId, rewardLabel: data.rewardLabel, clientName: client.name, isNew: true })
      setClient(prev => prev ? { ...prev, stamps: 0 } : null)
    } else {
      toast.success(`✅ Tampon ajouté — ${data.stampsNow}/${client.program.stampsRequired}`)
      setClient(prev => prev ? { ...prev, stamps: data.stampsNow } : null)
    }
    setAddingStamp(false)
  }

  async function redeemReward(rewardId: number) {
    setRedeemingId(rewardId)
    try {
      const res = await fetch(`/api/admin/rewards/${rewardId}`, { method: 'PATCH' })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Erreur lors de l\'encaissement')
        return
      }
      toast.success('✅ Récompense encaissée !')
      setRewardModal(null)
      setRedeemConfirm(null)
      setClient(prev => prev ? {
        ...prev,
        pendingRewards: prev.pendingRewards.filter(r => r.id !== rewardId),
      } : null)
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setRedeemingId(null)
    }
  }

  async function removeStamp(note: string) {
    if (!client) return
    setShowCorrectionModal(false)
    const toastId = toast.loading('Correction...')

    const res = await fetch('/api/admin/stamps/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: client.userId, note }),
    })

    const data = await res.json()
    toast.dismiss(toastId)

    if (!res.ok) { toast.error(data.error ?? 'Erreur'); return }
    toast.success(`Tampon retiré — ${data.stampsNow}/${client.program.stampsRequired}`)
    setClient(prev => prev ? { ...prev, stamps: data.stampsNow } : null)
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black" style={{ color: '#2B3674' }}>Scanner un client</h1>
        <p className="text-sm mt-1" style={{ color: '#A3AED0' }}>QR code ou recherche par nom / email / téléphone</p>
      </div>

      {/* New reward unlocked modal */}
      {rewardModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
            <div className="text-5xl mb-4">🎁</div>
            <h2 className="text-2xl font-black text-gray-900 mb-1">
              {rewardModal.isNew ? 'Récompense gagnée !' : 'Récompense en attente'}
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              {rewardModal.isNew
                ? `${rewardModal.clientName} a complété sa carte`
                : `${rewardModal.clientName} a une récompense à encaisser`}
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
              <p className="text-amber-800 text-xs font-semibold uppercase tracking-wide mb-1">Récompense</p>
              <p className="text-gray-900 font-bold text-lg">{rewardModal.rewardLabel}</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => redeemReward(rewardModal.rewardId)}
                disabled={redeemingId === rewardModal.rewardId}
                className="w-full text-white py-4 rounded-2xl font-bold text-base transition disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90" style={{ background: '#4318FF' }}>
                {redeemingId === rewardModal.rewardId
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Encaissement...</>
                  : '✅ Encaisser maintenant'}
              </button>
              <button
                onClick={() => { toast('Récompense conservée', { duration: 2000 }); setRewardModal(null) }}
                disabled={redeemingId !== null}
                className="w-full bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold text-base hover:bg-gray-200 transition disabled:opacity-50">
                ⏳ Plus tard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing reward confirmation modal */}
      {redeemConfirm && client && (
        <RedeemConfirmModal
          label={redeemConfirm.label}
          clientName={client.name}
          loading={redeemingId === redeemConfirm.id}
          onConfirm={() => redeemReward(redeemConfirm.id)}
          onCancel={() => setRedeemConfirm(null)}
        />
      )}

      {showCorrectionModal && client && (
        <CorrectionModal
          clientName={client.name}
          onConfirm={removeStamp}
          onCancel={() => setShowCorrectionModal(false)}
        />
      )}

      {client ? (
        <ClientCard
          client={client}
          addingStamp={addingStamp}
          redeemingId={redeemingId}
          onAddStamp={addStamp}
          onRemoveStamp={() => setShowCorrectionModal(true)}
          onRedeemReward={r => setRedeemConfirm(r)}
          onClose={() => setClient(null)}
          onScanAnother={() => setClient(null)}
        />
      ) : (
        <>
          {/* Tab switcher */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
            {([
              { key: 'qr' as const, label: 'Scanner QR', icon: '📷' },
              { key: 'search' as const, label: 'Recherche', icon: '🔍' },
            ]).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${
                  tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {tab === 'qr' && <QrTab onScan={handleScan} />}
          {tab === 'search' && <SearchPanel onSelect={c => { playScanBeep(scanSoundUrl); setClient(c) }} />}
        </>
      )}
    </div>
  )
}
