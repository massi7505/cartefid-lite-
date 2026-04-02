'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

// ── Types ─────────────────────────────────────────────────────────────────────
interface ThemeVars {
  bgMain: string; bgSurface: string; bgSurfaceBorder: string
  headerBg: string; headerText: string; headerIcon: string
  avatarBg: string; logoAccent: string
  bannerBg: string; bannerBorder: string; bannerIconBg: string
  bannerTextTitle: string; bannerTextSub: string
  statsBg: string; statsBorder: string; statsValue: string
  statsLabel: string; statsAccent: string
  ctaBg: string; ctaBgHover: string; ctaText: string; ctaSubtext: string
  textPrimary: string; textSecondary: string; textMuted: string; textGreeting: string
}

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT: ThemeVars = {
  bgMain: '#0D0D0D', bgSurface: '#141414', bgSurfaceBorder: 'rgba(255,255,255,0.06)',
  headerBg: '#111111', headerText: '#FFFFFF', headerIcon: 'rgba(255,255,255,0.6)',
  avatarBg: '#CCFF00', logoAccent: '#CCFF00',
  bannerBg: 'rgba(123,47,190,0.18)', bannerBorder: 'rgba(123,47,190,0.3)',
  bannerIconBg: 'rgba(123,47,190,0.3)', bannerTextTitle: '#FFFFFF',
  bannerTextSub: 'rgba(255,255,255,0.5)',
  statsBg: '#141414', statsBorder: 'rgba(255,255,255,0.06)',
  statsValue: '#FFFFFF', statsLabel: 'rgba(255,255,255,0.4)', statsAccent: '#CCFF00',
  ctaBg: '#CCFF00', ctaBgHover: '#B8E600', ctaText: '#000000',
  ctaSubtext: 'rgba(255,255,255,0.3)',
  textPrimary: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.4)', textGreeting: 'rgba(255,255,255,0.4)',
}

