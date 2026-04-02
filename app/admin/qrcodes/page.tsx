'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'

const QRCodeCanvas = dynamic(() => import('qrcode.react').then(m => ({ default: m.QRCodeCanvas })), { ssr: false })

interface QRCode {
  id: number
  token: string
  multiUse: boolean
  expiresAt?: string
  usedAt?: string
  program: { name: string }
}

function qrStatus(qr: QRCode): { label: string; cls: string } {
  if (!qr.multiUse && qr.usedAt) return { label: 'Utilisé', cls: 'bg-gray-100 text-gray-500' }
  if (qr.expiresAt && new Date(qr.expiresAt) < new Date()) return { label: 'Expiré', cls: 'bg-red-100 text-red-600' }
  return { label: 'Actif', cls: 'bg-green-100 text-green-700' }
}

function fmt(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function QRModal({ scanUrl, onClose }: { scanUrl: string; onClose: () => void }) {
  function downloadPNG() {
    const canvas = document.querySelector('#qr-canvas canvas') as HTMLCanvasElement | null
    if (!canvas) { toast.error('Impossible de télécharger'); return }
    const link = document.createElement('a')
    link.download = 'qrcode-fidelite.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
    toast.success('QR code téléchargé !')
  }

  function copyUrl() {
    navigator.clipboard.writeText(scanUrl)
    toast.success('URL copiée !')
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 text-lg">QR Code ✓</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        <p className="text-sm text-gray-500 mb-5">Imprimez ou affichez ce QR code pour vos clients</p>

        <div id="qr-canvas" className="flex justify-center mb-5 p-4 bg-white border-2 border-gray-100 rounded-xl">
          <QRCodeCanvas value={scanUrl} size={200} includeMargin />
        </div>

        <p className="text-xs font-mono text-gray-400 break-all mb-5 bg-gray-50 rounded-xl p-3">{scanUrl}</p>

        <div className="grid grid-cols-3 gap-2">
          <button onClick={copyUrl} className="py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition">
            📋 Copier
          </button>
          <button onClick={downloadPNG} className="py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition">
            ⬇️ PNG
          </button>
          <button onClick={() => window.print()} className="py-2.5 rounded-xl bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition">
            🖨️ Imprimer
          </button>
        </div>

        <button onClick={onClose} className="mt-4 text-sm text-gray-400 hover:text-gray-600 w-full py-2">
          Fermer
        </button>
      </div>
    </div>
  )
}

export default function QRCodesPage() {
  const [qrcodes, setQrcodes] = useState<QRCode[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null)
  const [form, setForm] = useState({ multiUse: false, expiresIn: 'none' as 'none' | '24h' | '7d' })
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [qrEnabled, setQrEnabled] = useState(true)
  const [togglingEnabled, setTogglingEnabled] = useState(false)

  const fetchQR = useCallback(async () => {
    const [listRes, pwaRes] = await Promise.all([
      fetch('/api/qr/list'),
      fetch('/api/admin/pwa'),
    ])
    if (listRes.ok) setQrcodes(await listRes.json())
    if (pwaRes.ok) {
      const pwa = await pwaRes.json()
      setQrEnabled(pwa.qrEnabled ?? true)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchQR() }, [fetchQR])

  async function toggleQrEnabled() {
    setTogglingEnabled(true)
    const next = !qrEnabled
    const res = await fetch('/api/admin/pwa', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrEnabled: next }),
    })
    if (res.ok) {
      setQrEnabled(next)
      toast.success(next ? 'QR codes activés' : 'QR codes désactivés')
    } else {
      toast.error('Erreur lors de la mise à jour')
    }
    setTogglingEnabled(false)
  }

  async function generate() {
    setGenerating(true)
    const res = await fetch('/api/qr/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ programId: 1, ...form }),
    })
    const data = await res.json()
    if (res.ok) {
      setSelectedUrl(data.scanUrl)
      fetchQR()
      toast.success('QR Code créé !')
    } else {
      toast.error(data.error ?? 'Erreur lors de la génération')
    }
    setGenerating(false)
  }

  async function handleDelete(id: number) {
    if (!confirm('Supprimer ce QR code ?')) return
    setDeletingId(id)
    const res = await fetch(`/api/qr/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setQrcodes(prev => prev.filter(q => q.id !== id))
      toast.success('QR code supprimé')
    } else {
      toast.error('Erreur lors de la suppression')
    }
    setDeletingId(null)
  }

  const activeCount = qrcodes.filter(qr => {
    if (!qr.multiUse && qr.usedAt) return false
    if (qr.expiresAt && new Date(qr.expiresAt) < new Date()) return false
    return true
  }).length

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">QR Codes</h1>
        <p className="text-gray-500 text-sm mt-1">
          {activeCount} actif{activeCount > 1 ? 's' : ''} · {qrcodes.length} total
        </p>
      </div>

      {/* Enable / Disable toggle */}
      <div className={`flex items-center justify-between p-5 rounded-2xl mb-6 border transition ${
        qrEnabled ? 'bg-white border-gray-100' : 'bg-red-50 border-red-100'
      }`} style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.08)' }}>
        <div>
          <p className="font-semibold text-gray-900 text-sm">Fonctionnalité QR codes</p>
          <p className="text-xs mt-0.5" style={{ color: '#A3AED0' }}>
            {qrEnabled
              ? 'Les clients peuvent scanner les QR codes pour recevoir des tampons'
              : 'Désactivé — les scans sont refusés'}
          </p>
        </div>
        <button
          onClick={toggleQrEnabled}
          disabled={togglingEnabled || loading}
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-60 flex-shrink-0 ${
            qrEnabled ? 'bg-green-500' : 'bg-gray-300'
          }`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
            qrEnabled ? 'translate-x-6' : 'translate-x-0'
          }`} />
        </button>
      </div>

      {/* Generator card */}
      <div className={`bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm ${!qrEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Générer un nouveau QR code</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Utilisation</label>
            <select
              value={form.multiUse ? 'multi' : 'single'}
              onChange={e => setForm(f => ({ ...f, multiUse: e.target.value === 'multi' }))}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition bg-white"
            >
              <option value="single">Usage unique</option>
              <option value="multi">Usage multiple</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Expiration</label>
            <select
              value={form.expiresIn}
              onChange={e => setForm(f => ({ ...f, expiresIn: e.target.value as 'none' | '24h' | '7d' }))}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition bg-white"
            >
              <option value="none">Sans expiration</option>
              <option value="24h">24 heures</option>
              <option value="7d">7 jours</option>
            </select>
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-800 transition disabled:opacity-50 flex items-center gap-2"
          >
            {generating ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Génération...
              </>
            ) : '+ Générer'}
          </button>
        </div>
      </div>

      {/* QR list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">

        {/* Mobile cards */}
        <div className="lg:hidden divide-y divide-gray-50">
          {loading ? (
            <p className="text-center py-10 text-gray-400 text-sm">Chargement...</p>
          ) : qrcodes.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-3xl mb-2">📷</div>
              <p className="text-gray-400 text-sm">Aucun QR code généré</p>
            </div>
          ) : qrcodes.map(qr => {
            const s = qrStatus(qr)
            return (
              <div key={qr.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-gray-600">{qr.token.slice(0, 14)}…</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${qr.multiUse ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {qr.multiUse ? 'Multiple' : 'Unique'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
                    {qr.expiresAt && <span className="text-xs text-gray-400">Expire {fmt(qr.expiresAt)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setSelectedUrl(`${window.location.origin}/scan?token=${qr.token}`)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                  >
                    Voir
                  </button>
                  <button
                    onClick={() => handleDelete(qr.id)}
                    disabled={deletingId === qr.id}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                  >
                    {deletingId === qr.id ? '...' : 'Suppr.'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Token', 'Type', 'Expiration', 'Utilisé le', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Chargement...</td></tr>
              ) : qrcodes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="text-3xl mb-2">📷</div>
                    <p className="text-gray-400 text-sm">Aucun QR code généré</p>
                  </td>
                </tr>
              ) : qrcodes.map(qr => {
                const s = qrStatus(qr)
                return (
                  <tr key={qr.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{qr.token.slice(0, 12)}...</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${qr.multiUse ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {qr.multiUse ? 'Multiple' : 'Unique'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{fmt(qr.expiresAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{fmt(qr.usedAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedUrl(`${window.location.origin}/scan?token=${qr.token}`)}
                          className="text-xs text-gray-500 hover:text-gray-900 underline transition"
                        >
                          Afficher
                        </button>
                        <button
                          onClick={() => handleDelete(qr.id)}
                          disabled={deletingId === qr.id}
                          className="text-xs text-red-500 hover:text-red-700 underline transition disabled:opacity-50"
                        >
                          {deletingId === qr.id ? '...' : 'Supprimer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUrl && (
        <QRModal scanUrl={selectedUrl} onClose={() => setSelectedUrl(null)} />
      )}
    </div>
  )
}
