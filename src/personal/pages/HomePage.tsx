import { useEffect, useLayoutEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight, Droplets, Leaf, Wind, Hammer, Wrench, Sprout, Table2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import vendorsData from '../../../data/vendors.json'
import lawnData from '../../../data/lawn-calendar.json'
import teakData from '../../../data/teak-table.json'
import { WatchesSection } from './WatchesPage'

type VendorRow = { service: string; name: string; contact: string | null }

const GROUP_ICONS: Record<string, LucideIcon> = {
  plumbing: Droplets,
  outdoors: Leaf,
  hvac: Wind,
  tile: Hammer,
  handyman: Wrench,
}

type LawnWindow = {
  id: string
  emoji: string
  rangeLabel: string
  reminder: string
  items: string[]
  optional?: boolean
  dormant?: boolean
}

function ContactLink({ contact }: { contact: string }) {
  const isEmail = contact.includes('@')
  const isPhone = /\(\d{3}\)/.test(contact)
  const href = isEmail ? `mailto:${contact}` : isPhone ? `tel:${contact.replace(/\D/g, '')}` : undefined
  return (
    <a
      href={href}
      className={cn(
        'text-xs text-muted-foreground',
        href && 'hover:text-foreground transition-colors'
      )}
    >
      {contact}
    </a>
  )
}

function LawnCalendarSection() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const { title, subtitle, windows } = lawnData as {
    title: string
    subtitle: string
    windows: LawnWindow[]
  }

  useEffect(() => {
    if (location.hash === '#lawn') setOpen(true)
  }, [location.hash])

  return (
    <section id="lawn" className="scroll-mt-24 space-y-4">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/30"
        aria-expanded={open}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
          <Sprout className="h-5 w-5 text-emerald-400" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <ChevronRight
          className={cn(
            'mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-90'
          )}
          aria-hidden
        />
      </button>

      {open && (
        <>
      <div className="relative border border-border rounded-xl bg-card overflow-hidden">
        <div className="absolute left-[1.125rem] top-6 bottom-6 w-px bg-border md:left-5" aria-hidden />
        <ul className="divide-y divide-border">
          {windows.map(w => (
            <li
              key={w.id}
              className={cn(
                'relative pl-12 pr-5 py-4 md:pl-14',
                w.dormant && 'bg-muted/20'
              )}
            >
              <span
                className="absolute left-3 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-lg md:left-4"
                aria-hidden
              >
                {w.emoji}
              </span>
              <div className="flex flex-wrap items-baseline gap-2 gap-y-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/95 tabular-nums">
                  {w.rangeLabel}
                </p>
                {w.optional && (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                    Optional
                  </span>
                )}
                {w.dormant && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Dormant season
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm font-semibold text-foreground">Reminder: {w.reminder}</p>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground list-disc pl-4 marker:text-muted-foreground/60">
                {w.items.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground pl-1">
        Products: <span className="text-foreground/90">middle bottle</span> = Turf Builder ·{' '}
        <span className="text-foreground/90">left bottle</span> = Green Max · pre-emergent = granular + spreader.
      </p>
        </>
      )}
    </section>
  )
}

type TeakStep = {
  id: string
  n: number
  emoji: string
  title: string
  timeLabel: string
  items: string[]
  optionalNote?: string
  important?: boolean
}

function TeakTableSection() {
  const [open, setOpen] = useState(false)
  const data = teakData as {
    title: string
    subtitle: string
    cadence: string
    steps: TeakStep[]
    rules: { title: string; items: string[] }
    timeSummary: { title: string; items: string[] }
    ongoingMaintenance: { title: string; items: string[] }
  }

  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/30"
        aria-expanded={open}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
          <Table2 className="h-5 w-5 text-amber-400" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">{data.title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{data.subtitle}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-amber-400/90">{data.cadence}</p>
        </div>
        <ChevronRight
          className={cn(
            'mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-90'
          )}
          aria-hidden
        />
      </button>

      {open && (
        <>
      <div className="relative border border-border rounded-xl bg-card overflow-hidden">
        <div className="absolute left-[1.125rem] top-6 bottom-6 w-px bg-border md:left-5" aria-hidden />
        <ul className="divide-y divide-border">
          {data.steps.map(s => (
            <li key={s.id} className="relative pl-12 pr-5 py-4 md:pl-14">
              <span
                className="absolute left-3 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-lg md:left-4"
                aria-hidden
              >
                {s.emoji}
              </span>
              <div className="flex flex-wrap items-baseline gap-2 gap-y-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/95">
                  Step {s.n}
                </p>
                <p className="text-sm font-semibold text-foreground">{s.title}</p>
                <span className="text-xs text-muted-foreground tabular-nums">· {s.timeLabel}</span>
                {s.important && (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                    Important
                  </span>
                )}
              </div>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground list-disc pl-4 marker:text-muted-foreground/60">
                {s.items.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
              {s.optionalNote && (
                <p className="mt-3 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90">
                  <span className="font-semibold text-amber-400">Optional: </span>
                  {s.optionalNote}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-destructive/90">⚠️ {data.rules.title}</p>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc pl-4 marker:text-muted-foreground/60">
          {data.rules.items.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">⏱️ {data.timeSummary.title}</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {data.timeSummary.items.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">🔁 {data.ongoingMaintenance.title}</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc pl-4 marker:text-muted-foreground/60">
            {data.ongoingMaintenance.items.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      </div>
        </>
      )}
    </section>
  )
}

function ContractorsSection() {
  const [open, setOpen] = useState(false)
  const groups = vendorsData as {
    id: string
    title: string
    description: string
    vendors: VendorRow[]
  }[]

  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/30"
        aria-expanded={open}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/15">
          <Wrench className="h-5 w-5 text-sky-400" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Contractors & services</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            People you’ve used for the house, grouped by type.
          </p>
        </div>
        <ChevronRight
          className={cn(
            'mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-90'
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map(group => {
            const Icon = GROUP_ICONS[group.id] ?? Wrench
            return (
              <div
                key={group.id}
                className="bg-card border border-border rounded-xl overflow-hidden flex flex-col"
              >
                <div className="px-5 py-4 border-b border-border">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted/50 flex-shrink-0 mt-0.5">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold">{group.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>
                    </div>
                  </div>
                </div>
                <ul className="divide-y divide-border flex-1">
                  {group.vendors.map((v, i) => (
                    <li key={i} className="px-5 py-3.5">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {v.service}
                      </p>
                      <p className="text-sm font-medium mt-1">{v.name}</p>
                      {v.contact && (
                        <div className="mt-1.5">
                          <ContactLink contact={v.contact} />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default function HomePage() {
  const location = useLocation()

  useLayoutEffect(() => {
    const id = location.hash.replace(/^#/, '')
    if (!id) return
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.pathname, location.hash])

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Home</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lawn care, teak table, contractors, watch collection, and services for the house.
        </p>
      </div>

      <LawnCalendarSection />

      <TeakTableSection />

      <ContractorsSection />

      <WatchesSection />
    </div>
  )
}