// ── Presets ───────────────────────────────────────────────────────────────────
const PRESETS: Record<string, ThemeVars> = {
  'Stampy': { ...DEFAULT },
  'Woodiz Pizza': {
    bgMain: '#1A0F00', bgSurface: '#251500', bgSurfaceBorder: 'rgba(255,160,0,0.15)',
    headerBg: '#1A0F00', headerText: '#FFF8F0', headerIcon: 'rgba(255,200,100,0.7)',
    avatarBg: '#FF6B00', logoAccent: '#FF6B00',
    bannerBg: 'rgba(255,107,0,0.15)', bannerBorder: 'rgba(255,107,0,0.3)',
    bannerIconBg: 'rgba(255,107,0,0.25)', bannerTextTitle: '#FFF8F0',
    bannerTextSub: 'rgba(255,220,180,0.7)',
    statsBg: '#251500', statsBorder: 'rgba(255,160,0,0.15)',
    statsValue: '#FFF8F0', statsLabel: 'rgba(255,200,120,0.6)', statsAccent: '#FF6B00',
    ctaBg: '#FF6B00', ctaBgHover: '#E55A00', ctaText: '#FFFFFF',
    ctaSubtext: 'rgba(255,220,180,0.5)',
    textPrimary: '#FFF8F0', textSecondary: 'rgba(255,230,200,0.8)',
    textMuted: 'rgba(255,200,150,0.5)', textGreeting: 'rgba(255,200,150,0.5)',
  },
  'Nuit Bleue': {
    bgMain: '#070B1A', bgSurface: '#0D1428', bgSurfaceBorder: 'rgba(100,150,255,0.12)',
    headerBg: '#080C1E', headerText: '#E8EEFF', headerIcon: 'rgba(150,180,255,0.7)',
    avatarBg: '#4F8EFF', logoAccent: '#4F8EFF',
    bannerBg: 'rgba(79,142,255,0.12)', bannerBorder: 'rgba(79,142,255,0.25)',
    bannerIconBg: 'rgba(79,142,255,0.2)', bannerTextTitle: '#E8EEFF',
    bannerTextSub: 'rgba(180,200,255,0.7)',
    statsBg: '#0D1428', statsBorder: 'rgba(100,150,255,0.12)',
    statsValue: '#E8EEFF', statsLabel: 'rgba(150,180,255,0.5)', statsAccent: '#4F8EFF',
    ctaBg: '#4F8EFF', ctaBgHover: '#3A78F0', ctaText: '#FFFFFF',
    ctaSubtext: 'rgba(150,180,255,0.5)',
    textPrimary: '#E8EEFF', textSecondary: 'rgba(180,200,255,0.8)',
    textMuted: 'rgba(150,180,255,0.5)', textGreeting: 'rgba(150,180,255,0.5)',
  },
  'Bordeaux': {
    bgMain: '#130008', bgSurface: '#1E0010', bgSurfaceBorder: 'rgba(180,0,60,0.2)',
    headerBg: '#130008', headerText: '#FFE8EE', headerIcon: 'rgba(255,150,180,0.7)',
    avatarBg: '#C0003A', logoAccent: '#C0003A',
    bannerBg: 'rgba(192,0,58,0.15)', bannerBorder: 'rgba(192,0,58,0.3)',
    bannerIconBg: 'rgba(192,0,58,0.25)', bannerTextTitle: '#FFE8EE',
    bannerTextSub: 'rgba(255,180,200,0.7)',
    statsBg: '#1E0010', statsBorder: 'rgba(180,0,60,0.2)',
    statsValue: '#FFE8EE', statsLabel: 'rgba(255,150,180,0.5)', statsAccent: '#FF4D7A',
    ctaBg: '#C0003A', ctaBgHover: '#A0002F', ctaText: '#FFFFFF',
    ctaSubtext: 'rgba(255,180,200,0.5)',
    textPrimary: '#FFE8EE', textSecondary: 'rgba(255,200,215,0.8)',
    textMuted: 'rgba(255,150,180,0.5)', textGreeting: 'rgba(255,150,180,0.5)',
  },
  'Forêt': {
    bgMain: '#070F07', bgSurface: '#0D1A0D', bgSurfaceBorder: 'rgba(50,180,80,0.12)',
    headerBg: '#070F07', headerText: '#E8F5E8', headerIcon: 'rgba(120,200,130,0.7)',
    avatarBg: '#2DB84B', logoAccent: '#2DB84B',
    bannerBg: 'rgba(45,184,75,0.12)', bannerBorder: 'rgba(45,184,75,0.25)',
    bannerIconBg: 'rgba(45,184,75,0.2)', bannerTextTitle: '#E8F5E8',
    bannerTextSub: 'rgba(160,230,170,0.7)',
    statsBg: '#0D1A0D', statsBorder: 'rgba(50,180,80,0.12)',
    statsValue: '#E8F5E8', statsLabel: 'rgba(120,200,130,0.5)', statsAccent: '#2DB84B',
    ctaBg: '#2DB84B', ctaBgHover: '#23993D', ctaText: '#FFFFFF',
    ctaSubtext: 'rgba(160,230,170,0.5)',
    textPrimary: '#E8F5E8', textSecondary: 'rgba(180,230,185,0.8)',
    textMuted: 'rgba(120,200,130,0.5)', textGreeting: 'rgba(120,200,130,0.5)',
  },
}

