import { useQuery } from '@tanstack/react-query'
import { patientsApi, appointmentsApi, labRecordsApi } from '../../../services/api'
import { Users, Calendar, FlaskConical, Clock, CheckCircle, AlertCircle, Wifi } from 'lucide-react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function DashboardHome() {
  const navigate = useNavigate()
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  
  const { data: patients, isFetching: fetchingPatients } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsApi.getAll(),
    refetchInterval: 20000, // Refetch every 20 seconds
    refetchOnWindowFocus: true,
  })

  const { data: appointments, isFetching: fetchingAppointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.getAll(),
    refetchInterval: 15000, // Refetch every 15 seconds
    refetchOnWindowFocus: true,
  })

  const { data: labRecords, isFetching: fetchingLabRecords } = useQuery({
    queryKey: ['lab-records'],
    queryFn: () => labRecordsApi.getAll(),
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
  })

  const isFetching = fetchingPatients || fetchingAppointments || fetchingLabRecords

  useEffect(() => {
    if (!isFetching) {
      setLastUpdate(new Date())
    }
  }, [isFetching])

  const todayAppointments = appointments?.filter(
    (apt: any) => {
      const aptDate = new Date(apt.appointmentDate)
      const today = new Date()
      return aptDate.toDateString() === today.toDateString()
    }
  ) || []

  const pendingLabRecords = labRecords?.filter((lab: any) => lab.status === 'PENDING') || []

  const stats = [
    {
      name: 'Total Patients',
      value: patients?.length || 0,
      icon: Users,
      color: 'bg-blue-500',
      link: '/nurse/patients',
    },
    {
      name: "Today's Appointments",
      value: todayAppointments.length,
      icon: Calendar,
      color: 'bg-green-500',
      link: '/nurse/appointments',
    },
    {
      name: 'Lab Records',
      value: labRecords?.length || 0,
      icon: FlaskConical,
      color: 'bg-purple-500',
      link: '/nurse/lab-records',
    },
    {
      name: 'Pending Lab Results',
      value: pendingLabRecords.length,
      icon: AlertCircle,
      color: 'bg-orange-500',
      link: '/nurse/lab-records',
    },
  ]

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nurse Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage patients, appointments, and lab records</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            {isFetching ? (
              <>
                <div className="h-2 w-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span>Live</span>
                <span className="text-gray-400">•</span>
                <span>Updated {format(lastUpdate, 'HH:mm:ss')}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            onClick={() => navigate(stat.link)}
            className="bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
          >
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className={`${stat.color} rounded-lg p-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-green-500" />
              Today's Schedule
            </h2>
            <button
              onClick={() => navigate('/nurse/appointments')}
              className="text-sm text-green-600 hover:text-green-800 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {todayAppointments.length > 0 ? (
              todayAppointments.slice(0, 5).map((apt: any) => (
                <div
                  key={apt.id}
                  className="p-4 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {apt.patient?.firstName} {apt.patient?.lastName}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <Clock className="h-4 w-4 mr-1" />
                        {apt.appointmentTime}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      apt.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                      apt.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No appointments scheduled for today</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/nurse/patients')}
              className="w-full text-left p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-semibold text-gray-900">View Patients</p>
                  <p className="text-sm text-gray-600">Access patient records</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => navigate('/nurse/lab-records')}
              className="w-full text-left p-4 bg-purple-50 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center">
                <FlaskConical className="h-5 w-5 text-purple-600 mr-3" />
                <div>
                  <p className="font-semibold text-gray-900">Manage Lab Records</p>
                  <p className="text-sm text-gray-600">Upload and update test results</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => navigate('/nurse/appointments')}
              className="w-full text-left p-4 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <p className="font-semibold text-gray-900">Appointment Management</p>
                  <p className="text-sm text-gray-600">View and manage appointments</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}



