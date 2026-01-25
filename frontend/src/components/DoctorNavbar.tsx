import { useNavigate, useLocation } from 'react-router-dom'
import { Activity, Calendar, Users, FileText, Pill, Clock } from 'lucide-react'

export default function DoctorNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity, path: '/doctor' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, path: '/doctor/appointments' },
    { id: 'patients', label: 'Patients', icon: Users, path: '/doctor/patients' },
  ]

  return (
    <div className="hidden sm:flex sm:space-x-4 sm:items-center sm:justify-center sm:ml-16">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = currentPath === item.path || (item.path === '/doctor' && currentPath === '/doctor')
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
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