// ── Tab config ────────────────────────────────────────────────────────────────
type TabKey = 'structure' | 'header' | 'banner' | 'stats' | 'cta' | 'text'
const TABS: Array<{ key: TabKey; label: string; fields: Array<{ key: keyof ThemeVars; label: string }> }> = [
  { key: 'structure', label: 'Structure', fields: [
    { key: 'bgMain', label: 'Fond principal' },
    { key: 'bgSurface', label: 'Fond des blocs' },
    { key: 'bgSurfaceBorder', label: 'Bordures des blocs' },
  ]},
  { key: 'header', label: 'Header', fields: [
    { key: 'headerBg', label: 'Fond header / sidebar' },
    { key: 'headerText', label: 'Texte header' },
    { key: 'headerIcon', label: 'Icônes header' },
    { key: 'avatarBg', label: 'Avatar utilisateur' },
    { key: 'logoAccent', label: 'Accent logo' },
  ]},
  { key: 'banner', label: 'Bannière', fields: [
    { key: 'bannerBg', label: 'Fond bannière récompense' },
    { key: 'bannerBorder', label: 'Bordure bannière' },
    { key: 'bannerIconBg', label: 'Fond icône cadeau' },
    { key: 'bannerTextTitle', label: 'Titre bannière' },
    { key: 'bannerTextSub', label: 'Sous-titre bannière' },
  ]},
  { key: 'stats', label: 'Stats', fields: [
    { key: 'statsBg', label: 'Fond bloc stats' },
    { key: 'statsBorder', label: 'Bordure bloc stats' },
    { key: 'statsValue', label: 'Chiffres (Objectif, Récompenses)' },
    { key: 'statsLabel', label: 'Labels (Tampons, Objectif…)' },
    { key: 'statsAccent', label: 'Accent (valeur tampons)' },
  ]},
  { key: 'cta', label: 'Bouton CTA', fields: [
    { key: 'ctaBg', label: 'Fond bouton' },
    { key: 'ctaBgHover', label: 'Fond survol' },
    { key: 'ctaText', label: 'Texte bouton' },
    { key: 'ctaSubtext', label: 'Texte sous le bouton' },
  ]},
  { key: 'text', label: 'Textes', fields: [
    { key: 'textPrimary', label: 'Texte principal' },
    { key: 'textSecondary', label: 'Texte secondaire' },
    { key: 'textMuted', label: 'Texte discret' },
    { key: 'textGreeting', label: '"Bonjour" (salutation)' },
  ]},
]

// ── Utility: extract hex from any CSS color ───────────────────────────────────
function toHex(val: string): string {
  if (val.startsWith('#')) return val.slice(0, 7)
  const m = val.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (m) {
    return '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('')
  }
  return '#000000'
}

// ── ColorRow component ────────────────────────────────────────────────────────
function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-700 flex-1 min-w-0 truncate">{label}</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="relative">
          <input
            type="color"
            value={toHex(value)}
            onChange={e => onChange(e.target.value)}
            className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0.5"
            style={{ background: 'transparent' }}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-36 text-xs font-mono border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          spellCheck={false}
        />
      </div>
    </div>
  )
}

