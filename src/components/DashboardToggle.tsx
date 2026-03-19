import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function DashboardToggle() {
  const navigate = useNavigate()
  const location = useLocation()
  const isPersonal = location.pathname.startsWith('/personal')

  return (
    <div className="flex bg-muted/50 rounded-lg p-0.5">
      <button
        onClick={() => { if (isPersonal) navigate('/') }}
        className={cn(
          'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
          !isPersonal ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Manager
      </button>
      <button
        onClick={() => { if (!isPersonal) navigate('/personal') }}
        className={cn(
          'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
          isPersonal ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Personal
      </button>
    </div>
  )
}
