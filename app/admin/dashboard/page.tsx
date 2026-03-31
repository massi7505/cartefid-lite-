'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const DashboardCharts = dynamic(() => import('@/components/admin/DashboardCharts'), {
  ssr: false,
  loading: () => (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      {[1, 2].map(i => (
        <div key={i} className="bg-white rounded-2xl p-6 h-[296px] animate-pulse"
          style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
          <div className="h-4 bg-gray-100 rounded w-32 mb-2" />
          <div className="h-6 bg-gray-100 rounded w-48 mb-6" />
          <div className="h-48 bg-gray-50 rounded-xl" />
        </div>
      ))}
    </div>
  ),
})

interface Stats {
  totalClients: number
  newClientsToday: number
  newClientsThisWeek: number
  totalStamps: number
  stampsToday: number
  stampsThisMonth: number
  totalRewards: number
  rewardsAvailable: number
  rewardsThisMonth: number
  completionRate: number
  stampsPerDay: Array<{ date: string; count: number }>
  recentStamps: Array<{ id: number; createdAt: string; user: { name: string; email: string } }>
}

function fmtTime(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (diff < 1) return "À l'instant"
  if (diff < 60) return `Il y a ${diff} min`
  const h = Math.floor(diff / 60)
  if (h < 24) return `Il y a ${h}h`
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function getWeeklyData(stampsPerDay: Array<{ date: string; count: number }>) {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const result = days.map(d => ({ day: d, Tampons: 0 }))
  stampsPerDay.slice(-7).forEach(d => {
    result[new Date(d.date).getDay()].Tampons += d.count
  })
  return result
}


function StatCard({ label, value, sub, subOk, g1, g2, href, children }: {
  label: string
  value: string | number
  sub?: string
  subOk?: boolean | null
  g1: string
  g2: string
  href?: string
  children: React.ReactNode
}) {
  const inner = (
    <div className="bg-white rounded-2xl p-3.5 sm:p-5 flex items-start justify-between transition hover:shadow-md h-full"
      style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-[11px] sm:text-xs font-semibold mb-2 sm:mb-3 leading-snug" style={{ color: '#A3AED0' }}>{label}</p>
        <p className="text-xl sm:text-2xl lg:text-3xl font-black leading-none" style={{ color: '#2B3674' }}>{value}</p>
        {sub && (
          <p className="text-[11px] sm:text-xs mt-1.5 leading-tight"
            style={{ color: subOk === true ? '#01B574' : '#A3AED0' }}>
            {sub}
          </p>
        )}
      </div>
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ml-2 sm:ml-3"
        style={{ background: `linear-gradient(135deg, ${g1} 0%, ${g2} 100%)` }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round">
          {children}
        </svg>
      </div>
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(data => {
      setStats(data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#4318FF transparent #4318FF #4318FF' }} />
      </div>
    )
  }
  if (!stats) return null

  const areaData = stats.stampsPerDay.map(d => ({
    date: new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    Tampons: d.count,
  }))
  const weeklyData = getWeeklyData(stats.stampsPerDay)

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total clients" value={stats.totalClients}
          sub={stats.newClientsThisWeek > 0 ? `+${stats.newClientsThisWeek} cette semaine` : 'Aucun nouveau'}
          subOk={stats.newClientsThisWeek > 0} g1="#4318FF" g2="#868CFF" href="/admin/clients">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
        </StatCard>

        <StatCard label="Tampons aujourd'hui" value={stats.stampsToday}
          sub={`${stats.stampsThisMonth} ce mois`} g1="#01B574" g2="#05CD99">
          <polyline points="20 6 9 17 4 12"/>
        </StatCard>

        <StatCard label="Récompenses dispo" value={stats.rewardsAvailable}
          sub={`${stats.totalRewards} total · +${stats.rewardsThisMonth} ce mois`}
          subOk={stats.rewardsAvailable > 0} g1="#FFB547" g2="#FFD580" href="/admin/recompenses">
          <polyline points="20 12 20 22 4 22 4 12"/>
          <rect x="2" y="7" width="20" height="5"/>
          <line x1="12" y1="22" x2="12" y2="7"/>
          <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
        </StatCard>

        <StatCard label="Taux de complétion" value={`${stats.completionRate}%`}
          sub="cartes ayant obtenu une récompense" g1="#EE5D50" g2="#FF8577">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </StatCard>
      </div>

      {/* ── Charts row ── */}
      <DashboardCharts
        areaData={areaData}
        weeklyData={weeklyData}
        stampsThisMonth={stats.stampsThisMonth}
      />

      {/* ── Activity + Quick actions ── */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-4">

        {/* Recent stamps */}
        <div className="bg-white rounded-2xl" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
            <h2 className="font-bold" style={{ color: '#2B3674' }}>Activité récente</h2>
            <Link href="/admin/clients" className="text-xs font-semibold hover:opacity-70 transition" style={{ color: '#4318FF' }}>
              Voir tout →
            </Link>
          </div>
          {stats.recentStamps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center" style={{ color: '#A3AED0' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="mb-3 opacity-40">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
              <p className="text-sm">Aucun tampon distribué</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {stats.recentStamps.map((s, i) => (
                <div key={s.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/50 transition">
                  <span className="text-xs font-semibold w-5 flex-shrink-0" style={{ color: '#A3AED0' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #868CFF 0%, #4318FF 100%)' }}>
                    {s.user.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#2B3674' }}>{s.user.name}</p>
                    <p className="text-xs truncate" style={{ color: '#A3AED0' }}>{s.user.email}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: '#EEF2FF', color: '#4318FF' }}>
                      +1 tampon
                    </span>
                    <p className="text-xs mt-1" style={{ color: '#A3AED0' }}>{fmtTime(s.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <Link href="/admin/scanner"
            className="flex items-center gap-4 p-5 rounded-2xl text-white transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #4318FF 0%, #868CFF 100%)', boxShadow: '0 8px 24px rgba(67,24,255,0.30)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/>
                <line x1="7" y1="12" x2="17" y2="12"/>
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm">Scanner un client</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>QR code ou code à 8 chiffres</p>
            </div>
          </Link>

          {[
            { href: '/admin/clients',     label: 'Clients',     sub: `${stats.totalClients} inscrits`,       dot: '#4318FF', bg: '#EEF2FF' },
            { href: '/admin/recompenses', label: 'Récompenses', sub: `${stats.rewardsAvailable} en attente`,  dot: '#FFB547', bg: '#FFF8EB' },
            { href: '/admin/promotions',  label: 'Promotions',  sub: 'Gérer les offres',                      dot: '#01B574', bg: '#E6FBF4' },
            { href: '/admin/programme',   label: 'Programme',   sub: 'Configuration',                         dot: '#EE5D50', bg: '#FFF2F0' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-4 px-5 py-4 bg-white rounded-2xl transition hover:shadow-md"
              style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.dot }}/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: '#2B3674' }}>{item.label}</p>
                <p className="text-xs truncate" style={{ color: '#A3AED0' }}>{item.sub}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A3AED0" strokeWidth="2" strokeLinecap="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
