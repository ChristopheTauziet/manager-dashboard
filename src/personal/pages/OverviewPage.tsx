import { LayoutDashboard } from 'lucide-react'

export default function OverviewPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <PlaceholderCard title="Upcoming Birthdays & Gifts" />
        <PlaceholderCard title="Financial Summary" />
        <PlaceholderCard title="Quick Links" />
      </div>
    </div>
  )
}

function PlaceholderCard({ title }: { title: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        <LayoutDashboard className="h-4 w-4" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className="text-sm text-muted-foreground">Coming soon</p>
    </div>
  )
}
