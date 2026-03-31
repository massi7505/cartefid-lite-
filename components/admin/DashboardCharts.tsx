'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function ChartTooltip({ active, payload, label, color }: {
  active?: boolean; payload?: Array<{ value?: unknown }>; label?: string; color: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl px-3 py-2 shadow-lg text-sm" style={{ border: '1px solid #E0E5F2' }}>
      <p className="font-semibold" style={{ color: '#2B3674' }}>{label}</p>
      <p style={{ color }}>{payload[0].value as number} tampons</p>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="h-48 flex items-center justify-center text-center" style={{ color: '#A3AED0' }}>
      <div>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="mx-auto mb-3 opacity-40">
          <path d="M3 3v18h18"/><path d="M18 9l-5 5-4-4-4 4"/>
        </svg>
        <p className="text-sm">Pas encore de données</p>
      </div>
    </div>
  )
}

export default function DashboardCharts({
  areaData,
  weeklyData,
  stampsThisMonth,
}: {
  areaData: Array<{ date: string; Tampons: number }>
  weeklyData: Array<{ day: string; Tampons: number }>
  stampsThisMonth: number
}) {
  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      {/* 30-day bar chart */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-semibold" style={{ color: '#A3AED0' }}>30 derniers jours</p>
            <h2 className="text-xl font-black mt-0.5" style={{ color: '#2B3674' }}>Tampons distribués</h2>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black" style={{ color: '#4318FF' }}>{stampsThisMonth}</p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: '#01B574' }}>ce mois</p>
          </div>
        </div>
        {areaData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={areaData} barSize={6} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false}/>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#A3AED0' }} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
              <YAxis tick={{ fontSize: 10, fill: '#A3AED0' }} axisLine={false} tickLine={false} allowDecimals={false} width={28}/>
              <Tooltip content={({ active, payload, label }) => <ChartTooltip active={active} payload={payload} label={label} color="#4318FF" />}/>
              <Bar dataKey="Tampons" fill="#4318FF" radius={[4, 4, 0, 0]} opacity={0.85}/>
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyChart />}
      </div>

      {/* Weekly bar chart */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
        <div className="mb-6">
          <p className="text-xs font-semibold" style={{ color: '#A3AED0' }}>Cette semaine</p>
          <h2 className="text-lg font-black mt-0.5" style={{ color: '#2B3674' }}>Par jour</h2>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData} barSize={14} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false}/>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#A3AED0' }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize: 10, fill: '#A3AED0' }} axisLine={false} tickLine={false} allowDecimals={false} width={24}/>
            <Tooltip content={({ active, payload, label }) => <ChartTooltip active={active} payload={payload} label={label} color="#868CFF" />}/>
            <Bar dataKey="Tampons" fill="#868CFF" radius={[6, 6, 0, 0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
