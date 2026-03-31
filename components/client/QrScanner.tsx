'use client'

import { useEffect, useRef } from 'react'

// ── BarcodeDetector type (browser API, not in all lib.dom.d.ts versions) ───────
interface BarcodeDetectorResult { rawValue: string }
interface BarcodeDetectorAPI {
  detect(source: HTMLVideoElement | HTMLCanvasElement): Promise<BarcodeDetectorResult[]>
}
declare const BarcodeDetector: {
  new(opts: { formats: string[] }): BarcodeDetectorAPI
  getSupportedFormats(): Promise<string[]>
}

interface Props {
  onScan: (token: string) => void
  onError: (msg?: string) => void
}

/** Parse QR payload — extract token param from URL or use raw value */
function extractToken(raw: string): string {
  try {
    const url = new URL(raw)
    return url.searchParams.get('token') ?? url.searchParams.get('clientToken') ?? raw
  } catch {
    return raw
  }
}

export default function QrScanner({ onScan, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef    = useRef<number>(0)
  const scannedRef = useRef(false)

  useEffect(() => {
    scannedRef.current = false
    let active = true

    // ── 1. Get camera stream immediately ─────────────────────────────────────
    async function start() {
      let stream: MediaStream

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width:  { ideal: 1280, max: 1920 },
            height: { ideal: 720,  max: 1080 },
          },
          audio: false,
        })
      } catch (err) {
        if (!active) return
        const msg = (err instanceof Error ? err.message : '').toLowerCase()
        if (msg.includes('permission') || msg.includes('denied') || msg.includes('notallowed')) {
          onError('Accès caméra refusé — vérifiez les autorisations du navigateur')
        } else if (msg.includes('notfound') || msg.includes('devicenotfound')) {
          onError('Aucune caméra détectée')
        } else {
          onError("Impossible d'accéder à la caméra")
        }
        return
      }

      if (!active) { stream.getTracks().forEach(t => t.stop()); return }
      streamRef.current = stream

      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      // playsInline + muted required on iOS for autoplay
      video.muted = true
      video.playsInline = true
      await video.play()

      // ── 2. Choose fastest decoding path ──────────────────────────────────
      const hasBarcodeDetector =
        typeof BarcodeDetector !== 'undefined' &&
        typeof BarcodeDetector.getSupportedFormats === 'function'

      if (hasBarcodeDetector) {
        try {
          const formats = await BarcodeDetector.getSupportedFormats()
          if (formats.includes('qr_code')) {
            const detector = new BarcodeDetector({ formats: ['qr_code'] })
            loopBarcodeDetector(detector)
            return
          }
        } catch {}
      }

      // Fallback: jsQR (60 KB, works everywhere)
      const { default: jsQR } = await import('jsqr')
      loopJsQR(jsQR)
    }

    // ── BarcodeDetector loop — async per-frame, hardware-accelerated ─────────
    function loopBarcodeDetector(detector: BarcodeDetectorAPI) {
      async function tick() {
        if (!active || scannedRef.current) return
        const video = videoRef.current
        if (video && video.readyState >= video.HAVE_ENOUGH_DATA) {
          try {
            const codes = await detector.detect(video)
            if (codes.length > 0 && codes[0].rawValue) {
              handleDecoded(codes[0].rawValue)
              return
            }
          } catch {}
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    // ── jsQR loop — canvas pixel data, max 15 scans/s ────────────────────────
    function loopJsQR(jsQR: (data: Uint8ClampedArray, w: number, h: number, opts?: { inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst' }) => { data: string } | null) {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return
      const safeCanvas: HTMLCanvasElement = canvas
      const safeCtx: CanvasRenderingContext2D = ctx

      let lastScan = 0

      function tick(ts: number) {
        if (!active || scannedRef.current) return
        const video = videoRef.current

        if (ts - lastScan >= 66 && video && video.readyState >= video.HAVE_ENOUGH_DATA) {
          lastScan = ts
          const { videoWidth: w, videoHeight: h } = video
          if (w > 0 && h > 0) {
            safeCanvas.width  = w
            safeCanvas.height = h
            safeCtx.drawImage(video, 0, 0, w, h)
            const img = safeCtx.getImageData(0, 0, safeCanvas.width, safeCanvas.height)
            const code = jsQR(img.data, w, h, { inversionAttempts: 'dontInvert' })
            if (code?.data) { handleDecoded(code.data); return }
          }
        }

        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    function handleDecoded(raw: string) {
      if (scannedRef.current || !active) return
      scannedRef.current = true
      onScan(extractToken(raw))
    }

    start()

    return () => {
      active = false
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [onScan, onError])

  return (
    <div className="overflow-hidden rounded-2xl bg-black relative w-full h-full" style={{ minHeight: '200px' }}>
      {/* Native video element — fills whatever height the parent provides */}
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        className="w-full h-full block"
        style={{ objectFit: 'cover' }}
      />
      {/* Off-screen canvas for jsQR fallback */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* Viewfinder corners overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative w-52 h-52">
          <span className="absolute top-0 left-0 w-7 h-7 border-white rounded-tl-lg"
            style={{ borderTopWidth: 3, borderLeftWidth: 3 }} />
          <span className="absolute top-0 right-0 w-7 h-7 border-white rounded-tr-lg"
            style={{ borderTopWidth: 3, borderRightWidth: 3 }} />
          <span className="absolute bottom-0 left-0 w-7 h-7 border-white rounded-bl-lg"
            style={{ borderBottomWidth: 3, borderLeftWidth: 3 }} />
          <span className="absolute bottom-0 right-0 w-7 h-7 border-white rounded-br-lg"
            style={{ borderBottomWidth: 3, borderRightWidth: 3 }} />
        </div>
      </div>
    </div>
  )
}
