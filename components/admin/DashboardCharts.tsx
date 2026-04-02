'use client'

import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

function ChartTooltip({ active, payload, label, color }: {
  active?: boolean; payload?: Array<{ value?: unknown }>; label?: string; color: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl px-3 py-2 shadow-lg text-sm" style={{ border: '1px solid #E0E5F2' }}>
      <p className="text-xs mb-0.5" style={{ color: '#A3AED0' }}>{label}</p>
      <p className="font-bold" style={{ color }}>{payload[0].value as number} tampon{(payload[0].value as number) > 1 ? 's' : ''}</p>
    </div>
  )
}

function EmptyChart({ height = 200 }: { height?: number }) {
  return (
    <div className="flex items-center justify-center text-center" style={{ height, color: '#A3AED0' }}>
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
  const hasAreaData = areaData.length > 0 && areaData.some(d => d.Tampons > 0)
  const hasWeeklyData = weeklyData.some(d => d.Tampons > 0)

  // Dynamic bar size for weekly chart based on data
  const weeklyBarSize = Math.min(32, Math.max(16, 140 / weeklyData.length))

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-4">

      {/* 30-day area chart */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-semibold" style={{ color: '#A3AED0' }}>30 derniers jours</p>
            <h2 className="text-xl font-black mt-0.5" style={{ color: '#2B3674' }}>Tampons distribués</h2>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black" style={{ color: '#4318FF' }}>{stampsThisMonth}</p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: '#01B574' }}>ce mois</p>
          </div>
        </div>

        {hasAreaData ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={areaData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="stampGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4318FF" stopOpacity={0.18}/>
                  <stop offset="95%" stopColor="#4318FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F4F7FE" vertical={false}/>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#A3AED0' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#A3AED0' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={28}
              />
              <Tooltip content={({ active, payload, label }) =>
                <ChartTooltip active={active} payload={payload} label={label} color="#4318FF" />
              }/>
              <Area
                type="monotone"
                dataKey="Tampons"
                stroke="#4318FF"
                strokeWidth={2.5}
                fill="url(#stampGradient)"
                dot={{ r: 3, fill: '#4318FF', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#4318FF', strokeWidth: 2, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : <EmptyChart height={200} />}
      </div>

      {/* Weekly bar chart */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '14px 17px 40px 4px rgba(112,144,176,0.10)' }}>
        <div className="mb-6">
          <p className="text-xs font-semibold" style={{ color: '#A3AED0' }}>Cette semaine</p>
          <h2 className="text-lg font-black mt-0.5" style={{ color: '#2B3674' }}>Par jour</h2>
        </div>

        {hasWeeklyData ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} barSize={weeklyBarSize} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#868CFF" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#4318FF" stopOpacity={0.7}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F4F7FE" vertical={false}/>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#A3AED0' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 10, fill: '#A3AED0' }} axisLine={false} tickLine={false} allowDecimals={false} width={24}/>
              <Tooltip content={({ active, payload, label }) =>
                <ChartTooltip active={active} payload={payload} label={label} color="#4318FF" />
              }/>
              <Bar dataKey="Tampons" fill="url(#weeklyGradient)" radius={[6, 6, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col gap-1.5 mt-2">
            {weeklyData.map(d => (
              <div key={d.day} className="flex items-center gap-3">
                <span className="text-xs w-7 flex-shrink-0" style={{ color: '#A3AED0' }}>{d.day}</span>
                <div className="flex-1 h-5 rounded-lg flex items-center px-2" style={{ background: '#F4F7FE' }}>
                  <span className="text-xs font-semibold" style={{ color: '#A3AED0' }}>0</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
