import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn, daysSince, formatDate } from '@/lib/utils'
import teamData from '../../data/team.json'
import oneOnOnesData from '../../data/one_on_ones.json'

interface Meeting {
  id: string
  team_member_id: string
  team_member_name: string
  date: string
  notes: string
  next_steps: string
}

export default function OneOnOnesPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const memberSummaries = useMemo(() => {
    return teamData.map(member => {
      const meetings = (oneOnOnesData as Meeting[])
        .filter(m => m.team_member_id === member.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      const latest = meetings[0]
      const days = latest ? daysSince(latest.date) : Infinity
      return { member, meetings, latest, days }
    }).sort((a, b) => b.days - a.days)
  }, [])

  const statusColor = (days: number) => {
    if (days <= 7) return 'bg-success'
    if (days <= 14) return 'bg-warning'
    return 'bg-destructive'
  }

  const statusText = (days: number) => {
    if (days === Infinity) return 'Never'
    return `${days}d ago`
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">1:1 Tracker</h1>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {memberSummaries.map(({ member, meetings, latest, days }) => {
          const isExpanded = expandedId === member.id
          return (
            <div key={member.id} className="border-b border-border last:border-b-0">
              <button
                onClick={() => setExpandedId(isExpanded ? null : member.id)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-accent/30 transition-colors text-left"
              >
                <span className="text-muted-foreground">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </span>
                <span className="font-medium flex-1">{member.name}</span>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {latest ? formatDate(latest.date) : 'No meetings'}
                </span>
                <span className={cn(
                  'text-xs font-medium px-2.5 py-1 rounded-full text-white',
                  statusColor(days)
                )}>
                  {statusText(days)}
                </span>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 space-y-4">
                  {meetings.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No 1:1s recorded yet.</p>
                  ) : (
                    meetings.map(meeting => (
                      <div key={meeting.id} className="bg-muted/30 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">{formatDate(meeting.date)}</span>
                          <span className="text-xs text-muted-foreground">{daysSince(meeting.date)}d ago</span>
                        </div>
                        <p className="text-sm text-foreground/90 leading-relaxed">{meeting.notes}</p>
                        {meeting.next_steps && (
                          <div className="text-sm">
                            <span className="text-muted-foreground font-medium">Next steps: </span>
                            <span className="text-foreground/80">{meeting.next_steps}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
