import { useState, Fragment } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import archiveData from '../../data/team_archive.json'

const LEVEL_COLORS: Record<string, string> = {
  L4: 'bg-zinc-600 text-zinc-200',
  L5: 'bg-blue-600/70 text-blue-100',
  L6: 'bg-purple-600/70 text-purple-100',
  L7: 'bg-amber-600/70 text-amber-100',
}

const PERF_STYLES: Record<string, string> = {
  'Exceptional': 'text-green-400',
  'Very Strong': 'text-emerald-400',
  'Strong': 'text-foreground/70',
  'High': 'text-emerald-400',
  'Inconsistent': 'text-red-400',
}

const EMPTY_COMP = { base_salary: 0, equity_value: 0, total_comp: 0, perf_rating: '', notes: '', year: 0 }

function latestComp(member: typeof archiveData[0]) {
  return member.compensation[member.compensation.length - 1] ?? EMPTY_COMP
}

export default function ArchivePage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const sorted = [...archiveData].sort((a, b) => b.level.localeCompare(a.level) || a.name.localeCompare(b.name))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Archive</h1>
        <p className="text-sm text-muted-foreground mt-1">{archiveData.length} former team members</p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 w-8"></th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Level</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Location</th>
              <th className="text-right px-5 py-3"><span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Base</span></th>
              <th className="text-right px-5 py-3"><span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Total Comp</span></th>
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
                      <div className="text-xs text-muted-foreground sm:hidden">{member.location}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn('inline-block text-xs font-medium px-2 py-0.5 rounded', LEVEL_COLORS[member.level] || 'bg-accent text-accent-foreground')}>
                        {member.level}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground hidden sm:table-cell">{member.location}</td>
                    <td className="px-5 py-3 text-right text-sm tabular-nums">{latest.base_salary ? formatCurrency(latest.base_salary) : '—'}</td>
                    <td className="px-5 py-3 text-right text-sm font-medium tabular-nums">{latest.total_comp ? formatCurrency(latest.total_comp) : '—'}</td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} className="bg-muted/30 px-5 py-4">
                        <div className="overflow-x-auto">
                          <div className="flex items-baseline gap-4 mb-3 flex-wrap">
                            <h3 className="text-sm font-semibold">Comp History — {member.name}</h3>
                            <span className="text-xs text-muted-foreground">Started {member.start_date.slice(0, 4)}</span>
                            {member.last_promo && member.last_promo !== 'No promo yet' && (
                              <span className="text-xs text-muted-foreground">Last promo: {member.last_promo}</span>
                            )}
                          </div>
                          {member.compensation.length > 0 ? (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-muted-foreground text-xs uppercase tracking-wider">
                                  <th className="text-left pb-2">Year</th>
                                  <th className="text-left pb-2">Perf Rating</th>
                                  <th className="text-right pb-2">Base</th>
                                  <th className="text-right pb-2">Equity</th>
                                  <th className="text-right pb-2">Total Comp</th>
                                  <th className="text-left pb-2 pl-4">Notes</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[...member.compensation].reverse().map(c => (
                                  <tr key={c.year} className="border-t border-border/50">
                                    <td className="py-2 tabular-nums">{c.year}</td>
                                    <td className={cn('py-2 text-sm font-medium', PERF_STYLES[c.perf_rating] || 'text-muted-foreground')}>
                                      {c.perf_rating || '—'}
                                    </td>
                                    <td className="py-2 text-right tabular-nums">{formatCurrency(c.base_salary)}</td>
                                    <td className="py-2 text-right tabular-nums">{formatCurrency(c.equity_value)}</td>
                                    <td className="py-2 text-right tabular-nums font-medium">{formatCurrency(c.total_comp)}</td>
                                    <td className="py-2 pl-4 text-muted-foreground">{c.notes}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No compensation data available.</p>
                          )}
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
    </div>
  )
}
