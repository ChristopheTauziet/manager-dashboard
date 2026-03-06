import { useMemo } from 'react'
import { cn, formatDate } from '@/lib/utils'
import teamData from '../../data/team.json'
import oneOnOnesData from '../../data/one_on_ones.json'

const CADENCE: Record<string, { weeks: number; graceWeeks: number; label: string }> = {
  direct_report: { weeks: 2, graceWeeks: 1, label: 'Every 2 weeks' },
  skip:          { weeks: 6, graceWeeks: 2, label: 'Every 6 weeks' },
  designer:      { weeks: 12, graceWeeks: 2, label: 'Every 12 weeks' },
}

function weeksBetween(from: string, to: Date): number {
  const diff = to.getTime() - new Date(from).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 7))
}

function weeksUntil(dateStr: string, from: Date): number {
  const diff = new Date(dateStr).getTime() - from.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24 * 7))
}

export default function OneOnOnesPage() {
  const now = new Date()

  const rows = useMemo(() => {
    return teamData.map(member => {
      const entry = oneOnOnesData.find(o => o.team_member_id === member.id)
      const cadence = CADENCE[member.relationship] ?? CADENCE.designer
      const lastDate = entry?.last_one_on_one ?? null
      const nextDate = entry?.next_one_on_one ?? null

      const weeksSinceLast = lastDate ? weeksBetween(lastDate, now) : Infinity
      const weeksToNext = nextDate ? weeksUntil(nextDate, now) : Infinity

      const overdue = weeksSinceLast > cadence.weeks
      const noUpcoming = weeksToNext > cadence.graceWeeks
      const isRed = overdue && noUpcoming

      return { member, lastDate, nextDate, weeksSinceLast, weeksToNext, cadence, isRed }
    }).sort((a, b) => {
      if (a.isRed !== b.isRed) return a.isRed ? -1 : 1
      return b.weeksSinceLast - a.weeksSinceLast
    })
  }, [now])

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">1:1 Tracker</h1>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Relationship</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Cadence</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Last 1:1</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Weeks Since</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Next 1:1</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Weeks Until</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ member, lastDate, nextDate, weeksSinceLast, weeksToNext, cadence, isRed }) => (
              <tr key={member.id} className={cn('border-b border-border transition-colors', isRed && 'bg-red-500/5')}>
                <td className="px-5 py-4">
                  <div className="font-medium">{member.name}</div>
                  <div className="text-xs text-muted-foreground sm:hidden">
                    {cadence.label}
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground hidden sm:table-cell">
                  {member.relationship === 'direct_report' ? 'Direct report' :
                   member.relationship === 'skip' ? 'Skip' : 'Designer'}
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground hidden sm:table-cell">{cadence.label}</td>
                <td className="px-5 py-4 text-sm">
                  {lastDate ? formatDate(lastDate) : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-5 py-4 text-center">
                  <span className={cn(
                    'text-sm font-medium px-2.5 py-1 rounded-full',
                    isRed
                      ? 'bg-red-500/20 text-red-400'
                      : weeksSinceLast > cadence.weeks
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-green-500/20 text-green-400'
                  )}>
                    {weeksSinceLast === Infinity ? '—' : `${weeksSinceLast}w`}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm">
                  {nextDate ? formatDate(nextDate) : <span className="text-muted-foreground">Not scheduled</span>}
                </td>
                <td className="px-5 py-4 text-center">
                  {nextDate ? (
                    <span className={cn(
                      'text-sm font-medium',
                      weeksToNext <= 0 ? 'text-muted-foreground' : 'text-foreground'
                    )}>
                      {weeksToNext <= 0 ? 'This week' : `${weeksToNext}w`}
                    </span>
                  ) : (
                    <span className={cn('text-sm font-medium', isRed ? 'text-red-400' : 'text-muted-foreground')}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
