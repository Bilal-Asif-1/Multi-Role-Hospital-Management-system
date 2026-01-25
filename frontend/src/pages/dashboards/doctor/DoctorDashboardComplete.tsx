import { useQuery } from '@tanstack/react-query'
import { appointmentsApi, visitNotesApi, prescriptionsApi, patientsApi } from '../../../services/api'
import { 
  Calendar, FileText, Pill, Users, Clock, 
  Activity
} from 'lucide-react'
import { format } from 'date-fns'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import DoctorSettings from './components/DoctorSettings'
import DoctorPerformanceChart from './components/DoctorPerformanceChart'
import TotalClientsChart from './components/TotalClientsChart'

export default function DoctorDashboardComplete() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname

  // Real-time data queries
  const { data: appointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.getAll(),
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  })

  const { data: visitNotes } = useQuery({
    queryKey: ['visit-notes'],
    queryFn: () => visitNotesApi.getAll(),
    refetchInterval: 20000,
  })

  const { data: prescriptions } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: () => prescriptionsApi.getAll(),
    refetchInterval: 20000,
  })

  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsApi.getAll(),
    refetchInterval: 30000,
  })

  // Calculate KPIs
  const today = new Date()
  const todayAppointments = appointments?.filter((apt: any) => {
    const aptDate = new Date(apt.appointmentDate)
    return aptDate.toDateString() === today.toDateString() && apt.status === 'SCHEDULED'
  }) || []

  const todayPrescriptions = prescriptions?.filter((pres: any) => {
    const presDate = new Date(pres.prescribedDate)
    return presDate.toDateString() === today.toDateString()
  }) || []

  const upcomingAppointments = appointments?.filter((apt: any) => 
    new Date(apt.appointmentDate) > today && apt.status === 'SCHEDULED'
  ) || []

  const kpis = [
    { name: "Today's Appointments", value: todayAppointments.length, icon: Calendar, link: '/doctor/appointments' },
    { name: 'Prescriptions Today', value: todayPrescriptions.length, icon: Pill, link: '/doctor/prescriptions' },
    { name: 'Upcoming Appointments', value: upcomingAppointments.length, icon: Users, link: '/doctor/appointments' },
    { name: 'Visit Notes', value: visitNotes?.length || 0, icon: Clock, link: '/doctor/visit-notes' },
  ]

  // Determine active tab based on pathname
  const getActiveTab = () => {
    if (currentPath === '/doctor' || currentPath === '/doctor/') return 'overview'
    if (currentPath.includes('/appointments')) return 'appointments'
    if (currentPath.includes('/patients')) return 'patients'
    if (currentPath.includes('/visit-notes')) return 'emr'
    if (currentPath.includes('/prescriptions')) return 'prescriptions'
    if (currentPath.includes('/availability')) return 'availability'
    if (currentPath.includes('/settings')) return 'settings'
    return 'overview'
  }

  const activeTab = getActiveTab()

  return (
    <div className="flex flex-col h-full">
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pl-6 pr-8 pt-6 pb-6">
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-4xl font-extrabold text-gray-900">Dashboard</h2>

            {/* Welcome Message */}
            <div className="bg-gradient-to-r from-black via-gray-900 to-black rounded-xl shadow-lg p-8 text-white">
              <h3 className="text-2xl font-bold mb-2">
                Welcome, <span className="font-extrabold">Dr. {user?.firstName} {user?.lastName}</span>!
              </h3>
              <p className="text-gray-300 font-semibold">
                Manage your appointments, patients, prescriptions, and clinical documentation all in one place.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {kpis.map((kpi) => {
                const Icon = kpi.icon
                return (
                  <div
                    key={kpi.name}
                    onClick={() => navigate(kpi.link)}
                    className="bg-white overflow-hidden shadow-lg rounded-xl p-4 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="bg-black rounded-lg p-2.5">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 ml-3">
                        <p className="text-xs font-bold text-black">{kpi.name}</p>
                        <p className="text-xl font-bold text-black mt-1">{kpi.value}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 justify-center">
              {/* Total Clients This Month */}
              <TotalClientsChart
                appointments={appointments}
                patients={patients}
              />

              {/* Today's Schedule */}
              <div className="bg-white shadow-lg rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-black flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-black" />
                    Today's Schedule
                  </h2>
                  <button
                    onClick={() => navigate('/doctor/appointments')}
                    className="text-sm text-black hover:text-gray-700 font-bold"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {todayAppointments.length > 0 ? (
                    todayAppointments.map((apt: any) => (
                      <div
                        key={apt.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => navigate(`/doctor/appointments`)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-bold text-black">
                              {apt.patient?.firstName} {apt.patient?.lastName}
                            </p>
                            <p className="text-sm text-black flex items-center mt-1">
                              <Clock className="h-4 w-4 mr-1" />
                              {apt.appointmentTime}
                            </p>
                            {apt.reason && (
                              <p className="text-sm text-black mt-1">Reason: {apt.reason}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="px-3 py-1 text-xs font-bold rounded-full bg-black text-white">
                              {apt.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-black py-8 font-bold">No appointments scheduled for today</p>
                  )}
                </div>
              </div>

              {/* Performance Chart */}
              <DoctorPerformanceChart
                appointments={appointments}
                prescriptions={prescriptions}
                visitNotes={visitNotes}
              />
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <DoctorSettings />
        )}
      </div>
    </div>
  )
}
