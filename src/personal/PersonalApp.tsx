import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, DollarSign, Briefcase, Receipt, Gift, Watch, Home, ArrowLeft, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import OverviewPage from './pages/OverviewPage'
import AssetsPage from './pages/AssetsPage'
import CompensationPage from './pages/CompensationPage'
import TaxesPage from './pages/TaxesPage'
import GiftTrackerPage from './pages/GiftTrackerPage'
import WatchesPage from './pages/WatchesPage'
import HomePage from './pages/HomePage'
import PlanningPage from './pages/PlanningPage'

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '' },
  { id: 'planning', label: 'Planning', icon: CalendarDays, path: 'planning' },
  { id: 'assets', label: 'Assets', icon: DollarSign, path: 'assets' },
  { id: 'compensation', label: 'Compensation', icon: Briefcase, path: 'compensation' },
  { id: 'taxes', label: 'Taxes', icon: Receipt, path: 'taxes' },
  { id: 'gifts', label: 'Gift Tracker', icon: Gift, path: 'gifts' },
  { id: 'watches', label: 'Watches', icon: Watch, path: 'watches' },
  { id: 'home', label: 'Home', icon: Home, path: 'home' },
] as const

export default function PersonalApp() {
  const navigate = useNavigate()
  const location = useLocation()

  const currentPath = location.pathname.replace('/personal', '').replace(/^\//, '')

  function isActive(tabPath: string) {
    if (tabPath === '') return currentPath === ''
    return currentPath.startsWith(tabPath)
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-16 md:pb-0">
      {/* Desktop top nav */}
      <nav className="hidden md:block border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 flex items-center h-14 gap-8">
          <button
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Back to Manager Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-lg font-semibold tracking-tight">Personal</span>
          <div className="flex gap-1">
            {tabs.map(({ id, label, icon: Icon, path }) => (
              <button
                key={id}
                onClick={() => navigate(`/personal/${path}`)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive(path)
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile top bar */}
      <nav className="md:hidden border-b border-border bg-card sticky top-0 z-50">
        <div className="px-4 flex items-center h-12 gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-base font-semibold tracking-tight">Personal</span>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
        <div className="flex overflow-x-auto scrollbar-none">
          {tabs.map(({ id, label, icon: Icon, path }) => (
            <button
              key={id}
              onClick={() => navigate(`/personal/${path}`)}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 px-3 min-w-[4.5rem] flex-shrink-0 transition-colors',
                isActive(path)
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <Routes>
          <Route index element={<OverviewPage />} />
          <Route path="planning" element={<PlanningPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="compensation" element={<CompensationPage />} />
          <Route path="taxes" element={<TaxesPage />} />
          <Route path="gifts" element={<GiftTrackerPage />} />
          <Route path="watches" element={<WatchesPage />} />
          <Route path="home" element={<HomePage />} />
          <Route path="*" element={<Navigate to="/personal" replace />} />
        </Routes>
      </main>
    </div>
  )
}
