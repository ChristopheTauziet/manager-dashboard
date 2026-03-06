import { useState } from 'react'
import { Users, MessageSquare, UserSearch, Archive } from 'lucide-react'
import { cn } from '@/lib/utils'
import TeamPage from './pages/TeamPage'
import OneOnOnesPage from './pages/OneOnOnesPage'
import InterviewsPage from './pages/InterviewsPage'
import ArchivePage from './pages/ArchivePage'

const tabs = [
  { id: 'team', label: 'Team', icon: Users },
  { id: 'one-on-ones', label: '1:1s', icon: MessageSquare },
  { id: 'interviews', label: 'Interviews', icon: UserSearch },
  { id: 'archive', label: 'Archive', icon: Archive },
] as const

type TabId = (typeof tabs)[number]['id']

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('team')

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 flex items-center h-14 gap-8">
          <span className="text-lg font-semibold tracking-tight">Dashboard</span>
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
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'team' && <TeamPage />}
        {activeTab === 'one-on-ones' && <OneOnOnesPage />}
        {activeTab === 'interviews' && <InterviewsPage />}
        {activeTab === 'archive' && <ArchivePage />}
      </main>
    </div>
  )
}
