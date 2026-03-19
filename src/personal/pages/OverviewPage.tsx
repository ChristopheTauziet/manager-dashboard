import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cake, Heart, Calendar, ArrowRight, TreePine, DollarSign, Briefcase, Receipt, CalendarDays, Plane, GraduationCap, Trophy, Cross, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import giftsData from '../../../data/gifts.json'
import { getAllEvents } from '../eventUtils'
import planningData from '../../../data/planning.json'
import assetsData from '../../../data/assets.json'
import cachedStockPrices from '../../../data/stock-prices.json'
import compData from '../../../data/compensation.json'
import taxesData from '../../../data/taxes.json'

interface StockHolding {
  ticker: string
  shares: number
  fixedValue?: number
}

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

function getIdeasForPerson(name: string) {
  const person = giftsData.people.find(p => p.name === name)
  return person?.ideas || []
}

const HEART_OCCASIONS = ["Anniversary", "Valentine's Day", "Mother's Day", "Father's Day", "Fête des Mères", "Fête des Pères", "Fête des grands-mères", "Fête des grands-pères"]

function NetWorthWidget() {
  const navigate = useNavigate()
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, number>>({})

  useEffect(() => {
    const ids = assetsData.crypto.map(c => c.id).join(',')
    fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`)
      .then(r => r.json())
      .then(data => {
        const prices: Record<string, number> = {}
        for (const c of assetsData.crypto) {
          if (data[c.id]?.usd) prices[c.ticker] = data[c.id].usd
        }
        setCryptoPrices(prices)
      })
      .catch(() => {})
  }, [])

  const stockPrices = cachedStockPrices as Record<string, number>

  const stocksTotal = (assetsData.stocks as StockHolding[]).reduce((s, h) => {
    if (h.fixedValue != null) return s + h.fixedValue
    const price = stockPrices[h.ticker]
    return s + (price != null ? price * h.shares : 0)
  }, 0)

  const cryptoTotal = assetsData.crypto.reduce((s, h) => {
    const price = cryptoPrices[h.ticker]
    return s + (price != null ? price * h.amount : 0)
  }, 0)

  const houseEquity = (assetsData.house.estimatedValue ?? 0) - (assetsData.house.mortgage ?? 0)
  const retirementTotal = assetsData.retirement
  const { commonShares, rsus, netSharePercent, sharePrice } = assetsData.plaid
  const plaidTotal = (commonShares + Math.floor(rsus * netSharePercent)) * sharePrice

  const total = stocksTotal + cryptoTotal + houseEquity + retirementTotal + plaidTotal

  const breakdown = [
    { label: 'Stocks & ETFs', value: stocksTotal },
    { label: 'Crypto', value: cryptoTotal },
    { label: 'Real Estate', value: houseEquity },
    { label: 'Retirement', value: retirementTotal },
    { label: 'Plaid', value: plaidTotal },
  ]

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Net Worth</h2>
        </div>
        <button
          onClick={() => navigate('/personal/assets')}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          Assets <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      <div className="px-5 py-4">
        <p className="text-2xl font-bold tabular-nums">{fmt(total)}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mt-3">
          {breakdown.map(b => (
            <div key={b.label}>
              <p className="text-[11px] text-muted-foreground">{b.label}</p>
              <p className="text-sm font-medium tabular-nums">{fmt(b.value)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CompensationWidget() {
  const navigate = useNavigate()
  const CURRENT_YEAR = 2026
  const { baseSalary, grants, currentSharePrice } = compData

  const equityShares = grants.reduce((s, g) => {
    const vesting = g.vesting as unknown as Record<string, number>
    return s + (vesting[String(CURRENT_YEAR)] ?? 0)
  }, 0)
  const equityValue = equityShares * currentSharePrice
  const totalComp = baseSalary + equityValue

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">{CURRENT_YEAR} Compensation</h2>
        </div>
        <button
          onClick={() => navigate('/personal/compensation')}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          Details <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      <div className="px-5 py-4">
        <p className="text-2xl font-bold tabular-nums">{fmt(totalComp)}</p>
        <div className="grid grid-cols-3 gap-x-4 mt-3">
          <div>
            <p className="text-[11px] text-muted-foreground">Base Salary</p>
            <p className="text-sm font-medium tabular-nums">{fmt(baseSalary)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Equity ({equityShares.toLocaleString()} shares)</p>
            <p className="text-sm font-medium tabular-nums">{fmt(equityValue)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Share Price</p>
            <p className="text-sm font-medium tabular-nums">${currentSharePrice}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function TaxesWidget() {
  const navigate = useNavigate()
  const taxYears = taxesData as { year: number; taxableIncome: number; federalTax: number; stateTax: number; federalDue: number; stateDue: number }[]
  const latest = [...taxYears].sort((a, b) => b.year - a.year)[0]
  const totalTax = latest.federalTax + latest.stateTax
  const effectiveRate = totalTax / latest.taxableIncome

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">{latest.year} Taxes</h2>
        </div>
        <button
          onClick={() => navigate('/personal/taxes')}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          All Years <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      <div className="px-5 py-4">
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold tabular-nums">{fmt(totalTax)}</p>
          <span className="text-xs text-muted-foreground">{(effectiveRate * 100).toFixed(1)}% effective</span>
        </div>
        <div className="grid grid-cols-3 gap-x-4 mt-3">
          <div>
            <p className="text-[11px] text-muted-foreground">Taxable Income</p>
            <p className="text-sm font-medium tabular-nums">{fmt(latest.taxableIncome)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Federal</p>
            <p className="text-sm font-medium tabular-nums">{fmt(latest.federalTax)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">California</p>
            <p className="text-sm font-medium tabular-nums">{fmt(latest.stateTax)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ComingUpItem {
  date: Date
  label: string
  subtitle?: string
  icon: typeof Calendar
  colorCls: string
  daysUntil: number
  ideas?: string[]
}

const CATEGORY_ICON: Record<string, typeof Calendar> = {
  trip: Plane,
  school: GraduationCap,
  sports: Trophy,
  medical: Cross,
  holiday: Calendar,
  camp: MapPin,
  birthday: Cake,
  anniversary: Heart,
}

const CATEGORY_COLORS: Record<string, string> = {
  trip: 'bg-blue-500/15 text-blue-400',
  school: 'bg-amber-500/15 text-amber-400',
  sports: 'bg-emerald-500/15 text-emerald-400',
  medical: 'bg-rose-500/15 text-rose-400',
  holiday: 'bg-purple-500/15 text-purple-400',
  camp: 'bg-cyan-500/15 text-cyan-400',
  birthday: 'bg-pink-500/15 text-pink-400',
  anniversary: 'bg-red-500/15 text-red-400',
}

function getComingUp(): ComingUpItem[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const maxDays = 61
  const results: ComingUpItem[] = []

  const giftEvents = getAllEvents(today.getFullYear())
  for (const ev of giftEvents) {
    let eventDate = new Date(today.getFullYear(), ev.month - 1, ev.day)
    if (eventDate < today) {
      eventDate = new Date(today.getFullYear() + 1, ev.month - 1, ev.day)
    }
    const diff = Math.ceil((eventDate.getTime() - today.getTime()) / 86400000)
    if (diff > maxDays) continue

    const isBirthday = ev.occasion === 'Birthday'
    const isAnniversary = ev.occasion === 'Anniversary'
    const isChristmas = ev.occasion === 'Christmas'
    let category = 'holiday'
    if (isBirthday) category = 'birthday'
    else if (isAnniversary) category = 'anniversary'

    const icon = isChristmas ? TreePine
      : HEART_OCCASIONS.includes(ev.occasion) ? Heart
      : CATEGORY_ICON[category] || Calendar

    const ideas = ev.name.includes('&') ? [] : getIdeasForPerson(ev.name)

    results.push({
      date: eventDate,
      label: ev.name,
      subtitle: ev.occasion,
      icon,
      colorCls: CATEGORY_COLORS[category] || 'bg-purple-500/15 text-purple-400',
      daysUntil: diff,
      ideas: ideas.length > 0 ? ideas : undefined,
    })
  }

  for (const trip of planningData.trips) {
    const start = new Date(trip.startDate + 'T12:00:00')
    const diff = Math.ceil((start.getTime() - today.getTime()) / 86400000)
    if (diff >= 0 && diff <= maxDays) {
      results.push({ date: start, label: trip.name, icon: Plane, colorCls: CATEGORY_COLORS.trip, daysUntil: diff })
    }
  }

  for (const ev of planningData.schoolEvents) {
    const d = new Date(ev.date + 'T12:00:00')
    const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000)
    if (diff >= 0 && diff <= maxDays) {
      results.push({ date: d, label: ev.label, icon: GraduationCap, colorCls: CATEGORY_COLORS.school, daysUntil: diff })
    }
  }

  const seen = new Set<string>()
  for (const ev of planningData.otherEvents as { date: string; label: string; endDate?: string; category?: string }[]) {
    const key = ev.label
    if (seen.has(key)) continue
    seen.add(key)
    const d = new Date(ev.date + 'T12:00:00')
    const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000)
    if (diff >= 0 && diff <= maxDays) {
      const cat = ev.category || 'other'
      const endStr = ev.endDate
        ? ` (${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${new Date(ev.endDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
        : ''
      results.push({
        date: d,
        label: ev.label + endStr,
        icon: CATEGORY_ICON[cat] || Calendar,
        colorCls: CATEGORY_COLORS[cat] || 'bg-muted text-muted-foreground',
        daysUntil: diff,
      })
    }
  }

  return results.sort((a, b) => a.daysUntil - b.daysUntil)
}

function ComingUpWidget() {
  const navigate = useNavigate()
  const items = getComingUp()

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Coming Up</h2>
        </div>
        <button
          onClick={() => navigate('/personal/planning')}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          Planning <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      <div className="divide-y divide-border/50">
        {items.length === 0 && (
          <div className="px-5 py-6 text-center text-sm text-muted-foreground">
            Nothing coming up in the next 2 months
          </div>
        )}
        {items.map((ev, i) => {
          const Icon = ev.icon
          const isUrgent = ev.daysUntil <= 7
          const isSoon = ev.daysUntil <= 21

          return (
            <div key={i} className="px-5 py-3 flex items-center gap-4">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', ev.colorCls)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate">{ev.label}</span>
                  {ev.subtitle && <span className="text-xs text-muted-foreground flex-shrink-0">{ev.subtitle}</span>}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {ev.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                {ev.ideas && ev.ideas.length > 0 && (
                  <div className="flex gap-1 mt-1 overflow-hidden">
                    {ev.ideas.slice(0, 2).map((idea, j) => (
                      <span key={j} className="text-[10px] bg-warning/10 text-warning border border-warning/20 px-1.5 py-0.5 rounded truncate">
                        {idea}
                      </span>
                    ))}
                    {ev.ideas.length > 2 && (
                      <span className="text-[10px] text-muted-foreground">+{ev.ideas.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <span className={cn(
                  'text-xs font-medium',
                  isUrgent ? 'text-destructive' : isSoon ? 'text-warning' : 'text-muted-foreground'
                )}>
                  {ev.daysUntil === 0 ? 'Today' : ev.daysUntil === 1 ? 'Tomorrow' : `${ev.daysUntil}d`}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function OverviewPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Overview</h1>
      <div className="flex flex-col xl:flex-row gap-5">
        <div className="xl:w-1/2 flex-shrink-0">
          <ComingUpWidget />
        </div>
        <div className="xl:w-1/2 flex flex-col gap-5">
          <NetWorthWidget />
          <CompensationWidget />
          <TaxesWidget />
        </div>
      </div>
    </div>
  )
}
