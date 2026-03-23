import { useState } from 'react'
import { Gift, ChevronDown, ChevronRight, Lightbulb, Heart, Cake, TreePine, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import giftsData from '../../../data/gifts.json'

interface GiftEntry {
  year: number
  occasion: string
  items: string[]
}

interface Person {
  name: string
  relation: string
  birthday: string | null
  gifts: GiftEntry[]
  ideas: string[]
}

const people: Person[] = giftsData.people as Person[]

const OCCASION_ICONS: Record<string, typeof Gift> = {
  Birthday: Cake,
  Christmas: TreePine,
  Anniversary: Heart,
  "Valentine's Day": Heart,
  "Mother's Day": Heart,
  "Father's Day": Heart,
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatBirthday(bd: string) {
  const [m, d] = bd.split('-').map(Number)
  return `${MONTHS[m - 1]} ${d}`
}

const RELATION_ORDER = ['Wife', 'Son', 'Daughter', 'Father', 'Mother', 'Sister', 'Brother-in-law', 'Friend', 'Family']

const sorted = [...people].sort((a, b) => {
  const ai = RELATION_ORDER.indexOf(a.relation)
  const bi = RELATION_ORDER.indexOf(b.relation)
  return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
})

// ── All Years View ──────────────────────────────────────────

interface YearGift {
  person: string
  relation: string
  occasion: string
  items: string[]
}

function getAllYears() {
  const yearMap = new Map<number, YearGift[]>()
  for (const p of people) {
    for (const g of p.gifts) {
      if (!yearMap.has(g.year)) yearMap.set(g.year, [])
      yearMap.get(g.year)!.push({
        person: p.name,
        relation: p.relation,
        occasion: g.occasion,
        items: g.items,
      })
    }
  }
  return [...yearMap.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, gifts]) => ({ year, gifts }))
}

function YearCard({ year, gifts, expanded, onToggle }: {
  year: number
  gifts: YearGift[]
  expanded: boolean
  onToggle: () => void
}) {
  const totalItems = gifts.reduce((s, g) => s + g.items.length, 0)
  const uniquePeople = new Set(gifts.map(g => g.person)).size

  const byPerson = new Map<string, YearGift[]>()
  for (const g of gifts) {
    if (!byPerson.has(g.person)) byPerson.set(g.person, [])
    byPerson.get(g.person)!.push(g)
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-accent/20 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          {expanded
            ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          }
          <div>
            <span className="font-semibold text-lg">{year}</span>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalItems} gifts · {uniquePeople} people
            </p>
          </div>
        </div>
        <Gift className="h-4 w-4 text-muted-foreground" />
      </button>

      {expanded && (
        <div className="border-t border-border divide-y divide-border/50">
          {[...byPerson.entries()].map(([person, personGifts]) => (
            <div key={person} className="px-5 py-3">
              <h4 className="text-sm font-medium mb-2">{person}</h4>
              <div className="space-y-2">
                {personGifts.map((occ, i) => {
                  const Icon = OCCASION_ICONS[occ.occasion] || Calendar
                  return (
                    <div key={i} className="flex gap-3">
                      <div className="flex items-center gap-1.5 w-32 flex-shrink-0">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{occ.occasion}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {occ.items.map((item, j) => (
                          <span key={j} className="text-xs bg-muted/70 px-2 py-0.5 rounded">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Person View ─────────────────────────────────────────────

function groupByYear(gifts: GiftEntry[]) {
  const years = [...new Set(gifts.map(g => g.year))].sort((a, b) => b - a)
  return years.map(year => ({
    year,
    occasions: gifts.filter(g => g.year === year),
  }))
}

function PersonView({ person }: { person: Person }) {
  const grouped = groupByYear(person.gifts)

  return (
    <div className="space-y-4">
      {person.birthday && (
        <p className="text-sm text-muted-foreground">
          <Cake className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
          Birthday: {formatBirthday(person.birthday)}
        </p>
      )}

      {person.ideas.length > 0 && (
        <div className="bg-card border border-border rounded-xl px-5 py-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb className="h-3.5 w-3.5 text-warning" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ideas</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {person.ideas.map((idea, i) => (
              <span key={i} className="text-xs bg-warning/10 text-warning border border-warning/20 px-2 py-0.5 rounded">
                {idea}
              </span>
            ))}
          </div>
        </div>
      )}

      {grouped.map(({ year, occasions }) => (
        <div key={year} className="bg-card border border-border rounded-xl px-5 py-4">
          <h4 className="text-sm font-semibold mb-3">{year}</h4>
          <div className="space-y-2">
            {occasions.map((occ, i) => {
              const Icon = OCCASION_ICONS[occ.occasion] || Calendar
              return (
                <div key={i} className="flex gap-3">
                  <div className="flex items-center gap-1.5 w-32 flex-shrink-0">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{occ.occasion}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {occ.items.map((item, j) => (
                      <span key={j} className="text-xs bg-muted/70 px-2 py-0.5 rounded">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────

const allYears = getAllYears()
const totalGifts = people.reduce((s, p) => s + p.gifts.reduce((s2, g) => s2 + g.items.length, 0), 0)

export default function GiftTrackerPage() {
  const [tab, setTab] = useState<string>('all')
  const [expandedYear, setExpandedYear] = useState<number | null>(null)

  const selectedPerson = tab !== 'all' ? sorted.find(p => p.name === tab) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Gifts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {people.length} people &middot; {totalGifts} gifts tracked
        </p>
      </div>

      <div className="flex gap-1 flex-wrap">
        <button
          onClick={() => setTab('all')}
          className={cn(
            'px-2.5 py-1 rounded text-xs font-medium transition-colors',
            tab === 'all' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          )}
        >
          All
        </button>
        {sorted.map(p => (
          <button
            key={p.name}
            onClick={() => setTab(p.name)}
            className={cn(
              'px-2.5 py-1 rounded text-xs font-medium transition-colors',
              tab === p.name ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            )}
          >
            {p.name}
          </button>
        ))}
      </div>

      {tab === 'all' ? (
        <div className="space-y-3">
          {allYears.map(({ year, gifts }) => (
            <YearCard
              key={year}
              year={year}
              gifts={gifts}
              expanded={expandedYear === year}
              onToggle={() => setExpandedYear(expandedYear === year ? null : year)}
            />
          ))}
        </div>
      ) : selectedPerson ? (
        <PersonView person={selectedPerson} />
      ) : null}
    </div>
  )
}
