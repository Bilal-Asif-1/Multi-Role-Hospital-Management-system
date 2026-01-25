import { useNavigate, useLocation } from 'react-router-dom'
import { Activity, Users, ClipboardList } from 'lucide-react'

export default function NurseNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentTab = (location.state as any)?.activeTab || 'overview'

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity, tab: 'overview' },
    { id: 'queue', label: 'Patient Queue', icon: Users, tab: 'queue' },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList, tab: 'tasks' },
  ]

  return (
    <div className="hidden sm:flex sm:space-x-4 sm:items-center sm:justify-center sm:ml-16">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = currentTab === item.tab
        return (
          <button
            key={item.id}
            onClick={() => navigate('/nurse', { state: { activeTab: item.tab }, replace: true })}
            className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-bold transition-colors ${
              isActive
                ? 'bg-white/20 text-white'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4 mr-2" />
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

