import { useMemo, useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, ChevronDown, ChevronRight } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import taxesData from '../../../data/taxes.json'

const CHART_AXIS = '#a1a1aa'
const CHART_GRID = '#27272a'
const CHART_TOOLTIP_BG = '#18181b'
const CHART_TOOLTIP_BORDER = '#27272a'
const COL_WITHHELD = '#3b82f6'
const COL_OWED = '#eab308'
const COL_REFUND = '#22c55e'

function axisTickMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`
  return formatCurrency(n)
}

interface TaxDetails {
  incomeChristophe: number
  incomeClaire: number
  totalWages: number
  capitalGains: number
  dividends: number
  totalInvestmentIncome: number
  deduction: number
  niit: number | null
  taxOnWages: number | null
  otherTaxes: number | null
  taxCredits: number | null
  fedWithholdingChristophe: number
  fedWithholdingClaire: number
  additionalMedicareWithholding: number | null
  stateWithholdingChristophe: number | null
  stateWithholdingClaire: number | null
  capitalLossCarryover: number | null
}

interface TaxYear {
  year: number
  totalIncome: number
  taxableIncome: number
  federalTax: number
  federalWithholding: number
  federalDue: number
  stateTax: number
  stateDue: number
  details: TaxDetails
}

const taxes: TaxYear[] = (taxesData as TaxYear[]).sort((a, b) => b.year - a.year)

type TaxStackChartRow = {
  year: string
  federalDue: number
  stateDue: number
  fedBase: number
  fedOwed: number
  fedRefund: number
  caBase: number
  caOwed: number
  caRefund: number
}

function TaxStackTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{
    dataKey?: string | number
    value?: number
    color?: string
    payload?: TaxStackChartRow
  }>
  label?: string
}) {
  if (!active || !payload?.length || !payload[0]?.payload) return null
  const row = payload[0].payload
  const lines: { key: string; label: string; value: number; color: string }[] = []

  if (row.fedBase > 0) {
    lines.push({
      key: 'fb',
      label: row.federalDue >= 0 ? 'Federal — Withheld' : 'Federal — Tax (liability)',
      value: row.fedBase,
      color: COL_WITHHELD,
    })
  }
  if (row.fedOwed > 0) {
    lines.push({ key: 'fo', label: 'Federal — Owed at filing', value: row.fedOwed, color: COL_OWED })
  }
  if (row.fedRefund > 0) {
    lines.push({
      key: 'fr',
      label: 'Federal — Refund (over-withheld)',
      value: row.fedRefund,
      color: COL_REFUND,
    })
  }
  if (row.caBase > 0) {
    lines.push({
      key: 'cb',
      label: row.stateDue >= 0 ? 'CA — Withheld' : 'CA — Tax (liability)',
      value: row.caBase,
      color: COL_WITHHELD,
    })
  }
  if (row.caOwed > 0) {
    lines.push({ key: 'co', label: 'CA — Owed at filing', value: row.caOwed, color: COL_OWED })
  }
  if (row.caRefund > 0) {
    lines.push({
      key: 'cr',
      label: 'CA — Refund (over-withheld)',
      value: row.caRefund,
      color: COL_REFUND,
    })
  }

  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-lg"
      style={{ backgroundColor: CHART_TOOLTIP_BG, borderColor: CHART_TOOLTIP_BORDER }}
    >
      <p className="font-semibold mb-1" style={{ color: '#fafafa' }}>
        {label}
      </p>
      <div className="space-y-1">
        {lines.map(l => (
          <div key={l.key} className="flex items-center justify-between gap-6 tabular-nums">
            <span className="flex items-center gap-2" style={{ color: CHART_AXIS }}>
              <span className="h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: l.color }} />
              {l.label}
            </span>
            <span style={{ color: '#fafafa' }}>{formatCurrency(l.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TaxesOverviewCharts({ data }: { data: TaxYear[] }) {
  const chronological = useMemo(() => [...data].sort((a, b) => a.year - b.year), [data])

  const incomeChartData = useMemo(
    () => chronological.map(t => ({ year: String(t.year), taxableIncome: t.taxableIncome })),
    [chronological]
  )

  const taxStackData = useMemo<TaxStackChartRow[]>(
    () =>
      chronological.map(t => {
        const stateWithheld = t.stateTax - t.stateDue
        const fd = t.federalDue
        const sd = t.stateDue
        return {
          year: String(t.year),
          federalDue: fd,
          stateDue: sd,
          fedBase: fd >= 0 ? t.federalWithholding : t.federalTax,
          fedOwed: fd > 0 ? fd : 0,
          fedRefund: fd < 0 ? -fd : 0,
          caBase: sd >= 0 ? stateWithheld : t.stateTax,
          caOwed: sd > 0 ? sd : 0,
          caRefund: sd < 0 ? -sd : 0,
        }
      }),
    [chronological]
  )

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Taxable income</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Federal taxable income by tax year</p>
        </div>
        <div className="px-4 sm:px-6 py-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incomeChartData} barCategoryGap="18%" margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: CHART_AXIS }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: CHART_AXIS }}
                axisLine={false}
                tickLine={false}
                width={52}
                tickFormatter={axisTickMoney}
              />
              <Tooltip
                cursor={{ fill: 'rgba(63, 63, 70, 0.35)' }}
                contentStyle={{
                  backgroundColor: CHART_TOOLTIP_BG,
                  border: `1px solid ${CHART_TOOLTIP_BORDER}`,
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#fafafa', fontWeight: 600, marginBottom: 4 }}
                formatter={(value: unknown) => [formatCurrency(Number(value)), 'Taxable income']}
              />
              <Bar dataKey="taxableIncome" fill={COL_WITHHELD} radius={[4, 4, 0, 0]} name="Taxable income" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Federal &amp; California tax</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Stacked bars: withheld (or full liability in refund years), plus owed at filing or refund of over-withholding.
            Two columns per year — federal and CA.
          </p>
        </div>
        <div className="px-4 sm:px-6 py-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={taxStackData} barGap={4} barCategoryGap="22%" margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: CHART_AXIS }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: CHART_AXIS }}
                axisLine={false}
                tickLine={false}
                width={52}
                tickFormatter={axisTickMoney}
              />
              <Tooltip content={<TaxStackTooltip />} cursor={{ fill: 'rgba(63, 63, 70, 0.35)' }} />
              <Bar stackId="fed" dataKey="fedBase" fill={COL_WITHHELD} name="Withheld" />
              <Bar stackId="fed" dataKey="fedOwed" fill={COL_OWED} name="Owed at filing" />
              <Bar stackId="fed" dataKey="fedRefund" fill={COL_REFUND} name="Refund" />
              <Bar stackId="ca" dataKey="caBase" fill={COL_WITHHELD} name="Withheld" />
              <Bar stackId="ca" dataKey="caOwed" fill={COL_OWED} name="Owed at filing" />
              <Bar stackId="ca" dataKey="caRefund" fill={COL_REFUND} name="Refund" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="px-6 pb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground border-t border-border/50 pt-3">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: COL_WITHHELD }} />
            Blue: withheld (refund years: tax liability)
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: COL_OWED }} />
            Amber: owed at filing
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: COL_REFUND }} />
            Green: refund from over-withholding
          </span>
        </div>
      </div>
    </div>
  )
}

function rate(tax: number, income: number) {
  if (income === 0) return '0%'
  return (tax / income * 100).toFixed(1) + '%'
}

function DueRefundBadge({ amount }: { amount: number }) {
  if (amount === 0) return <span className="text-xs text-muted-foreground">—</span>
  const isRefund = amount < 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded',
        isRefund ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
      )}
    >
      {isRefund ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
      {isRefund ? 'Refund' : 'Owed'} {formatCurrency(Math.abs(amount))}
    </span>
  )
}

function DetailRow({ label, value, bold, indent }: { label: string; value: number | null; bold?: boolean; indent?: boolean }) {
  if (value === null) return null
  return (
    <div className={cn('flex items-center justify-between py-1', indent && 'pl-4')}>
      <span className={cn('text-xs', bold ? 'font-medium text-foreground' : 'text-muted-foreground')}>{label}</span>
      <span className={cn('text-xs tabular-nums', bold ? 'font-medium' : '', value < 0 ? 'text-destructive' : '')}>
        {value < 0 ? `(${formatCurrency(Math.abs(value))})` : formatCurrency(value)}
      </span>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-3 pb-1 border-b border-border/50 mb-1">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{children}</span>
    </div>
  )
}

function ExpandedDetails({ t }: { t: TaxYear }) {
  const d = t.details
  const stateWithholding = t.stateTax - t.stateDue

  return (
    <div className="px-6 py-4 border-t border-border bg-background/50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <SectionLabel>Income</SectionLabel>
          <DetailRow label="Christophe" value={d.incomeChristophe} indent />
          <DetailRow label="Claire" value={d.incomeClaire} indent />
          <DetailRow label="Total Wages" value={d.totalWages} bold />
          <div className="h-2" />
          <DetailRow label="Capital Gains" value={d.capitalGains} />
          <DetailRow label="Dividends" value={d.dividends} />
          <DetailRow label="Total Investment Income" value={d.totalInvestmentIncome} bold />
          <div className="h-2" />
          <DetailRow label="Total Income" value={t.totalIncome} bold />
          <DetailRow label="Deduction" value={-d.deduction} />
          <div className="border-t border-border/50 mt-1 pt-1">
            <DetailRow label="Taxable Income" value={t.taxableIncome} bold />
          </div>
          {d.capitalLossCarryover !== null && (
            <>
              <div className="h-2" />
              <DetailRow label="Capital Loss Carryover" value={d.capitalLossCarryover} />
            </>
          )}
        </div>

        <div>
          <SectionLabel>Federal Tax</SectionLabel>
          <DetailRow label="Tax on Wages" value={d.taxOnWages} />
          <DetailRow label="Net Investment Income Tax" value={d.niit} />
          <DetailRow label="Other Taxes" value={d.otherTaxes} />
          {d.taxCredits !== null && d.taxCredits > 0 && (
            <DetailRow label="Tax Credits" value={-d.taxCredits} />
          )}
          <div className="border-t border-border/50 mt-1 pt-1">
            <DetailRow label="Total Federal Tax" value={t.federalTax} bold />
          </div>

          <div className="h-3" />
          <SectionLabel>Federal Withholding</SectionLabel>
          <DetailRow label="Christophe" value={d.fedWithholdingChristophe} indent />
          <DetailRow label="Claire" value={d.fedWithholdingClaire} indent />
          <DetailRow label="Addl. Medicare" value={d.additionalMedicareWithholding} indent />
          <div className="border-t border-border/50 mt-1 pt-1">
            <DetailRow label="Total Withheld" value={t.federalWithholding} bold />
          </div>
          <div className="mt-2 flex justify-end">
            <DueRefundBadge amount={t.federalDue} />
          </div>
        </div>

        <div>
          <SectionLabel>California Tax</SectionLabel>
          <DetailRow label="Total State Tax" value={t.stateTax} bold />

          <div className="h-3" />
          <SectionLabel>State Withholding</SectionLabel>
          <DetailRow label="Christophe" value={d.stateWithholdingChristophe} indent />
          <DetailRow label="Claire" value={d.stateWithholdingClaire} indent />
          <div className="border-t border-border/50 mt-1 pt-1">
            <DetailRow label="Total Withheld" value={stateWithholding} bold />
          </div>
          <div className="mt-2 flex justify-end">
            <DueRefundBadge amount={t.stateDue} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function TaxesSection() {
  const [expandedYear, setExpandedYear] = useState<number | null>(null)

  return (
    <div className="space-y-8">
      <TaxesOverviewCharts data={taxes} />

      <div className="space-y-5">
        {taxes.map(t => {
          const totalTax = t.federalTax + t.stateTax
          const totalDue = t.federalDue + t.stateDue
          const expanded = expandedYear === t.year

          return (
            <div key={t.year} className="bg-card border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedYear(expanded ? null : t.year)}
                className="w-full text-left px-6 py-4 border-b border-border flex items-center justify-between hover:bg-accent/20 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  {expanded
                    ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  }
                  <h2 className="text-xl font-semibold tabular-nums">{t.year}</h2>
                  <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Taxable Income</span>
                    <span className="font-semibold text-foreground">{formatCurrency(t.taxableIncome)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="text-right hidden lg:block">
                    <p className="text-xs text-muted-foreground">Total Tax</p>
                    <p className="text-sm font-semibold text-primary">{formatCurrency(totalTax)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Effective Rate</p>
                    <p className="text-sm font-semibold">{rate(totalTax, t.taxableIncome)}</p>
                  </div>
                </div>
              </button>

              <div className="sm:hidden px-6 py-3 border-b border-border/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Taxable Income</span>
                  <span className="font-semibold">{formatCurrency(t.taxableIncome)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                <div className="px-6 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">Federal</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{rate(t.federalTax, t.taxableIncome)}</span>
                      <span className="text-sm font-semibold">{formatCurrency(t.federalTax)}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Withheld</span>
                      <span>{formatCurrency(t.federalWithholding)}</span>
                    </div>
                  </div>
                  <DueRefundBadge amount={t.federalDue} />
                </div>

                <div className="px-6 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">California</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{rate(t.stateTax, t.taxableIncome)}</span>
                      <span className="text-sm font-semibold">{formatCurrency(t.stateTax)}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Withheld</span>
                      <span>{formatCurrency(t.stateTax - t.stateDue)}</span>
                    </div>
                  </div>
                  <DueRefundBadge amount={t.stateDue} />
                </div>
              </div>

              <div className="px-6 py-3 bg-accent/20 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Net due at filing</span>
                <DueRefundBadge amount={totalDue} />
              </div>

              {expanded && <ExpandedDetails t={t} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
