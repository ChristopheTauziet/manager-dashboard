import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Check, Pizza, ShoppingBasket, X } from 'lucide-react'
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
  id: string
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

// ── Shopping list helpers ───────────────────────────────────

function normalizeIngredientKey(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ')
}

type ShoppingCategory = 'vegetables' | 'herbs' | 'cheeses' | 'meats' | 'other'

const SHOPPING_CATEGORY_ORDER: ShoppingCategory[] = [
  'vegetables',
  'herbs',
  'cheeses',
  'meats',
  'other',
]

const SHOPPING_CATEGORY_LABEL: Record<ShoppingCategory, string> = {
  vegetables: 'Vegetables & produce',
  herbs: 'Herbs',
  cheeses: 'Cheeses',
  meats: 'Meats & seafood',
  other: 'Pantry & other',
}

/** Rough grouping for the shopping list (keyword heuristics). */
function categorizeIngredient(label: string): ShoppingCategory {
  const s = normalizeIngredientKey(label)

  // Bases / sauces / oils / condiments (before cheese names inside "pecorino base", etc.)
  if (
    /\b\w+ base\b/.test(s) ||
    s.includes('oil base') ||
    s.includes('olive oil') ||
    s.includes('extra olive oil') ||
    s.includes('oil drizzle') ||
    s.includes('balsamic') ||
    s.includes('glaze') ||
    s.includes('vinegar') ||
    s.includes('tomato sauce') ||
    s.includes('tzatziki') ||
    s.includes('truffle cream') ||
    s.includes('ricotta cream') ||
    s.includes('cream base')
  ) {
    return 'other'
  }

  // Meats & seafood
  if (
    [
      'prosciutto',
      'pancetta',
      'bacon',
      'salmon',
      'mortadella',
      'sausage',
      'pepperoni',
      'anchovy',
      'soppressata',
      'nduja',
    ].some(k => s.includes(k))
  ) {
    return 'meats'
  }

  // Cheeses (after bases)
  if (
    [
      'mozzarella',
      'burrata',
      'burratina',
      'parmesan',
      'pecorino',
      'ricotta',
      'gorgonzola',
      'feta',
      'cheddar',
      'brie',
      'grana',
      'stracciatella',
      'fior di latte',
      'parmigiano',
      'blue cheese',
      'mascarpone',
      'provolone',
      'gruyere',
      'goat cheese',
      'chevre',
      'fontina',
      'comté',
      'comte',
    ].some(k => s.includes(k))
  ) {
    return 'cheeses'
  }

  // Herbs
  if (
    ['basil', 'rosemary', 'thyme', 'oregano', 'parsley', 'cilantro', 'mint', 'dill', 'sage', 'marjoram', 'chive'].some(
      k => s.includes(k)
    )
  ) {
    return 'herbs'
  }

  // Pesto spreads (not already caught as base)
  if (s.includes('pesto')) return 'other'

  // Pantry / nuts / spices / eggs (before broad "pepper")
  if (
    s.includes('pine nut') ||
    s.includes('pistachio') ||
    s.includes('egg yolk') ||
    s.includes('black pepper') ||
    (s.includes('pepper') && !s.includes('bell pepper') && !s.includes('pepperoni'))
  ) {
    return 'other'
  }

  // Pesto as spread (not pistachio pesto already handled)
  if (s.includes('pesto')) return 'other'

  // Vegetables & produce
  if (
    [
      'tomato',
      'onion',
      'mushroom',
      'arugula',
      'peach',
      'cherry',
      'heirloom',
      'zucchini',
      'spinach',
      'kale',
      'lettuce',
      'garlic',
      'artichoke',
      'eggplant',
      'potato',
      'cucumber',
      'corn',
      'broccoli',
      'jalapeño',
      'bell pepper',
      'radicchio',
      'fig',
      'lemon',
      'lime',
      'sprout',
    ].some(k => s.includes(k))
  ) {
    return 'vegetables'
  }

  return 'other'
}

function aggregateShoppingIngredients(
  selectedIds: string[],
  pizzaList: PizzaRecipe[]
): { key: string; label: string }[] {
  const map = new Map<string, string>()
  const idSet = new Set(selectedIds)
  for (const p of pizzaList) {
    if (!idSet.has(p.id)) continue
    for (const sec of p.sections) {
      for (const item of sec.items) {
        const key = normalizeIngredientKey(item)
        if (!map.has(key)) map.set(key, item.trim())
      }
    }
  }
  return Array.from(map.entries()).map(([key, label]) => ({ key, label }))
}

function groupShoppingByCategory(items: { key: string; label: string }[]): {
  category: ShoppingCategory
  label: string
  items: { key: string; label: string }[]
}[] {
  const buckets = new Map<ShoppingCategory, { key: string; label: string }[]>()
  for (const c of SHOPPING_CATEGORY_ORDER) buckets.set(c, [])
  for (const item of items) {
    const cat = categorizeIngredient(item.label)
    buckets.get(cat)!.push(item)
  }
  return SHOPPING_CATEGORY_ORDER.filter(c => (buckets.get(c)?.length ?? 0) > 0).map(category => ({
    category,
    label: SHOPPING_CATEGORY_LABEL[category],
    items: (buckets.get(category) ?? []).sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
    ),
  }))
}

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

