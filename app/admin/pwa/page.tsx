'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'

// ── Types ─────────────────────────────────────────────────────────────────────
interface PwaSettings {
  id: number
  appName: string
  shortName: string
  description: string
  startUrl: string
  themeColor: string
  backgroundColor: string
  display: string
  orientation: string
  logoUrl: string | null
  faviconUrl: string | null
  splashUrl: string | null
  pwaEnabled: boolean
  offlineMessage: string
  installPromptEnabled: boolean
  installPromptDelay: number | null
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionCard({ title, description, children }: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
      <div className="mb-5">
        <h2 className="font-bold text-base" style={{ color: '#2B3674' }}>{title}</h2>
        {description && <p className="text-xs mt-0.5" style={{ color: '#A3AED0' }}>{description}</p>}
      </div>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none flex-shrink-0"
      style={{ background: checked ? '#4318FF' : '#E2E8F0' }}
      aria-checked={checked}
      role="switch"
    >
      <span
        className="inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm"
        style={{ transform: checked ? 'translateX(1.375rem)' : 'translateX(0.25rem)' }}
      />
    </button>
  )
}

function InputField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2B3674' }}>{label}</label>
      {children}
      {hint && <p className="text-xs mt-1" style={{ color: '#A3AED0' }}>{hint}</p>}
    </div>
  )
}

