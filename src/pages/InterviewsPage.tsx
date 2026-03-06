import { useState, useMemo, useCallback, Fragment } from 'react'
import { ChevronDown, ChevronRight, Filter, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import candidatesData from '../../data/candidates.json'

const ALL_STATUSES = ['All', 'Hired', 'Offer', 'Rejected'] as const

const RATING_OPTIONS = ['—', 'Strong Hire', 'Hire', 'No Hire', 'Strong No Hire'] as const
type Rating = (typeof RATING_OPTIONS)[number]

const statusStyles: Record<string, string> = {
  'Hired': 'bg-green-500/20 text-green-400',
  'Offer': 'bg-emerald-500/20 text-emerald-400',
  'Rejected': 'bg-red-500/20 text-red-400',
}

const ratingStyles: Record<string, string> = {
  'Strong Hire': 'text-green-400',
  'Hire': 'text-emerald-400',
  'No Hire': 'text-red-400',
  'Strong No Hire': 'text-red-400',
  '—': 'text-muted-foreground',
}

const STORAGE_KEY = 'interview-ratings'

function loadRatings(): Record<string, Rating> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch { return {} }
}

function saveRatings(ratings: Record<string, Rating>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings))
}

function inferRating(recommendation: string): Rating {
  if (!recommendation) return '—'
  const lower = recommendation.toLowerCase()
  if (lower.includes('strong hire') || lower.includes('4 -')) return 'Strong Hire'
  if (lower.includes('strong no') || lower.includes('1 -')) return 'Strong No Hire'
  if (lower.includes('no hire') || lower.includes('2 -')) return 'No Hire'
  if (lower.includes('hire') || lower.includes('3 -')) return 'Hire'
  return '—'
}

function renderBullets(text: string) {
  if (!text) return null
  const lines = text.split('\n').map(l => l.replace(/^-\s*/, '').trim()).filter(Boolean)
  if (lines.length === 0) return null
  return (
    <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80 leading-relaxed">
      {lines.map((line, i) => <li key={i}>{line}</li>)}
    </ul>
  )
}

export default function InterviewsPage() {
  const [statusFilter, setStatusFilter] = useState('All')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [ratingOverrides, setRatingOverrides] = useState<Record<string, Rating>>(loadRatings)

  const getRating = useCallback((candidate: { id: string; recommendation: string }): Rating => {
    if (ratingOverrides[candidate.id]) return ratingOverrides[candidate.id]
    return inferRating(candidate.recommendation)
  }, [ratingOverrides])

  const handleRatingChange = useCallback((id: string, value: Rating) => {
    setRatingOverrides(prev => {
      const next = { ...prev, [id]: value }
      saveRatings(next)
      return next
    })
  }, [])

  const filtered = useMemo(() => {
    let data = candidatesData as typeof candidatesData
    if (statusFilter !== 'All') {
      data = data.filter(c => c.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      data = data.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q)
      )
    }
    return data
  }, [statusFilter, search])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Interviews</h1>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-48"
          />
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
          <span className="text-xs text-muted-foreground">{filtered.length} candidates</span>
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
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Last Interview</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Rating</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(candidate => {
              const isExpanded = expandedId === candidate.id
              const rating = getRating(candidate)
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
                    <td className="px-5 py-3 text-sm text-muted-foreground hidden md:table-cell">
                      {candidate.last_activity_date ? formatDate(candidate.last_activity_date) : '—'}
                    </td>
                    <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                      <select
                        value={rating}
                        onChange={e => handleRatingChange(candidate.id, e.target.value as Rating)}
                        className={cn(
                          'text-sm font-medium bg-transparent border border-transparent hover:border-border rounded px-1.5 py-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none',
                          ratingStyles[rating]
                        )}
                        style={{ WebkitAppearance: 'none' }}
                      >
                        {RATING_OPTIONS.map(opt => (
                          <option key={opt} value={opt} className="bg-card text-foreground">{opt}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} className="bg-muted/30 px-5 py-4">
                        <div className="space-y-5 max-w-4xl">
                          {candidate.debrief_notes && (
                            <div className="bg-card/50 border border-border/50 rounded-lg p-4">
                              <h3 className="text-sm font-semibold mb-2">Debrief Summary</h3>
                              {candidate.recommendation && (
                                <p className="text-xs text-muted-foreground mb-2">Original rating: {candidate.recommendation}</p>
                              )}
                              <p className="text-sm text-foreground/80 leading-relaxed">{candidate.debrief_notes}</p>
                            </div>
                          )}

                          <div>
                            <h3 className="text-sm font-semibold mb-3">
                              Interview Rounds ({candidate.interview_rounds.length})
                            </h3>
                            <div className="space-y-3">
                              {candidate.interview_rounds.map((round, i) => (
                                <div key={i} className="bg-card/50 border border-border/50 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium">{round.round_name}</span>
                                    {round.date && (
                                      <span className="text-xs text-muted-foreground">{formatDate(round.date)}</span>
                                    )}
                                  </div>

                                  {round.did_well && (
                                    <div className="mb-3">
                                      <div className="flex items-center gap-1.5 mb-1.5">
                                        <ThumbsUp className="h-3.5 w-3.5 text-green-400" />
                                        <span className="text-xs font-medium text-green-400 uppercase tracking-wider">Did well</span>
                                      </div>
                                      {renderBullets(round.did_well)}
                                    </div>
                                  )}

                                  {round.did_not_well && (
                                    <div className="mb-3">
                                      <div className="flex items-center gap-1.5 mb-1.5">
                                        <ThumbsDown className="h-3.5 w-3.5 text-red-400" />
                                        <span className="text-xs font-medium text-red-400 uppercase tracking-wider">Did not do well</span>
                                      </div>
                                      {renderBullets(round.did_not_well)}
                                    </div>
                                  )}

                                  {round.thoughts && (
                                    <div>
                                      <div className="flex items-center gap-1.5 mb-1.5">
                                        <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                                        <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">Thoughts</span>
                                      </div>
                                      <p className="text-sm text-foreground/80 leading-relaxed">{round.thoughts}</p>
                                    </div>
                                  )}
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