// ── Live Preview ──────────────────────────────────────────────────────────────
function ThemePreview({ t }: { t: ThemeVars }) {
  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Aperçu live</p>
      <div
        className="w-[260px] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-gray-800 flex-shrink-0"
        style={{ background: t.bgMain }}
      >
        {/* Fake status bar */}
        <div className="px-4 pt-2 pb-1 flex justify-between items-center" style={{ background: t.headerBg }}>
          <span className="text-[9px] font-bold" style={{ color: t.headerText }}>9:41</span>
          <div className="flex gap-1">
            {[3,4,5].map(i => <div key={i} className="w-0.5 rounded-sm" style={{ height: i*2, background: t.headerIcon }} />)}
            <div className="w-3 h-1.5 rounded-sm border ml-1" style={{ borderColor: t.headerIcon }}>
              <div className="w-2/3 h-full rounded-sm" style={{ background: t.headerIcon }} />
            </div>
          </div>
        </div>

        {/* Header bar */}
        <div className="flex items-center justify-between px-3 py-2" style={{ background: t.headerBg, borderBottom: `1px solid ${t.bgSurfaceBorder}` }}>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md flex items-center justify-center font-black text-[9px]" style={{ background: t.logoAccent, color: t.ctaText }}>S</div>
            <span className="text-[10px] font-bold" style={{ color: t.headerText }}>Stampy</span>
          </div>
          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="flex flex-col gap-0.5">
              {[0,1,2].map(i => <div key={i} className="w-2.5 h-px rounded" style={{ background: t.headerIcon }} />)}
            </div>
          </div>
        </div>

        {/* Greeting */}
        <div className="px-3 pt-3 pb-1">
          <p className="text-[9px]" style={{ color: t.textGreeting }}>Bonjour</p>
          <p className="text-[12px] font-bold leading-tight" style={{ color: t.textPrimary }}>Marie D.</p>
        </div>

        {/* Reward banner */}
        <div className="mx-3 mt-2 mb-2 rounded-xl p-2 flex items-center gap-2" style={{ background: t.bannerBg, border: `1px solid ${t.bannerBorder}` }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm" style={{ background: t.bannerIconBg }}>🎁</div>
          <div>
            <p className="text-[9px] font-semibold leading-tight" style={{ color: t.bannerTextTitle }}>1 récompense disponible</p>
            <p className="text-[8px] leading-tight" style={{ color: t.bannerTextSub }}>Présentez votre carte en caisse</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-1.5 px-3 mb-2">
          {[
            { label: 'Tampons', value: '6', accent: true },
            { label: 'Objectif', value: '10', accent: false },
            { label: 'Récompenses', value: '1', accent: false },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-2 text-center" style={{ background: t.statsBg, border: `1px solid ${t.statsBorder}` }}>
              <p className="text-[12px] font-black" style={{ color: s.accent ? t.statsAccent : t.statsValue }}>{s.value}</p>
              <p className="text-[7px]" style={{ color: t.statsLabel }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Loyalty card placeholder — EXCLUDED from theme */}
        <div className="mx-3 mb-2 rounded-2xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <p className="text-[8px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Carte fidélité (non thématisée)</p>
        </div>

        {/* CTA */}
        <div className="px-3 pb-4">
          <button className="w-full py-2.5 rounded-xl font-bold text-[10px] flex items-center justify-center gap-1.5" style={{ background: t.ctaBg, color: t.ctaText }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2.5"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2.5"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2.5"/><rect x="5" y="5" width="3" height="3" fill="currentColor"/><rect x="16" y="5" width="3" height="3" fill="currentColor"/><rect x="5" y="16" width="3" height="3" fill="currentColor"/></svg>
            Présenter ma carte
          </button>
          <p className="text-center text-[7px] mt-1" style={{ color: t.ctaSubtext }}>5 tampons pour votre récompense</p>
        </div>
      </div>
    </div>
  )
}

// ── Export CSS utility ────────────────────────────────────────────────────────
function buildCssVars(t: ThemeVars): string {
  return `:root {\n` + [
    `  --bg-main: ${t.bgMain};`,
    `  --bg-surface: ${t.bgSurface};`,
    `  --bg-surface-border: ${t.bgSurfaceBorder};`,
    `  --header-bg: ${t.headerBg};`,
    `  --header-text: ${t.headerText};`,
    `  --header-icon: ${t.headerIcon};`,
    `  --avatar-bg: ${t.avatarBg};`,
    `  --logo-accent: ${t.logoAccent};`,
    `  --banner-bg: ${t.bannerBg};`,
    `  --banner-border: ${t.bannerBorder};`,
    `  --banner-icon-bg: ${t.bannerIconBg};`,
    `  --banner-text-title: ${t.bannerTextTitle};`,
    `  --banner-text-sub: ${t.bannerTextSub};`,
    `  --stats-bg: ${t.statsBg};`,
    `  --stats-border: ${t.statsBorder};`,
    `  --stats-value: ${t.statsValue};`,
    `  --stats-label: ${t.statsLabel};`,
    `  --stats-accent: ${t.statsAccent};`,
    `  --cta-bg: ${t.ctaBg};`,
    `  --cta-bg-hover: ${t.ctaBgHover};`,
    `  --cta-text: ${t.ctaText};`,
    `  --cta-subtext: ${t.ctaSubtext};`,
    `  --text-primary: ${t.textPrimary};`,
    `  --text-secondary: ${t.textSecondary};`,
    `  --text-muted: ${t.textMuted};`,
    `  --text-greeting: ${t.textGreeting};`,
  ].join('\n') + '\n}'
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ThemePage() {
  const [theme, setTheme] = useState<ThemeVars>(DEFAULT)
  const [activeTab, setActiveTab] = useState<TabKey>('structure')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchTheme = useCallback(async () => {
    const res = await fetch('/api/theme')
    if (res.ok) {
      const data = await res.json()
      setTheme({ ...DEFAULT, ...data })
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchTheme() }, [fetchTheme])

  function set(key: keyof ThemeVars, value: string) {
    setTheme(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(theme),
      })
      if (res.ok) {
        toast.success('Thème sauvegardé !')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur lors de la sauvegarde')
      }
    } finally {
      setSaving(false)
    }
  }

  function handleExportCSS() {
    const css = buildCssVars(theme)
    navigator.clipboard.writeText(css).then(() => {
      toast.success('CSS copié dans le presse-papier !')
    }).catch(() => {
      toast.error('Impossible de copier')
    })
  }

  const currentTab = TABS.find(t => t.key === activeTab)!

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4318FF transparent #4318FF #4318FF' }} />
      </div>
    )
  }

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black" style={{ color: '#2B3674' }}>Thème & Apparence</h1>
          <p className="text-sm mt-0.5" style={{ color: '#A3AED0' }}>Personnalisez les couleurs de l&apos;interface client</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSS}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            Copier CSS
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition hover:opacity-90"
            style={{ background: '#4318FF' }}
          >
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Presets */}
      <div className="bg-white rounded-2xl p-4 mb-4" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#A3AED0' }}>Palettes prédéfinies</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PRESETS).map(([name, preset]) => (
            <button
              key={name}
              onClick={() => setTheme(preset)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:border-indigo-300 hover:bg-indigo-50 transition"
              style={{ color: '#2B3674' }}
            >
              <div className="flex gap-0.5">
                <div className="w-3 h-3 rounded-full" style={{ background: preset.bgMain }} />
                <div className="w-3 h-3 rounded-full" style={{ background: preset.statsAccent }} />
                <div className="w-3 h-3 rounded-full" style={{ background: preset.headerBg }} />
              </div>
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Main: pickers + preview */}
      <div className="flex gap-4 items-start flex-wrap lg:flex-nowrap">

        {/* Color pickers panel */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-gray-100 px-4 pt-4 gap-1 scrollbar-none">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex-shrink-0 px-4 py-2 rounded-t-xl text-sm font-semibold transition whitespace-nowrap"
                  style={activeTab === tab.key
                    ? { background: '#EEF2FF', color: '#4318FF', borderBottom: '2px solid #4318FF' }
                    : { color: '#A3AED0' }
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Fields */}
            <div className="p-5">
              {currentTab.fields.map(field => (
                <ColorRow
                  key={field.key}
                  label={field.label}
                  value={theme[field.key]}
                  onChange={v => set(field.key, v)}
                />
              ))}
            </div>

            {/* Variable name reference */}
            <div className="px-5 pb-4">
              <p className="text-xs font-semibold text-gray-400 mb-2">Variables CSS correspondantes</p>
              <div className="flex flex-wrap gap-1.5">
                {currentTab.fields.map(f => {
                  const cssVar = '--' + f.key.replace(/([A-Z])/g, '-$1').toLowerCase()
                  return (
                    <code key={f.key} className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded font-mono border border-gray-100">
                      {cssVar}
                    </code>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="bg-white rounded-2xl p-6 flex-shrink-0" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
          <ThemePreview t={theme} />
        </div>
      </div>

      {/* Info banner */}
      <div className="mt-4 rounded-2xl p-4 bg-indigo-50 border border-indigo-100">
        <p className="text-sm font-semibold text-indigo-800 mb-1">Note</p>
        <p className="text-xs text-indigo-600">
          La carte de fidélité (tampons, couleurs de progression) n&apos;est pas thématisée ici — elle possède son propre système de couleurs dans l&apos;onglet Programme.
        </p>
      </div>
    </div>
  )
}