// ── Phone mockup preview ──────────────────────────────────────────────────────
function PhoneMockup({ themeColor, backgroundColor, appName, logoUrl }: {
  themeColor: string
  backgroundColor: string
  appName: string
  logoUrl: string | null
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* iOS-style mockup */}
      <div>
        <p className="text-[10px] font-semibold text-center mb-2" style={{ color: '#A3AED0' }}>iOS</p>
        <div
          className="relative rounded-[2rem] overflow-hidden border-4 border-gray-200"
          style={{ width: 130, height: 260, background: backgroundColor }}
        >
          {/* Status bar */}
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{ background: themeColor, height: 32 }}
          >
            <span className="text-[9px] font-bold" style={{ color: '#fff' }}>9:41</span>
            <div className="flex gap-1 items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-white/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/80" />
            </div>
          </div>
          {/* Home screen */}
          <div className="flex flex-col items-center justify-center h-[calc(100%-32px)] gap-3 px-4">
            <div
              className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center"
              style={{ background: themeColor }}
            >
              {logoUrl ? (
                <Image src={logoUrl} alt="App icon" width={56} height={56} className="object-cover" unoptimized />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              )}
            </div>
            <span className="text-[9px] font-semibold text-center leading-tight" style={{ color: '#fff' }}>
              {appName.slice(0, 14)}
            </span>
          </div>
        </div>
      </div>

      {/* Android-style mockup */}
      <div>
        <p className="text-[10px] font-semibold text-center mb-2" style={{ color: '#A3AED0' }}>Android</p>
        <div
          className="relative rounded-[1.5rem] overflow-hidden border-4 border-gray-200"
          style={{ width: 130, height: 260, background: backgroundColor }}
        >
          {/* Status bar */}
          <div
            className="flex items-center justify-between px-3 py-1.5"
            style={{ background: themeColor, height: 28 }}
          >
            <span className="text-[8px] font-bold" style={{ color: '#fff' }}>9:41</span>
            <div className="flex gap-0.5">
              {[3, 3, 3].map((_, i) => (
                <div key={i} className="w-1 rounded-sm bg-white/80" style={{ height: i === 0 ? 6 : i === 1 ? 9 : 12 }} />
              ))}
            </div>
          </div>
          {/* App icon on launcher */}
          <div className="flex flex-col items-center justify-center h-[calc(100%-28px)] gap-2">
            <div
              className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center"
              style={{ background: themeColor }}
            >
              {logoUrl ? (
                <Image src={logoUrl} alt="App icon" width={48} height={48} className="object-cover" unoptimized />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5"/>
                </svg>
              )}
            </div>
            <span className="text-[8px] font-semibold" style={{ color: '#fff' }}>
              {appName.slice(0, 10)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Upload field ───────────────────────────────────────────────────────────────
function UploadField({ label, hint, value, onChange }: {
  label: string
  hint?: string
  value: string | null
  onChange: (url: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File) {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      const { url } = await res.json()
      onChange(url)
      toast.success('Image uploadée')
    } catch {
      toast.error('Erreur lors de l\'upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2B3674' }}>{label}</label>
      {hint && <p className="text-xs mb-2" style={{ color: '#A3AED0' }}>{hint}</p>}

      <div className="flex gap-3 items-start">
        {/* Preview */}
        {value ? (
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
            <Image src={value} alt={label} fill className="object-cover" unoptimized />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A3AED0" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}

        <div className="flex flex-col gap-2 flex-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50"
            style={{ color: '#2B3674' }}
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-indigo-600 rounded-full animate-spin" />
                Upload…
              </span>
            ) : value ? 'Changer' : 'Choisir un fichier'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-xs text-red-400 hover:text-red-600 transition text-left"
            >
              Supprimer
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

// ── Status checker ─────────────────────────────────────────────────────────────
function PwaStatusPanel({ pwa }: { pwa: PwaSettings }) {
  const [swRegistered, setSwRegistered] = useState<boolean | null>(null)
  const [manifestValid, setManifestValid] = useState<boolean | null>(null)

  useEffect(() => {
    // Check service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration('/').then(reg => {
        setSwRegistered(!!reg)
      }).catch(() => setSwRegistered(false))
    } else {
      setSwRegistered(false)
    }
    // Check manifest
    fetch('/api/manifest').then(r => setManifestValid(r.ok)).catch(() => setManifestValid(false))
  }, [])

  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
  const hasIcon = !!(pwa.logoUrl)

  const items = [
    { label: 'PWA activée',               ok: pwa.pwaEnabled,                  warn: false },
    { label: 'Manifest valide',            ok: manifestValid !== false,          loading: manifestValid === null },
    { label: 'HTTPS actif',               ok: isHttps,                          warn: true, failMsg: 'Requis pour PWA' },
    { label: 'Service Worker enregistré', ok: swRegistered !== false,            loading: swRegistered === null },
    { label: 'Icône configurée',          ok: hasIcon,                          warn: true, failMsg: 'Logo Branding utilisé par défaut' },
    { label: 'Splash screen',            ok: !!(pwa.splashUrl),                 warn: true, failMsg: 'Optionnel' },
  ] as Array<{ label: string; ok: boolean; loading?: boolean; warn?: boolean; failMsg?: string }>

  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
          {item.loading ? (
            <span className="w-5 h-5 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin flex-shrink-0" />
          ) : item.ok ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10" fill="#01B574" opacity=".15"/>
              <path d="M9 12l2 2 4-4" stroke="#01B574" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : item.warn ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10" fill="#FFB547" opacity=".15"/>
              <path d="M12 8v4M12 16h.01" stroke="#FFB547" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10" fill="#EE5D50" opacity=".15"/>
              <path d="M15 9l-6 6M9 9l6 6" stroke="#EE5D50" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
          <span className="text-sm flex-1" style={{ color: '#2B3674' }}>{item.label}</span>
          {!item.ok && !item.loading && item.failMsg && (
            <span className="text-xs" style={{ color: '#A3AED0' }}>{item.failMsg}</span>
          )}
        </div>
      ))}

      <div className="flex gap-3 pt-3">
        <a
          href="/api/manifest"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
          style={{ color: '#2B3674' }}
        >
          Voir le manifest
        </a>
        <a
          href={pwa.startUrl || '/carte'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl text-white transition hover:opacity-90"
          style={{ background: '#4318FF' }}
        >
          Tester la PWA
        </a>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PwaPage() {
  const [settings, setSettings] = useState<PwaSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/pwa')
      .then(r => r.json())
      .then(data => { setSettings(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function update<K extends keyof PwaSettings>(key: K, value: PwaSettings[K]) {
    setSettings(prev => prev ? { ...prev, [key]: value } : prev)
  }

  async function save() {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/pwa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setSettings(updated)
      toast.success('Paramètres PWA sauvegardés')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-5 max-w-4xl">
        <div className="skeleton h-8 w-64 rounded-xl" />
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl p-6" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
            <div className="skeleton h-4 w-32 mb-5 rounded" />
            <div className="space-y-3">
              <div className="skeleton h-10 rounded-xl" />
              <div className="skeleton h-10 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="max-w-4xl">
        <p className="text-red-500 text-sm">Impossible de charger les paramètres PWA. Vérifiez la migration DB.</p>
        <p className="text-xs mt-1" style={{ color: '#A3AED0' }}>
          Exécutez : <code className="bg-gray-100 px-1 rounded text-gray-700">npx prisma db push</code>
        </p>
      </div>
    )
  }

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition bg-white"
  const focusCls = "focus:ring-indigo-200"

  return (
    <div className="max-w-4xl space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black" style={{ color: '#2B3674' }}>PWA & Installation</h1>
          <p className="text-sm mt-0.5" style={{ color: '#A3AED0' }}>Configuration complète de l'application mobile installable</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition hover:opacity-90 disabled:opacity-50 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #4318FF 0%, #868CFF 100%)' }}
        >
          {saving ? (
            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sauvegarde…</>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              Sauvegarder
            </>
          )}
        </button>
      </div>

      {/* ── 1. Activation ── */}
      <SectionCard title="Activation" description="Permettre aux clients d'installer l'application">
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-semibold" style={{ color: '#2B3674' }}>Activer la PWA</p>
            <p className="text-xs mt-0.5" style={{ color: '#A3AED0' }}>Les clients peuvent installer l'app sur leur téléphone</p>
          </div>
          <Toggle checked={settings.pwaEnabled} onChange={v => update('pwaEnabled', v)} />
        </div>
      </SectionCard>

      {/* ── 2. Identité ── */}
      <SectionCard title="Identité" description="Nom et description affichés dans le launcher et sur l'écran d'accueil">
        <div className="grid sm:grid-cols-2 gap-4">
          <InputField label="Nom complet" hint="Ex: Woodiz Pizza 14 - Fidélité">
            <input
              type="text"
              value={settings.appName}
              onChange={e => update('appName', e.target.value)}
              className={`${inputCls} ${focusCls}`}
              style={{ color: '#2B3674' }}
              placeholder="Fidélité"
            />
          </InputField>

          <InputField label={`Nom court (${settings.shortName.length}/12)`} hint="Affiché sous l'icône sur l'écran d'accueil">
            <input
              type="text"
              value={settings.shortName}
              onChange={e => update('shortName', e.target.value.slice(0, 12))}
              className={`${inputCls} ${focusCls}`}
              style={{ color: '#2B3674' }}
              placeholder="Fidélité"
              maxLength={12}
            />
          </InputField>

          <div className="sm:col-span-2">
            <InputField label="Description">
              <textarea
                value={settings.description}
                onChange={e => update('description', e.target.value)}
                rows={2}
                className={`${inputCls} ${focusCls} resize-none`}
                style={{ color: '#2B3674' }}
                placeholder="Votre carte de fidélité numérique"
              />
            </InputField>
          </div>

          <InputField label="Page de départ" hint="Page affichée à l'ouverture de l'app">
            <select
              value={settings.startUrl}
              onChange={e => update('startUrl', e.target.value)}
              className={`${inputCls} ${focusCls}`}
              style={{ color: '#2B3674' }}
            >
              <option value="/carte">Carte fidélité (/carte)</option>
              <option value="/">Accueil (/)</option>
              <option value="/scanner">Scanner (/scanner)</option>
              <option value="/offres">Offres (/offres)</option>
            </select>
          </InputField>
        </div>
      </SectionCard>

      {/* ── 3. Apparence + Live preview ── */}
      <SectionCard title="Apparence PWA" description="Couleurs indépendantes de la carte fidélité — propres à l'app installée">
        <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-start">
          <div className="space-y-4">
            {/* Colors */}
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField
                label="Couleur du thème"
                hint="Barre navigateur et splash screen"
              >
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={settings.themeColor}
                    onChange={e => update('themeColor', e.target.value)}
                    className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5 flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={settings.themeColor}
                    onChange={e => update('themeColor', e.target.value)}
                    className={`${inputCls} ${focusCls} font-mono`}
                    style={{ color: '#2B3674' }}
                    placeholder="#0D0D0D"
                  />
                </div>
              </InputField>

              <InputField
                label="Couleur de fond"
                hint="Arrière-plan du splash screen"
              >
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={settings.backgroundColor}
                    onChange={e => update('backgroundColor', e.target.value)}
                    className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5 flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={settings.backgroundColor}
                    onChange={e => update('backgroundColor', e.target.value)}
                    className={`${inputCls} ${focusCls} font-mono`}
                    style={{ color: '#2B3674' }}
                    placeholder="#0D0D0D"
                  />
                </div>
              </InputField>
            </div>

            {/* Presets */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#A3AED0' }}>Presets rapides</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Nuit',    theme: '#0D0D0D', bg: '#0D0D0D' },
                  { label: 'Indigo',  theme: '#4318FF', bg: '#0a0520' },
                  { label: 'Lime',    theme: '#1a1a1a', bg: '#111' },
                  { label: 'Bois',    theme: '#3d2008', bg: '#2a1505' },
                  { label: 'Marine',  theme: '#1e3a5f', bg: '#111c2d' },
                  { label: 'Bordeaux',theme: '#5c0a2e', bg: '#2a0415' },
                ].map(p => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => { update('themeColor', p.theme); update('backgroundColor', p.bg) }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold hover:border-indigo-300 transition"
                    style={{ color: '#2B3674' }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full border border-gray-200" style={{ background: p.theme }} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Display & Orientation */}
            <div className="grid sm:grid-cols-2 gap-4">
              <InputField label="Mode d'affichage">
                <select
                  value={settings.display}
                  onChange={e => update('display', e.target.value)}
                  className={`${inputCls} ${focusCls}`}
                  style={{ color: '#2B3674' }}
                >
                  <option value="standalone">Standalone (recommandé)</option>
                  <option value="fullscreen">Plein écran</option>
                  <option value="minimal-ui">Minimal UI</option>
                </select>
              </InputField>

              <InputField label="Orientation">
                <select
                  value={settings.orientation}
                  onChange={e => update('orientation', e.target.value)}
                  className={`${inputCls} ${focusCls}`}
                  style={{ color: '#2B3674' }}
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Paysage</option>
                  <option value="any">Libre</option>
                </select>
              </InputField>
            </div>
          </div>

          {/* Live mockup */}
          <div className="flex justify-center lg:justify-end">
            <PhoneMockup
              themeColor={settings.themeColor}
              backgroundColor={settings.backgroundColor}
              appName={settings.appName}
              logoUrl={settings.logoUrl}
            />
          </div>
        </div>
      </SectionCard>

      {/* ── 4. Icônes & Splash ── */}
      <SectionCard title="Icônes & Splash" description="Assets visuels de l'application">
        <div className="space-y-5">
          <UploadField
            label="Logo app (512×512 min, PNG recommandé)"
            hint="Sans upload, le logo Branding est utilisé automatiquement"
            value={settings.logoUrl}
            onChange={v => update('logoUrl', v)}
          />

          {/* Icon previews */}
          {settings.logoUrl && (
            <div className="flex gap-4 items-end pt-2">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-gray-100 mb-1">
                  <Image src={settings.logoUrl} alt="icon 56" width={56} height={56} className="object-cover w-full h-full" unoptimized />
                </div>
                <p className="text-[9px]" style={{ color: '#A3AED0' }}>iOS (56px)</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 mb-1">
                  <Image src={settings.logoUrl} alt="icon 48" width={48} height={48} className="object-cover w-full h-full" unoptimized />
                </div>
                <p className="text-[9px]" style={{ color: '#A3AED0' }}>Android (48px)</p>
              </div>
              <div className="text-center">
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-gray-100 mb-1">
                  <Image src={settings.logoUrl} alt="icon 36" width={36} height={36} className="object-cover w-full h-full" unoptimized />
                </div>
                <p className="text-[9px]" style={{ color: '#A3AED0' }}>Favicon (36px)</p>
              </div>
            </div>
          )}

          <UploadField
            label="Favicon (onglet navigateur)"
            hint="Format .ico, .png ou .svg — 32×32 recommandé"
            value={settings.faviconUrl}
            onChange={v => update('faviconUrl', v)}
          />

          <UploadField
            label="Splash screen personnalisé (optionnel)"
            hint="Affiché 2-3s au lancement de l'app — 390×844px recommandé"
            value={settings.splashUrl}
            onChange={v => update('splashUrl', v)}
          />
        </div>
      </SectionCard>

      {/* ── 5. Installation ── */}
      <SectionCard title="Installation" description="Comportement de la bannière d'installation et expérience hors-ligne">
        <div className="space-y-5">
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-semibold" style={{ color: '#2B3674' }}>Bannière d'installation personnalisée</p>
              <p className="text-xs mt-0.5" style={{ color: '#A3AED0' }}>Afficher une invite d'installation au bon moment</p>
            </div>
            <Toggle
              checked={settings.installPromptEnabled}
              onChange={v => update('installPromptEnabled', v)}
            />
          </div>

          {settings.installPromptEnabled && (
            <InputField label="Délai avant affichage" hint="Temps de navigation avant de proposer l'installation">
              <select
                value={settings.installPromptDelay ?? ''}
                onChange={e => update('installPromptDelay', e.target.value ? Number(e.target.value) : null)}
                className={`${inputCls} ${focusCls}`}
                style={{ color: '#2B3674' }}
              >
                <option value="10">10 secondes</option>
                <option value="30">30 secondes (recommandé)</option>
                <option value="60">1 minute</option>
                <option value="">Jamais (désactivé)</option>
              </select>
            </InputField>
          )}

          <InputField
            label="Message hors-ligne"
            hint="Affiché quand le client n'a pas de connexion"
          >
            <input
              type="text"
              value={settings.offlineMessage}
              onChange={e => update('offlineMessage', e.target.value)}
              className={`${inputCls} ${focusCls}`}
              style={{ color: '#2B3674' }}
              placeholder="Vous êtes hors connexion. Reconnectez-vous pour scanner."
            />
          </InputField>
        </div>
      </SectionCard>

      {/* ── 6. Statut en temps réel ── */}
      <SectionCard title="Statut en temps réel" description="Vérification de la configuration PWA actuelle">
        <PwaStatusPanel pwa={settings} />
      </SectionCard>

      {/* ── Bottom save ── */}
      <div className="flex justify-end pb-4">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold transition hover:opacity-90 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #4318FF 0%, #868CFF 100%)' }}
        >
          {saving ? (
            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sauvegarde…</>
          ) : 'Sauvegarder les modifications'}
        </button>
      </div>

    </div>
  )
}
