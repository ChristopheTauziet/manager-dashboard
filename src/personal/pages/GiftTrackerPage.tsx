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

const RELATION_ORDER = ['Wife', 'Son', 'Daughter', 'Father', 'Mother', 'Sister', 'Brother-in-law', 'Friend', 'Family']

const sorted = [...people].sort((a, b) => {
  const ai = RELATION_ORDER.indexOf(a.relation)
  const bi = RELATION_ORDER.indexOf(b.relation)
  return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
})

function groupByYear(gifts: GiftEntry[]) {
  const years = [...new Set(gifts.map(g => g.year))].sort((a, b) => b - a)
  return years.map(year => ({
    year,
    occasions: gifts.filter(g => g.year === year),
  }))
}

function PersonCard({ person, expanded, onToggle }: { person: Person; expanded: boolean; onToggle: () => void }) {
  const totalGifts = person.gifts.reduce((s, g) => s + g.items.length, 0)
  const years = [...new Set(person.gifts.map(g => g.year))]
  const yearRange = years.length > 0 ? `${Math.min(...years)}–${Math.max(...years)}` : ''
  const grouped = groupByYear(person.gifts)

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
            <div className="flex items-center gap-2">
              <span className="font-semibold">{person.name}</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{person.relation}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalGifts} gifts {yearRange && `· ${yearRange}`}
              {person.ideas.length > 0 && ` · ${person.ideas.length} idea${person.ideas.length > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <Gift className="h-4 w-4 text-muted-foreground" />
      </button>

      {expanded && (
        <div className="border-t border-border">
          <div className="divide-y divide-border/50">
            {grouped.map(({ year, occasions }) => (
              <div key={year} className="px-5 py-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{year}</h4>
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

          {person.ideas.length > 0 && (
            <div className="px-5 py-3 border-t border-border bg-accent/10">
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
        </div>
      )}
    </div>
  )
}

export default function GiftTrackerPage() {
  const [expandedName, setExpandedName] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const relations = [...new Set(people.map(p => p.relation))]
  const filtered = filter === 'all' ? sorted : sorted.filter(p => p.relation === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gift Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {people.length} people &middot; {people.reduce((s, p) => s + p.gifts.reduce((s2, g) => s2 + g.items.length, 0), 0)} gifts tracked
          </p>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'px-2.5 py-1 rounded text-xs font-medium transition-colors',
            filter === 'all' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          )}
        >
          All
        </button>
        {relations.map(r => (
          <button
            key={r}
            onClick={() => setFilter(filter === r ? 'all' : r)}
            className={cn(
              'px-2.5 py-1 rounded text-xs font-medium transition-colors',
              filter === r ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            )}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(person => (
          <PersonCard
            key={person.name}
            person={person}
            expanded={expandedName === person.name}
            onToggle={() => setExpandedName(expandedName === person.name ? null : person.name)}
          />
        ))}
      </div>
    </div>
  )
}
