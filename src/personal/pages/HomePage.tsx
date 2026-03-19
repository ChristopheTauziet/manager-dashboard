import type { LucideIcon } from 'lucide-react'
import { Droplets, Leaf, Wind, Hammer, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import vendorsData from '../../../data/vendors.json'

type VendorRow = { service: string; name: string; contact: string | null }

const GROUP_ICONS: Record<string, LucideIcon> = {
  plumbing: Droplets,
  outdoors: Leaf,
  hvac: Wind,
  tile: Hammer,
  handyman: Wrench,
}

function ContactLink({ contact }: { contact: string }) {
  const isEmail = contact.includes('@')
  const isPhone = /\(\d{3}\)/.test(contact)
  const href = isEmail ? `mailto:${contact}` : isPhone ? `tel:${contact.replace(/\D/g, '')}` : undefined
  return (
    <a
      href={href}
      className={cn(
        'text-xs text-muted-foreground',
        href && 'hover:text-foreground transition-colors'
      )}
    >
      {contact}
    </a>
  )
}

export default function HomePage() {
  const groups = vendorsData as {
    id: string
    title: string
    description: string
    vendors: VendorRow[]
  }[]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Home</h1>
      <p className="text-sm text-muted-foreground -mt-4">
        Contractors and services you’ve used for the house, grouped by type.
      </p>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map(group => {
          const Icon = GROUP_ICONS[group.id] ?? Wrench
          return (
            <div
              key={group.id}
              className="bg-card border border-border rounded-xl overflow-hidden flex flex-col"
            >
              <div className="px-5 py-4 border-b border-border">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted/50 flex-shrink-0 mt-0.5">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold">{group.title}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>
                  </div>
                </div>
              </div>
              <ul className="divide-y divide-border flex-1">
                {group.vendors.map((v, i) => (
                  <li key={i} className="px-5 py-3.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {v.service}
                    </p>
                    <p className="text-sm font-medium mt-1">{v.name}</p>
                    {v.contact && (
                      <div className="mt-1.5">
                        <ContactLink contact={v.contact} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
