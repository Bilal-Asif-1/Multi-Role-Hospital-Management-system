import { useNavigate, useLocation } from 'react-router-dom'
import { Receipt, Building2, BedDouble, Clock, UserCheck } from 'lucide-react'

export default function AdminNavbar() {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { id: 'registration-requests', label: 'Registration Requests', icon: UserCheck, path: '/admin/registration-requests' },
    { id: 'shifts', label: 'Shifts', icon: Clock, path: '/admin/shifts' },
    { id: 'allocation', label: 'Allocation', icon: BedDouble, path: '/admin/allocation' },
    { id: 'departments', label: 'Departments', icon: Building2, path: '/admin/departments' },
    { id: 'invoices', label: 'Invoices', icon: Receipt, path: '/admin/invoices' },
  ]

  return (
    <div className="hidden sm:flex sm:space-x-4 sm:items-center sm:justify-center sm:ml-16">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = location.pathname === item.path || 
          (item.path !== '/admin' && location.pathname.startsWith(item.path))
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


