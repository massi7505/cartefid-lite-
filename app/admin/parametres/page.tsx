'use client'

import { useEffect, useState, useRef } from 'react'
import toast from 'react-hot-toast'

type Tab = 'branding' | 'liens' | 'smtp' | 'pwa' | 'notifications' | 'emails'

const TABS: { key: Tab; label: string }[] = [
  { key: 'branding',      label: 'Branding' },
  { key: 'pwa',           label: 'PWA' },
  { key: 'liens',         label: 'Liens rapides' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'emails',        label: 'Emails' },
  { key: 'smtp',          label: 'SMTP' },
]

interface SmtpForm {
  host: string; port: number; user: string; pass: string; from: string
}

function UploadField({ label, hint, value, onUploaded, accept }: {
  label: string; hint: string; value: string | null
  onUploaded: (url: string) => void; accept: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File) {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    if (res.ok) {
      const data = await res.json()
      onUploaded(data.url)
      toast.success('Fichier uploadé !')
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error || 'Erreur upload')
    }
    setUploading(false)
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
      <div className="flex-shrink-0">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label}
            className="w-14 h-14 rounded-xl object-contain border border-gray-200 bg-white p-1"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : (
          <div className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-white text-gray-300">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
        {value && <p className="text-xs text-gray-400 mt-1 truncate">{value.split('/').pop()}</p>}
      </div>
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
        className="flex-shrink-0 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-gray-400 transition disabled:opacity-50">
        {uploading ? 'Upload...' : value ? 'Changer' : 'Choisir'}
      </button>
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
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

const INPUT = "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition bg-white"

export default function ParametresPage() {
  const [tab, setTab] = useState<Tab>('branding')
  const [programId, setProgramId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const [branding, setBranding] = useState({ logoUrl: null as string | null, faviconUrl: null as string | null })
  const [savingBranding, setSavingBranding] = useState(false)

  const [pwa, setPwa] = useState({
    pwaEnabled: true,
    pwaShortName: '',
    appName: '',
    cardColor1: '#0D0D0D',
  })
  const [savingPwa, setSavingPwa] = useState(false)

  const [liens, setLiens] = useState({ phoneNumber: '', uberEatsUrl: '', deliverooUrl: '' })
  const [savingLiens, setSavingLiens] = useState(false)

  const [smtp, setSmtp] = useState<SmtpForm>({ host: '', port: 587, user: '', pass: '', from: '' })
  const [savingSmtp, setSavingSmtp] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testingSmtp, setTestingSmtp] = useState(false)

  const [notifs, setNotifs] = useState({
    notificationSoundUrl: null as string | null,
    notificationSoundEnabled: true,
  })
  const [savingNotifs, setSavingNotifs] = useState(false)

  const DEFAULT_STAMP_SUBJECT = 'Vous avez reçu un tampon !'
  const DEFAULT_STAMP_BODY = `Bonjour {{name}},\n\nVous avez reçu un nouveau tampon ! Vous avez maintenant {{stamps}}/{{stampsRequired}} tampons.\nEncore {{remaining}} tampon(s) pour votre récompense.\n\n<a href="{{appUrl}}/carte">Voir ma carte →</a>`
  const DEFAULT_REWARD_SUBJECT = '🎁 Votre récompense est disponible !'
  const DEFAULT_REWARD_BODY = `Félicitations {{name}} !\n\nVous avez obtenu votre récompense : {{rewardLabel}}\n\nPrésentez votre carte pour en profiter.\n\n<a href="{{appUrl}}/carte">Voir ma carte →</a>`

  const [emails, setEmails] = useState({
    stampEmailEnabled: true,
    stampEmailSubject: '',
    stampEmailBody: '',
    rewardEmailEnabled: true,
    rewardEmailSubject: '',
    rewardEmailBody: '',
    inactivityEmailEnabled: false,
    inactivityDays: 14,
    inactivityEmailSubject: '',
    inactivityEmailBody: '',
  })
  const [savingEmails, setSavingEmails] = useState(false)
  const [sendingRelance, setSendingRelance] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/programs/active').then(r => r.json()),
      fetch('/api/admin/smtp').then(r => r.json()),
    ]).then(([p, s]) => {
      if (p.id) {
        setProgramId(p.id)
        setBranding({ logoUrl: p.logoUrl ?? null, faviconUrl: p.faviconUrl ?? null })
        setLiens({ phoneNumber: p.phoneNumber ?? '', uberEatsUrl: p.uberEatsUrl ?? '', deliverooUrl: p.deliverooUrl ?? '' })
        setPwa({
          pwaEnabled: p.pwaEnabled ?? true,
          pwaShortName: p.pwaShortName ?? '',
          appName: p.name ?? '',
          cardColor1: p.cardColor1 ?? '#0D0D0D',
        })
        setNotifs({
          notificationSoundUrl: p.notificationSoundUrl ?? null,
          notificationSoundEnabled: p.notificationSoundEnabled ?? true,
        })
        setEmails({
          stampEmailEnabled: p.stampEmailEnabled ?? true,
          stampEmailSubject: p.stampEmailSubject ?? '',
          stampEmailBody: p.stampEmailBody ?? '',
          rewardEmailEnabled: p.rewardEmailEnabled ?? true,
          rewardEmailSubject: p.rewardEmailSubject ?? '',
          rewardEmailBody: p.rewardEmailBody ?? '',
          inactivityEmailEnabled: p.inactivityEmailEnabled ?? false,
          inactivityDays: p.inactivityDays ?? 14,
          inactivityEmailSubject: p.inactivityEmailSubject ?? '',
          inactivityEmailBody: p.inactivityEmailBody ?? '',
        })
      }
      if (s) setSmtp({ host: s.host ?? '', port: s.port ?? 587, user: s.user ?? '', pass: s.pass ?? '', from: s.from ?? '' })
      setLoading(false)
    })
  }, [])

  async function patchProgram(data: Record<string, unknown>) {
    if (!programId) return false
    const res = await fetch(`/api/admin/programs/${programId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.ok
  }

  async function saveBranding(e: React.FormEvent) {
    e.preventDefault()
    setSavingBranding(true)
    const ok = await patchProgram({ logoUrl: branding.logoUrl || null, faviconUrl: branding.faviconUrl || null })
    if (ok) toast.success('Branding sauvegardé !'); else toast.error('Erreur')
    setSavingBranding(false)
  }

  async function savePwaSettings(e: React.FormEvent) {
    e.preventDefault()
    setSavingPwa(true)
    const ok = await patchProgram({
      pwaEnabled: pwa.pwaEnabled,
      pwaShortName: pwa.pwaShortName || null,
      name: pwa.appName || undefined,
    })
    if (ok) toast.success('Configuration PWA sauvegardée !'); else toast.error('Erreur')
    setSavingPwa(false)
  }

  async function saveLiens(e: React.FormEvent) {
    e.preventDefault()
    setSavingLiens(true)
    const ok = await patchProgram({
      phoneNumber: liens.phoneNumber || null,
      uberEatsUrl: liens.uberEatsUrl || null,
      deliverooUrl: liens.deliverooUrl || null,
    })
    if (ok) toast.success('Liens sauvegardés !'); else toast.error('Erreur')
    setSavingLiens(false)
  }

  async function saveSmtp() {
    setSavingSmtp(true)
    const res = await fetch('/api/admin/smtp', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...smtp, port: Number(smtp.port) }),
    })
    if (res.ok) toast.success('Config SMTP sauvegardée !'); else toast.error('Erreur')
    setSavingSmtp(false)
  }

  async function sendTestEmail() {
    if (!testEmail) { toast.error('Entrez un email de test'); return }
    setTestingSmtp(true)
    const res = await fetch('/api/admin/test-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    })
    if (res.ok) toast.success('Email envoyé !'); else {
      const d = await res.json().catch(() => ({}))
      toast.error(d.error || 'Erreur envoi')
    }
    setTestingSmtp(false)
  }

  async function saveNotifs(e: React.FormEvent) {
    e.preventDefault()
    setSavingNotifs(true)
    const ok = await patchProgram({
      notificationSoundUrl: notifs.notificationSoundUrl || null,
      notificationSoundEnabled: notifs.notificationSoundEnabled,
    })
    if (ok) toast.success('Paramètres notifications sauvegardés !'); else toast.error('Erreur')
    setSavingNotifs(false)
  }

  async function saveEmails(e: React.FormEvent) {
    e.preventDefault()
    setSavingEmails(true)
    const ok = await patchProgram({
      stampEmailEnabled: emails.stampEmailEnabled,
      stampEmailSubject: emails.stampEmailSubject || null,
      stampEmailBody: emails.stampEmailBody || null,
      rewardEmailEnabled: emails.rewardEmailEnabled,
      rewardEmailSubject: emails.rewardEmailSubject || null,
      rewardEmailBody: emails.rewardEmailBody || null,
      inactivityEmailEnabled: emails.inactivityEmailEnabled,
      inactivityDays: Number(emails.inactivityDays),
      inactivityEmailSubject: emails.inactivityEmailSubject || null,
      inactivityEmailBody: emails.inactivityEmailBody || null,
    })
    if (ok) toast.success('Templates email sauvegardés !'); else toast.error('Erreur')
    setSavingEmails(false)
  }

  async function sendRelanceNow() {
    setSendingRelance(true)
    const res = await fetch('/api/cron/inactivity', { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      toast.success(data.sent > 0
        ? `${data.sent} email${data.sent > 1 ? 's' : ''} de relance envoyé${data.sent > 1 ? 's' : ''} !`
        : data.message ?? 'Aucun email envoyé')
    } else {
      toast.error(data.error ?? 'Erreur')
    }
    setSendingRelance(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black" style={{ color: '#2B3674' }}>Paramètres</h1>
        <p className="text-sm mt-1" style={{ color: '#A3AED0' }}>Branding, PWA, notifications, emails et SMTP</p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition -mb-px whitespace-nowrap ${
              tab === t.key
                ? 'border-indigo-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
            style={tab === t.key ? { color: '#4318FF' } : {}}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Branding ── */}
      {tab === 'branding' && (
        <form onSubmit={saveBranding} className="space-y-4">
          <p className="text-sm text-gray-500">Logo et favicon affichés dans l&apos;application</p>

          <UploadField
            label="Logo"
            hint="Affiché dans la sidebar et sur la carte fidélité. PNG ou SVG recommandé. Max 5 Mo."
            value={branding.logoUrl}
            onUploaded={url => setBranding(f => ({ ...f, logoUrl: url }))}
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
          />

          <UploadField
            label="Favicon"
            hint="Icône de l'onglet navigateur. ICO, PNG 32×32 ou SVG. Max 5 Mo."
            value={branding.faviconUrl}
            onUploaded={url => setBranding(f => ({ ...f, faviconUrl: url }))}
            accept="image/x-icon,image/png,image/svg+xml"
          />

          {(branding.logoUrl || branding.faviconUrl) && (
            <div className="flex gap-4">
              {branding.logoUrl && (
                <button type="button" onClick={() => setBranding(f => ({ ...f, logoUrl: null }))}
                  className="text-xs text-red-500 hover:text-red-700 transition">Supprimer le logo</button>
              )}
              {branding.faviconUrl && (
                <button type="button" onClick={() => setBranding(f => ({ ...f, faviconUrl: null }))}
                  className="text-xs text-red-500 hover:text-red-700 transition">Supprimer le favicon</button>
              )}
            </div>
          )}

          <button type="submit" disabled={savingBranding}
            className="w-full text-white py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 hover:opacity-90" style={{ background: '#4318FF' }}>
            {savingBranding ? 'Sauvegarde...' : 'Sauvegarder le branding'}
          </button>
        </form>
      )}

      {/* ── PWA ── */}
      {tab === 'pwa' && (
        <form onSubmit={savePwaSettings} className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-800 mb-1">Application installable</p>
            <p className="text-xs text-blue-600">
              La PWA permet à vos clients d&apos;installer l&apos;app sur leur téléphone comme une application native.
            </p>
          </div>

          <Toggle
            value={pwa.pwaEnabled}
            onChange={v => setPwa(f => ({ ...f, pwaEnabled: v }))}
            label="Activer la PWA"
            sublabel="Les clients peuvent installer l'app depuis leur navigateur"
          />

          <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de l&apos;app</label>
              <input type="text" value={pwa.appName}
                onChange={e => setPwa(f => ({ ...f, appName: e.target.value }))}
                placeholder="Ex: Café de la Paix Fidélité"
                className={INPUT} />
              <p className="text-xs text-gray-400 mt-1">Affiché dans le navigateur et les emails</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nom court <span className="text-gray-400 font-normal">(icône sur l&apos;écran d&apos;accueil)</span>
              </label>
              <input type="text" value={pwa.pwaShortName}
                onChange={e => setPwa(f => ({ ...f, pwaShortName: e.target.value.slice(0, 12) }))}
                placeholder="Ex: Fidélité"
                maxLength={12}
                className={INPUT} />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-400">Maximum 12 caractères recommandé</p>
                <p className="text-xs text-gray-400">{pwa.pwaShortName.length}/12</p>
              </div>
            </div>
          </div>

          {/* Logo / Favicon reminder */}
          <div className="rounded-xl p-4 bg-gray-50 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Icônes de l&apos;app</p>
            <p className="text-xs text-gray-500 mb-2">
              Le logo et le favicon définis dans l&apos;onglet <strong>Branding</strong> sont utilisés comme icônes de l&apos;app installée.
            </p>
            <button type="button" onClick={() => setTab('branding')}
              className="text-xs font-semibold text-gray-700 hover:text-gray-900 transition underline">
              Configurer le logo →
            </button>
          </div>

          {/* Couleur thème */}
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
            <p className="text-sm font-semibold text-gray-700 mb-1">Couleur du thème</p>
            <p className="text-xs text-gray-400 mb-3">
              Couleur de la barre de navigation du navigateur. Définie via les couleurs de la carte dans <strong>Programme → Carte</strong>.
            </p>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg border border-gray-200" style={{ background: pwa.cardColor1 }} />
              <div>
                <p className="text-sm font-medium text-gray-700">{pwa.cardColor1}</p>
                <p className="text-xs text-gray-400">Couleur principale de la carte</p>
              </div>
            </div>
          </div>

          {/* Preview */}
          {pwa.pwaEnabled && (
            <div className="rounded-2xl border border-gray-100 p-5 bg-white">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Aperçu icône</p>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${pwa.cardColor1}, #000)` }}>
                  📱
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{pwa.pwaShortName || pwa.appName || 'Fidélité'}</p>
                  <p className="text-gray-400 text-xs">Sur l&apos;écran d&apos;accueil</p>
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={savingPwa}
            className="w-full text-white py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 hover:opacity-90" style={{ background: '#4318FF' }}>
            {savingPwa ? 'Sauvegarde...' : 'Sauvegarder la configuration PWA'}
          </button>
        </form>
      )}

      {/* ── Liens rapides ── */}
      {tab === 'liens' && (
        <form onSubmit={saveLiens} className="space-y-4">
          <p className="text-sm text-gray-500">Affichés sur la page Offres de vos clients</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Numéro de téléphone</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.95 13a19.79 19.79 0 01-3.07-8.67A2 2 0 012.86 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <input type="tel" value={liens.phoneNumber}
                onChange={e => setLiens(f => ({ ...f, phoneNumber: e.target.value }))}
                placeholder="+33 1 23 45 67 89" className={`${INPUT} pl-9`} />
            </div>
            <p className="text-xs text-gray-400 mt-1">Affiché sous forme de bouton &quot;Appeler&quot;</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Lien Uber Eats</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base leading-none">🛵</span>
              <input type="url" value={liens.uberEatsUrl}
                onChange={e => setLiens(f => ({ ...f, uberEatsUrl: e.target.value }))}
                placeholder="https://www.ubereats.com/fr/store/..." className={`${INPUT} pl-9`} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Lien Deliveroo</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base leading-none">🦘</span>
              <input type="url" value={liens.deliverooUrl}
                onChange={e => setLiens(f => ({ ...f, deliverooUrl: e.target.value }))}
                placeholder="https://deliveroo.fr/menu/..." className={`${INPUT} pl-9`} />
            </div>
          </div>

          {(liens.phoneNumber || liens.uberEatsUrl || liens.deliverooUrl) && (
            <div className="rounded-xl p-4 bg-gray-50 border border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Aperçu</p>
              <div className="flex flex-wrap gap-2">
                {liens.phoneNumber && <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-900 text-white">📞 Appeler</span>}
                {liens.uberEatsUrl && <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-700">🛵 Uber Eats</span>}
                {liens.deliverooUrl && <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-700">🦘 Deliveroo</span>}
              </div>
            </div>
          )}

          <button type="submit" disabled={savingLiens}
            className="w-full text-white py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 hover:opacity-90" style={{ background: '#4318FF' }}>
            {savingLiens ? 'Sauvegarde...' : 'Sauvegarder les liens'}
          </button>
        </form>
      )}

      {/* ── Notifications ── */}
      {tab === 'notifications' && (
        <form onSubmit={saveNotifs} className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-800 mb-1">Son personnalisé</p>
            <p className="text-xs text-blue-600">
              Joué sur la carte client quand un tampon est reçu, et dans le scanner admin au scan réussi.
              Formats acceptés : MP3, OGG, WAV · Max 5 Mo.
            </p>
          </div>

          <Toggle
            value={notifs.notificationSoundEnabled}
            onChange={v => setNotifs(f => ({ ...f, notificationSoundEnabled: v }))}
            label="Activer le son"
            sublabel="Son joué à chaque tampon reçu et à chaque scan admin"
          />

          {notifs.notificationSoundEnabled && (
            <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Son personnalisé</p>
                <p className="text-xs text-gray-400 mb-3">
                  Laissez vide pour utiliser le bip par défaut (Web Audio API)
                </p>

                {notifs.notificationSoundUrl ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#EEF2FF' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="#4318FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M15.54 8.46a5 5 0 010 7.07" stroke="#4318FF" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{notifs.notificationSoundUrl.split('/').pop()}</p>
                      <audio controls src={notifs.notificationSoundUrl} className="mt-1 w-full h-8" style={{ height: 32 }} />
                    </div>
                    <button type="button" onClick={() => setNotifs(f => ({ ...f, notificationSoundUrl: null }))}
                      className="text-xs text-red-500 hover:text-red-700 transition flex-shrink-0">
                      Supprimer
                    </button>
                  </div>
                ) : (
                  <UploadField
                    label="Fichier son"
                    hint="MP3, OGG ou WAV recommandé. Max 5 Mo."
                    value={null}
                    onUploaded={url => setNotifs(f => ({ ...f, notificationSoundUrl: url }))}
                    accept="audio/mpeg,audio/mp3,audio/ogg,audio/wav,audio/wave"
                  />
                )}
              </div>
            </div>
          )}

          <button type="submit" disabled={savingNotifs}
            className="w-full text-white py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 hover:opacity-90" style={{ background: '#4318FF' }}>
            {savingNotifs ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </form>
      )}

      {/* ── Emails ── */}
      {tab === 'emails' && (
        <form onSubmit={saveEmails} className="space-y-5">

          {/* Variables reference */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Variables disponibles</p>
            <div className="flex flex-wrap gap-2">
              {['{{name}}', '{{stamps}}', '{{stampsRequired}}', '{{remaining}}', '{{rewardLabel}}', '{{programName}}', '{{appUrl}}', '{{inactivityDays}}'].map(v => (
                <code key={v} className="text-xs px-2 py-1 rounded-lg font-mono" style={{ background: '#EEF2FF', color: '#4318FF' }}>{v}</code>
              ))}
            </div>
          </div>

          {/* ─ Email tampon ─ */}
          <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold" style={{ color: '#2B3674' }}>✅ Email tampon reçu</p>
              <button type="button" onClick={() => setEmails(f => ({ ...f, stampEmailEnabled: !f.stampEmailEnabled }))}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${emails.stampEmailEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${emails.stampEmailEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {emails.stampEmailEnabled && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Objet</label>
                  <input type="text" value={emails.stampEmailSubject}
                    onChange={e => setEmails(f => ({ ...f, stampEmailSubject: e.target.value }))}
                    placeholder={DEFAULT_STAMP_SUBJECT} className={INPUT} />
                  <p className="text-xs text-gray-400 mt-1">Vide = sujet par défaut</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Corps <span className="font-normal">(HTML autorisé)</span></label>
                  <textarea value={emails.stampEmailBody}
                    onChange={e => setEmails(f => ({ ...f, stampEmailBody: e.target.value }))}
                    rows={6} placeholder={DEFAULT_STAMP_BODY} className={`${INPUT} resize-y font-mono text-xs`} />
                  <p className="text-xs text-gray-400 mt-1">Vide = template par défaut</p>
                </div>
              </div>
            )}
          </div>

          {/* ─ Email récompense ─ */}
          <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold" style={{ color: '#2B3674' }}>🎁 Email récompense débloquée</p>
              <button type="button" onClick={() => setEmails(f => ({ ...f, rewardEmailEnabled: !f.rewardEmailEnabled }))}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${emails.rewardEmailEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${emails.rewardEmailEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {emails.rewardEmailEnabled && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Objet</label>
                  <input type="text" value={emails.rewardEmailSubject}
                    onChange={e => setEmails(f => ({ ...f, rewardEmailSubject: e.target.value }))}
                    placeholder={DEFAULT_REWARD_SUBJECT} className={INPUT} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Corps <span className="font-normal">(HTML autorisé)</span></label>
                  <textarea value={emails.rewardEmailBody}
                    onChange={e => setEmails(f => ({ ...f, rewardEmailBody: e.target.value }))}
                    rows={6} placeholder={DEFAULT_REWARD_BODY} className={`${INPUT} resize-y font-mono text-xs`} />
                </div>
              </div>
            )}
          </div>

          {/* ─ Email de relance ─ */}
          <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold" style={{ color: '#2B3674' }}>👋 Email de relance (inactivité)</p>
                <p className="text-xs text-gray-400 mt-0.5">Envoyé aux clients qui ne sont pas repassés depuis X jours</p>
              </div>
              <button type="button" onClick={() => setEmails(f => ({ ...f, inactivityEmailEnabled: !f.inactivityEmailEnabled }))}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${emails.inactivityEmailEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${emails.inactivityEmailEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {emails.inactivityEmailEnabled && (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Délai d&apos;inactivité (jours)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number" min={5} max={90}
                      value={emails.inactivityDays}
                      onChange={e => setEmails(f => ({ ...f, inactivityDays: Number(e.target.value) }))}
                      className={`${INPUT} w-28`}
                    />
                    <p className="text-sm text-gray-500">
                      Envoie l&apos;email si le client n&apos;a pas eu de tampon depuis <strong>{emails.inactivityDays} jours</strong>
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Objet</label>
                  <input type="text" value={emails.inactivityEmailSubject}
                    onChange={e => setEmails(f => ({ ...f, inactivityEmailSubject: e.target.value }))}
                    placeholder="Ça fait longtemps qu'on ne vous a pas vu !"
                    className={INPUT} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Corps <span className="font-normal">(HTML autorisé)</span></label>
                  <textarea value={emails.inactivityEmailBody}
                    onChange={e => setEmails(f => ({ ...f, inactivityEmailBody: e.target.value }))}
                    rows={6}
                    placeholder={`Bonjour {{name}},\n\nCela fait {{inactivityDays}} jours que vous n'êtes pas passé...\nVous avez {{stamps}}/{{stampsRequired}} tampons. Encore {{remaining}} pour votre récompense !\n\n<a href="{{appUrl}}/carte">Voir ma carte →</a>`}
                    className={`${INPUT} resize-y font-mono text-xs`} />
                  <p className="text-xs text-gray-400 mt-1">Vide = template par défaut</p>
                </div>

                {/* Lancer maintenant */}
                <div className="pt-1 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-2">Testez en envoyant les emails maintenant (aux clients inactifs éligibles)</p>
                  <button
                    type="button"
                    onClick={sendRelanceNow}
                    disabled={sendingRelance}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50"
                    style={{ background: '#7B2FBE' }}
                  >
                    {sendingRelance ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                        Envoyer maintenant
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <button type="submit" disabled={savingEmails}
            className="w-full text-white py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 hover:opacity-90" style={{ background: '#4318FF' }}>
            {savingEmails ? 'Sauvegarde...' : 'Sauvegarder les templates'}
          </button>
        </form>
      )}

      {/* ── Email SMTP ── */}
      {tab === 'smtp' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Emails envoyés automatiquement à vos clients</p>

          <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Serveur SMTP</label>
                <input type="text" value={smtp.host} onChange={e => setSmtp(f => ({ ...f, host: e.target.value }))}
                  placeholder="smtp.gmail.com" className={INPUT} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Port</label>
                <input type="number" value={smtp.port} onChange={e => setSmtp(f => ({ ...f, port: Number(e.target.value) }))}
                  className={INPUT} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom d&apos;utilisateur</label>
              <input type="text" value={smtp.user} onChange={e => setSmtp(f => ({ ...f, user: e.target.value }))}
                placeholder="votre@email.com" className={INPUT} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe / App password</label>
              <input type="password" value={smtp.pass} onChange={e => setSmtp(f => ({ ...f, pass: e.target.value }))}
                placeholder="••••••••••••" className={INPUT} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse expéditeur</label>
              <input type="email" value={smtp.from} onChange={e => setSmtp(f => ({ ...f, from: e.target.value }))}
                placeholder="noreply@votreboutique.com" className={INPUT} />
            </div>

            <button onClick={saveSmtp} disabled={savingSmtp}
              className="w-full text-white py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 hover:opacity-90" style={{ background: '#4318FF' }}>
              {savingSmtp ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>

          {/* Test */}
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
            <p className="text-sm font-semibold text-gray-700 mb-3">Tester la configuration</p>
            <div className="flex gap-2">
              <input type="email" value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                placeholder="test@email.com" className={`${INPUT} flex-1`} />
              <button onClick={sendTestEmail} disabled={testingSmtp}
                className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl text-sm font-semibold transition disabled:opacity-50 whitespace-nowrap">
                {testingSmtp ? '...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
