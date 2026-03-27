import { useState, useMemo, useCallback } from 'react'
import { RefreshCw, Lock, AlertTriangle, Calendar, Zap, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
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

const FLEXIBLE_TYPES = new Set(['skip_1on1', 'design_1on1'])

// ── Types ──────────────────────────────────────────────────────────────────────

interface Breakdown {
  count: number
  hours: number
  names?: string[]
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
  deepWorkHours: number
  breakdown: Record<string, Breakdown>
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

function getMonday(d: Date): Date {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.getFullYear(), d.getMonth(), diff)
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

function saturationLevel(meetingHours: number): string {
  if (meetingHours < 10) return 'low'
  if (meetingHours < 13) return 'medium'
  if (meetingHours <= 15) return 'high'
  return 'overloaded'
}

function formatWeekLabel(mon: Date): string {
  const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(mon)} – ${fmt(sun)}`
}

// ── Compute weeks from snapshot ────────────────────────────────────────────────

function computeWeeks(events: CalendarEvent[], numWeeks: number): Week[] {
  const monday = getMonday(new Date())
  const weeks: Week[] = []

  for (let i = 0; i < numWeeks; i++) {
    const start = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i * 7)
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)
    const startStr = dateStr(start)
    const endStr = dateStr(end)

    const weekEvents = events.filter(e =>
      e.date >= startStr && e.date <= endStr &&
      !e.isAllDay &&
      e.myResponseStatus !== 'declined'
    )

    const meetings = weekEvents.filter(e => e.meetingType !== 'focus')
    const breakdown: Record<string, Breakdown> = {}
    let meetingHours = 0

    for (const e of meetings) {
      const t = e.meetingType
      if (!breakdown[t]) breakdown[t] = { count: 0, hours: 0, names: [] }
      breakdown[t].count++
      breakdown[t].hours += e.durationMinutes / 60
      meetingHours += e.durationMinutes / 60
      if (t.endsWith('_1on1') || t === 'zach') {
        const other = e.humanAttendees.find(a => !a.self)
        if (other) {
          const name = other.displayName || other.email.split('@')[0]
          if (!breakdown[t].names!.includes(name)) breakdown[t].names!.push(name)
        }
      }
    }

    for (const k of Object.keys(breakdown)) {
      breakdown[k].hours = Math.round(breakdown[k].hours * 10) / 10
    }

    meetingHours = Math.round(meetingHours * 10) / 10
    const deepWorkHours = Math.round(Math.max(0, 40 - meetingHours) * 10) / 10

    weeks.push({
      weekNumber: i + 1,
      startDate: startStr,
      endDate: endStr,
      label: formatWeekLabel(start),
      saturation: saturationLevel(meetingHours),
      totalMeetings: meetings.length,
      meetingHours,
      deepWorkHours,
      breakdown,
      rescheduleOpportunities: [],
    })
  }

  for (const week of weeks) {
    if (week.saturation !== 'high' && week.saturation !== 'overloaded') continue
    const lighterWeek = weeks.find(w =>
      w.weekNumber !== week.weekNumber &&
      (w.saturation === 'low' || w.saturation === 'medium')
    )
    if (!lighterWeek) continue

    const flexMeetings = events.filter(e =>
      e.date >= week.startDate && e.date <= week.endDate &&
      !e.isAllDay &&
      e.myResponseStatus !== 'declined' &&
      FLEXIBLE_TYPES.has(e.meetingType)
    )
    for (const e of flexMeetings) {
      week.rescheduleOpportunities.push({
        meeting: e.title,
        currentWeek: week.label,
        suggestedWeek: lighterWeek.label,
        reason: `Week is ${week.saturation} — lighter week available`,
      })
    }
  }

  return weeks
}

// ── Widget 1: Weekly Meeting Distribution ──────────────────────────────────────

function WeeklyDistribution({ weeks }: { weeks: Week[] }) {
  const display = weeks.slice(0, 6)
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

// ── Widget 2: Room Check (Calendar View) ───────────────────────────────────────

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM'
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return '12 PM'
  return `${hour - 12} PM`
}

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

  const formatDayHeader = (ds: string) => {
    const d = new Date(ds + 'T12:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  const allMeetings = [...tueMeetings, ...thuMeetings]
  const startHour = allMeetings.length > 0
    ? Math.floor(Math.min(...allMeetings.map(e => timeToMinutes(e.startTime || '09:00'))) / 60)
    : 9
  const endHour = allMeetings.length > 0
    ? Math.ceil(Math.max(...allMeetings.map(e => timeToMinutes(e.endTime || '17:00'))) / 60)
    : 17
  const totalMinutes = (endHour - startHour) * 60
  const hourSlots = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)
  const PX_PER_MINUTE = 2.0

  const layoutColumns = (meetings: CalendarEvent[]) => {
    const positioned: { event: CalendarEvent; col: number; totalCols: number }[] = []
    const columns: { end: number }[] = []

    for (const e of meetings) {
      const start = timeToMinutes(e.startTime || '09:00')
      const end = start + e.durationMinutes

      let placed = -1
      for (let c = 0; c < columns.length; c++) {
        if (columns[c].end <= start) {
          placed = c
          columns[c].end = end
          break
        }
      }
      if (placed === -1) {
        placed = columns.length
        columns.push({ end })
      }
      positioned.push({ event: e, col: placed, totalCols: 0 })
    }

    const totalCols = columns.length
    positioned.forEach(p => { p.totalCols = totalCols })
    return positioned
  }

  const renderDay = (meetings: CalendarEvent[]) => {
    const laid = layoutColumns(meetings)

    return (
      <div className="relative" style={{ height: totalMinutes * PX_PER_MINUTE }}>
        {hourSlots.map(hour => {
          const top = (hour - startHour) * 60 * PX_PER_MINUTE
          return (
            <div key={hour} className="absolute left-0 right-0 border-t border-border/30" style={{ top }}>
              <span className="absolute -top-2.5 -left-1 text-[10px] text-muted-foreground/50 tabular-nums select-none w-10 text-right pr-2">
                {formatHour(hour)}
              </span>
            </div>
          )
        })}

        <div className="ml-10 relative">
          {laid.map(({ event: e, col, totalCols }) => {
            const startMin = timeToMinutes(e.startTime || '09:00') - startHour * 60
            const height = Math.max(e.durationMinutes * PX_PER_MINUTE, 24)
            const top = startMin * PX_PER_MINUTE
            const color = MEETING_COLORS[e.meetingType]?.hex || '#757575'

            const sfRooms = e.roomAttendees.filter(r => r.displayName.startsWith('HQ'))
            const hasRoom = sfRooms.length > 0
            const roomAccepted = sfRooms.some(r => r.responseStatus === 'accepted')
            const roomName = hasRoom ? stripRoomPrefix(sfRooms[0].displayName) : null

            const widthPct = 100 / totalCols
            const leftPct = col * widthPct

            return (
              <div
                key={e.id}
                className="absolute rounded-md overflow-hidden cursor-default"
                style={{
                  top,
                  height,
                  left: `${leftPct}%`,
                  width: `calc(${widthPct}% - 2px)`,
                  backgroundColor: color + '20',
                  borderLeft: `3px solid ${color}`,
                }}
                title={e.title}
              >
                <div className="px-2 py-1 h-full flex flex-col justify-center">
                  <div className="text-xs font-medium truncate leading-tight" style={{ color }}>
                    {truncate(e.title, 24)}
                  </div>
                  {height > 28 && (
                    <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {hasRoom ? (
                        <span className={roomAccepted ? 'text-emerald-400' : 'text-amber-400'}>
                          {roomAccepted ? '✓' : '?'} {roomName && truncate(roomName, 16)}
                        </span>
                      ) : (
                        <span className="text-red-400">No room</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
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
              renderDay(meetings)
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Widget 4: Quick Insights ───────────────────────────────────────────────────

function QuickInsights({ weeks, events }: { weeks: Week[]; events: CalendarEvent[] }) {
  const display = weeks.slice(0, 6)

  const heaviestWeekData = useMemo(() =>
    display.reduce((best, w) => w.meetingHours > best.meetingHours ? w : best, display[0]),
  [display])

  const bestDeepWork = useMemo(() =>
    display.reduce((best, w) => w.deepWorkHours > best.deepWorkHours ? w : best, display[0]),
  [display])

  const HOLDS_IGNORE = /epd no meeting wednesday/i

  const nonPrivateHolds = useMemo(() => {
    const today = dateStr(new Date())
    return events
      .filter(e =>
        e.date >= today &&
        !e.isAllDay &&
        e.myResponseStatus !== 'declined' &&
        e.meetingType === 'focus' &&
        e.visibility !== 'private' &&
        e.humanAttendees.length <= 1 &&
        !HOLDS_IGNORE.test(e.title)
      )
      .sort((a, b) => {
        const cmp = a.date.localeCompare(b.date)
        if (cmp !== 0) return cmp
        return (a.startTime || '').localeCompare(b.startTime || '')
      })
      .slice(0, 3)
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
        <p className="text-sm font-semibold">{heaviestWeekData?.label}</p>
        <p className={cn('text-lg font-bold tabular-nums', heaviestWeekData?.saturation === 'overloaded' ? 'text-red-400' : heaviestWeekData?.saturation === 'high' ? 'text-amber-400' : '')}>
          {heaviestWeekData?.meetingHours ?? '—'}h
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 border-emerald-500/30">
        <p className="text-xs text-muted-foreground mb-1">Best for deep work</p>
        <p className="text-sm font-semibold">{bestDeepWork?.label}</p>
        <p className="text-lg font-bold tabular-nums text-emerald-400">{bestDeepWork?.deepWorkHours ?? '—'}h</p>
      </div>

      <div className={cn('bg-card border border-border rounded-xl p-4', nonPrivateHolds.length > 0 ? 'border-amber-500/30' : '')}>
        <p className="text-xs text-muted-foreground mb-1">Holds not private</p>
        {nonPrivateHolds.length === 0 ? (
          <p className="text-sm text-emerald-400/80 italic">All holds are private ✓</p>
        ) : (
          <div className="space-y-1">
            {nonPrivateHolds.map(e => (
              <div key={e.id} className="flex items-center gap-1.5 text-sm">
                <Lock className="h-3 w-3 text-amber-400 flex-shrink-0" />
                <span className="tabular-nums text-muted-foreground text-xs">{formatShortDate(e.date, e.startTime)}</span>
                <span className="truncate text-muted-foreground" title={e.title}>{truncate(e.title, 20)}</span>
              </div>
            ))}
          </div>
        )}
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
  const events = snapshotData.events as CalendarEvent[]
  const weeks = useMemo(() => computeWeeks(events, 7), [events])

  const stale = isStale(snapshotData.generatedAt)
  const generatedAt = new Date(snapshotData.generatedAt).toLocaleString('en-US', {
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

      <QuickInsights weeks={weeks} events={events} />

      <WeeklyDistribution weeks={weeks} />

      <RoomCheck events={events} />
    </div>
  )
}
