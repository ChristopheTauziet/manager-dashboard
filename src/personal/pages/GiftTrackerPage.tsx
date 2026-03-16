import { Gift } from 'lucide-react'

export default function GiftTrackerPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Gift Tracker</h1>
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Gift className="h-4 w-4" />
          <span className="text-sm font-medium">Gift History</span>
        </div>
        <p className="text-sm text-muted-foreground">Coming soon — track gifts by person and occasion</p>
      </div>
    </div>
  )
}
