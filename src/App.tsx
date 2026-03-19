import { useState } from 'react'
import { Users, MessageSquare, UserSearch, Archive, Eye, EyeOff, DollarSign, Star } from 'lucide-react'
import DashboardToggle from './components/DashboardToggle'
import { cn } from '@/lib/utils'
import TeamPage from './pages/TeamPage'
import OneOnOnesPage from './pages/OneOnOnesPage'
import InterviewsPage from './pages/InterviewsPage'
import ArchivePage from './pages/ArchivePage'
import CompPlanningPage from './pages/CompPlanningPage'

const tabs = [
  { id: 'team', label: 'Team', icon: Users },
  { id: 'one-on-ones', label: '1:1s', icon: MessageSquare },
  { id: 'interviews', label: 'Interviews', icon: UserSearch },
  { id: 'comp-planning', label: 'Comp Planning', icon: DollarSign },
  { id: 'archive', label: 'Archive', icon: Archive },
] as const

type TabId = (typeof tabs)[number]['id']

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('team')
  const [showSensitive, setShowSensitive] = useState(false)
  const [highlightTopPerformers, setHighlightTopPerformers] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground pb-16 md:pb-0">
      {/* Desktop top nav */}
      <nav className="hidden md:block border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 flex items-center h-14 gap-8">
          <DashboardToggle />
          <div className="flex gap-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  activeTab === id
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setShowSensitive(s => !s)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                showSensitive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
              title={showSensitive ? 'Hide sensitive data' : 'Show sensitive data'}
            >
              {showSensitive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setHighlightTopPerformers(h => !h)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                highlightTopPerformers
                  ? 'bg-yellow-500/20 text-yellow-300'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
              title={highlightTopPerformers ? 'Hide top performer highlights' : 'Highlight top performers'}
            >
              <Star className={cn('h-4 w-4', highlightTopPerformers && 'fill-yellow-400')} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile top bar */}
      <nav className="md:hidden border-b border-border bg-card sticky top-0 z-50">
        <div className="px-4 flex items-center justify-center h-12">
          <DashboardToggle />
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
        <div className="flex justify-around">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 px-3 min-w-[4.5rem] flex-shrink-0 transition-colors',
                activeTab === id
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
        {activeTab === 'team' && <TeamPage showSensitive={showSensitive} highlightTopPerformers={highlightTopPerformers} />}
        {activeTab === 'one-on-ones' && <OneOnOnesPage />}
        {activeTab === 'interviews' && <InterviewsPage />}
        {activeTab === 'comp-planning' && <CompPlanningPage showSensitive={showSensitive} highlightTopPerformers={highlightTopPerformers} />}
        {activeTab === 'archive' && <ArchivePage showSensitive={showSensitive} />}
      </main>
    </div>
  )
}
