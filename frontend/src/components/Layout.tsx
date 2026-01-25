import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Menu, X, Activity, Calendar, FileText, FlaskConical, Pill, Receipt, Bell, Users, Clock, Stethoscope, Settings, UserPlus, Heart, ClipboardList, UserCog, BedDouble, Building2, DollarSign, Wallet, CreditCard } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { notificationsApi } from '../services/api'
import PatientNavbar from './PatientNavbar'
import DoctorNavbar from './DoctorNavbar'
import NurseNavbar from './NurseNavbar'
import AdminNavbar from './AdminNavbar'
import UserMenu from './UserMenu'
import NotificationDropdown from './NotificationDropdown'

interface LayoutProps {
  children: React.ReactNode
  role: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'PATIENT'
}

const roleRoutes = {
  ADMIN: [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/patients', label: 'Patients' },
    { path: '/admin/appointments', label: 'Appointments' },
    { path: '/admin/users', label: 'Users' },
    { path: '/admin/invoices', label: 'Invoices' },
  ],
  DOCTOR: [
    { path: '/doctor', label: 'Dashboard' },
    { path: '/doctor/patients', label: 'Patients' },
    { path: '/doctor/appointments', label: 'Appointments' },
    { path: '/doctor/visit-notes', label: 'Visit Notes' },
    { path: '/doctor/prescriptions', label: 'Prescriptions' },
    { path: '/doctor/availability', label: 'Availability' },
  ],
  NURSE: [
    { path: '/nurse', label: 'Dashboard' },
    { path: '/nurse/patients', label: 'Patients' },
    { path: '/nurse/appointments', label: 'Appointments' },
    { path: '/nurse/lab-records', label: 'Lab Records' },
  ],
  PATIENT: [
    { path: '/patient', label: 'Dashboard' },
    { path: '/patient/appointments', label: 'Appointments' },
    { path: '/patient/records', label: 'Medical Records' },
    { path: '/patient/prescriptions', label: 'Prescriptions' },
  ],
}

