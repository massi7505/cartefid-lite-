'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'

const QRCode = dynamic(() => import('qrcode.react').then(m => ({ default: m.QRCodeSVG })), { ssr: false })

const LIME = '#CCFF00'

interface Card {
  id: number
  stamps: number
  user: { name: string; qrToken: string; shortCode: string | null }
  program: {
    id: number
    name: string
    description?: string
    stampsRequired: number
    rewardLabel: string
    cardColor1: string
    cardColor2: string
    accentColor: string
    cardIcon: string
    notificationSoundUrl?: string | null
    notificationSoundEnabled?: boolean
    stampShape?: string
    cardTextColor?: string
    cardSubtitle?: string
    cardNote?: string | null
    cardBgImageUrl?: string | null
    cardIconUrl?: string | null
    logoUrl?: string | null
  }
  rewards: Array<{ id: number; label: string; isUsed: boolean; expiresAt: string | null }>
}

interface Stamp {
  id: number
  createdAt: string
}

interface Promotion {
  id: number
  title: string
  description: string | null
  imageUrl: string | null
}

type StampShape = 'circle' | 'rounded' | 'square'

// ── Sound helpers ─────────────────────────────────────────────────────────────
function playSound(url: string | null | undefined) {
  if (!url) return
  try {
    const audio = new Audio(url)
    audio.volume = 0.7
    audio.play().catch(() => {})
  } catch {}
}

// ── Web Push helpers ───────────────────────────────────────────────────────────
function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

type PushState = 'unsupported' | 'denied' | 'default' | 'subscribed'

