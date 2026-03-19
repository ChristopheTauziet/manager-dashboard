import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plane, MapPin, UtensilsCrossed, Car, Home, ExternalLink } from 'lucide-react'

const STAY_CALENDAR_COLORS: Record<string, string> = {
  Paris: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Lescar: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Toulouse: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Bordeaux: 'bg-red-500/20 text-red-400 border-red-500/30',
  Asson: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Flight: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
}
import { cn } from '@/lib/utils'
import planningData from '../../../data/planning.json'
import { getAllEvents } from '../eventUtils'

// ── Types ───────────────────────────────────────────────────

interface CalendarEvent {
  date: string
  label: string
  type: 'trip' | 'birthday' | 'anniversary' | 'holiday' | 'school' | 'other'
  detail?: string
  color: string
}

interface Reservation {
  type: 'flight' | 'lodging' | 'restaurant' | 'car'
  label: string
  url?: string
}

interface TripDay {
  date: string
  day: string
  calendarLabel: string
  transport: string | null
  stay: string
  reservations: Reservation[]
}

interface Trip {
  id: string
  name: string
  startDate: string
  endDate: string
  itinerary: TripDay[]
}

// ── Helpers ─────────────────────────────────────────────────

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function pad(n: number) { return n.toString().padStart(2, '0') }

function dateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return { firstDay, daysInMonth }
}

// ── Build events ────────────────────────────────────────────

function buildAllEvents(year: number): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>()

  function add(date: string, ev: CalendarEvent) {
    if (!map.has(date)) map.set(date, [])
    map.get(date)!.push(ev)
  }

  const trips = planningData.trips as Trip[]
  for (const trip of trips) {
    for (const day of trip.itinerary) {
      add(day.date, {
        date: day.date,
        label: day.calendarLabel,
        type: 'trip',
        color: STAY_CALENDAR_COLORS[day.stay] || 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      })
    }
  }

  const giftEvents = getAllEvents(year)
  for (const ev of giftEvents) {
    const d = dateKey(year, ev.month - 1, ev.day)
    const isBirthday = ev.occasion === 'Birthday'
    const isAnniversary = ev.occasion === 'Anniversary'
    add(d, {
      date: d,
      label: `${ev.name}${isBirthday ? '' : ` — ${ev.occasion}`}`,
      type: isBirthday ? 'birthday' : isAnniversary ? 'anniversary' : 'holiday',
      color: isBirthday ? 'bg-pink-500/20 text-pink-400 border-pink-500/30'
        : isAnniversary ? 'bg-red-500/20 text-red-400 border-red-500/30'
        : 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    })
  }

  for (const ev of planningData.schoolEvents as { date: string; label: string }[]) {
    add(ev.date, {
      date: ev.date,
      label: ev.label,
      type: 'school',
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    })
  }

  const categoryColors: Record<string, string> = {
    trip: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    sports: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    medical: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    holiday: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    camp: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  }
  const defaultOtherColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'

  for (const ev of planningData.otherEvents as { date: string; label: string; endDate?: string; category?: string }[]) {
    const color = (ev.category && categoryColors[ev.category]) || defaultOtherColor
    const evType = ev.category === 'holiday' ? 'holiday' as const : 'other' as const

    if (ev.endDate) {
      const start = new Date(ev.date + 'T12:00:00')
      const end = new Date(ev.endDate + 'T12:00:00')
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
        add(key, { date: key, label: ev.label, type: evType, color })
      }
    } else {
      add(ev.date, { date: ev.date, label: ev.label, type: evType, color })
    }
  }

  return map
}

// ── Reservation icon ────────────────────────────────────────

function ReservationIcon({ type }: { type: string }) {
  const cls = 'h-3 w-3 flex-shrink-0'
  switch (type) {
    case 'restaurant': return <UtensilsCrossed className={cls} />
    case 'lodging': return <Home className={cls} />
    case 'flight': return <Plane className={cls} />
    case 'car': return <Car className={cls} />
    default: return null
  }
}

// ── Calendar Grid ───────────────────────────────────────────

