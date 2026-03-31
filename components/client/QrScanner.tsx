'use client'

import { useEffect, useRef } from 'react'

interface Props {
  onScan: (token: string) => void
  onError: (msg?: string) => void
}

export default function QrScanner({ onScan, onError }: Props) {
  const scannedRef = useRef(false)

  useEffect(() => {
    let qrInstance: { stop: () => Promise<void> } | null = null
    let started = false  // only true after start() resolves
    scannedRef.current = false

    async function start() {
      const { Html5Qrcode } = await import('html5-qrcode')
      const qr = new Html5Qrcode('qr-reader', { verbose: false })
      qrInstance = qr

      const handleDecoded = (decodedText: string) => {
        if (scannedRef.current) return
        scannedRef.current = true
        let token = decodedText
        try {
          const url = new URL(decodedText)
          token = url.searchParams.get('token') ?? url.searchParams.get('clientToken') ?? decodedText
        } catch {}
        started = false
        qr.stop().catch(() => {})
        onScan(token)
      }

      const config = { fps: 10, qrbox: { width: 250, height: 250 } }

      try {
        await qr.start({ facingMode: 'environment' }, config, handleDecoded, () => {})
        started = true
      } catch {
        try {
          const cameras = await Html5Qrcode.getCameras()
          if (!cameras.length) { onError('Aucune caméra détectée'); return }
          await qr.start(cameras[0].id, config, handleDecoded, () => {})
          started = true
        } catch (err) {
          const msg = (err instanceof Error ? err.message : '').toLowerCase()
          if (msg.includes('permission') || msg.includes('denied') || msg.includes('notallowed')) {
            onError('Accès caméra refusé — vérifiez les autorisations du navigateur')
          } else {
            onError("Impossible d'accéder à la caméra")
          }
        }
      }
    }

    start()

    return () => {
      // Only call stop() if start() actually succeeded
      if (started && qrInstance) {
        started = false
        qrInstance.stop().catch(() => {})
      }
    }
  }, [onScan, onError])

  return (
    <div className="overflow-hidden rounded-2xl bg-black relative">
      <div id="qr-reader" style={{ width: '100%' }} />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative w-52 h-52">
          <span className="absolute top-0 left-0 w-7 h-7 border-white rounded-tl-lg" style={{ borderTopWidth: 3, borderLeftWidth: 3 }} />
          <span className="absolute top-0 right-0 w-7 h-7 border-white rounded-tr-lg" style={{ borderTopWidth: 3, borderRightWidth: 3 }} />
          <span className="absolute bottom-0 left-0 w-7 h-7 border-white rounded-bl-lg" style={{ borderBottomWidth: 3, borderLeftWidth: 3 }} />
          <span className="absolute bottom-0 right-0 w-7 h-7 border-white rounded-br-lg" style={{ borderBottomWidth: 3, borderRightWidth: 3 }} />
        </div>
      </div>
    </div>
  )
}
