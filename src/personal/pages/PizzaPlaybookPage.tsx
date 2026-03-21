import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Pizza } from 'lucide-react'
import playbookData from '../../../data/pizza-playbook.json'

// ── Types ───────────────────────────────────────────────────

interface IngredientRow {
  name: string
  amount: string
}

interface StaticDough {
  id: string
  title: string
  meta: string
  ingredients: IngredientRow[]
  steps: string[]
  tip?: string
}

interface PizzaSection {
  phase: 'pre' | 'post'
  label: string
  items: string[]
}

interface PizzaRecipe {
  emoji: string
  name: string
  subtitle?: string
  starred?: boolean
  sections: PizzaSection[]
  note?: string
}

const meta = playbookData.meta as { subtitle: string; footer: string }
const staticDoughs = playbookData.staticDoughs as StaticDough[]
const pizzas = playbookData.pizzas as PizzaRecipe[]

// ── Biga calculator (base = 9 balls) ────────────────────────

const BIGA_BASE = {
  balls: 9,
  bigaFlour: 2000,
  bigaWater: 900,
  bigaYeast: 2,
  finalWater: 420,
  salt: 50,
} as const

function fmtGrams(grams: number) {
  if (grams < 10) return `${grams.toFixed(1)}g`
  return `${Math.round(grams)}g`
}

function fmtWithNote(grams: number, note?: string) {
  return fmtGrams(grams) + (note ? ` ${note}` : '')
}

function BigaDoughCard() {
  const [balls, setBalls] = useState(9)

  const scaled = useMemo(() => {
    const ratio = balls / BIGA_BASE.balls
    return {
      bigaFlour: BIGA_BASE.bigaFlour * ratio,
      bigaWater: BIGA_BASE.bigaWater * ratio,
      bigaYeast: BIGA_BASE.bigaYeast * ratio,
      finalWater: BIGA_BASE.finalWater * ratio,
      salt: BIGA_BASE.salt * ratio,
    }
  }, [balls])

  const yeastDisplay =
    scaled.bigaYeast < 10 ? `${scaled.bigaYeast.toFixed(1)}g` : fmtGrams(scaled.bigaYeast)

  return (
    <div
      className={cn(
        'rounded-xl border-2 border-orange-500/60 bg-card p-6 md:p-8 shadow-sm relative overflow-hidden',
        'ring-1 ring-orange-500/20'
      )}
    >
      <div className="absolute top-0 right-0 rounded-bl-lg bg-orange-500/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white">
        Current best
      </div>

      <h3 className="text-lg font-semibold text-foreground pr-24">Biga Method</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        November 2025 · <span className="tabular-nums">{balls}</span> balls × 360g · ~63% hydration total
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-4 rounded-lg border border-orange-500/40 bg-orange-500/10 px-4 py-3">
        <span className="text-xs font-bold uppercase tracking-wide text-orange-400 whitespace-nowrap">
          Number of balls
        </span>
        <input
          type="range"
          min={1}
          max={20}
          value={balls}
          onChange={e => setBalls(Number(e.target.value))}
          className="min-w-[120px] flex-1 accent-orange-500 h-2 cursor-pointer"
        />
        <span className="min-w-[3rem] rounded-md bg-orange-500 px-3 py-1 text-center text-sm font-bold tabular-nums text-white">
          {balls}
        </span>
      </div>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="space-y-5">
          <div>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-orange-400">
              The Biga (Day Before — morning)
            </div>
            <IngredientTable
              rows={[
                { name: 'Type 00 Flour', amount: fmtGrams(scaled.bigaFlour) },
                { name: 'Water', amount: fmtWithNote(scaled.bigaWater, '(45%)') },
                { name: 'Instant yeast', amount: yeastDisplay },
              ]}
            />
            <div className="mt-3 rounded-md border-l-2 border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-xs italic text-emerald-300/90 leading-relaxed">
              Mix roughly by hand — do <strong className="not-italic">not</strong> form a proper dough. Keep it shaggy.
              Refrigerate 16–18h.
            </div>
          </div>

          <div>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-orange-400">
              Final Dough (Day Of — morning)
            </div>
            <IngredientTable
              rows={[
                { name: 'Cold water', amount: fmtGrams(scaled.finalWater) },
                { name: 'Salt', amount: fmtGrams(scaled.salt) },
              ]}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-orange-400">Steps</div>
          <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm leading-relaxed space-y-2">
            <Step n={1}>
              Add biga + half the cold water to mixer on <strong>slow</strong> speed for 5 min
            </Step>
            <Step n={2}>
              Add remaining water + salt, switch to <strong>high</strong> speed for 5 more min
            </Step>
            <Step n={3}>
              <strong>Fold</strong> the dough to build strength. Rest 20 min.
            </Step>
            <Step n={4}>
              Form <strong>{balls} balls</strong> (360g each). Rise at room temp 1h.
            </Step>
            <Step n={5}>
              Refrigerate until needed. Take out <strong>30 min before</strong> stretching.
            </Step>
          </div>
        </div>
      </div>
    </div>
  )
}

