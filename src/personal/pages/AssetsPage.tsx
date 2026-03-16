import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, RefreshCw, Home, Building2, BarChart3, Bitcoin } from 'lucide-react'
import { cn } from '@/lib/utils'
import assetsData from '../../../data/assets.json'
import cachedStockPrices from '../../../data/stock-prices.json'

// ── Types ───────────────────────────────────────────────────

interface StockHolding {
  ticker: string
  name: string
  shares: number
  avgCost: number
}

interface CryptoHolding {
  id: string
  ticker: string
  amount: number
  avgCost: number
}

interface Prices {
  stocks: Record<string, number>
  crypto: Record<string, number>
}

// ── Price Fetching ──────────────────────────────────────────

async function fetchCryptoPrices(): Promise<Record<string, number>> {
  try {
    const ids = assetsData.crypto.map(c => c.id).join(',')
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
    )
    if (!res.ok) return {}
    const data = await res.json()
    const result: Record<string, number> = {}
    for (const c of assetsData.crypto) {
      if (data[c.id]?.usd) result[c.ticker] = data[c.id].usd
    }
    return result
  } catch {
    return {}
  }
}

function usePrices() {
  const [prices, setPrices] = useState<Prices>({
    stocks: cachedStockPrices as Record<string, number>,
    crypto: {},
  })
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setLoading(true)
    const cryptoPrices = await fetchCryptoPrices()
    setPrices(prev => ({ stocks: prev.stocks, crypto: cryptoPrices }))
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  return { prices, loading, refresh }
}

// ── Formatting ──────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtExact = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${(n * 100).toFixed(1)}%`

// ── Stocks Table ────────────────────────────────────────────

