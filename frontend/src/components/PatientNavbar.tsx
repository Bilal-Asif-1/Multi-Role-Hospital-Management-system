import { useNavigate, useLocation } from 'react-router-dom'
import { Activity, Calendar, FileText, Pill } from 'lucide-react'

export default function PatientNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentTab = (location.state as any)?.activeTab || 'overview'

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: Activity },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'records', label: 'Records', icon: FileText },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
  ]

  return (
    <div className="hidden sm:flex sm:space-x-4 sm:items-center sm:justify-center sm:ml-16">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = currentTab === item.id
        return (
          <button
            key={item.id}
            onClick={() => navigate('/patient', { state: { activeTab: item.id } })}
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

