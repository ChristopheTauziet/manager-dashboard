import { Receipt } from 'lucide-react'

export default function TaxesPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Taxes</h1>
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Receipt className="h-4 w-4" />
          <span className="text-sm font-medium">Tax History</span>
        </div>
        <p className="text-sm text-muted-foreground">Coming soon — overview of recent tax years</p>
      </div>
    </div>
  )
}
