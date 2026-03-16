import { Home } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Home</h1>
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Home className="h-4 w-4" />
          <span className="text-sm font-medium">Contractors & Services</span>
        </div>
        <p className="text-sm text-muted-foreground">Coming soon — contractor directory and contact info</p>
      </div>
    </div>
  )
}