function CalendarMonth({ year, month, events }: { year: number; month: number; events: Map<string, CalendarEvent[]> }) {
  const { firstDay, daysInMonth } = getMonthDays(year, month)
  const today = new Date()
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate())

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div>
      <div className="grid grid-cols-7 gap-px mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-[10px] text-muted-foreground text-center py-1 font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} className="min-h-[80px]" />
          const key = dateKey(year, month, day)
          const dayEvents = events.get(key) || []
          const isToday = key === todayKey
          const isWeekend = (firstDay + day - 1) % 7 === 0 || (firstDay + day - 1) % 7 === 6

          return (
            <div
              key={key}
              className={cn(
                'min-h-[80px] p-1 rounded-md border transition-colors',
                isToday ? 'border-primary/50 bg-primary/5' : 'border-border/30 hover:border-border/60',
                isWeekend && !isToday && 'bg-muted/20',
              )}
            >
              <span className={cn(
                'text-xs font-medium inline-flex items-center justify-center w-5 h-5 rounded-full',
                isToday && 'bg-primary text-primary-foreground',
                !isToday && isWeekend && 'text-muted-foreground',
              )}>
                {day}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {dayEvents.map((ev, j) => (
                  <div
                    key={j}
                    className={cn('text-[9px] leading-tight px-1 py-0.5 rounded border truncate', ev.color)}
                    title={ev.detail ? `${ev.label}: ${ev.detail}` : ev.label}
                  >
                    {ev.label}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Trip Detail Card ────────────────────────────────────────

const STAY_COLORS: Record<string, string> = {
  Paris: 'bg-blue-500/15 text-blue-400',
  Lescar: 'bg-emerald-500/15 text-emerald-400',
  Toulouse: 'bg-purple-500/15 text-purple-400',
  Bordeaux: 'bg-red-500/15 text-red-400',
  Asson: 'bg-amber-500/15 text-amber-400',
  Flight: 'bg-muted text-muted-foreground',
}

function TripCard({ trip }: { trip: Trip }) {
  const start = new Date(trip.startDate + 'T12:00:00')
  const end = new Date(trip.endDate + 'T12:00:00')
  const nights = Math.round((end.getTime() - start.getTime()) / 86400000)

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">{trip.name}</h2>
          <span className="text-xs text-muted-foreground">
            {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {nights} nights
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-xs text-muted-foreground">
              <th className="text-left px-4 py-2 font-medium w-24">Date</th>
              <th className="text-left px-4 py-2 font-medium">Stay</th>
              <th className="text-left px-4 py-2 font-medium">Reservations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {trip.itinerary.map(day => {
              const d = new Date(day.date + 'T12:00:00')
              const stayColor = STAY_COLORS[day.stay] || 'bg-muted text-muted-foreground'
              return (
                <tr key={day.date} className="hover:bg-accent/10 transition-colors">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className="text-xs text-muted-foreground">{day.day}</span>
                    <span className="ml-1.5 text-xs font-medium">{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={cn('text-xs px-2 py-0.5 rounded inline-flex items-center gap-1', stayColor)}>
                      <MapPin className="h-3 w-3" />
                      {day.stay}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {day.reservations.length > 0 && (
                      <div className="space-y-1">
                        {day.reservations.map((r, i) => (
                          <div key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <ReservationIcon type={r.type} />
                            {r.url ? (
                              <a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
                                {r.label}
                                <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                              </a>
                            ) : (
                              <span>{r.label}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Legend ───────────────────────────────────────────────────

function Legend() {
  const items = [
    { label: 'Trip', color: 'bg-blue-500/20 border-blue-500/30' },
    { label: 'Birthday', color: 'bg-pink-500/20 border-pink-500/30' },
    { label: 'Anniversary', color: 'bg-red-500/20 border-red-500/30' },
    { label: 'Holiday', color: 'bg-purple-500/20 border-purple-500/30' },
    { label: 'School', color: 'bg-amber-500/20 border-amber-500/30' },
    { label: 'Sports', color: 'bg-emerald-500/20 border-emerald-500/30' },
    { label: 'Camp', color: 'bg-cyan-500/20 border-cyan-500/30' },
  ]
  return (
    <div className="flex gap-3 flex-wrap">
      {items.map(it => (
        <div key={it.label} className="flex items-center gap-1.5">
          <div className={cn('w-3 h-3 rounded border', it.color)} />
          <span className="text-xs text-muted-foreground">{it.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────

export default function PlanningPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const events = buildAllEvents(year)
  const trips = planningData.trips as Trip[]

  function prev() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function next() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }
  function goToday() { setYear(today.getFullYear()); setMonth(today.getMonth()) }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Planning</h1>
        <Legend />
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={prev} className="p-1 rounded hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-semibold w-48 text-center">{MONTHS[month]} {year}</h2>
            <button onClick={next} className="p-1 rounded hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button onClick={goToday} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent/50 transition-colors">
            Today
          </button>
        </div>
        <CalendarMonth year={year} month={month} events={events} />
      </div>

      {trips.length > 0 && (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold">Upcoming Trips</h2>
          {trips.map(trip => <TripCard key={trip.id} trip={trip} />)}
        </div>
      )}
    </div>
  )
}
