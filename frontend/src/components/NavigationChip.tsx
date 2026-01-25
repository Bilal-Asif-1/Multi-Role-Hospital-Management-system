import { useNavigate } from 'react-router-dom'
import { Users, UserCog, Building, Calendar } from 'lucide-react'

interface NavigationChipProps {
  entityType: string
  entityId: string
  label: string
  className?: string
}

const entityIcons: Record<string, any> = {
  Patient: Users,
  Doctor: UserCog,
  Nurse: Users,
  Room: Building,
  Appointment: Calendar,
}

const entityRoutes: Record<string, (id: string) => string> = {
  Patient: (id) => `/admin/patients/${id}`,
  Doctor: (id) => `/admin/doctors`,
  Nurse: (id) => `/admin/nurses`,
  Room: (id) => `/admin/rooms`,
  Appointment: (id) => `/admin/appointments`,
}

export function NavigationChip({
  entityType,
  entityId,
  label,
  className = '',
}: NavigationChipProps) {
  const navigate = useNavigate()
  const Icon = entityIcons[entityType] || Users
  const routeFn = entityRoutes[entityType]

  const handleClick = () => {
    if (routeFn) {
      navigate(routeFn(entityId))
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-bold transition-colors hover:bg-gray-100 ${className}`}
    >
      <Icon className="h-3 w-3" />
      <span>{label}</span>
    </button>
  )
}