function PizzaCard({
  p,
  selected,
  onToggle,
}: {
  p: PizzaRecipe
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        // p-0 + flex column: WebKit vertically centers button contents when the grid stretches the card to match a taller neighbor — that caused the header gap. Pin content to the top; let the body grow.
        'm-0 flex h-full min-h-0 w-full flex-col items-stretch justify-start appearance-none p-0 text-left font-sans text-inherit',
        'rounded-xl border bg-card overflow-hidden shadow-sm transition',
        'hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60',
        selected
          ? 'ring-2 ring-orange-500/70 border-orange-500/50'
          : p.starred
            ? 'border-amber-500/50 ring-1 ring-amber-500/20'
            : 'border-border'
      )}
    >
      <div
        className={cn(
          'relative flex shrink-0 items-start gap-3 rounded-t-xl border-b border-border px-4 py-4',
          p.starred && 'bg-amber-500/5',
          selected && 'bg-orange-500/10'
        )}
      >
        <span className="text-3xl leading-none" aria-hidden>
          {p.emoji}
        </span>
        <div className="min-w-0 flex-1 pr-14">
          <div className="font-semibold leading-snug">{p.name}</div>
          {p.subtitle && (
            <div className="mt-0.5 text-xs font-normal text-muted-foreground">{p.subtitle}</div>
          )}
          <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-orange-400">
            {selected ? 'In shopping list · tap to remove' : 'Tap to add to shopping list'}
          </div>
        </div>
        {p.starred && !selected && <span className="absolute top-3 right-3 text-base">⭐</span>}
        {selected && (
          <span className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white">
            <Check className="h-4 w-4" strokeWidth={3} />
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1 space-y-3 px-4 py-4 text-sm pointer-events-none">
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
    </button>
  )
}

function ShoppingListDock({
  grouped,
  checked,
  onToggleItem,
  onResetChecks,
  recipeCount,
  onClearRecipes,
}: {
  grouped: {
    category: ShoppingCategory
    label: string
    items: { key: string; label: string }[]
  }[]
  checked: Record<string, boolean>
  onToggleItem: (key: string) => void
  onResetChecks: () => void
  recipeCount: number
  onClearRecipes: () => void
}) {
  const flat = grouped.flatMap(g => g.items)
  const done = flat.filter(i => checked[i.key]).length
  const total = flat.length

  return (
    <div
      className={cn(
        'fixed inset-x-0 z-[60] border-t border-border bg-card/95 backdrop-blur-md shadow-[0_-8px_30px_rgba(0,0,0,0.35)]',
        'bottom-16 max-h-[min(50vh,22rem)] md:bottom-0 md:max-h-[min(45vh,24rem)]',
        'flex flex-col'
      )}
      role="region"
      aria-label="Shopping list"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/80 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <ShoppingBasket className="h-5 w-5 shrink-0 text-orange-400" aria-hidden />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-tight">Shopping list</h3>
            <p className="text-[11px] text-muted-foreground">
              {recipeCount === 0
                ? 'Select pizza recipes above'
                : `${recipeCount} recipe${recipeCount === 1 ? '' : 's'} · ${done}/${total} checked`}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {recipeCount > 0 && total > 0 && (
            <button
              type="button"
              onClick={onResetChecks}
              className="rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              Uncheck all
            </button>
          )}
          {recipeCount > 0 && (
            <button
              type="button"
              onClick={onClearRecipes}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
            >
              <X className="h-3 w-3" />
              Clear recipes
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
        {total === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            Tap one or more pizza cards to merge ingredients here. Duplicates are merged automatically.
          </p>
        ) : (
          <div className="space-y-4 pb-2">
            {grouped.map(group => (
              <div key={group.category}>
                <h4 className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-orange-400/95">
                  {group.label}
                </h4>
                <ul className="space-y-0.5">
                  {group.items.map(({ key, label }) => {
                    const isChecked = !!checked[key]
                    return (
                      <li key={key}>
                        <label
                          className={cn(
                            'flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/40',
                            isChecked && 'opacity-60'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => onToggleItem(key)}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-orange-500"
                          />
                          <span
                            className={cn(
                              'text-sm leading-snug',
                              isChecked && 'line-through text-muted-foreground'
                            )}
                          >
                            {label}
                          </span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────

export default function PizzaPlaybookPage() {
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([])
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const aggregated = useMemo(
    () => aggregateShoppingIngredients(selectedRecipeIds, pizzas),
    [selectedRecipeIds]
  )

  const groupedShopping = useMemo(() => groupShoppingByCategory(aggregated), [aggregated])

  useEffect(() => {
    const keys = new Set(aggregated.map(i => i.key))
    setChecked(prev => {
      const next: Record<string, boolean> = {}
      for (const k of keys) {
        next[k] = prev[k] ?? false
      }
      return next
    })
  }, [aggregated])

  function toggleRecipe(id: string) {
    setSelectedRecipeIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function toggleCheck(key: string) {
    setChecked(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-10 pb-44 md:pb-40">
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
          <a
            href="#shopping-list"
            className="rounded-full border border-orange-500/50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-400 hover:bg-orange-500/15 transition-colors"
          >
            Shopping list
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
            Favourites first · Pre-bake & post-bake toppings · Tap a card to add ingredients to your list
          </p>
        </div>
        <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {pizzas.map(p => (
            <PizzaCard
              key={p.id}
              p={p}
              selected={selectedRecipeIds.includes(p.id)}
              onToggle={() => toggleRecipe(p.id)}
            />
          ))}
        </div>
      </section>

      <div id="shopping-list" className="h-px scroll-mt-28 w-full shrink-0" aria-hidden />

      <footer className="border-t border-border pt-8 text-center text-xs text-muted-foreground">
        {meta.footer}
      </footer>

      <ShoppingListDock
        grouped={groupedShopping}
        checked={checked}
        onToggleItem={toggleCheck}
        onResetChecks={() => setChecked(Object.fromEntries(aggregated.map(i => [i.key, false])))}
        recipeCount={selectedRecipeIds.length}
        onClearRecipes={() => setSelectedRecipeIds([])}
      />
    </div>
  )
}
