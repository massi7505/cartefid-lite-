'use client'

import { useEffect, useState, useRef } from 'react'
import toast from 'react-hot-toast'

type Tab = 'programme' | 'carte'

const TABS: { key: Tab; label: string }[] = [
  { key: 'programme', label: 'Programme' },
  { key: 'carte',     label: 'Carte' },
]

interface Program {
  id: number
  name: string
  description?: string
  stampsRequired: number
  rewardLabel: string
  isActive: boolean
  cardColor1: string
  cardColor2: string
  accentColor: string
  cardIcon: string
  stampShape: string
  cardTextColor: string
  cardSubtitle: string
  cardNote?: string | null
  cardBgImageUrl?: string | null
  cardIconUrl?: string | null
  emailVerificationEnabled: boolean
  otpValidityMinutes: number
  rewardExpiryDays: number | null
  logoUrl?: string | null
}

const ICON_LIST = [
  '☕','🍕','🍔','🌮','🍱','🥐','🍰','🎂','🥤','🍹',
  '✂️','💈','💅','🧴','💊','🦷','👓','🌸','💐','🌿',
  '🚗','🏋️','⚽','🎮','📚','🎵','🛍️','🎁','⭐','🏆',
]

const PRESETS = [
  { label: 'Forêt',    c1: '#1A3526', c2: '#0F2318', a: '#3DD68C' },
  { label: 'Lime',     c1: '#1a2e00', c2: '#0f1a00', a: '#CCFF00' },
  { label: 'Nuit',     c1: '#1e1b4b', c2: '#0f0e2a', a: '#818cf8' },
  { label: 'Bordeaux', c1: '#4a0f1e', c2: '#2d0812', a: '#f87171' },
  { label: 'Océan',    c1: '#0c3547', c2: '#071e2d', a: '#38bdf8' },
  { label: 'Café',     c1: '#3d2008', c2: '#1f1004', a: '#f59e0b' },
  { label: 'Ardoise',  c1: '#1e293b', c2: '#0f172a', a: '#94a3b8' },
  { label: 'Rose',     c1: '#4a0030', c2: '#2d001c', a: '#f472b6' },
  { label: 'Or',       c1: '#2d1f00', c2: '#1a1200', a: '#fbbf24' },
  { label: 'Jade',     c1: '#003d2d', c2: '#001f17', a: '#6ee7b7' },
]

type StampShape = 'circle' | 'rounded' | 'square'

function getStampRadius(shape: StampShape) {
  if (shape === 'circle') return 'rounded-full'
  if (shape === 'square') return 'rounded-md'
  return 'rounded-xl'
}

