import { 
  Activity, Calendar, FileText, FlaskConical, Pill, 
  Bell, MessageCircle, Settings 
} from 'lucide-react'

interface PatientSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  unreadCount: number
}

export default function PatientSidebar({ activeTab, onTabChange, unreadCount }: PatientSidebarProps) {
  const menuItems = [
    { id: 'overview', label: 'Personal Snapshot', icon: Activity },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'records', label: 'Medical Records', icon: FileText },
    { id: 'labs', label: 'Lab Reports', icon: FlaskConical },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'support', label: 'Support', icon: MessageCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="w-64 bg-white shadow-lg min-h-screen">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-indigo-600">Patient Portal</h2>
        <p className="text-sm text-gray-500 mt-1">Health Management</p>
      </div>
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.badge && item.badge > 0 && (
                <span className="bg-red-500 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}



