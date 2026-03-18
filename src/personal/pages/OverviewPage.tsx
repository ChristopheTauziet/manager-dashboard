import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Gift, Cake, Heart, Calendar, ArrowRight, TreePine, DollarSign, Briefcase, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import giftsData from '../../../data/gifts.json'
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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface EventEntry {
  name: string
  occasion: string
  month: number
  day: number
}

const jsonEvents: EventEntry[] = giftsData.events as EventEntry[]

function nthSundayOf(year: number, month: number, n: number) {
  const first = new Date(year, month, 1)
  const firstSunday = (7 - first.getDay()) % 7 + 1
  return firstSunday + (n - 1) * 7
}

function lastSundayOf(year: number, month: number) {
  const last = new Date(year, month + 1, 0)
  return last.getDate() - last.getDay()
}

function getEasterSunday(year: number) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month, day)
}

function getUSMothersDay(year: number) {
  return { month: 5, day: nthSundayOf(year, 4, 2) }
}

function getFrenchMothersDay(year: number) {
  const lastSunMay = lastSundayOf(year, 4)
  const pentecost = new Date(getEasterSunday(year).getTime() + 49 * 86400000)
  if (pentecost.getMonth() === 4 && pentecost.getDate() === lastSunMay) {
    return { month: 6, day: nthSundayOf(year, 5, 1) }
  }
  return { month: 5, day: lastSunMay }
}

function getFathersDay(year: number) {
  return { month: 6, day: nthSundayOf(year, 5, 3) }
}

function getGrandmasDay(year: number) {
  return { month: 3, day: nthSundayOf(year, 2, 1) }
}

function getGrandpasDay(year: number) {
  return { month: 10, day: nthSundayOf(year, 9, 1) }
}

function getAllEvents(): EventEntry[] {
  const year = new Date().getFullYear()
  const usMom = getUSMothersDay(year)
  const frMom = getFrenchMothersDay(year)
  const dad = getFathersDay(year)
  const grandma = getGrandmasDay(year)
  const grandpa = getGrandpasDay(year)

  const dynamicEvents: EventEntry[] = [
    { name: "Maman & Brigitte", occasion: "Fête des grands-mères", ...grandma },
    { name: "Claire", occasion: "Mother's Day", ...usMom },
    { name: "Maman", occasion: "Fête des Mères", ...frMom },
    { name: "Papa", occasion: "Fête des Pères", ...dad },
    { name: "Papa & Domi", occasion: "Fête des grands-pères", ...grandpa },
  ]
  return [...jsonEvents, ...dynamicEvents]
}

function getUpcomingEvents() {
  const today = new Date()
  const maxDays = 61
  const events = getAllEvents()

  const withDaysUntil = events.map(ev => {
    const thisYear = today.getFullYear()
    let eventDate = new Date(thisYear, ev.month - 1, ev.day)
    if (eventDate < today) {
      eventDate = new Date(thisYear + 1, ev.month - 1, ev.day)
    }
    const diff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return { ...ev, daysUntil: diff, eventDate }
  })

  return withDaysUntil
    .filter(ev => ev.daysUntil <= maxDays)
    .sort((a, b) => a.daysUntil - b.daysUntil)
}

function getIdeasForPerson(name: string) {
  const person = giftsData.people.find(p => p.name === name)
  return person?.ideas || []
}

const HEART_OCCASIONS = ["Anniversary", "Valentine's Day", "Mother's Day", "Father's Day", "Fête des Mères", "Fête des Pères", "Fête des grands-mères", "Fête des grands-pères"]

function getIcon(occasion: string) {
  if (occasion === 'Birthday') return Cake
  if (HEART_OCCASIONS.includes(occasion)) return Heart
  if (occasion === 'Christmas') return TreePine
  return Calendar
}

function UpcomingEventsWidget() {
  const navigate = useNavigate()
  const upcoming = getUpcomingEvents()

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Upcoming Events</h2>
        </div>
        <button
          onClick={() => navigate('/personal/gifts')}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          Gift Tracker <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      <div className="divide-y divide-border/50">
        {upcoming.length === 0 && (
          <div className="px-5 py-6 text-center text-sm text-muted-foreground">
            No events in the next 2 months
          </div>
        )}
        {upcoming.map((ev) => {
          const ideas = ev.name.includes('&') ? [] : getIdeasForPerson(ev.name)
          const Icon = getIcon(ev.occasion)
          const isUrgent = ev.daysUntil <= 14
          const isSoon = ev.daysUntil <= 30

          return (
            <div key={`${ev.name}-${ev.occasion}`} className="px-5 py-3 flex items-center gap-4">
              <div className={cn(
                'w-10 h-10 rounded-lg flex flex-col items-center justify-center text-xs flex-shrink-0',
                isUrgent ? 'bg-destructive/15 text-destructive' : isSoon ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground'
              )}>
                <span className="font-semibold leading-none">{ev.day}</span>
                <span className="text-[10px] leading-none mt-0.5">{MONTHS[ev.month - 1]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{ev.name}</span>
                  <span className="text-xs text-muted-foreground">{ev.occasion}</span>
                </div>
                {ideas.length > 0 && (
                  <div className="flex gap-1 mt-1 overflow-hidden">
                    {ideas.slice(0, 2).map((idea, j) => (
                      <span key={j} className="text-[10px] bg-warning/10 text-warning border border-warning/20 px-1.5 py-0.5 rounded truncate">
                        {idea}
                      </span>
                    ))}
                    {ideas.length > 2 && (
                      <span className="text-[10px] text-muted-foreground">+{ideas.length - 2}</span>
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

export default function OverviewPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Overview</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <NetWorthWidget />
        <CompensationWidget />
        <TaxesWidget />
        <UpcomingEventsWidget />
      </div>
    </div>
  )
}
