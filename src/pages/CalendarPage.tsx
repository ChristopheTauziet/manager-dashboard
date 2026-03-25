import { useState, useMemo, useCallback } from 'react'
import { RefreshCw, Lock, AlertTriangle, Calendar, Zap, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import insightsData from '../../data/calendar-insights.json'
import snapshotData from '../../data/calendar-snapshot.json'

// ── Color map ──────────────────────────────────────────────────────────────────

const MEETING_COLORS: Record<string, { label: string; hex: string }> = {
  zach:        { label: 'Zach',         hex: '#D50000' },
  direct_1on1: { label: 'Direct 1:1',   hex: '#F4511E' },
  skip_1on1:   { label: 'Skip 1:1',     hex: '#0F9D58' },
  design_1on1: { label: 'Design 1:1',   hex: '#33B679' },
  review:      { label: 'Review',       hex: '#E67C73' },
  interview:   { label: 'Interview',    hex: '#F6BF26' },
  xfn:         { label: 'XFN',          hex: '#8E24AA' },
  focus:       { label: 'Focus / Hold', hex: '#757575' },
  one_off:     { label: 'Other',        hex: '#7986CB' },
}

const MEETING_TYPE_ORDER = ['zach', 'direct_1on1', 'skip_1on1', 'design_1on1', 'review', 'interview', 'xfn', 'one_off']

const SATURATION_STYLES: Record<string, string> = {
  low: 'bg-zinc-700 text-zinc-300',
  medium: 'bg-blue-600/40 text-blue-300',
  high: 'bg-amber-600/40 text-amber-300',
  overloaded: 'bg-red-600/40 text-red-300',
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface Breakdown {
  count: number
  hours: number
  names?: string[]
}

interface VisibilityFlag {
  title: string
  visibility: string
}

interface RescheduleOpp {
  meeting: string
  currentWeek: string
  suggestedWeek: string
  reason: string
}

interface Week {
  weekNumber: number
  startDate: string
  endDate: string
  label: string
  saturation: string
  totalMeetings: number
  meetingHours: number
  focusHours: number
  deepWorkHours: number
  breakdown: Record<string, Breakdown>
  visibilityFlags: VisibilityFlag[]
  rescheduleOpportunities: RescheduleOpp[]
}

interface CalendarEvent {
  id: string
  title: string
  date: string
  startTime: string | null
  endTime: string | null
  durationMinutes: number
  isAllDay: boolean
  isRecurring: boolean
  visibility: string
  myResponseStatus: string
  meetingType: string
  humanAttendees: { email: string; displayName: string; responseStatus: string; self?: boolean }[]
  roomAttendees: { email: string; displayName: string; responseStatus: string }[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function truncate(s: string, max = 40) {
  return s.length > max ? s.slice(0, max) + '…' : s
}

function formatDayTime(date: string, startTime: string | null) {
  const d = new Date(date + 'T00:00:00')
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]
  return startTime ? `${day} ${startTime}` : day
}

function getMonday(d: Date): Date {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.getFullYear(), d.getMonth(), diff)
}

function getSunday(d: Date): Date {
  const mon = getMonday(d)
  return new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6)
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function isStale(generatedAt: string): boolean {
  const gen = new Date(generatedAt).getTime()
  return Date.now() - gen > 48 * 60 * 60 * 1000
}

function stripRoomPrefix(name: string): string {
  return name.replace(/^HQ-\d+-/, '')
}

function getNextWeekday(targetDay: number): string {
  const now = new Date()
  const today = now.getDay()
  let diff = targetDay - today
  if (diff <= 0) diff += 7
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff)
  return dateStr(d)
}

// ── Widget 1: Weekly Meeting Distribution ──────────────────────────────────────

function WeeklyDistribution({ weeks }: { weeks: Week[] }) {
  const display = weeks.slice(0, 4)
  const [hoveredSegment, setHoveredSegment] = useState<{ weekIdx: number; type: string; x: number; y: number } | null>(null)
  const [expandedResched, setExpandedResched] = useState<number | null>(null)

  const activeTypes = useMemo(() => {
    const types = new Set<string>()
    display.forEach(w => {
      MEETING_TYPE_ORDER.forEach(t => {
        const b = w.breakdown[t]
        if (b && b.count > 0) types.add(t)
      })
    })
    return MEETING_TYPE_ORDER.filter(t => types.has(t))
  }, [display])

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <h2 className="text-lg font-semibold">Weekly Meeting Distribution</h2>

      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {activeTypes.map(t => (
          <span key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: MEETING_COLORS[t]?.hex }} />
            {MEETING_COLORS[t]?.label}
          </span>
        ))}
      </div>

      <div className="space-y-3">
        {display.map((week, wIdx) => {
          const maxHours = Math.max(...display.map(w => MEETING_TYPE_ORDER.reduce((s, t) => s + (w.breakdown[t]?.hours || 0), 0)))
          const meetingHours = MEETING_TYPE_ORDER.reduce((s, t) => s + (week.breakdown[t]?.hours || 0), 0)

          return (
            <div key={week.weekNumber} className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-32 flex-shrink-0 tabular-nums">{week.label}</span>

                <div className="flex-1 flex h-6 rounded overflow-hidden bg-muted/30 relative">
                  {MEETING_TYPE_ORDER.map(type => {
                    const b = week.breakdown[type]
                    if (!b || b.hours <= 0) return null
                    const pct = maxHours > 0 ? (b.hours / maxHours) * 100 : 0
                    return (
                      <div
                        key={type}
                        className="h-full relative cursor-default transition-opacity hover:opacity-80"
                        style={{ width: `${pct}%`, backgroundColor: MEETING_COLORS[type]?.hex }}
                        onMouseEnter={(e) => setHoveredSegment({ weekIdx: wIdx, type, x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setHoveredSegment(null)}
                      />
                    )
                  })}
                </div>

                <span className="text-sm font-bold tabular-nums w-12 text-right">{meetingHours.toFixed(1)}h</span>
                <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', SATURATION_STYLES[week.saturation] || 'bg-muted text-muted-foreground')}>
                  {week.saturation}
                </span>
              </div>

              <div className="flex items-center gap-4 pl-32 ml-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {week.totalMeetings}
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" /> {week.deepWorkHours}h deep work
                </span>
                {week.rescheduleOpportunities.length > 0 && (
                  <button
                    onClick={() => setExpandedResched(expandedResched === wIdx ? null : wIdx)}
                    className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" /> {week.rescheduleOpportunities.length} reschedule
                  </button>
                )}
              </div>

              {expandedResched === wIdx && week.rescheduleOpportunities.length > 0 && (
                <div className="ml-[8.5rem] pl-3 space-y-1 py-1">
                  {week.rescheduleOpportunities.map((r, i) => (
                    <div key={i} className="text-[11px] text-muted-foreground bg-muted/30 rounded px-2.5 py-1.5">
                      <span className="font-medium text-foreground/80">{r.meeting}</span>
                      <span className="mx-1">→</span>
                      <span>{r.suggestedWeek}</span>
                      <span className="text-muted-foreground/60 ml-2">({r.reason})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {hoveredSegment && (() => {
        const week = display[hoveredSegment.weekIdx]
        const b = week.breakdown[hoveredSegment.type]
        if (!b) return null
        return (
          <div
            className="fixed z-[100] bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-lg pointer-events-none"
            style={{ left: hoveredSegment.x + 12, top: hoveredSegment.y - 10 }}
          >
            <div className="font-medium text-foreground mb-1">{MEETING_COLORS[hoveredSegment.type]?.label}</div>
            <div className="text-muted-foreground">{b.count} meeting{b.count !== 1 ? 's' : ''} · {b.hours}h</div>
            {b.names && b.names.length > 0 && (
              <div className="text-muted-foreground/70 mt-1">{b.names.join(', ')}</div>
            )}
          </div>
        )
      })()}
    </div>
  )
}

// ── Widget 2: Privacy & Holds Check ────────────────────────────────────────────

function PrivacyHoldsCheck({ events }: { events: CalendarEvent[] }) {
  const now = new Date()
  const monStr = dateStr(getMonday(now))
  const sunStr = dateStr(getSunday(now))

  const thisWeek = useMemo(() =>
    events.filter(e =>
      e.date >= monStr && e.date <= sunStr &&
      !e.isAllDay &&
      e.myResponseStatus !== 'declined'
    ), [events, monStr, sunStr])

  const privateEvents = thisWeek.filter(e => e.visibility === 'private')
  const nonPrivateHolds = thisWeek.filter(e => e.meetingType === 'focus' && e.visibility !== 'private')

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h2 className="text-lg font-semibold mb-4">Privacy & Holds Check</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Private Meetings</h3>
          {privateEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground/60 italic">No private meetings this week</p>
          ) : (
            <div className="space-y-2">
              {privateEvents.map(e => (
                <div key={e.id} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: MEETING_COLORS[e.meetingType]?.hex || '#757575' }} />
                  <span className="text-muted-foreground tabular-nums w-16 flex-shrink-0">{formatDayTime(e.date, e.startTime)}</span>
                  <span className="truncate" title={e.title}>{truncate(e.title)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Holds Not Set to Private</h3>
          {nonPrivateHolds.length === 0 ? (
            <p className="text-sm text-emerald-400/80 italic">All holds are private ✓</p>
          ) : (
            <div className="space-y-2">
              {nonPrivateHolds.map(e => (
                <div key={e.id} className="flex items-center gap-2 text-sm">
                  <Lock className="h-3 w-3 text-amber-400 flex-shrink-0" />
                  <span className="text-muted-foreground tabular-nums w-16 flex-shrink-0">{formatDayTime(e.date, e.startTime)}</span>
                  <span className="truncate" title={e.title}>{truncate(e.title)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Widget 3: Room Check ───────────────────────────────────────────────────────

function RoomCheck({ events }: { events: CalendarEvent[] }) {
  const nextTue = getNextWeekday(2)
  const nextThu = getNextWeekday(4)

  const filterDay = useCallback((day: string) =>
    events.filter(e =>
      e.date === day &&
      !e.isAllDay &&
      e.myResponseStatus !== 'declined' &&
      e.meetingType !== 'focus' &&
      e.durationMinutes > 0
    ).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')),
  [events])

  const tueMeetings = useMemo(() => filterDay(nextTue), [filterDay, nextTue])
  const thuMeetings = useMemo(() => filterDay(nextThu), [filterDay, nextThu])

  const formatDayHeader = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h2 className="text-lg font-semibold mb-4">Room Check: In-Office Days</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[{ label: formatDayHeader(nextTue), meetings: tueMeetings }, { label: formatDayHeader(nextThu), meetings: thuMeetings }].map(({ label, meetings }) => (
          <div key={label}>
            <h3 className="text-sm font-medium mb-3">{label}</h3>
            {meetings.length === 0 ? (
              <p className="text-sm text-muted-foreground/60 italic">No in-person meetings</p>
            ) : (
              <div className="space-y-2">
                {meetings.map(e => {
                  const hasRoom = e.roomAttendees.length > 0
                  const roomAccepted = e.roomAttendees.some(r => r.responseStatus === 'accepted')
                  const roomName = hasRoom ? stripRoomPrefix(e.roomAttendees[0].displayName) : null

                  return (
                    <div key={e.id} className="flex items-center gap-2 bg-muted/20 rounded-lg px-3 py-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: MEETING_COLORS[e.meetingType]?.hex || '#757575' }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate" title={e.title}>{truncate(e.title, 32)}</div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="tabular-nums">{e.startTime} – {e.endTime}</span>
                          <span>{e.humanAttendees.length} attendee{e.humanAttendees.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 text-xs">
                        {hasRoom ? (
                          <>
                            <span className={roomAccepted ? 'text-emerald-400' : 'text-amber-400'}>
                              {roomAccepted ? '✅' : '🟡'}
                            </span>
                            {roomName && <span className="text-muted-foreground truncate max-w-[100px]" title={roomName}>{truncate(roomName, 18)}</span>}
                          </>
                        ) : (
                          <span className="text-red-400">🔴 No room</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Widget 4: Quick Insights ───────────────────────────────────────────────────

function QuickInsights({ weeks, events, summary }: { weeks: Week[]; events: CalendarEvent[]; summary: { heaviestWeek: string; avgMeetingHoursPerWeek: number } }) {
  const display = weeks.slice(0, 4)

  const heaviestWeekData = useMemo(() => {
    const w = display.find(w => w.label === summary.heaviestWeek) || display.reduce((best, w) => w.meetingHours > best.meetingHours ? w : best, display[0])
    return w
  }, [display, summary.heaviestWeek])

  const bestDeepWork = useMemo(() =>
    display.reduce((best, w) => w.deepWorkHours > best.deepWorkHours ? w : best, display[0]),
  [display])

  const backToBacks = useMemo(() => {
    const now = new Date()
    const monStr = dateStr(getMonday(now))
    const sunStr = dateStr(getSunday(now))
    const thisWeek = events
      .filter(e => e.date >= monStr && e.date <= sunStr && !e.isAllDay && e.myResponseStatus !== 'declined' && e.meetingType !== 'focus')
      .sort((a, b) => {
        const cmp = a.date.localeCompare(b.date)
        if (cmp !== 0) return cmp
        return (a.startTime || '').localeCompare(b.startTime || '')
      })

    let count = 0
    for (let i = 0; i < thisWeek.length - 1; i++) {
      if (thisWeek[i].date !== thisWeek[i + 1].date) continue
      const endA = thisWeek[i].endTime
      const startB = thisWeek[i + 1].startTime
      if (!endA || !startB) continue
      const [eh, em] = endA.split(':').map(Number)
      const [sh, sm] = startB.split(':').map(Number)
      const gapMin = (sh * 60 + sm) - (eh * 60 + em)
      if (gapMin >= 0 && gapMin <= 5) count++
    }
    return count
  }, [events])

  const zachMeetings = useMemo(() => {
    const today = dateStr(new Date())
    return events
      .filter(e => e.meetingType === 'zach' && e.date >= today && !e.isAllDay)
      .sort((a, b) => {
        const cmp = a.date.localeCompare(b.date)
        if (cmp !== 0) return cmp
        return (a.startTime || '').localeCompare(b.startTime || '')
      })
      .slice(0, 2)
  }, [events])

  const formatShortDate = (date: string, time: string | null) => {
    const d = new Date(date + 'T12:00:00')
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return time ? `${label} ${time}` : label
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className={cn('bg-card border border-border rounded-xl p-4', heaviestWeekData?.saturation === 'overloaded' ? 'border-red-500/30' : heaviestWeekData?.saturation === 'high' ? 'border-amber-500/30' : '')}>
        <p className="text-xs text-muted-foreground mb-1">Heaviest week</p>
        <p className="text-sm font-semibold">{summary.heaviestWeek}</p>
        <p className={cn('text-lg font-bold tabular-nums', heaviestWeekData?.saturation === 'overloaded' ? 'text-red-400' : heaviestWeekData?.saturation === 'high' ? 'text-amber-400' : '')}>
          {heaviestWeekData?.meetingHours ?? '—'}h
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 border-emerald-500/30">
        <p className="text-xs text-muted-foreground mb-1">Best for deep work</p>
        <p className="text-sm font-semibold">{bestDeepWork?.label}</p>
        <p className="text-lg font-bold tabular-nums text-emerald-400">{bestDeepWork?.deepWorkHours ?? '—'}h</p>
      </div>

      <div className={cn('bg-card border border-border rounded-xl p-4', backToBacks > 10 ? 'border-red-500/30' : backToBacks > 5 ? 'border-amber-500/30' : '')}>
        <p className="text-xs text-muted-foreground mb-1">Back-to-backs this week</p>
        <p className={cn('text-lg font-bold tabular-nums', backToBacks > 10 ? 'text-red-400' : backToBacks > 5 ? 'text-amber-400' : '')}>
          {backToBacks} gap{backToBacks !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4" style={{ borderColor: 'rgba(213, 0, 0, 0.3)' }}>
        <p className="text-xs text-muted-foreground mb-1">Next with Zach</p>
        {zachMeetings.length === 0 ? (
          <p className="text-sm text-muted-foreground/60 italic">None scheduled</p>
        ) : (
          <div className="space-y-1">
            {zachMeetings.map((e, i) => (
              <div key={e.id} className="flex items-center gap-1.5 text-sm">
                {i === 0 && <ArrowRight className="h-3 w-3 flex-shrink-0" style={{ color: '#D50000' }} />}
                {i > 0 && <span className="w-3" />}
                <span className="tabular-nums text-muted-foreground text-xs">{formatShortDate(e.date, e.startTime)}</span>
                <span className={cn('truncate', i === 0 ? 'font-medium' : 'text-muted-foreground')} title={e.title}>
                  {truncate(e.title, 24)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [, setTick] = useState(0)

  const stale = isStale(insightsData.generatedAt) || isStale(snapshotData.generatedAt)
  const generatedAt = new Date(insightsData.generatedAt).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Last updated: {generatedAt}</span>
          <button
            onClick={() => { setTick(t => t + 1); window.location.reload() }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reload
          </button>
        </div>
      </div>

      {stale && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-sm text-amber-300">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Data is stale — run the calendar snapshot job to refresh
        </div>
      )}

      <QuickInsights
        weeks={insightsData.weeks as Week[]}
        events={snapshotData.events as CalendarEvent[]}
        summary={insightsData.summary}
      />

      <WeeklyDistribution weeks={insightsData.weeks as Week[]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PrivacyHoldsCheck events={snapshotData.events as CalendarEvent[]} />
        <RoomCheck events={snapshotData.events as CalendarEvent[]} />
      </div>
    </div>
  )
}