export default function Layout({ children, role }: LayoutProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false)

  // Get unread notifications count
  const { data: unreadCount } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 10000,
    enabled: role === 'PATIENT' || role === 'DOCTOR' || role === 'NURSE',
  })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const routes = roleRoutes[role]

  const roleColors = {
    ADMIN: 'bg-black',
    DOCTOR: 'bg-black',
    NURSE: 'bg-black',
    PATIENT: 'bg-black',
  }

  const roleLabels = {
    ADMIN: 'Administrator',
    DOCTOR: 'Doctor',
    NURSE: 'Nurse',
    PATIENT: 'Patient',
  }

  // Patient sidebar menu items
  const patientSidebarItems = [
    { id: 'overview', label: 'Dashboard', icon: Activity, path: '/patient' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, path: '/patient' },
    { id: 'records', label: 'Medical Records', icon: FileText, path: '/patient' },
    { id: 'labs', label: 'Lab Reports', icon: FlaskConical, path: '/patient' },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill, path: '/patient' },
  ]

  // Doctor sidebar menu items
  const doctorSidebarItems = [
    { id: 'overview', label: 'Dashboard', icon: Activity, path: '/doctor' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, path: '/doctor/appointments' },
    { id: 'patients', label: 'Patients', icon: Users, path: '/doctor/patients' },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill, path: '/doctor/prescriptions' },
    { id: 'nurses', label: 'Available Nurses', icon: UserPlus, path: '/doctor/nurses' },
    { id: 'salary', label: 'My Salary', icon: Wallet, path: '/doctor/salary' },
  ]

  // Nurse sidebar menu items
  const nurseSidebarItems = [
    { id: 'overview', label: 'Dashboard', icon: Activity, path: '/nurse' },
    { id: 'queue', label: 'Patient Queue', icon: Users, path: '/nurse' },
    { id: 'notes', label: 'Nursing Notes', icon: FileText, path: '/nurse' },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList, path: '/nurse' },
    { id: 'salary', label: 'My Salary', icon: Wallet, path: '/nurse/salary' },
  ]

  // Admin sidebar menu items
  const adminSidebarItems = [
    { id: 'overview', label: 'Dashboard', icon: Activity, path: '/admin' },
    { id: 'patients', label: 'Patients', icon: Users, path: '/admin/patients' },
    { id: 'doctors', label: 'Doctors', icon: UserCog, path: '/admin/doctors' },
    { id: 'nurses', label: 'Nurses', icon: UserPlus, path: '/admin/nurses' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, path: '/admin/appointments' },
    { id: 'revenue', label: 'Revenue', icon: DollarSign, path: '/admin/revenue' },
    { id: 'salaries', label: 'Salaries', icon: Wallet, path: '/admin/salaries' },
    { id: 'withdrawals', label: 'Withdrawals', icon: CreditCard, path: '/admin/withdrawals' },
    { id: 'allocation', label: 'Allocation', icon: BedDouble, path: '/admin/allocation' },
    { id: 'departments', label: 'Departments', icon: Building2, path: '/admin/departments' },
    { id: 'invoices', label: 'Invoices', icon: Receipt, path: '/admin/invoices' },
  ]

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navbar */}
      <nav className={`${roleColors[role]} shadow-xl z-50 fixed top-0 left-0 right-0`}>
        <div className="pl-4 pr-0 sm:pl-6 sm:pr-0 lg:pl-8 lg:pr-0">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-white">IHIS</h1>
            </div>
            <div className="flex-1 flex justify-center">
              {role === 'PATIENT' ? (
                <PatientNavbar />
              ) : role === 'DOCTOR' ? (
                <DoctorNavbar />
              ) : role === 'NURSE' ? (
                <NurseNavbar />
              ) : role === 'ADMIN' ? (
                <AdminNavbar />
              ) : (
                <div className="hidden sm:flex sm:space-x-8 sm:ml-8">
                  {routes.map((route) => (
                    <Link
                      key={route.path}
                      to={route.path}
                      className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-bold transition-colors ${
                        location.pathname === route.path
                          ? 'bg-white/20 text-white'
                          : 'text-white/90 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {route.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
              {/* Notifications */}
              {(role === 'PATIENT' || role === 'DOCTOR' || role === 'NURSE' || role === 'ADMIN') && (
                <div className="relative">
                  <button
                    onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                    className="relative text-white/90 hover:text-white hover:bg-white/10 p-2 rounded-md transition-colors"
                    title="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <NotificationDropdown
                    isOpen={notificationDropdownOpen}
                    onClose={() => setNotificationDropdownOpen(false)}
                  />
                </div>
              )}
              <UserMenu role={role} />
            </div>
            <div className="sm:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {routes.map((route) => (
                <Link
                  key={route.path}
                  to={route.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    location.pathname === route.path
                      ? `bg-white/10 text-white border-white`
                      : 'border-transparent text-white/90 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {route.label}
                </Link>
              ))}
              <div className="pl-3 pr-4 py-2 border-l-4 border-transparent">
                <span className="text-white">{user?.firstName} {user?.lastName}</span>
                <button
                  onClick={handleLogout}
                  className="block mt-2 text-white/90 hover:text-white"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content Area with Sidebar for Patient and Doctor */}
      <div className="flex flex-1 overflow-hidden pt-16">
        {role === 'PATIENT' && (
          <aside className={`${sidebarOpen ? 'w-48' : 'w-0'} bg-black shadow-lg transition-all duration-300 overflow-hidden border-r border-gray-900 fixed left-0 top-16 bottom-0 z-40`}>
            <div className="h-full flex flex-col">
              <div className="p-3 border-b border-gray-900">
                <h2 className="text-sm font-bold text-white">Patient Portal</h2>
                <p className="text-xs text-gray-400 mt-0.5">Health Management</p>
              </div>
              <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {patientSidebarItems.map((item) => {
                  const Icon = item.icon
                  const currentTab = (location.state as any)?.activeTab || 'overview'
                  const isActive = currentTab === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        // Navigate and set active tab via state
                        navigate('/patient', { state: { activeTab: item.id } })
                      }}
                      className={`w-full flex items-center justify-between px-2 py-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-gray-900 text-white border-l-4 border-white'
                          : 'text-gray-300 hover:bg-gray-900 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-bold">{item.label}</span>
                      </div>
                      {item.badge && item.badge > 0 && (
                        <span className="bg-red-500 text-white text-xs font-semibold rounded-full h-4 w-4 flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </nav>
            </div>
          </aside>
        )}

        {role === 'DOCTOR' && (
          <aside className={`${sidebarOpen ? 'w-48' : 'w-0'} bg-black shadow-lg transition-all duration-300 overflow-hidden border-r border-gray-900 fixed left-0 top-16 bottom-0 z-40`}>
            <div className="h-full flex flex-col">
              <div className="p-3 border-b border-gray-900">
                <h2 className="text-sm font-bold text-white">Doctor Portal</h2>
                <p className="text-xs text-gray-400 mt-0.5">Clinical Management</p>
              </div>
              <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {doctorSidebarItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path || (item.path === '/doctor' && location.pathname === '/doctor')
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(item.path)
                      }}
                      className={`w-full flex items-center justify-between px-2 py-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-gray-900 text-white border-l-4 border-white'
                          : 'text-gray-300 hover:bg-gray-900 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-bold">{item.label}</span>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </div>
          </aside>
        )}

        {role === 'NURSE' && (
          <aside className={`${sidebarOpen ? 'w-48' : 'w-0'} bg-black shadow-lg transition-all duration-300 overflow-hidden border-r border-gray-900 fixed left-0 top-16 bottom-0 z-40`}>
            <div className="h-full flex flex-col">
              <div className="p-3 border-b border-gray-900">
                <h2 className="text-sm font-bold text-white">Nurse Portal</h2>
                <p className="text-xs text-gray-400 mt-0.5">Clinical Operations</p>
              </div>
              <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {nurseSidebarItems.map((item) => {
                  const Icon = item.icon
                  const currentTab = (location.state as any)?.activeTab || 'overview'
                  const isActive = item.path === '/nurse/salary' 
                    ? location.pathname === '/nurse/salary'
                    : currentTab === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.path === '/nurse/salary') {
                          navigate('/nurse/salary')
                        } else {
                          navigate('/nurse', { state: { activeTab: item.id }, replace: true })
                        }
                      }}
                      className={`w-full flex items-center justify-between px-2 py-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-gray-900 text-white border-l-4 border-white'
                          : 'text-gray-300 hover:bg-gray-900 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-bold">{item.label}</span>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </div>
          </aside>
        )}

        {role === 'ADMIN' && (
          <aside className={`${sidebarOpen ? 'w-48' : 'w-0'} bg-black shadow-lg transition-all duration-300 overflow-hidden border-r border-gray-900 fixed left-0 top-16 bottom-0 z-40`}>
            <div className="h-full flex flex-col">
              <div className="p-3 border-b border-gray-900">
                <h2 className="text-sm font-bold text-white">Admin Portal</h2>
                <p className="text-xs text-gray-400 mt-0.5">Hospital Management</p>
              </div>
              <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {adminSidebarItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path))
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(item.path)
                      }}
                      className={`w-full flex items-center justify-between px-2 py-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-gray-900 text-white border-l-4 border-white'
                          : 'text-gray-300 hover:bg-gray-900 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-bold">{item.label}</span>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto bg-gray-100 pt-2 transition-all duration-300 ${sidebarOpen ? 'ml-48' : 'ml-0'}`}>
          {children}
        </main>
      </div>
    </div>
  )
}