function IngredientTable({ rows }: { rows: IngredientRow[] }) {
  return (
    <div className="divide-y divide-dotted divide-border">
      {rows.map(row => (
        <div key={row.name} className="flex justify-between gap-4 py-2 text-sm first:pt-0">
          <span className="text-foreground">{row.name}</span>
          <span className="shrink-0 font-semibold tabular-nums text-orange-400">{row.amount}</span>
        </div>
      ))}
    </div>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
        {n}
      </span>
      <span>{children}</span>
    </div>
  )
}

function StaticDoughCard({ d }: { d: StaticDough }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm">
      <h3 className="text-lg font-semibold">{d.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{d.meta}</p>
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-orange-400">Ingredients</div>
          <IngredientTable rows={d.ingredients} />
          {d.tip && (
            <div className="mt-3 rounded-md border-l-2 border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-xs italic text-emerald-300/90">
              {d.tip}
            </div>
          )}
        </div>
        <div>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-orange-400">Steps</div>
          <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm leading-relaxed space-y-2">
            {d.steps.map((text, i) => (
              <Step key={i} n={i + 1}>
                {text}
              </Step>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PizzaCard({ p }: { p: PizzaRecipe }) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card overflow-hidden shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
        p.starred ? 'border-amber-500/50 ring-1 ring-amber-500/20' : 'border-border'
      )}
    >
      <div
        className={cn(
          'flex items-start gap-3 border-b border-border px-4 py-4 relative',
          p.starred && 'bg-amber-500/5'
        )}
      >
        <span className="text-3xl leading-none" aria-hidden>
          {p.emoji}
        </span>
        <div className="min-w-0 flex-1 pr-8">
          <div className="font-semibold leading-snug">{p.name}</div>
          {p.subtitle && (
            <div className="mt-0.5 text-xs font-normal text-muted-foreground">{p.subtitle}</div>
          )}
        </div>
        {p.starred && <span className="absolute top-3 right-3 text-base">⭐</span>}
      </div>
      <div className="space-y-3 px-4 py-4 text-sm">
        {p.sections.map((sec, i) => (
          <div key={`${sec.label}-${i}`}>
            <div
              className={cn(
                'mb-1.5 text-[10px] font-bold uppercase tracking-wider',
                sec.phase === 'post' ? 'text-emerald-400' : 'text-orange-400'
              )}
            >
              {sec.label}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sec.items.map(item => (
                <span
                  key={item}
                  className={cn(
                    'inline-block rounded-full px-2.5 py-0.5 text-xs',
                    sec.phase === 'post'
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'bg-muted text-foreground/90'
                  )}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
        {p.note && (
          <p className="mt-2 border-t border-dotted border-border pt-2 text-xs italic text-muted-foreground">
            {p.note}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────

export default function PizzaPlaybookPage() {
  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Pizza className="h-7 w-7 text-orange-400" aria-hidden />
            Pizza Playbook
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{meta.subtitle}</p>
        </div>
        <nav className="flex flex-wrap gap-2 pt-1">
          <a
            href="#dough"
            className="rounded-full border border-orange-500/50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-400 hover:bg-orange-500/15 transition-colors"
          >
            Dough recipes
          </a>
          <a
            href="#pizzas"
            className="rounded-full border border-orange-500/50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-400 hover:bg-orange-500/15 transition-colors"
          >
            Pizza recipes
          </a>
        </nav>
      </div>

      <section id="dough" className="scroll-mt-24 space-y-6">
        <div>
          <h2 className="text-xl font-semibold border-b border-orange-500/40 pb-2 text-orange-400">
            Dough recipes
          </h2>
          <p className="mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Most recent & best at the top
          </p>
        </div>
        <BigaDoughCard />
        {staticDoughs.map(d => (
          <StaticDoughCard key={d.id} d={d} />
        ))}
      </section>

      <section id="pizzas" className="scroll-mt-24 space-y-6">
        <div>
          <h2 className="text-xl font-semibold border-b border-orange-500/40 pb-2 text-orange-400">
            Pizza recipes
          </h2>
          <p className="mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Favourites first · Pre-bake & post-bake toppings
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {pizzas.map(p => (
            <PizzaCard key={p.name + (p.subtitle ?? '')} p={p} />
          ))}
        </div>
      </section>

      <footer className="border-t border-border pt-8 text-center text-xs text-muted-foreground">
        {meta.footer}
      </footer>
    </div>
  )
}
