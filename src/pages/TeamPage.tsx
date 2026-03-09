import { useState, useMemo, Fragment } from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { ChevronDown, ChevronRight, ArrowUpDown } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import teamData from '../../data/team.json'

type SortKey = 'name' | 'level' | 'time_in_level' | 'base_salary' | 'total_comp'
type SortDir = 'asc' | 'desc'

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4']

const LEVEL_COLORS: Record<string, string> = {
  L4: 'bg-zinc-600 text-zinc-200',
  L5: 'bg-blue-600/70 text-blue-100',
  L6: 'bg-purple-600/70 text-purple-100',
  L7: 'bg-amber-600/70 text-amber-100',
}

const ZONE_COLORS: Record<string, string> = {
  Z1: 'bg-emerald-600/60 text-emerald-100',
  Z2: 'bg-sky-600/60 text-sky-100',
  Z3: 'bg-orange-600/60 text-orange-100',
  Z4: 'bg-rose-600/60 text-rose-100',
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  direct_report: 'Direct report',
  skip: 'Skip',
  designer: 'Designer',
}

const PERF_STYLES: Record<string, string> = {
  'Exceptional': 'text-green-400',
  'Very Strong': 'text-emerald-400',
  'Strong / Very Strong': 'text-emerald-400',
  'Strong': 'text-foreground/70',
  'High': 'text-emerald-400',
  'Inconsistent': 'text-red-400',
}

const EMPTY_COMP = { base_salary: 0, equity_value: 0, total_comp: 0, perf_rating: '', notes: '', year: 0 }

function latestComp(member: typeof teamData[0]) {
  return member.compensation[member.compensation.length - 1] ?? EMPTY_COMP
}

function parsePromoDate(lastPromo: string, startDate: string): Date {
  if (!lastPromo || lastPromo === 'No promo yet') {
    return new Date(startDate)
  }
  // "Mar 2024" format
  const monthYear = lastPromo.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/)
  if (monthYear) {
    const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }
    return new Date(Number(monthYear[2]), months[monthYear[1]], 1)
  }
  // "2023 - Sept" or "2025 - Sept" format
  const yearMonth = lastPromo.match(/^(\d{4})\s*-\s*(\w+)$/)
  if (yearMonth) {
    const monthMap: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Sept: 8, Oct: 9, Nov: 10, Dec: 11 }
    const m = monthMap[yearMonth[2]] ?? 0
    return new Date(Number(yearMonth[1]), m, 1)
  }
  return new Date(startDate)
}

