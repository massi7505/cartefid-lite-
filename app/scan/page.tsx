'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Status = 'loading' | 'success' | 'reward' | 'error' | 'unauthenticated'

function ScanContent() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [scanStatus, setScanStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('')
  const [stampsNow, setStampsNow] = useState(0)
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

      const data = await res.json()

      if (!res.ok) {
        setScanStatus('error')
        setMessage(data.error ?? 'Erreur lors du scan')
        return
      }

      setStampsNow(data.stampsNow)
      if (data.rewardLabel) setRewardLabel(data.rewardLabel)
      setScanStatus(data.rewardUnlocked ? 'reward' : 'success')
    }

    redeem()
  }, [session, status, token])

  if (scanStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Connexion requise</h1>
          <p className="text-gray-500 text-sm mb-6">Connectez-vous pour recevoir votre tampon</p>
          <Link
            href={`/login?redirect=/scan?token=${token}`}
            className="inline-block bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gray-800 transition"
          >
            Se connecter →
          </Link>
        </div>
      </div>
    )
  }

  if (scanStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Attribution du tampon...</p>
        </div>
      </div>
    )
  }

  if (scanStatus === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Erreur</h1>
          <p className="text-gray-500 text-sm mb-6">{message}</p>
          <Link
            href="/carte"
            className="inline-block bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gray-800 transition"
          >
            Retour à ma carte
          </Link>
        </div>
      </div>
    )
  }

  if (scanStatus === 'reward') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-8xl mb-4 animate-bounce">🎁</div>
          <h1 className="text-3xl font-black text-white mb-2">Félicitations !</h1>
          {rewardLabel && (
            <div className="bg-white/20 backdrop-blur rounded-2xl px-6 py-3 mb-4 inline-block">
              <p className="text-white font-semibold">{rewardLabel}</p>
            </div>
          )}
          <p className="text-white/80 text-base mb-8">
            Votre récompense est débloquée !<br />Présentez cette page au commerçant.
          </p>
          <Link
            href="/carte"
            className="inline-block bg-white text-gray-900 px-8 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition"
          >
            Voir ma carte →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center text-white text-4xl mx-auto mb-4 animate-stamp-pop">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tampon reçu !</h1>
        <p className="text-gray-500 text-sm mb-2">Vous avez maintenant</p>
        <p className="text-4xl font-black text-gray-900 mb-6">
          {stampsNow} tampon{stampsNow > 1 ? 's' : ''}
        </p>
        <Link
          href="/carte"
          className="inline-block bg-gray-900 text-white px-8 py-3 rounded-xl font-semibold text-sm hover:bg-gray-800 transition"
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ScanContent />
    </Suspense>
  )
}