function getStampRadius(shape: StampShape) {
  if (shape === 'circle') return 'rounded-full'
  if (shape === 'square') return 'rounded-lg'
  return 'rounded-xl'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ── Fullscreen QR Modal ────────────────────────────────────────────────────────
function QrModal({ qrValue, programName, shortCode, countdown, countdownColor, onClose }: {
  qrValue: string
  programName: string
  shortCode: string | null
  countdown: number
  countdownColor: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  // Keep screen on while modal is open
  useEffect(() => {
    let wakeLock: { release: () => void } | null = null
    if ('wakeLock' in navigator) {
      (navigator.wakeLock as { request: (t: string) => Promise<{ release: () => void }> })
        .request('screen').then(l => { wakeLock = l }).catch(() => {})
    }
    return () => { wakeLock?.release() }
  }, [])

  function copyCode() {
    if (!shortCode) return
    navigator.clipboard?.writeText(shortCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between py-10 px-6"
      style={{ background: '#000' }}>

      {/* Top bar */}
      <div className="w-full flex items-center justify-between">
        <p className="text-white/40 text-sm">{programName}</p>
        <button onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.10)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6 6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Middle: QR + short code + countdown */}
      <div className="flex flex-col items-center gap-5">
        <p className="text-white font-bold text-xl">Scannez-moi</p>

        <div className="bg-white rounded-3xl p-5 shadow-2xl"
          style={{ boxShadow: '0 0 80px rgba(255,255,255,0.12)' }}>
          <QRCode value={qrValue} size={210} level="M" bgColor="#ffffff" fgColor="#0D0D0D" />
        </div>

        {/* Short code — prominently visible right below QR */}
        {shortCode && (
          <button onClick={copyCode}
            className="flex flex-col items-center gap-1 px-8 py-3 rounded-2xl transition active:scale-95"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <p className="text-white/40 text-[10px] uppercase tracking-widest">Code client</p>
            <p className="text-white font-black text-3xl tracking-[0.25em]">
              {shortCode.slice(0, 4)} {shortCode.slice(4)}
            </p>
            <p className="text-[11px] font-medium" style={{ color: copied ? LIME : 'rgba(255,255,255,0.35)' }}>
              {copied ? '✓ Copié' : 'Toucher pour copier'}
            </p>
          </button>
        )}

        {/* Countdown */}
        <div className="flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke={countdownColor} strokeWidth="2"/>
            <path d="M12 7v5l3 3" stroke={countdownColor} strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p className="text-sm font-mono font-semibold" style={{ color: countdownColor }}>
            {countdown > 0 ? `Expire dans ${countdown}s` : 'Renouvellement…'}
          </p>
        </div>

        <p className="text-white/30 text-xs text-center max-w-xs">
          Présentez ce QR code au commerçant pour valider vos tampons
        </p>
      </div>

      {/* Bottom spacer */}
      <div />
    </div>
  )
}

// ── StampGrid ─────────────────────────────────────────────────────────────────
function StampGrid({ stamps, required, icon, iconUrl, shape, accentColor, textColor }: {
  stamps: number; required: number; icon: string; iconUrl?: string | null; shape: StampShape
  accentColor: string; textColor: string
}) {
  const cols = required <= 5 ? required : required <= 8 ? 4 : 5
  const radius = getStampRadius(shape)
  const tc = textColor || '#000000'
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: required }).map((_, i) => {
        const filled = i < stamps
        const isLast = i === required - 1
        return (
          <div key={i} className={`aspect-square ${radius} flex items-center justify-center transition-all duration-300`}
            style={
              isLast
                ? filled
                  ? { background: accentColor, boxShadow: `0 0 10px ${accentColor}60` }
                  : { border: `1.5px dashed ${tc}30`, background: `${tc}06` }
                : filled
                ? { background: `${tc}20`, border: `1.5px solid ${tc}15` }
                : { border: `1.5px dashed ${tc}18`, background: `${tc}05` }
            }>
            {isLast
              ? <span className="text-lg">🎁</span>
              : filled
              ? iconUrl
                ? <img src={iconUrl} alt="" className="w-5 h-5 object-contain" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }} />
                : <span className="text-sm" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}>{icon}</span>
              : null
            }
          </div>
        )
      })}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CartePage() {
  const [card, setCard] = useState<Card | null>(null)
  const [stamps, setStamps] = useState<Stamp[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [showQrModal, setShowQrModal] = useState(false)
  const [stampFlash, setStampFlash] = useState(false)
  const [pushState, setPushState] = useState<PushState>('default')
  const [pushLoading, setPushLoading] = useState(false)

  const fetchData = useCallback(async () => {
    const [cardRes, stampsRes, promoRes] = await Promise.all([
      fetch('/api/cards/me'),
      fetch('/api/stamps/me'),
      fetch('/api/promotions'),
    ])
    if (cardRes.ok) setCard(await cardRes.json())
    if (stampsRes.ok) {
      const s = await stampsRes.json()
      setStamps(Array.isArray(s) ? s.slice(0, 8) : [])
    }
    if (promoRes.ok) {
      const p = await promoRes.json()
      setPromotions(Array.isArray(p.items) ? p.items : [])
    }
    setLoading(false)
  }, [])

  // ── SSE: real-time stamp updates — stable connection, Page Visibility aware ─
  // Keep fetchData in a ref so the SSE effect has zero deps and never reconnects
  const fetchDataRef = useRef(fetchData)
  useEffect(() => { fetchDataRef.current = fetchData }, [fetchData])

  useEffect(() => {
    let es: EventSource | null = null
    let retryTimeout: ReturnType<typeof setTimeout> | null = null
    let retryDelay = 1000

    function connect() {
      if (document.hidden) return   // don't open when tab is invisible
      es = new EventSource('/api/cards/stream')

      es.addEventListener('stamp', (e) => {
        retryDelay = 1000           // reset backoff on successful event
        try {
          const event = JSON.parse(e.data)
          setCard(prev => {
            if (!prev) return prev
            return {
              ...prev,
              stamps: event.stampsNow,
              rewards: event.rewardUnlocked
                ? [...prev.rewards, { id: Date.now(), label: event.rewardLabel ?? '', isUsed: false, expiresAt: null }]
                : prev.rewards,
            }
          })
          fetchDataRef.current()
          setStampFlash(true)
          setTimeout(() => setStampFlash(false), 1200)
          setCard(prev => {
            const soundUrl = prev?.program?.notificationSoundEnabled !== false
              ? prev?.program?.notificationSoundUrl : null
            playSound(soundUrl)
            return prev
          })
          if (event.rewardUnlocked) {
            toast('🎁 Récompense débloquée !', { duration: 4000, style: { background: '#7B2FBE', color: '#fff', fontWeight: 'bold' } })
          } else {
            toast(`✅ +1 tampon — ${event.stampsNow}/${event.stampsRequired}`, { duration: 3000, style: { background: '#1a1a1a', color: '#CCFF00', fontWeight: 'bold' } })
          }
        } catch {}
      })

      es.onerror = () => {
        es?.close()
        es = null
        // Exponential backoff: 1s → 2s → 4s → 8s → max 30s
        retryTimeout = setTimeout(() => {
          retryDelay = Math.min(retryDelay * 2, 30_000)
          connect()
        }, retryDelay)
      }
    }

    function handleVisibility() {
      if (document.hidden) {
        // Close SSE when tab goes background — saves server connections
        es?.close()
        es = null
        if (retryTimeout) clearTimeout(retryTimeout)
      } else {
        // Reconnect immediately when tab comes back
        if (!es || es.readyState === EventSource.CLOSED) {
          retryDelay = 1000
          connect()
        }
      }
    }

    connect()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      es?.close()
      if (retryTimeout) clearTimeout(retryTimeout)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])   // ← empty deps: connects once, never recreated

  // ── SW message listener (push sound when page is open) ───────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'PLAY_SOUND') {
        playSound(event.data.sound)
      }
    }
    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [])

  // ── Push notifications ────────────────────────────────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushState('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setPushState('denied')
      return
    }
    navigator.serviceWorker.register('/sw.js').then(reg =>
      reg.pushManager.getSubscription()
    ).then(sub => {
      if (sub) setPushState('subscribed')
    }).catch(() => {})
  }, [])

  async function togglePush() {
    if (pushState === 'unsupported' || pushState === 'denied' || pushLoading) return
    setPushLoading(true)
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      if (pushState === 'subscribed') {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          })
          await sub.unsubscribe()
        }
        setPushState('default')
        toast('🔕 Notifications désactivées', { duration: 2000, style: { background: '#1a1a1a', color: 'rgba(255,255,255,0.6)' } })
      } else {
        const perm = await Notification.requestPermission()
        if (perm !== 'granted') {
          setPushState(perm === 'denied' ? 'denied' : 'default')
          return
        }
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidKey) return
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })
        const json = sub.toJSON()
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
        })
        setPushState('subscribed')
        toast('🔔 Notifications activées !', { duration: 2500, style: { background: '#1a1a1a', color: LIME, fontWeight: 'bold' } })
      }
    } catch (err) {
      console.error('Push error:', err)
    } finally {
      setPushLoading(false)
    }
  }

  // QR auto-refresh (runs in background even when modal is closed)
  const [dynamicQr, setDynamicQr] = useState<{ token: string; expiresAt: number } | null>(null)
  const [countdown, setCountdown] = useState(60)
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refreshQr = useCallback(async () => {
    try {
      const res = await fetch('/api/cards/qr-token')
      if (res.ok) {
        const data = await res.json()
        setDynamicQr(data)
        const secs = Math.round((data.expiresAt - Date.now()) / 1000)
        setCountdown(Math.max(0, secs))
        if (refreshTimer.current) clearTimeout(refreshTimer.current)
        // Refresh 5s before expiry
        const delay = Math.max(2000, data.expiresAt - Date.now() - 5000)
        refreshTimer.current = setTimeout(refreshQr, delay)
      }
    } catch {}
  }, [])

  // Countdown ticker — paused when tab is hidden to save CPU/battery
  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null

    function startTicker() {
      if (id) return
      id = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { refreshQr(); return 0 }
          return prev - 1
        })
      }, 1000)
    }
    function stopTicker() {
      if (id) { clearInterval(id); id = null }
    }
    function handleVisibility() {
      document.hidden ? stopTicker() : startTicker()
    }

    if (!document.hidden) startTicker()
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      stopTicker()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [refreshQr])

  useEffect(() => {
    return () => { if (refreshTimer.current) clearTimeout(refreshTimer.current) }
  }, [])

  useEffect(() => {
    fetchData()
    refreshQr()
  }, [fetchData, refreshQr])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-main)' }}>
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `${LIME} transparent ${LIME} ${LIME}` }} />
      </div>
    )
  }

  if (!card) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6" style={{ background: 'var(--bg-main)' }}>
        <div className="text-center">
          <div className="text-5xl mb-4">🃏</div>
          <p className="text-white/40 text-sm">Aucune carte trouvée</p>
        </div>
      </div>
    )
  }

  const { stamps: stampCount, program, rewards, user } = card
  const {
    cardColor1, cardColor2, accentColor, cardIcon, cardIconUrl,
    stampShape = 'rounded', cardTextColor = '#ffffff',
    cardSubtitle = 'Carte Fidélité', cardNote, cardBgImageUrl, logoUrl,
  } = program
  const tc = cardTextColor
  const pct = Math.min(100, Math.round((stampCount / program.stampsRequired) * 100))
  const pendingRewards = rewards.filter(r => !r.isUsed)
  const qrValue = dynamicQr?.token ?? user.qrToken
  const countdownColor = countdown <= 10 ? '#F87171' : countdown <= 20 ? '#FB923C' : LIME

  return (
    <>
      {/* Fullscreen QR modal */}
      {showQrModal && (
        <QrModal
          qrValue={qrValue}
          programName={program.name}
          shortCode={user.shortCode}
          countdown={countdown}
          countdownColor={countdownColor}
          onClose={() => setShowQrModal(false)}
        />
      )}

      <div className="min-h-screen" style={{ background: 'var(--bg-main)' }}>
      <div className="max-w-lg mx-auto px-4 sm:px-6 pb-32">

        {/* ── Header ── */}
        <div className="flex items-center justify-between py-5">
          <div>
            <p className="text-xs" style={{ color: 'var(--text-greeting)' }}>Bonjour</p>
            <h1 className="text-xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{user.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Bell button */}
            {pushState !== 'unsupported' && (
              <button
                onClick={togglePush}
                disabled={pushLoading || pushState === 'denied'}
                title={
                  pushState === 'denied' ? 'Notifications bloquées — autorisez dans les paramètres du navigateur'
                  : pushState === 'subscribed' ? 'Désactiver les notifications'
                  : 'Activer les notifications'
                }
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}
              >
                {pushLoading ? (
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: `${LIME} transparent ${LIME} ${LIME}` }} />
                ) : pushState === 'subscribed' ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" fill={LIME} stroke={LIME} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={LIME} strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ) : pushState === 'denied' ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="4" y1="4" x2="20" y2="20" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
            )}
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-black"
              style={{ background: accentColor, color: '#0D0D0D' }}>
              {user.name[0]?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* ── Loyalty Card ── */}
        <div className={`rounded-3xl overflow-hidden mb-2 relative transition-all duration-300 ${stampFlash ? 'scale-[1.02]' : ''}`}
          style={{
            background: `linear-gradient(135deg, ${cardColor1} 0%, ${cardColor2} 100%)`,
            boxShadow: stampFlash ? `0 32px 80px ${accentColor}60` : `0 24px 64px ${cardColor1}40`,
          }}>
          {/* Background image */}
          {cardBgImageUrl && (
            <div className="absolute inset-0 z-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cardBgImageUrl} alt="" className="w-full h-full object-cover opacity-30"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
          )}
          <div className="relative z-10">
            {/* Card header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-1">
              <div className="flex items-center gap-2.5">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt={program.name} className="w-8 h-8 rounded-lg object-contain"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                    style={{ background: 'rgba(255,255,255,0.15)' }}>
                    {cardIconUrl
                      ? <img src={cardIconUrl} alt="" className="w-5 h-5 object-contain" />
                      : cardIcon}
                  </div>
                )}
                <div>
                  <p className="text-xs" style={{ color: `${tc}70` }}>{cardSubtitle}</p>
                  <p className="font-bold text-sm leading-tight" style={{ color: tc }}>{program.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-2xl leading-none" style={{ color: tc }}>{stampCount}</p>
                <p className="text-xs" style={{ color: `${tc}50` }}>/ {program.stampsRequired}</p>
              </div>
            </div>

            {/* Stamp grid */}
            <div className="px-5 py-4">
              <StampGrid
                stamps={stampCount} required={program.stampsRequired}
                icon={cardIcon} iconUrl={cardIconUrl}
                shape={stampShape as StampShape}
                accentColor={accentColor} textColor={tc}
              />
            </div>

            {/* Progress bar */}
            <div className="px-5 pb-2">
              <div className="h-1 rounded-full" style={{ background: `${tc}15` }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: `${tc}45` }} />
              </div>
            </div>

            {/* Card footer */}
            <div className="flex items-center justify-between px-5 pb-4 pt-2">
              <span className="text-xs" style={{ color: `${tc}50` }}>Récompense</span>
              <span className="text-xs font-bold" style={{ color: tc }}>{program.rewardLabel}</span>
            </div>
          </div>
        </div>

        {/* Card note */}
        {cardNote && (
          <div className="rounded-2xl px-4 py-3 mb-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-white/50 text-xs leading-relaxed">{cardNote}</p>
          </div>
        )}

        {/* ── Pending rewards ── */}
        {pendingRewards.length > 0 && (
          <div className="rounded-2xl p-4 mb-4 flex items-center gap-3"
            style={{ background: 'var(--banner-bg)', border: '1px solid var(--banner-border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
              style={{ background: 'var(--banner-icon-bg)' }}>🎁</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: 'var(--banner-text-title)' }}>
                {pendingRewards.length} récompense{pendingRewards.length > 1 ? 's' : ''} disponible{pendingRewards.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs" style={{ color: 'var(--banner-text-sub)' }}>Présentez votre carte en caisse</p>
            </div>
          </div>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Tampons', value: stampCount, color: 'var(--stats-accent)' },
            { label: 'Objectif', value: program.stampsRequired, color: 'var(--stats-value)' },
            { label: 'Récompenses', value: rewards.length, color: '#A78BFA' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-3.5 text-center"
              style={{ background: 'var(--stats-bg)', border: '1px solid var(--stats-border)' }}>
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--stats-label)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Progress ── */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-border)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Progression</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{stampCount} / {program.stampsRequired}</p>
          </div>
          <div className="h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: 'var(--stats-accent)' }} />
          </div>
          {pct >= 100
            ? <p className="text-xs mt-2" style={{ color: 'var(--stats-accent)' }}>🎉 Récompense débloquée !</p>
            : <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                {program.stampsRequired - stampCount} tampon{program.stampsRequired - stampCount > 1 ? 's' : ''} pour votre récompense
              </p>
          }
        </div>

        {/* ── Recent stamps ── */}
        {stamps.length > 0 && (
          <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-border)' }}>
            <p className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Historique</p>
            <div className="space-y-3">
              {stamps.map(stamp => (
                <div key={stamp.id} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{ background: 'rgba(204,255,0,0.12)', color: LIME }}>+1</div>
                  <p className="text-white/70 text-sm flex-1">Tampon ajouté</p>
                  <p className="text-white/30 text-xs flex-shrink-0">{formatDate(stamp.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Promotions ── */}
        {promotions.length > 0 && (
          <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-border)' }}>
            <div className="px-5 pt-4 pb-3">
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Offres</p>
            </div>
            <div className="px-5 pb-5 space-y-3">
              {promotions.slice(0, 3).map(promo => (
                <div key={promo.id} className="rounded-xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {promo.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={promo.imageUrl} alt={promo.title} className="w-full h-32 object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  )}
                  <div className="p-3">
                    <p className="text-white text-sm font-medium">{promo.title}</p>
                    {promo.description && <p className="text-white/50 text-xs mt-1">{promo.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>

      {/* ── Sticky CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-40 px-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 76px)' }}>
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => setShowQrModal(true)}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 active:scale-98 transition-transform"
            style={{ background: 'var(--cta-bg)', color: 'var(--cta-text)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/>
              <rect x="5" y="5" width="3" height="3" fill="currentColor"/>
              <rect x="16" y="5" width="3" height="3" fill="currentColor"/>
              <rect x="5" y="16" width="3" height="3" fill="currentColor"/>
              <path d="M14 14h2v2h-2zM18 14h3v2h-3zM14 18h2v3h-2zM18 18h3v3h-3z" fill="currentColor"/>
            </svg>
            Présenter ma carte
          </button>
        </div>
      </div>
    </>
  )
}
