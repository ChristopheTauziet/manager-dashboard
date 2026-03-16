import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, ChevronDown, ChevronRight } from 'lucide-react'
import taxesData from '../../../data/taxes.json'

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

export default function TaxesPage() {
  const [expandedYear, setExpandedYear] = useState<number | null>(null)

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Taxes</h1>

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
