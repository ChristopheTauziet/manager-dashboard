import { useState, useMemo, Fragment } from 'react'
import { ChevronDown, ChevronRight, Filter } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import candidatesData from '../../data/candidates.json'

const ALL_STATUSES = ['All', 'Active', 'Offer', 'Hired', 'Rejected'] as const

const statusStyles: Record<string, string> = {
  'Active': 'bg-blue-500/20 text-blue-400',
  'Offer': 'bg-emerald-500/20 text-emerald-400',
  'Hired': 'bg-green-500/20 text-green-400',
  'Rejected': 'bg-red-500/20 text-red-400',
}

const recStyles: Record<string, string> = {
  'Strong yes': 'text-green-400',
  'Yes': 'text-emerald-400',
  'Pending': 'text-yellow-400',
  'No': 'text-red-400',
}

export default function InterviewsPage() {
  const [statusFilter, setStatusFilter] = useState('All')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (statusFilter === 'All') return candidatesData
    return candidatesData.filter(c => c.status === statusFilter)
  }, [statusFilter])

  const COL_COUNT = 6

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Interviews</h1>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {ALL_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="w-8 px-5 py-3"></th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Candidate</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Role</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Last Activity</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Rec</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(candidate => {
              const isExpanded = expandedId === candidate.id
              return (
                <Fragment key={candidate.id}>
                  <tr
                    className="border-b border-border hover:bg-accent/30 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : candidate.id)}
                  >
                    <td className="px-5 py-3 text-muted-foreground">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </td>
                    <td className="px-5 py-3 font-medium">{candidate.name}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground hidden sm:table-cell">{candidate.role}</td>
                    <td className="px-5 py-3">
                      <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', statusStyles[candidate.status] || 'bg-muted text-muted-foreground')}>
                        {candidate.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground hidden md:table-cell">{formatDate(candidate.last_activity_date)}</td>
                    <td className="px-5 py-3">
                      <span className={cn('text-sm font-medium', recStyles[candidate.recommendation] || 'text-muted-foreground')}>
                        {candidate.recommendation}
                      </span>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={COL_COUNT} className="bg-muted/30 px-5 py-4">
                        <div className="space-y-4 max-w-3xl">
                          <div>
                            <p className="text-sm text-muted-foreground">Applied {formatDate(candidate.applied_date)}</p>
                            <p className="text-sm mt-1 text-foreground/90">{candidate.overall_notes}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold mb-3">Interview Rounds</h3>
                            <div className="space-y-3">
                              {candidate.interview_rounds.map((round, i) => (
                                <div key={i} className="bg-card/50 border border-border/50 rounded-lg p-4">
                                  <div className="flex items-start justify-between gap-4 mb-2">
                                    <div>
                                      <span className="text-sm font-medium">{round.round_name}</span>
                                      <span className="text-xs text-muted-foreground ml-2">with {round.interviewer}</span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                      <span className="text-xs text-muted-foreground">{formatDate(round.date)}</span>
                                      <span className={cn(
                                        'text-xs font-medium px-2 py-0.5 rounded',
                                        round.recommendation.toLowerCase().includes('advance')
                                          ? 'bg-green-500/20 text-green-400'
                                          : round.recommendation.toLowerCase().includes('reject')
                                            ? 'bg-red-500/20 text-red-400'
                                            : 'bg-muted text-muted-foreground'
                                      )}>
                                        {round.recommendation}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-foreground/80 leading-relaxed">{round.notes}</p>
                                </div>
                              ))}
                            </div>
                          </div>
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
