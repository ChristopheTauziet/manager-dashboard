import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import compData from '../../../data/compensation.json'

const { currentSharePrice, baseSalary, grants, compHistory } = compData

const CURRENT_YEAR = 2026
const VESTING_YEARS = [2023, 2024, 2025, 2026, 2027]

const GRANT_COLORS: Record<string, string> = {
  'ES-4660': '#3b82f6',
  'ES-4731': '#8b5cf6',
  'ES-6438': '#22c55e',
  'ES-7316': '#eab308',
  'ES-8321': '#f97316',
}

const COMPANY_COLORS: Record<string, string> = {
  Lucca: '#6b7280',
  Parse: '#8b5cf6',
  Facebook: '#3b82f6',
  Uber: '#000000',
  Alto: '#f97316',
  Plaid: '#22c55e',
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return formatCurrency(n)
}

function SharePriceScenarios() {
  const [customPrice, setCustomPrice] = useState<string>('')

  const totalSharesThisYear = grants.reduce((sum, g) => {
    const v = g.vesting as unknown as Record<string, number>
    return sum + (v[String(CURRENT_YEAR)] || 0)
  }, 0)

  const scenarios = [
    { label: 'Current', price: currentSharePrice },
    { label: '+30%', price: Math.round(currentSharePrice * 1.3) },
    { label: '+69%', price: Math.round(currentSharePrice * 1.3 * 1.3) },
    { label: '+120%', price: Math.round(currentSharePrice * 1.3 * 1.3 * 1.3) },
  ]

  const parsedCustom = parseFloat(customPrice)
  if (parsedCustom > 0 && !scenarios.some(s => s.price === Math.round(parsedCustom))) {
    scenarios.push({ label: 'Custom', price: Math.round(parsedCustom) })
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 md:px-6 py-4 border-b border-border flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Current Compensation</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalSharesThisYear.toLocaleString()} shares vesting in {CURRENT_YEAR} &middot; Base {formatCurrency(baseSalary)}
          </p>
        </div>
        <div className="relative flex-shrink-0">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
          <input
            type="number"
            value={customPrice}
            onChange={e => setCustomPrice(e.target.value)}
            placeholder={String(currentSharePrice)}
            className="w-20 md:w-24 bg-background border border-border rounded-md pl-6 pr-2 py-1.5 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Component</th>
              {scenarios.map(s => (
                <th key={s.label} className="text-right text-xs font-medium text-muted-foreground px-6 py-3">
                  <div>{s.label}</div>
                  <div className="font-normal">${s.price}/share</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="px-6 py-3 text-sm">Base Salary</td>
              {scenarios.map(s => (
                <td key={s.label} className="px-6 py-3 text-sm text-right tabular-nums">{formatCurrency(baseSalary)}</td>
              ))}
            </tr>
            <tr className="border-b border-border">
              <td className="px-6 py-3 text-sm">
                Equity ({CURRENT_YEAR})
                <span className="text-xs text-muted-foreground ml-1">({totalSharesThisYear.toLocaleString()} shares)</span>
              </td>
              {scenarios.map(s => (
                <td key={s.label} className="px-6 py-3 text-sm text-right tabular-nums text-success">
                  {formatCurrency(totalSharesThisYear * s.price)}
                </td>
              ))}
            </tr>
            <tr className="bg-accent/20">
              <td className="px-6 py-3 text-sm font-semibold">Total Compensation</td>
              {scenarios.map(s => (
                <td key={s.label} className="px-6 py-3 text-sm text-right tabular-nums font-semibold text-primary">
                  {fmt(baseSalary + totalSharesThisYear * s.price)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EquityVesting() {
  const vestingByYear = VESTING_YEARS.map(year => {
    const row: Record<string, number | string> = { year: String(year) }
    let total = 0
    for (const g of grants) {
      const v = g.vesting as unknown as Record<string, number>
      const shares = v[String(year)] || 0
      row[g.id] = shares
      total += shares
    }
    row.total = total
    return row
  })

  const vestedByGrant = grants.map(g => {
    const v = g.vesting as unknown as Record<string, number>
    let vested = 0
    let remaining = 0
    for (const [yr, shares] of Object.entries(v)) {
      if (parseInt(yr) <= CURRENT_YEAR) {
        vested += shares
      } else {
        remaining += shares
      }
    }
    return { ...g, vested, remaining, total: g.totalShares }
  })

  const totalVested = vestedByGrant.reduce((s, g) => s + g.vested, 0)
  const totalShares = grants.reduce((s, g) => s + g.totalShares, 0)

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-lg font-semibold">Equity Vesting</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {totalVested.toLocaleString()} of {totalShares.toLocaleString()} shares vested &middot; {fmt(totalVested * currentSharePrice)} at ${currentSharePrice}
        </p>
      </div>

      <div className="px-6 py-4 space-y-3">
        {vestedByGrant.map(g => {
          const pct = g.total > 0 ? (g.vested / g.total) * 100 : 0
          return (
            <div key={g.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: GRANT_COLORS[g.id] }} />
                  <span className="text-sm font-medium">{g.id}</span>
                  <span className="text-xs text-muted-foreground">{g.label}</span>
                </div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {g.vested.toLocaleString()} / {g.total.toLocaleString()} shares ({pct.toFixed(0)}%)
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: GRANT_COLORS[g.id] }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-6 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground mb-3 font-medium">Shares vesting by year</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vestingByYear} barCategoryGap="20%">
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#a1a1aa' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => v.toLocaleString()}
                width={50}
              />
              <Tooltip
                cursor={false}
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#fafafa', fontWeight: 600, marginBottom: 4 }}
                itemStyle={{ color: '#a1a1aa', padding: '1px 0' }}
                formatter={(value: unknown, name: unknown) => {
                  const n = value as number
                  const nm = name as string
                  const grant = grants.find(g => g.id === nm)
                  return [`${n.toLocaleString()} shares (${fmt(n * currentSharePrice)})`, grant ? `${nm} – ${grant.label}` : nm]
                }}
              />
              {grants.map(g => (
                <Bar key={g.id} dataKey={g.id} stackId="a" fill={GRANT_COLORS[g.id]} radius={0} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function CompHistoryChart() {
  const data = useMemo(() => {
    return compHistory.map(c => ({
      year: String(c.year),
      company: c.company,
      base: c.base,
      bonus: c.bonus,
      equity: c.equity,
      total: c.base + c.bonus + c.equity,
    }))
  }, [])

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-lg font-semibold">Compensation History</h2>
      </div>
      <div className="px-6 py-4">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap="15%">
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#a1a1aa' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => fmt(v)}
                width={55}
              />
              <Tooltip
                cursor={false}
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#fafafa', fontWeight: 600, marginBottom: 4 }}
                itemStyle={{ color: '#a1a1aa', padding: '1px 0' }}
                formatter={(value: unknown) => formatCurrency(value as number)}
                labelFormatter={(label) => {
                  const item = data.find(d => d.year === label)
                  return item ? `${label} – ${item.company}` : label
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                iconType="square"
                iconSize={10}
              />
              <Bar dataKey="base" name="Base" stackId="a" radius={0}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={COMPANY_COLORS[entry.company] || '#6b7280'} fillOpacity={0.4} />
                ))}
              </Bar>
              <Bar dataKey="bonus" name="Bonus" stackId="a">
                {data.map((entry, i) => (
                  <Cell key={i} fill={COMPANY_COLORS[entry.company] || '#6b7280'} fillOpacity={0.65} />
                ))}
              </Bar>
              <Bar dataKey="equity" name="Equity" stackId="a">
                {data.map((entry, i) => (
                  <Cell key={i} fill={COMPANY_COLORS[entry.company] || '#6b7280'} fillOpacity={1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default function CompensationPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Compensation</h1>
      <SharePriceScenarios />
      <EquityVesting />
      <CompHistoryChart />
    </div>
  )
}
