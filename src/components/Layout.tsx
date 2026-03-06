import { NavLink, Outlet } from 'react-router-dom'
import { Users, MessageSquare, UserSearch } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/team', label: 'Team', icon: Users },
  { to: '/one-on-ones', label: '1:1s', icon: MessageSquare },
  { to: '/interviews', label: 'Interviews', icon: UserSearch },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 flex items-center h-14 gap-8">
          <span className="text-lg font-semibold tracking-tight">Dashboard</span>
          <div className="flex gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
