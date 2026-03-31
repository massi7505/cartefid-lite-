'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const LIME = '#CCFF00'

interface Promotion {
  id: number
  title: string
  description: string | null
  imageUrl: string | null
  couponCode: string | null
  buttonLabel: string | null
  buttonUrl: string | null
  expiresAt: string | null
  createdAt: string
}

interface QuickLinks {
  phone: string | null
  uberEats: string | null
  deliveroo: string | null
}

const CARD_STYLE = { background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }

function daysLeft(expiresAt: string) {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function CouponButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      toast.success('Code copié !')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className="flex items-center gap-3 rounded-xl p-3 mt-3"
      style={{ background: 'rgba(204,255,0,0.07)', border: '1px dashed rgba(204,255,0,0.25)' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-white/40 text-xs mb-0.5">Code promo</p>
        <p className="text-white font-mono font-bold text-base tracking-widest truncate">{code}</p>
      </div>
      <button
        onClick={copy}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition flex-shrink-0 text-black"
        style={{ background: copied ? '#A8D400' : LIME }}
      >
        {copied ? (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Copié !
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Copier
          </>
        )}
      </button>
    </div>
  )
}

export default function OffresPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [quickLinks, setQuickLinks] = useState<QuickLinks>({ phone: null, uberEats: null, deliveroo: null })
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/promotions')
    if (res.ok) {
      const data = await res.json()
      setPromotions(Array.isArray(data.items) ? data.items : [])
      if (data.quickLinks) setQuickLinks(data.quickLinks)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const hasLinks = quickLinks.phone || quickLinks.uberEats || quickLinks.deliveroo

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 pb-10" style={{ background: '#0D0D0D' }}>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-white text-xl font-bold">Offres & Promotions</h1>
        <p className="text-white/40 text-sm mt-0.5">Offres exclusives et liens rapides</p>
      </div>

      {/* Quick links */}
      {hasLinks && (
        <div className="rounded-2xl p-4 mb-6" style={CARD_STYLE}>
          <p className="text-white text-sm font-semibold mb-3">Liens rapides</p>
          <div className="flex flex-wrap gap-2">
            {quickLinks.phone && (
              <a
                href={`tel:${quickLinks.phone}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition text-black"
                style={{ background: LIME }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.95 13a19.79 19.79 0 01-3.07-8.67A2 2 0 012.86 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Appeler
              </a>
            )}
            {quickLinks.uberEats && (
              <a
                href={quickLinks.uberEats}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition"
                style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <span className="text-base">🛵</span> Uber Eats
              </a>
            )}
            {quickLinks.deliveroo && (
              <a
                href={quickLinks.deliveroo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition"
                style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <span className="text-base">🦘</span> Deliveroo
              </a>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: `${LIME} transparent ${LIME} ${LIME}` }} />
        </div>
      ) : promotions.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={CARD_STYLE}>
          <p className="text-4xl mb-3">🎁</p>
          <p className="text-white/60 text-sm font-medium">Aucune offre disponible</p>
          <p className="text-white/30 text-xs mt-1">Revenez bientôt !</p>
        </div>
      ) : (
        <div className="space-y-4">
          {promotions.map(promo => {
            const days = promo.expiresAt ? daysLeft(promo.expiresAt) : null
            const badgeStyle =
              days === null ? null
              : days <= 0 ? { bg: 'rgba(239,68,68,0.15)', color: '#F87171', label: "Expire aujourd'hui" }
              : days <= 3 ? { bg: 'rgba(239,68,68,0.15)', color: '#F87171', label: `${days}j restants` }
              : days <= 7 ? { bg: 'rgba(251,146,60,0.15)', color: '#FB923C', label: `${days}j restants` }
              : { bg: 'rgba(204,255,0,0.1)', color: LIME, label: `${days}j restants` }

            return (
              <div key={promo.id} className="rounded-2xl overflow-hidden" style={CARD_STYLE}>
                {promo.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={promo.imageUrl}
                    alt={promo.title}
                    className="w-full h-44 object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h2 className="text-white font-semibold text-base leading-tight flex-1">{promo.title}</h2>
                    {badgeStyle && (
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
                        style={{ background: badgeStyle.bg, color: badgeStyle.color }}
                      >
                        {badgeStyle.label}
                      </span>
                    )}
                  </div>
                  {promo.description && (
                    <p className="text-white/55 text-sm leading-relaxed">{promo.description}</p>
                  )}

                  {/* Coupon code */}
                  {promo.couponCode && <CouponButton code={promo.couponCode} />}

                  {/* Custom button */}
                  {promo.buttonLabel && promo.buttonUrl && (
                    <a
                      href={promo.buttonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition text-black"
                      style={{ background: LIME }}
                    >
                      {promo.buttonLabel}
                    </a>
                  )}

                  <p className="text-white/25 text-xs mt-3">
                    Publié le {new Date(promo.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
