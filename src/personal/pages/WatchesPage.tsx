import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronRight, LayoutGrid, List, ArrowUpDown, Watch } from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import watchesData from '../../../data/watches.json'

type SortField = 'date' | 'price'
type SortDir = 'asc' | 'desc'
type ViewMode = 'cards' | 'table'

const BASE = import.meta.env.BASE_URL

interface WatchEntry {
  name: string
  ref: string | null
  price: number
  date: string | null
  image: string
  notes: string | null
}

const watches: WatchEntry[] = watchesData as WatchEntry[]
const totalSpent = watches.reduce((sum, w) => sum + w.price, 0)

function sortWatches(items: WatchEntry[], field: SortField, dir: SortDir) {
  return [...items].sort((a, b) => {
    if (field === 'price') {
      return dir === 'asc' ? a.price - b.price : b.price - a.price
    }
    const da = a.date ? new Date(a.date).getTime() : 0
    const db = b.date ? new Date(b.date).getTime() : 0
    return dir === 'asc' ? da - db : db - da
  })
}

export function WatchesSection() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<ViewMode>('cards')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const sorted = sortWatches(watches, sortField, sortDir)

  useEffect(() => {
    if (location.hash === '#watches') setOpen(true)
  }, [location.hash])

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  return (
    <section id="watches" className="scroll-mt-24 space-y-4">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/30"
        aria-expanded={open}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/15">
          <Watch className="h-5 w-5 text-violet-400" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Watches</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {watches.length} pieces &middot; {formatCurrency(totalSpent)} total
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
        <div className="space-y-6">
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
              <button
                type="button"
                onClick={() => setView('cards')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  view === 'cards'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <LayoutGrid className="h-4 w-4" />
                Cards
              </button>
              <button
                type="button"
                onClick={() => setView('table')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  view === 'table'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <List className="h-4 w-4" />
                Table
              </button>
            </div>
          </div>

          {view === 'cards' ? (
            <CardView watches={sorted} sortField={sortField} sortDir={sortDir} onToggleSort={toggleSort} />
          ) : (
            <TableView watches={sorted} sortField={sortField} sortDir={sortDir} onToggleSort={toggleSort} />
          )}
        </div>
      )}
    </section>
  )
}

function SortControls({
  sortField,
  onToggleSort,
}: {
  sortField: SortField
  sortDir: SortDir
  onToggleSort: (f: SortField) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground mr-1">Sort by</span>
      {(['date', 'price'] as SortField[]).map(field => (
        <button
          key={field}
          onClick={() => onToggleSort(field)}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors',
            sortField === field
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          )}
        >
          {field === 'date' ? 'Date' : 'Price'}
          {sortField === field && (
            <ArrowUpDown className="h-3 w-3" />
          )}
        </button>
      ))}
    </div>
  )
}

function CardView({
  watches,
  sortField,
  sortDir,
  onToggleSort,
}: {
  watches: WatchEntry[]
  sortField: SortField
  sortDir: SortDir
  onToggleSort: (f: SortField) => void
}) {
  return (
    <div className="space-y-4">
      <SortControls sortField={sortField} sortDir={sortDir} onToggleSort={onToggleSort} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {watches.map(watch => (
          <div
            key={watch.name}
            className="bg-card border border-border rounded-xl overflow-hidden group"
          >
            <div className="aspect-[16/10] overflow-hidden bg-muted relative">
              <img
                src={`${BASE}watches/${watch.image}`}
                alt={watch.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              {watch.notes && (
                <span className="absolute top-3 right-3 bg-warning/90 text-background text-xs font-medium px-2 py-0.5 rounded">
                  {watch.notes.includes('Sold') ? 'Sold' : 'Note'}
                </span>
              )}
            </div>
            <div className="p-4 space-y-1">
              <h3 className="font-medium text-sm leading-tight">{watch.name}</h3>
              {watch.ref && (
                <p className="text-xs text-muted-foreground font-mono">Ref. {watch.ref}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-primary">
                  {formatCurrency(watch.price)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {watch.date ? formatDate(watch.date) : 'Unknown date'}
                </span>
              </div>
              {watch.notes && (
                <p className="text-xs text-muted-foreground pt-1">{watch.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TableView({
  watches,
  sortField,
  sortDir,
  onToggleSort,
}: {
  watches: WatchEntry[]
  sortField: SortField
  sortDir: SortDir
  onToggleSort: (f: SortField) => void
}) {
  const arrow = sortDir === 'asc' ? '↑' : '↓'

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 w-16"></th>
            <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Watch</th>
            <th
              className="text-right text-xs font-medium text-muted-foreground px-5 py-3 cursor-pointer hover:text-foreground select-none"
              onClick={() => onToggleSort('price')}
            >
              Price {sortField === 'price' && arrow}
            </th>
            <th
              className="text-right text-xs font-medium text-muted-foreground px-5 py-3 cursor-pointer hover:text-foreground select-none hidden sm:table-cell"
              onClick={() => onToggleSort('date')}
            >
              Date {sortField === 'date' && arrow}
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Notes</th>
          </tr>
        </thead>
        <tbody>
          {watches.map(watch => (
            <tr key={watch.name} className="border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors">
              <td className="px-5 py-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={`${BASE}watches/${watch.image}`}
                    alt={watch.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </td>
              <td className="px-5 py-3">
                <span className="text-sm font-medium">{watch.name}</span>
                {watch.ref && (
                  <span className="text-xs text-muted-foreground font-mono block mt-0.5">Ref. {watch.ref}</span>
                )}
                {watch.date && (
                  <span className="text-xs text-muted-foreground sm:hidden block mt-0.5">
                    {formatDate(watch.date)}
                  </span>
                )}
              </td>
              <td className="px-5 py-3 text-right">
                <span className="text-sm font-medium text-primary">{formatCurrency(watch.price)}</span>
              </td>
              <td className="px-5 py-3 text-right hidden sm:table-cell">
                <span className="text-sm text-muted-foreground">
                  {watch.date ? formatDate(watch.date) : '—'}
                </span>
              </td>
              <td className="px-5 py-3 hidden md:table-cell">
                {watch.notes ? (
                  <span className="text-xs text-muted-foreground">{watch.notes}</span>
                ) : (
                  <span className="text-xs text-muted-foreground/40">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border bg-accent/20">
            <td className="px-5 py-4" />
            <td className="px-5 py-4">
              <div className="flex items-center gap-2">
                <Watch className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">{watches.length} watches</span>
              </div>
            </td>
            <td className="px-5 py-4 text-right">
              <span className="text-sm font-semibold text-primary">{formatCurrency(totalSpent)}</span>
            </td>
            <td className="px-5 py-4 hidden sm:table-cell" />
            <td className="px-5 py-4 hidden md:table-cell" />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
