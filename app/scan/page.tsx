'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const LIME = '#CCFF00'

type Status = 'loading' | 'success' | 'reward' | 'error' | 'unauthenticated'

function ScanContent() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [scanStatus, setScanStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('')
  const [stampsNow, setStampsNow] = useState(0)
  const [stampsRequired, setStampsRequired] = useState(0)
  const [rewardLabel, setRewardLabel] = useState('')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      setScanStatus('unauthenticated')
      return
    }

    if (!token) {
      setScanStatus('error')
      setMessage('QR Code invalide ou manquant')
      return
    }

    async function redeem() {
      const res = await fetch('/api/stamps/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setScanStatus('error')
        setMessage((data as { error?: string }).error ?? 'Erreur lors du scan')
        return
      }

      const data = await res.json()
      setStampsNow(data.stampsNow)
      setStampsRequired(data.stampsRequired ?? 0)
      if (data.rewardLabel) setRewardLabel(data.rewardLabel)
      setScanStatus(data.rewardUnlocked ? 'reward' : 'success')
    }

    redeem()
  }, [session, status, token])

  if (scanStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0D0D0D' }}>
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            🔒
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: '#FFFFFF' }}>Connexion requise</h1>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Connectez-vous pour recevoir votre tampon
          </p>
          <Link
            href={`/login?redirect=/scan?token=${token}`}
            className="inline-block px-8 py-3 rounded-2xl font-bold text-sm transition active:scale-95"
            style={{ background: LIME, color: '#000000' }}
          >
            Se connecter →
          </Link>
        </div>
      </div>
    )
  }

  if (scanStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D0D' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: `rgba(204,255,0,0.3)`, borderTopColor: LIME }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Attribution du tampon…</p>
        </div>
      </div>
    )
  }

  if (scanStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0D0D0D' }}>
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
            ❌
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: '#FFFFFF' }}>Erreur</h1>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>{message}</p>
          <Link
            href="/carte"
            className="inline-block px-8 py-3 rounded-2xl font-bold text-sm transition active:scale-95"
            style={{ background: LIME, color: '#000000' }}
          >
            Retour à ma carte
          </Link>
        </div>
      </div>
    )
  }

  if (scanStatus === 'reward') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #0D0D0D 100%)' }}>
        <div className="text-center max-w-sm">
          <div className="text-8xl mb-6 animate-bounce">🎁</div>
          <h1 className="text-3xl font-black mb-3" style={{ color: '#FFFFFF' }}>Félicitations !</h1>
          {rewardLabel && (
            <div className="rounded-2xl px-6 py-3 mb-5 inline-block"
              style={{ background: 'rgba(123,47,190,0.2)', border: '1px solid rgba(123,47,190,0.4)' }}>
              <p className="font-semibold" style={{ color: '#FFFFFF' }}>{rewardLabel}</p>
            </div>
          )}
          <p className="text-base mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Votre récompense est débloquée !<br />Présentez cette page au commerçant.
          </p>
          <Link
            href="/carte"
            className="inline-block px-8 py-3 rounded-2xl font-bold text-sm transition active:scale-95"
            style={{ background: LIME, color: '#000000' }}
          >
            Voir ma carte →
          </Link>
        </div>
      </div>
    )
  }

  // success
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0D0D0D' }}>
      <div className="text-center max-w-sm">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-4xl mx-auto mb-6"
          style={{ background: LIME, boxShadow: `0 0 40px rgba(204,255,0,0.3)` }}
        >
          ✓
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#FFFFFF' }}>Tampon reçu !</h1>
        <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Vous avez maintenant</p>
        <p className="text-5xl font-black mb-1" style={{ color: LIME }}>
          {stampsNow}
        </p>
        {stampsRequired > 0 && (
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
            sur {stampsRequired} tampons
          </p>
        )}
        <Link
          href="/carte"
          className="inline-block px-8 py-3 rounded-2xl font-bold text-sm transition active:scale-95"
          style={{ background: LIME, color: '#000000' }}
        >
          Voir ma carte →
        </Link>
      </div>
    </div>
  )
}

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D0D' }}>
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'rgba(204,255,0,0.3)', borderTopColor: '#CCFF00' }} />
      </div>
    }>
      <ScanContent />
    </Suspense>
  )
}