function timeInLevel(member: typeof teamData[0]): number {
  const since = parsePromoDate(member.last_promo, member.start_date)
  const now = new Date()
  const years = (now.getTime() - since.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  return Math.round(years * 2) / 2
}

function formatTimeInLevel(years: number): string {
  if (years < 1) return '<1y'
  if (years < 2) return '<2y'
  return `${years}y`
}

function tilColor(years: number): string {
  if (years < 1) return 'bg-emerald-600/60 text-emerald-100'
  if (years < 2) return 'bg-purple-600/60 text-purple-100'
  if (years >= 3.5) return 'bg-red-600/60 text-red-100'
  return 'bg-orange-600/60 text-orange-100'
}

const ALL_LEVELS = ['L4', 'L5', 'L6', 'L7']
const ALL_ZONES = ['Z1', 'Z2', 'Z3', 'Z4']

export default function TeamPage({ showSensitive }: { showSensitive: boolean }) {
  const [sortKey, setSortKey] = useState<SortKey>('level')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterLevel, setFilterLevel] = useState<string | null>(null)
  const [filterZone, setFilterZone] = useState<string | null>(null)

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const membersWithTIL = useMemo(() => {
    return teamData.map(m => ({ ...m, til: timeInLevel(m) }))
  }, [])

  const filtered = useMemo(() => {
    return membersWithTIL.filter(m => {
      if (filterLevel && m.level !== filterLevel) return false
      if (filterZone && m.zone !== filterZone) return false
      return true
    })
  }, [membersWithTIL, filterLevel, filterZone])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name)
          break
        case 'level':
          cmp = a.level.localeCompare(b.level)
          break
        case 'time_in_level':
          cmp = a.til - b.til
          break
        case 'base_salary':
          cmp = latestComp(a).base_salary - latestComp(b).base_salary
          break
        case 'total_comp':
          cmp = latestComp(a).total_comp - latestComp(b).total_comp
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [sortKey, sortDir, filtered])

  const genderData = useMemo(() => {
    const counts: Record<string, number> = {}
    teamData.forEach(m => { counts[m.gender] = (counts[m.gender] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [])

  const locationData = useMemo(() => {
    const counts: Record<string, number> = {}
    teamData.forEach(m => {
      const loc = m.location || 'Unknown'
      counts[loc] = (counts[loc] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [])

  const levelData = useMemo(() => {
    const counts: Record<string, number> = {}
    teamData.forEach(m => { counts[m.level] = (counts[m.level] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
    >
      {label}
      <ArrowUpDown className={cn('h-3 w-3', sortKey === field && 'text-primary')} />
    </button>
  )

  const RATING_ORDER = ['Inconsistent', 'Strong', 'Very Strong', 'Exceptional']
  const ratingDistribution = useMemo(() => {
    const years = [2023, 2024, 2025]
    return years.map(year => {
      const ratings: Record<string, number> = {}
      let total = 0
      teamData.forEach(m => {
        const comp = m.compensation.find(c => c.year === year)
        if (!comp || !comp.perf_rating) return
        const normalized = comp.perf_rating === 'High' ? 'Very Strong'
          : comp.perf_rating === 'Strong / Very Strong' ? 'Very Strong'
          : comp.perf_rating
        if (!RATING_ORDER.includes(normalized)) return
        ratings[normalized] = (ratings[normalized] || 0) + 1
        total++
      })
      return { year, ratings, total }
    }).filter(d => d.total > 0)
  }, [])

  const PERF_COLORS: Record<string, string> = {
    'Exceptional': '#8b5cf6',
    'Very Strong': '#22c55e',
    'Strong': '#3b82f6',
    'Inconsistent': '#ec4899',
  }

  const ratingPieData = useMemo(() => {
    return [...ratingDistribution].reverse().map(({ year, ratings, total }) => ({
      year,
      total,
      slices: RATING_ORDER.map(rating => ({
        name: rating,
        count: ratings[rating] || 0,
        pct: Math.round(((ratings[rating] || 0) / total) * 100),
      })).filter(s => s.count > 0),
    }))
  }, [ratingDistribution])

  const COL_COUNT = showSensitive ? 6 : 4

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Team</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground mb-1">Team Size</p>
          <p className="text-3xl font-bold">{teamData.length}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground mb-2">Gender</p>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genderData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={48} paddingAngle={3} strokeWidth={0}>
                  {genderData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#fafafa' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-3 justify-center mt-1">
            {genderData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground mb-2">Location</p>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={locationData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={48} paddingAngle={2} strokeWidth={0}>
                  {locationData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#fafafa' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
            {locationData.slice(0, 5).map((d, i) => (
              <span key={d.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                {d.name} ({d.value})
              </span>
            ))}
            {locationData.length > 5 && (
              <span className="text-xs text-muted-foreground">+{locationData.length - 5} more</span>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground mb-2">Levels</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={levelData} margin={{ top: 18, right: 4, bottom: 4, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} width={20} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} label={{ position: 'top', fill: '#a1a1aa', fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Filter</span>
        <div className="flex gap-1.5">
          <button
            onClick={() => setFilterLevel(null)}
            className={cn('px-2.5 py-1 rounded text-xs font-medium transition-colors',
              filterLevel === null ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >All Levels</button>
          {ALL_LEVELS.map(l => (
            <button
              key={l}
              onClick={() => setFilterLevel(filterLevel === l ? null : l)}
              className={cn('px-2.5 py-1 rounded text-xs font-medium transition-colors',
                filterLevel === l ? LEVEL_COLORS[l] : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >{l}</button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setFilterZone(null)}
            className={cn('px-2.5 py-1 rounded text-xs font-medium transition-colors',
              filterZone === null ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >All Zones</button>
          {ALL_ZONES.map(z => (
            <button
              key={z}
              onClick={() => setFilterZone(filterZone === z ? null : z)}
              className={cn('px-2.5 py-1 rounded text-xs font-medium transition-colors',
                filterZone === z ? ZONE_COLORS[z] : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >{z}</button>
          ))}
        </div>
        {(filterLevel || filterZone) && (
          <span className="text-xs text-muted-foreground">{sorted.length} of {teamData.length}</span>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 w-8"></th>
              <th className="text-left px-5 py-3"><SortHeader label="Name" field="name" /></th>
              <th className="text-left px-5 py-3"><SortHeader label="Level" field="level" /></th>
              <th className="text-center px-5 py-3"><SortHeader label="Time in Level" field="time_in_level" /></th>
              {showSensitive && <th className="text-right px-5 py-3"><div className="flex justify-end"><SortHeader label="Base" field="base_salary" /></div></th>}
              {showSensitive && <th className="text-right px-5 py-3"><div className="flex justify-end"><SortHeader label="Total Comp" field="total_comp" /></div></th>}
            </tr>
          </thead>
          <tbody>
            {sorted.map(member => {
              const latest = latestComp(member)
              const isExpanded = expandedId === member.id
              return (
                <Fragment key={member.id}>
                  <tr
                    className="border-b border-border hover:bg-accent/30 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : member.id)}
                  >
                    <td className="px-5 py-3 text-muted-foreground">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{member.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-muted-foreground">{member.location}</span>
                        {member.zone && (
                          <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', ZONE_COLORS[member.zone] || 'bg-muted text-muted-foreground')}>
                            {member.zone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn('inline-block text-xs font-medium px-2 py-0.5 rounded', LEVEL_COLORS[member.level] || 'bg-accent text-accent-foreground')}>
                        {member.level}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={cn('inline-block text-xs font-medium px-2 py-0.5 rounded tabular-nums', tilColor(member.til))}>
                        {formatTimeInLevel(member.til)}
                      </span>
                    </td>
                    {showSensitive && <td className="px-5 py-3 text-right text-sm tabular-nums">{formatCurrency(latest.base_salary)}</td>}
                    {showSensitive && <td className="px-5 py-3 text-right text-sm font-medium tabular-nums">{formatCurrency(latest.total_comp)}</td>}
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={COL_COUNT} className="bg-muted/30 px-5 py-4">
                        <div className="overflow-x-auto">
                          <div className="flex items-baseline gap-4 mb-3 flex-wrap">
                            <h3 className="text-sm font-semibold">{showSensitive ? 'Comp & Performance' : 'Performance'} — {member.name}</h3>
                            <span className="text-xs text-muted-foreground">{RELATIONSHIP_LABELS[member.relationship] ?? member.relationship}</span>
                            {member.last_promo && member.last_promo !== 'No promo yet' && (
                              <span className="text-xs text-muted-foreground">Last promo: {member.last_promo}</span>
                            )}
                          </div>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-muted-foreground text-xs uppercase tracking-wider">
                                <th className="text-left pb-2">Year</th>
                                <th className="text-left pb-2">Perf Rating</th>
                                {showSensitive && <th className="text-right pb-2">Base</th>}
                                {showSensitive && <th className="text-right pb-2">Equity</th>}
                                {showSensitive && <th className="text-right pb-2">Total Comp</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {[...member.compensation].reverse().map(c => (
                                <tr key={c.year} className="border-t border-border/50">
                                  <td className="py-2 tabular-nums">{c.year}</td>
                                  <td className="py-2">
                                    <span className="flex items-center gap-2">
                                      <span className={cn('text-sm font-medium', PERF_STYLES[c.perf_rating] || 'text-muted-foreground')}>
                                        {c.perf_rating || '—'}
                                      </span>
                                      {c.notes === 'Promoted' && (
                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                                          Promoted
                                        </span>
                                      )}
                                    </span>
                                  </td>
                                  {showSensitive && <td className="py-2 text-right tabular-nums">{formatCurrency(c.base_salary)}</td>}
                                  {showSensitive && <td className="py-2 text-right tabular-nums">{formatCurrency(c.equity_value)}</td>}
                                  {showSensitive && <td className="py-2 text-right tabular-nums font-medium">{formatCurrency(c.total_comp)}</td>}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Rating Distribution */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-1">Performance Rating Distribution</h2>
        <p className="text-sm text-muted-foreground mb-4">Percentage of rated team members per cycle</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ratingPieData.map(({ year, total, slices }) => (
            <div key={year} className="flex flex-col items-center">
              <h3 className="text-sm font-semibold mb-1">{year}</h3>
              <p className="text-xs text-muted-foreground mb-3">{total} rated</p>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={slices}
                      dataKey="pct"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      label={((props: Record<string, unknown>) => {
                        const pct = props.pct as number
                        const count = props.count as number
                        return `${pct}% (${count})`
                      }) as never}
                      labelLine={false}
                    >
                      {slices.map(s => (
                        <Cell key={s.name} fill={PERF_COLORS[s.name] || '#a1a1aa'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: '#fafafa' }}
                      formatter={(value: unknown, name?: string) => {
                        const match = slices.find(s => s.name === (name ?? ''))
                        return [`${value}% (${match?.count ?? ''})`, name ?? '']
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                {slices.map(s => (
                  <span key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PERF_COLORS[s.name] }} />
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
