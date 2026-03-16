import { Watch } from 'lucide-react'

export default function WatchesPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Watches</h1>
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Watch className="h-4 w-4" />
          <span className="text-sm font-medium">Watch Collection</span>
        </div>
        <p className="text-sm text-muted-foreground">Coming soon — collection with purchase dates and prices</p>
      </div>
    </div>
  )
}