// ── Card preview ─────────────────────────────────────────────────────────────
function CardPreview({ name, subtitle, icon, iconUrl, stamps, required, color1, color2, accent, shape, logoUrl, textColor, bgImageUrl }: {
  name: string; subtitle: string; icon: string; iconUrl?: string | null; stamps: number; required: number
  color1: string; color2: string; accent: string; shape: StampShape
  logoUrl?: string | null; textColor: string; bgImageUrl?: string | null
}) {
  const pct = Math.round((stamps / required) * 100)
  const cols = required <= 5 ? required : required <= 8 ? 4 : 5
  const radius = getStampRadius(shape)
  const tc = textColor || '#000000'

  return (
    <div className="rounded-3xl overflow-hidden shadow-2xl select-none relative"
      style={{ background: `linear-gradient(135deg,${color1} 0%,${color2} 100%)` }}>
      {/* Background image */}
      {bgImageUrl && (
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bgImageUrl} alt="" className="w-full h-full object-cover opacity-30"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        </div>
      )}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-1">
          <div className="flex items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={name} className="w-7 h-7 rounded-lg object-contain"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            ) : (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                style={{ background: 'rgba(255,255,255,0.15)' }}>{icon}</div>
            )}
            <div>
              <p className="text-xs leading-none" style={{ color: `${tc}80` }}>{subtitle || 'Carte Fidélité'}</p>
              <p className="font-bold text-xs leading-tight truncate max-w-[100px]" style={{ color: tc }}>{name || 'Mon Commerce'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-black text-xl leading-none" style={{ color: tc }}>{stamps}</p>
            <p className="text-xs" style={{ color: `${tc}60` }}>/ {required}</p>
          </div>
        </div>
        {/* Stamps */}
        <div className="px-4 py-3">
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: required }).map((_, i) => {
              const filled = i < stamps; const isLast = i === required - 1
              return (
                <div key={i} className={`aspect-square ${radius} flex items-center justify-center`}
                  style={
                    isLast
                      ? filled ? { background: accent } : { border: `1.5px dashed ${tc}30`, background: `${tc}08` }
                      : filled ? { background: `${tc}25` } : { background: `${tc}08`, border: `1px solid ${tc}20` }
                  }>
                  {isLast
                ? <span className="text-xs">🎁</span>
                : filled
                ? iconUrl
                  ? <img src={iconUrl} alt="" className="w-4 h-4 object-contain" />
                  : <span className="text-xs">{icon}</span>
                : null}
                </div>
              )
            })}
          </div>
        </div>
        {/* Progress */}
        <div className="px-4 pb-2">
          <div className="h-1 rounded-full" style={{ background: `${tc}15` }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `${tc}50` }} />
          </div>
        </div>
        <div className="px-4 pb-3 flex items-center justify-between">
          <span className="text-xs" style={{ color: `${tc}60` }}>Récompense</span>
          <span className="text-xs font-bold" style={{ color: tc }}>🎁 Offert</span>
        </div>
      </div>
    </div>
  )
}

function Toggle({ value, onChange, label, sublabel }: {
  value: boolean; onChange: (v: boolean) => void; label: string; sublabel?: string
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {sublabel && <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>}
      </div>
      <button type="button" onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${value ? 'bg-gray-900' : 'bg-gray-300'}`}>
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow ${value ? 'translate-x-7' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 mt-1">
      <svg className="flex-shrink-0 mt-0.5 text-blue-400" width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <p className="text-xs text-blue-700">{children}</p>
    </div>
  )
}

function UploadField({ label, hint, value, onUploaded, onRemove, accept }: {
  label: string; hint: string; value: string | null
  onUploaded: (url: string) => void; onRemove: () => void; accept: string
}) {
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File) {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error || 'Erreur upload')
      setUploading(false)
      return
    }
    const data = await res.json()
    onUploaded(data.url)
    toast.success('Fichier uploadé !')
    setUploading(false)
  }

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt={label} className="w-full h-28 object-cover"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
      )}
      <div className="flex items-center gap-3 p-3 bg-gray-50">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800">{label}</p>
          <p className="text-xs text-gray-400 truncate">{value ? value.split('/').pop() : hint}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {value && (
            <button type="button" onClick={onRemove}
              className="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-xs font-medium hover:bg-red-50 transition">
              Supprimer
            </button>
          )}
          {/* label wraps input — guaranteed to open file picker on all browsers */}
          <label className={`px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:border-gray-400 transition cursor-pointer select-none ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            {uploading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin inline-block" />
                Upload...
              </span>
            ) : value ? 'Changer' : 'Choisir'}
            <input
              type="file"
              accept={accept}
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) handleFile(f)
              }}
            />
          </label>
        </div>
      </div>
    </div>
  )
}

const INPUT = "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"

