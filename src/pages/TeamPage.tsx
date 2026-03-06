import { useState, useMemo } from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, YAxis,
  BarChart, Bar, XAxis, CartesianGrid,
} from 'recharts'
import { ChevronDown, ChevronRight, ArrowUpDown } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import teamData from '../../data/team.json'

type SortKey = 'name' | 'level' | 'base_salary' | 'total_comp'
type SortDir = 'asc' | 'desc'

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4']

function latestComp(member: typeof teamData[0]) {
  return member.compensation[member.compensation.length - 1]
}

export default function TeamPage() {
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    return [...teamData].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name)
          break
        case 'level':
          cmp = a.level.localeCompare(b.level)
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
  }, [sortKey, sortDir])

  const genderData = useMemo(() => {
    const counts: Record<string, number> = {}
    teamData.forEach(m => { counts[m.gender] = (counts[m.gender] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [])

  const locationData = useMemo(() => {
    const counts: Record<string, number> = {}
    teamData.forEach(m => { counts[m.location] = (counts[m.location] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
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

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Team</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Team size */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground mb-1">Team Size</p>
          <p className="text-3xl font-bold">{teamData.length}</p>
        </div>

        {/* Gender */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground mb-2">Gender</p>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genderData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={48} paddingAngle={3} strokeWidth={0}>
                  {genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#fafafa' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-3 justify-center mt-1">
            {genderData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {d.name}
              </span>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground mb-2">Location</p>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={locationData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={48} paddingAngle={3} strokeWidth={0}>
                  {locationData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#fafafa' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-3 justify-center mt-1">
            {locationData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {d.name}
              </span>
            ))}
          </div>
        </div>

        {/* Level breakdown */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground mb-2">Levels</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={levelData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} width={20} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Team table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 w-8"></th>
              <th className="text-left px-5 py-3"><SortHeader label="Name" field="name" /></th>
              <th className="text-left px-5 py-3 hidden sm:table-cell"><span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</span></th>
              <th className="text-left px-5 py-3"><SortHeader label="Level" field="level" /></th>
              <th className="text-right px-5 py-3"><SortHeader label="Base" field="base_salary" /></th>
              <th className="text-right px-5 py-3"><SortHeader label="Total Comp" field="total_comp" /></th>
              <th className="text-center px-5 py-3 w-28"><span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Trend</span></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(member => {
              const latest = latestComp(member)
              const isExpanded = expandedId === member.id
              const sparkData = member.compensation.map(c => ({ v: c.total_comp }))
              return (
                <tbody key={member.id}>
                  <tr
                    className="border-b border-border hover:bg-accent/30 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : member.id)}
                  >
                    <td className="px-5 py-3 text-muted-foreground">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{member.name}</div>
                      <div className="text-xs text-muted-foreground">{member.location}</div>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground hidden sm:table-cell">{member.role}</td>
                    <td className="px-5 py-3">
                      <span className="inline-block bg-accent text-accent-foreground text-xs font-medium px-2 py-0.5 rounded">{member.level}</span>
                    </td>
                    <td className="px-5 py-3 text-right text-sm tabular-nums">{formatCurrency(latest.base_salary)}</td>
                    <td className="px-5 py-3 text-right text-sm font-medium tabular-nums">{formatCurrency(latest.total_comp)}</td>
                    <td className="px-5 py-3">
                      <div className="h-8 w-24 mx-auto">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={sparkData}>
                            <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} dot={false} />
                            <YAxis hide domain={['dataMin - 10000', 'dataMax + 10000']} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} className="bg-muted/30 px-5 py-4">
                        <div className="max-w-2xl">
                          <h3 className="text-sm font-semibold mb-3">Compensation History — {member.name}</h3>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-muted-foreground text-xs uppercase tracking-wider">
                                <th className="text-left pb-2">Year</th>
                                <th className="text-right pb-2">Base</th>
                                <th className="text-right pb-2">Bonus Target</th>
                                <th className="text-right pb-2">Equity</th>
                                <th className="text-right pb-2">Total</th>
                                <th className="text-left pb-2 pl-4">Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...member.compensation].reverse().map(c => (
                                <tr key={c.year} className="border-t border-border/50">
                                  <td className="py-2 tabular-nums">{c.year}</td>
                                  <td className="py-2 text-right tabular-nums">{formatCurrency(c.base_salary)}</td>
                                  <td className="py-2 text-right tabular-nums">{formatCurrency(c.bonus_target)}</td>
                                  <td className="py-2 text-right tabular-nums">{formatCurrency(c.equity_value)}</td>
                                  <td className="py-2 text-right tabular-nums font-medium">{formatCurrency(c.total_comp)}</td>
                                  <td className="py-2 pl-4 text-muted-foreground">{c.notes}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
