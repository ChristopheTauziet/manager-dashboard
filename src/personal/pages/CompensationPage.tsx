import { Briefcase } from 'lucide-react'

export default function CompensationPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Compensation</h1>
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Briefcase className="h-4 w-4" />
          <span className="text-sm font-medium">Current Compensation</span>
        </div>
        <p className="text-sm text-muted-foreground">Coming soon — share price simulator and compensation history</p>
      </div>
    </div>
  )
}
