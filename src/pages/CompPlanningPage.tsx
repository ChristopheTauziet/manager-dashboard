import { useState, useMemo } from 'react'
import { ArrowUpDown, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import compData from '../../data/comp_planning.json'

type SortKey = 'name' | 'level' | 'current_base' | 'new_base' | 'base_pct' | 'current_total_comp' | 'new_total_comp' | 'total_pct' | 'new_total_comp_y2' | 'total_pct_y2'
type SortDir = 'asc' | 'desc'

const LEVEL_COLORS: Record<string, string> = {
  'Level 4': 'bg-zinc-600 text-zinc-200',
  'Level 5': 'bg-blue-600/70 text-blue-100',
  'Level 6': 'bg-purple-600/70 text-purple-100',
  'Level 7': 'bg-amber-600/70 text-amber-100',
}

function levelShort(level: string) {
  return level.replace('Level ', 'L')
}

function pctChange(from: number, to: number): number {
  if (!from) return 0
  return ((to - from) / from) * 100
}

function PctBadge({ pct }: { pct: number }) {
  if (Math.abs(pct) < 0.05) {
    return <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Minus className="h-3 w-3" />0%</span>
  }
  const isUp = pct > 0
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', isUp ? 'text-emerald-400' : 'text-red-400')}>
      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
    </span>
  )
}

export default function CompPlanningPage({ showSensitive }: { showSensitive: boolean }) {
  const [sortKey, setSortKey] = useState<SortKey>('level')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
  }

  const enriched = useMemo(() => {
    return compData.map(r => ({
      ...r,
      base_pct: pctChange(r.current_base, r.new_base),
      total_pct: pctChange(r.current_total_comp, r.new_total_comp),
      total_pct_y2: pctChange(r.current_total_comp, r.new_total_comp_y2),
    }))
  }, [])

  const sorted = useMemo(() => {
    return [...enriched].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name': cmp = a.name.localeCompare(b.name); break
        case 'level': cmp = a.level.localeCompare(b.level); break
        case 'current_base': cmp = a.current_base - b.current_base; break
        case 'new_base': cmp = a.new_base - b.new_base; break
        case 'base_pct': cmp = a.base_pct - b.base_pct; break
        case 'current_total_comp': cmp = a.current_total_comp - b.current_total_comp; break
        case 'new_total_comp': cmp = a.new_total_comp - b.new_total_comp; break
        case 'total_pct': cmp = a.total_pct - b.total_pct; break
        case 'new_total_comp_y2': cmp = a.new_total_comp_y2 - b.new_total_comp_y2; break
        case 'total_pct_y2': cmp = a.total_pct_y2 - b.total_pct_y2; break
      }
      if (cmp === 0) cmp = a.name.localeCompare(b.name)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [sortKey, sortDir, enriched])

  const SortHeader = ({ label, field, align = 'left' }: { label: string; field: SortKey; align?: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className={cn(
        'flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors',
        align === 'right' && 'ml-auto'
      )}
    >
      {label}
      <ArrowUpDown className={cn('h-3 w-3', sortKey === field && 'text-primary')} />
    </button>
  )

  const totalCurrentBase = enriched.reduce((s, r) => s + r.current_base, 0)
  const totalNewBase = enriched.reduce((s, r) => s + r.new_base, 0)
  const totalCurrentComp = enriched.reduce((s, r) => s + r.current_total_comp, 0)
  const totalNewComp = enriched.reduce((s, r) => s + r.new_total_comp, 0)
  const promoCount = enriched.filter(r => r.promotion).length

  if (!showSensitive) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold">Compensation Planning</h1>
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground">Enable sensitive data visibility to view compensation planning.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Compensation Planning</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground mb-1">Employees</p>
          <p className="text-3xl font-bold">{enriched.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{promoCount} promotion{promoCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground mb-1">Base Increase</p>
          <p className="text-2xl font-bold">{formatCurrency(totalNewBase - totalCurrentBase)}</p>
          <PctBadge pct={pctChange(totalCurrentBase, totalNewBase)} />
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground mb-1">Total Comp Increase</p>
          <p className="text-2xl font-bold">{formatCurrency(totalNewComp - totalCurrentComp)}</p>
          <PctBadge pct={pctChange(totalCurrentComp, totalNewComp)} />
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground mb-1">New Total Spend</p>
          <p className="text-2xl font-bold">{formatCurrency(totalNewComp)}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3"><SortHeader label="Name" field="name" /></th>
                <th className="text-left px-4 py-3"><SortHeader label="Level" field="level" /></th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Perf</th>
                <th className="text-right px-4 py-3"><div className="flex justify-end"><SortHeader label="Current Base" field="current_base" align="right" /></div></th>
                <th className="text-right px-4 py-3"><div className="flex justify-end"><SortHeader label="New Base" field="new_base" align="right" /></div></th>
                <th className="text-right px-4 py-3"><div className="flex justify-end"><SortHeader label="Δ%" field="base_pct" align="right" /></div></th>
                <th className="text-right px-4 py-3"><div className="flex justify-end"><SortHeader label="Current Total" field="current_total_comp" align="right" /></div></th>
                <th className="text-right px-4 py-3"><div className="flex justify-end"><SortHeader label="Y1 Total" field="new_total_comp" align="right" /></div></th>
                <th className="text-right px-4 py-3"><div className="flex justify-end"><SortHeader label="Δ%" field="total_pct" align="right" /></div></th>
                <th className="text-right px-4 py-3"><div className="flex justify-end"><SortHeader label="Y2 Total" field="new_total_comp_y2" align="right" /></div></th>
                <th className="text-right px-4 py-3"><div className="flex justify-end"><SortHeader label="Δ%" field="total_pct_y2" align="right" /></div></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(r => (
                <tr key={r.name} className="border-b border-border hover:bg-accent/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium">{r.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-muted-foreground">{r.zone}</span>
                      {r.promotion && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                          Promoted
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-block text-xs font-medium px-2 py-0.5 rounded', LEVEL_COLORS[r.level] || 'bg-accent text-accent-foreground')}>
                      {levelShort(r.level)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{r.perf_score || '—'}</td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-muted-foreground">{formatCurrency(r.current_base)}</td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums font-medium">{formatCurrency(r.new_base)}</td>
                  <td className="px-4 py-3 text-right"><PctBadge pct={r.base_pct} /></td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-muted-foreground">{formatCurrency(r.current_total_comp)}</td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums font-medium">{formatCurrency(r.new_total_comp)}</td>
                  <td className="px-4 py-3 text-right"><PctBadge pct={r.total_pct} /></td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums font-medium">{formatCurrency(r.new_total_comp_y2)}</td>
                  <td className="px-4 py-3 text-right"><PctBadge pct={r.total_pct_y2} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