function StocksSection({ holdings, prices }: { holdings: StockHolding[]; prices: Record<string, number> }) {
  const rows = holdings.map(h => {
    const price = prices[h.ticker]
    const value = price != null ? price * h.shares : null
    const cost = h.avgCost * h.shares
    const gain = value != null ? value - cost : null
    const gainPct = gain != null ? gain / cost : null
    return { ...h, price, value, gain, gainPct }
  })

  const totalValue = rows.reduce((s, r) => s + (r.value ?? 0), 0)
  const totalCost = rows.reduce((s, r) => s + r.avgCost * r.shares, 0)
  const totalGain = totalValue - totalCost
  const totalGainPct = totalGain / totalCost

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Stocks & ETFs</h2>
        </div>
        <div className="text-right">
          <span className="text-sm font-semibold">{fmt(totalValue)}</span>
          <span className={cn('text-xs ml-2', totalGain >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {fmtPct(totalGainPct)}
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-xs text-muted-foreground">
              <th className="text-left px-5 py-2 font-medium">Ticker</th>
              <th className="text-right px-5 py-2 font-medium">Shares</th>
              <th className="text-right px-5 py-2 font-medium">Avg Cost</th>
              <th className="text-right px-5 py-2 font-medium">Price</th>
              <th className="text-right px-5 py-2 font-medium">Value</th>
              <th className="text-right px-5 py-2 font-medium">Gain/Loss</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {rows.map(r => (
              <tr key={r.ticker} className="hover:bg-accent/10 transition-colors">
                <td className="px-5 py-2.5">
                  <span className="font-medium">{r.ticker}</span>
                  <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">{r.name}</span>
                </td>
                <td className="text-right px-5 py-2.5 tabular-nums">{r.shares.toLocaleString()}</td>
                <td className="text-right px-5 py-2.5 tabular-nums text-muted-foreground">{fmtExact(r.avgCost)}</td>
                <td className="text-right px-5 py-2.5 tabular-nums">
                  {r.price != null ? fmtExact(r.price) : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="text-right px-5 py-2.5 tabular-nums font-medium">
                  {r.value != null ? fmt(r.value) : '—'}
                </td>
                <td className={cn('text-right px-5 py-2.5 tabular-nums text-xs', r.gain != null && r.gain >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {r.gain != null ? (
                    <span className="flex items-center justify-end gap-1">
                      {r.gain >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {fmt(r.gain)} ({fmtPct(r.gainPct!)})
                    </span>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Crypto Table ────────────────────────────────────────────

function CryptoSection({ holdings, prices }: { holdings: CryptoHolding[]; prices: Record<string, number> }) {
  const rows = holdings.map(h => {
    const price = prices[h.ticker]
    const value = price != null ? price * h.amount : null
    const cost = h.avgCost * h.amount
    const gain = value != null ? value - cost : null
    const gainPct = gain != null ? gain / cost : null
    return { ...h, price, value, gain, gainPct }
  })

  const totalValue = rows.reduce((s, r) => s + (r.value ?? 0), 0)
  const totalCost = rows.reduce((s, r) => s + r.avgCost * r.amount, 0)
  const totalGain = totalValue - totalCost
  const totalGainPct = totalGain / totalCost

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bitcoin className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Crypto</h2>
        </div>
        <div className="text-right">
          <span className="text-sm font-semibold">{fmt(totalValue)}</span>
          <span className={cn('text-xs ml-2', totalGain >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {fmtPct(totalGainPct)}
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-xs text-muted-foreground">
              <th className="text-left px-5 py-2 font-medium">Asset</th>
              <th className="text-right px-5 py-2 font-medium">Amount</th>
              <th className="text-right px-5 py-2 font-medium">Avg Cost</th>
              <th className="text-right px-5 py-2 font-medium">Price</th>
              <th className="text-right px-5 py-2 font-medium">Value</th>
              <th className="text-right px-5 py-2 font-medium">Gain/Loss</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {rows.map(r => (
              <tr key={r.ticker} className="hover:bg-accent/10 transition-colors">
                <td className="px-5 py-2.5 font-medium">{r.ticker}</td>
                <td className="text-right px-5 py-2.5 tabular-nums">{r.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                <td className="text-right px-5 py-2.5 tabular-nums text-muted-foreground">{fmtExact(r.avgCost)}</td>
                <td className="text-right px-5 py-2.5 tabular-nums">
                  {r.price != null ? fmtExact(r.price) : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="text-right px-5 py-2.5 tabular-nums font-medium">
                  {r.value != null ? fmt(r.value) : '—'}
                </td>
                <td className={cn('text-right px-5 py-2.5 tabular-nums text-xs', r.gain != null && r.gain >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {r.gain != null ? (
                    <span className="flex items-center justify-end gap-1">
                      {r.gain >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {fmt(r.gain)} ({fmtPct(r.gainPct!)})
                    </span>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Real Estate ─────────────────────────────────────────────

function RealEstateSection({ address, estimatedValue }: { address: string; estimatedValue: number | null }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Home className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Real Estate</h2>
        </div>
        {estimatedValue != null && (
          <span className="text-sm font-semibold">{fmt(estimatedValue)}</span>
        )}
      </div>
      <div className="px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{address}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Primary residence</p>
        </div>
        <div className="text-right">
          {estimatedValue != null ? (
            <span className="text-sm font-medium tabular-nums">{fmt(estimatedValue)}</span>
          ) : (
            <span className="text-xs text-muted-foreground">Update in data/assets.json</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Plaid ───────────────────────────────────────────────────

function PlaidSection() {
  const { commonShares, rsus, netSharePercent, sharePrice } = assetsData.plaid
  const netShares = Math.floor(rsus * netSharePercent)
  const commonValue = commonShares * sharePrice
  const rsuValue = netShares * sharePrice
  const totalValue = commonValue + rsuValue

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Plaid</h2>
        </div>
        <div className="text-right">
          <span className="text-sm font-semibold">{fmt(totalValue)}</span>
          <span className="text-xs text-muted-foreground ml-2">@ {fmtExact(sharePrice)}/share</span>
        </div>
      </div>
      <div className="divide-y divide-border/30">
        <div className="px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Common Shares</p>
            <p className="text-xs text-muted-foreground">{commonShares.toLocaleString()} shares</p>
          </div>
          <span className="text-sm font-medium tabular-nums">{fmt(commonValue)}</span>
        </div>
        <div className="px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">RSUs (net)</p>
            <p className="text-xs text-muted-foreground">
              {netShares.toLocaleString()} net shares ({rsus.toLocaleString()} RSUs × {(netSharePercent * 100).toFixed(0)}%)
            </p>
          </div>
          <span className="text-sm font-medium tabular-nums">{fmt(rsuValue)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Net Worth Banner ────────────────────────────────────────

function NetWorthBanner({ stocksTotal, cryptoTotal, houseValue, plaidTotal, loading, onRefresh }: {
  stocksTotal: number
  cryptoTotal: number
  houseValue: number
  plaidTotal: number
  loading: boolean
  onRefresh: () => void
}) {
  const total = stocksTotal + cryptoTotal + houseValue + plaidTotal

  const breakdown = [
    { label: 'Stocks & ETFs', value: stocksTotal },
    { label: 'Crypto', value: cryptoTotal },
    { label: 'Real Estate', value: houseValue },
    { label: 'Plaid', value: plaidTotal },
  ]

  return (
    <div className="bg-card border border-border rounded-xl px-6 py-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">Net Worth</p>
          <p className="text-3xl font-bold tabular-nums mt-1">{fmt(total)}</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          title="Refresh crypto prices"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {breakdown.map(b => (
          <div key={b.label}>
            <p className="text-xs text-muted-foreground">{b.label}</p>
            <p className="text-sm font-medium tabular-nums">{fmt(b.value)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────

export default function AssetsPage() {
  const { prices, loading, refresh } = usePrices()

  const stocksTotal = assetsData.stocks.reduce((s, h) => {
    const price = prices.stocks[h.ticker]
    return s + (price != null ? price * h.shares : 0)
  }, 0)

  const cryptoTotal = assetsData.crypto.reduce((s, h) => {
    const price = prices.crypto[h.ticker]
    return s + (price != null ? price * h.amount : 0)
  }, 0)

  const houseValue = assetsData.house.estimatedValue ?? 0

  const { commonShares, rsus, netSharePercent, sharePrice } = assetsData.plaid
  const plaidTotal = (commonShares + Math.floor(rsus * netSharePercent)) * sharePrice

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Assets</h1>

      <NetWorthBanner
        stocksTotal={stocksTotal}
        cryptoTotal={cryptoTotal}
        houseValue={houseValue}
        plaidTotal={plaidTotal}
        loading={loading}
        onRefresh={refresh}
      />

      <StocksSection holdings={assetsData.stocks} prices={prices.stocks} />
      <CryptoSection holdings={assetsData.crypto as CryptoHolding[]} prices={prices.crypto} />
      <RealEstateSection address={assetsData.house.address} estimatedValue={assetsData.house.estimatedValue} />
      <PlaidSection />
    </div>
  )
}