export default function ProgrammePage() {
  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('programme')

  const [prog, setProg] = useState({
    name: '', description: '', stampsRequired: 10, rewardLabel: '',
    isActive: true, rewardExpiryDays: null as number | null,
    emailVerificationEnabled: false, otpValidityMinutes: 15,
  })
  const [savingProg, setSavingProg] = useState(false)

  const [carte, setCarte] = useState({
    cardColor1: '#1a2e00', cardColor2: '#0f1a00', accentColor: '#CCFF00',
    cardIcon: '⭐', stampShape: 'rounded' as StampShape,
    cardTextColor: '#ffffff',
    cardSubtitle: 'Carte Fidélité',
    cardNote: '',
    cardBgImageUrl: null as string | null,
    cardIconUrl: null as string | null,
  })
  const [savingCarte, setSavingCarte] = useState(false)

  useEffect(() => {
    fetch('/api/admin/programs/active').then(r => r.json()).then(p => {
      if (p.id) {
        setProgram(p)
        setProg({
          name: p.name, description: p.description ?? '',
          stampsRequired: p.stampsRequired, rewardLabel: p.rewardLabel,
          isActive: p.isActive, rewardExpiryDays: p.rewardExpiryDays ?? null,
          emailVerificationEnabled: p.emailVerificationEnabled ?? false,
          otpValidityMinutes: p.otpValidityMinutes ?? 15,
        })
        setCarte({
          cardColor1: p.cardColor1 ?? '#1a2e00', cardColor2: p.cardColor2 ?? '#0f1a00',
          accentColor: p.accentColor ?? '#CCFF00', cardIcon: p.cardIcon ?? '⭐',
          stampShape: (p.stampShape ?? 'rounded') as StampShape,
          cardTextColor: p.cardTextColor ?? '#ffffff',
          cardSubtitle: p.cardSubtitle ?? 'Carte Fidélité',
          cardNote: p.cardNote ?? '',
          cardBgImageUrl: p.cardBgImageUrl ?? null,
          cardIconUrl: p.cardIconUrl ?? null,
        })
      }
      setLoading(false)
    })
  }, [])

  async function patch(data: Record<string, unknown>) {
    if (!program) return false
    const res = await fetch(`/api/admin/programs/${program.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.ok
  }

  async function saveProg(e: React.FormEvent) {
    e.preventDefault()
    setSavingProg(true)
    const ok = await patch({ ...prog })
    if (ok) toast.success('Programme mis à jour !'); else toast.error('Erreur')
    setSavingProg(false)
  }

  async function saveCarte(e: React.FormEvent) {
    e.preventDefault()
    setSavingCarte(true)
    const ok = await patch({ ...carte, cardBgImageUrl: carte.cardBgImageUrl || null, cardIconUrl: carte.cardIconUrl || null })
    if (ok) toast.success('Carte mise à jour !'); else toast.error('Erreur')
    setSavingCarte(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const previewStamps = Math.ceil(prog.stampsRequired * 0.6)

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black" style={{ color: '#2B3674' }}>Programme de fidélité</h1>
        <p className="text-sm mt-1" style={{ color: '#A3AED0' }}>Configuration et personnalisation</p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition -mb-px ${
              tab === t.key ? 'border-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
            style={tab === t.key ? { color: '#4318FF' } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Programme ── */}
      {tab === 'programme' && (
        <form onSubmit={saveProg}>
          <div className="bg-white rounded-2xl p-6 space-y-5" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du programme</label>
              <input type="text" value={prog.name} onChange={e => setProg(f => ({ ...f, name: e.target.value }))}
                className={INPUT} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description <span className="text-gray-400 font-normal">(optionnel)</span></label>
              <textarea value={prog.description} onChange={e => setProg(f => ({ ...f, description: e.target.value }))}
                rows={2} className={`${INPUT} resize-none`} placeholder="Ex: Bienvenue dans notre programme de fidélité…" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tampons requis : <span className="font-black text-gray-900">{prog.stampsRequired}</span>
              </label>
              <input type="range" min={3} max={20} value={prog.stampsRequired}
                onChange={e => setProg(f => ({ ...f, stampsRequired: Number(e.target.value) }))}
                className="w-full accent-gray-900" />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>3</span><span>20</span></div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Récompense offerte</label>
              <input type="text" value={prog.rewardLabel} onChange={e => setProg(f => ({ ...f, rewardLabel: e.target.value }))}
                placeholder="Ex: Un café offert, -10%…" className={INPUT} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expiration de la récompense</label>
              <div className="flex flex-wrap gap-2">
                {[{ l: 'Jamais', v: null }, { l: '30j', v: 30 }, { l: '90j', v: 90 }, { l: '180j', v: 180 }, { l: '1 an', v: 360 }].map(opt => (
                  <button key={String(opt.v)} type="button"
                    onClick={() => setProg(f => ({ ...f, rewardExpiryDays: opt.v }))}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                      prog.rewardExpiryDays === opt.v ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >{opt.l}</button>
                ))}
              </div>
            </div>

            <Toggle value={prog.isActive} onChange={v => setProg(f => ({ ...f, isActive: v }))}
              label="Programme actif" sublabel="Les clients peuvent recevoir des tampons" />

            <div className="border-t border-gray-100 pt-5 space-y-4">
              <p className="text-sm font-semibold text-gray-700">Sécurité des comptes</p>
              <Toggle value={prog.emailVerificationEnabled}
                onChange={v => setProg(f => ({ ...f, emailVerificationEnabled: v }))}
                label="Validation email à l'inscription"
                sublabel="Les nouveaux clients doivent vérifier leur email" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Validité code OTP : <span className="font-black">{prog.otpValidityMinutes} min</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[5, 10, 15, 30, 60].map(m => (
                    <button key={m} type="button" onClick={() => setProg(f => ({ ...f, otpValidityMinutes: m }))}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                        prog.otpValidityMinutes === m ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                    >{m} min</button>
                  ))}
                </div>
              </div>
            </div>

            <button type="submit" disabled={savingProg}
              className="w-full text-white py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 hover:opacity-90" style={{ background: '#4318FF' }}>
              {savingProg ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      )}

      {/* ── Carte ── */}
      {tab === 'carte' && (
        <form onSubmit={saveCarte}>
          <div className="grid lg:grid-cols-[1fr_180px] gap-5 items-start">

            {/* Controls */}
            <div className="bg-white rounded-2xl p-6 space-y-6" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>

              {/* Colors */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Couleurs du dégradé</p>
                <div className="flex gap-3">
                  {[
                    { key: 'cardColor1' as const, label: 'Fond 1' },
                    { key: 'cardColor2' as const, label: 'Fond 2' },
                    { key: 'accentColor' as const, label: 'Accent' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex-1 cursor-pointer">
                      <span className="block text-xs text-gray-500 mb-1.5">{label}</span>
                      <div className="flex items-center gap-2 p-2.5 border border-gray-200 rounded-xl hover:border-gray-400 transition">
                        <input type="color" value={carte[key]}
                          onChange={e => setCarte(f => ({ ...f, [key]: e.target.value }))}
                          className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent p-0" />
                        <span className="text-xs font-mono text-gray-400 truncate">{carte[key]}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Text color */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1.5">Couleur du texte</p>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl hover:border-gray-400 transition cursor-pointer flex-1">
                    <input type="color" value={carte.cardTextColor}
                      onChange={e => setCarte(f => ({ ...f, cardTextColor: e.target.value }))}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Texte de la carte</p>
                      <p className="text-xs font-mono text-gray-400">{carte.cardTextColor}</p>
                    </div>
                  </label>
                  <div className="flex flex-col gap-2">
                    <button type="button" onClick={() => setCarte(f => ({ ...f, cardTextColor: '#ffffff' }))}
                      className="w-9 h-9 rounded-xl border-2 border-gray-200 hover:border-gray-400 transition flex items-center justify-center text-xs font-bold"
                      style={{ background: '#000', color: '#fff' }}>A</button>
                    <button type="button" onClick={() => setCarte(f => ({ ...f, cardTextColor: '#000000' }))}
                      className="w-9 h-9 rounded-xl border-2 border-gray-200 hover:border-gray-400 transition flex items-center justify-center text-xs font-bold"
                      style={{ background: '#fff', color: '#000' }}>A</button>
                  </div>
                </div>
                <Hint>
                  Si votre carte a un fond foncé, choisissez du texte blanc. Si le fond est clair, choisissez du texte noir.
                  Le texte &quot;Carte Fidélité&quot; et tous les chiffres utilisent cette couleur.
                </Hint>
              </div>

              {/* Presets */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Thèmes</p>
                <div className="grid grid-cols-5 gap-2">
                  {PRESETS.map(t => (
                    <button key={t.label} type="button"
                      onClick={() => setCarte(f => ({ ...f, cardColor1: t.c1, cardColor2: t.c2, accentColor: t.a, cardTextColor: '#ffffff' }))}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition">
                      <span className="w-6 h-6 rounded-full" style={{ background: `linear-gradient(135deg,${t.c1},${t.c2})`, border: `2px solid ${t.a}50` }} />
                      <span className="text-xs text-gray-500 truncate w-full text-center">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background image */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Image de fond <span className="text-gray-400 font-normal text-xs">(optionnel)</span></p>
                <UploadField
                  label="Image de fond de la carte"
                  hint="PNG, JPG ou WebP. S'affiche en superposition sur le dégradé. Max 5 Mo."
                  value={carte.cardBgImageUrl}
                  onUploaded={url => setCarte(f => ({ ...f, cardBgImageUrl: url }))}
                  onRemove={() => setCarte(f => ({ ...f, cardBgImageUrl: null }))}
                  accept="image/png,image/jpeg,image/webp"
                />
                <Hint>
                  L&apos;image sera affichée avec 30% d&apos;opacité derrière les tampons. Idéal pour ajouter un logo, une texture ou un motif discret.
                  Pensez à ajuster la couleur du texte si l&apos;image rend le texte illisible.
                </Hint>
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Sous-titre de la carte</label>
                <input type="text" value={carte.cardSubtitle}
                  onChange={e => setCarte(f => ({ ...f, cardSubtitle: e.target.value }))}
                  placeholder="Carte Fidélité"
                  className={INPUT} />
                <Hint>
                  Ce texte s&apos;affiche en petit au-dessus du nom de votre commerce sur la carte. Par défaut : &quot;Carte Fidélité&quot;.
                  Vous pouvez le personnaliser : &quot;Carte Avantages&quot;, &quot;Club VIP&quot;, etc.
                </Hint>
              </div>

              {/* Card note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Message sous la carte <span className="text-gray-400 font-normal">(optionnel)</span>
                </label>
                <textarea value={carte.cardNote ?? ''}
                  onChange={e => setCarte(f => ({ ...f, cardNote: e.target.value }))}
                  rows={3} className={`${INPUT} resize-none`}
                  placeholder="Ex: Valable du lundi au samedi. Tampons non cumulables avec d'autres offres." />
                <Hint>
                  Ce message est affiché sous la carte sur le compte de vos clients. Utilisez-le pour préciser
                  les conditions du programme : jours valables, exclusions, infos pratiques, etc.
                </Hint>
              </div>

              {/* Icon */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Icône{' '}
                  {carte.cardIconUrl
                    ? <img src={carte.cardIconUrl} alt="" className="inline w-5 h-5 object-contain align-middle ml-1" />
                    : <span className="ml-1 text-xl">{carte.cardIcon}</span>
                  }
                </p>

                {/* Upload SVG / GIF */}
                <div className="mb-4 p-3 rounded-xl border border-dashed border-gray-200 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Icône personnalisée (SVG, GIF animé)</p>
                  {carte.cardIconUrl ? (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center p-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={carte.cardIconUrl} alt="Icône" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 truncate">{carte.cardIconUrl.split('/').pop()}</p>
                        <p className="text-xs text-gray-400">Utilisée à la place de l&apos;emoji</p>
                      </div>
                      <button type="button"
                        onClick={() => setCarte(f => ({ ...f, cardIconUrl: null }))}
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition flex-shrink-0">
                        Supprimer
                      </button>
                    </div>
                  ) : (
                    <UploadField
                      label="Icône SVG ou GIF"
                      hint="SVG vectoriel ou GIF animé · max 5 Mo"
                      value={null}
                      onUploaded={url => setCarte(f => ({ ...f, cardIconUrl: url }))}
                      onRemove={() => setCarte(f => ({ ...f, cardIconUrl: null }))}
                      accept="image/svg+xml,image/gif"
                    />
                  )}
                </div>

                {/* Emoji fallback — disabled if iconUrl is set */}
                <div className={carte.cardIconUrl ? 'opacity-40 pointer-events-none' : ''}>
                  <p className="text-xs text-gray-400 mb-2">Ou choisir un emoji :</p>
                  <div className="grid grid-cols-10 gap-1.5 mb-3">
                    {ICON_LIST.map(ic => (
                      <button key={ic} type="button" onClick={() => setCarte(f => ({ ...f, cardIcon: ic }))}
                        className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition hover:bg-gray-100 ${
                          carte.cardIcon === ic ? 'bg-gray-900 ring-2 ring-gray-900 ring-offset-1' : 'bg-gray-50'
                        }`}
                      >{ic}</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">Emoji personnalisé :</span>
                    <input type="text" value={carte.cardIcon}
                      onChange={e => { const v = e.target.value; if (v) setCarte(f => ({ ...f, cardIcon: v.slice(-2) })) }}
                      className="w-14 px-2 py-1.5 text-center text-lg rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900" />
                  </div>
                </div>
              </div>

              {/* Stamp shape */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Forme des tampons</p>
                <div className="flex gap-3">
                  {([
                    { key: 'circle' as const, label: 'Rond', preview: 'rounded-full' },
                    { key: 'rounded' as const, label: 'Arrondi', preview: 'rounded-xl' },
                    { key: 'square' as const, label: 'Carré', preview: 'rounded-md' },
                  ] as { key: StampShape; label: string; preview: string }[]).map(s => (
                    <button key={s.key} type="button" onClick={() => setCarte(f => ({ ...f, stampShape: s.key }))}
                      className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition ${
                        carte.stampShape === s.key ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <div className={`w-8 h-8 ${s.preview} border-2 border-gray-300 flex items-center justify-center`}
                        style={{ background: carte.stampShape === s.key ? '#111827' : 'transparent' }}>
                        {carte.stampShape === s.key && <span className="text-white text-xs">{carte.cardIcon}</span>}
                      </div>
                      <span className="text-xs font-medium text-gray-600">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={savingCarte}
                className="w-full text-white py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 hover:opacity-90" style={{ background: '#4318FF' }}>
                {savingCarte ? 'Sauvegarde...' : 'Sauvegarder la carte'}
              </button>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Aperçu</p>
              <CardPreview
                name={prog.name} subtitle={carte.cardSubtitle} icon={carte.cardIcon}
                iconUrl={carte.cardIconUrl}
                stamps={previewStamps} required={prog.stampsRequired}
                color1={carte.cardColor1} color2={carte.cardColor2} accent={carte.accentColor}
                shape={carte.stampShape} logoUrl={program?.logoUrl}
                textColor={carte.cardTextColor} bgImageUrl={carte.cardBgImageUrl}
              />
              {carte.cardNote && (
                <div className="p-3 rounded-xl bg-gray-100 text-xs text-gray-600">
                  {carte.cardNote}
                </div>
              )}
              <p className="text-xs text-gray-400 text-center">Aperçu carte client</p>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
