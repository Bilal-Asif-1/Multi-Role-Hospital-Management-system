import { useQuery } from '@tanstack/react-query'
import { appointmentsApi, visitNotesApi, prescriptionsApi, patientsApi } from '../../../services/api'
import { Calendar, FileText, Pill, Users, Clock, Wifi } from 'lucide-react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function DashboardHome() {
  const navigate = useNavigate()
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  
  const { data: appointments, isFetching: fetchingAppointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.getAll(),
    refetchInterval: 15000, // Refetch every 15 seconds
    refetchOnWindowFocus: true,
  })

  const { data: visitNotes, isFetching: fetchingVisitNotes } = useQuery({
    queryKey: ['visit-notes'],
    queryFn: () => visitNotesApi.getAll(),
    refetchInterval: 20000, // Refetch every 20 seconds
    refetchOnWindowFocus: true,
  })

  const { data: prescriptions, isFetching: fetchingPrescriptions } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: () => prescriptionsApi.getAll(),
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
  })

  const { data: patients, isFetching: fetchingPatients } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsApi.getAll(),
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  })

  const isFetching = fetchingAppointments || fetchingVisitNotes || fetchingPrescriptions || fetchingPatients

  useEffect(() => {
    if (!isFetching) {
      setLastUpdate(new Date())
    }
  }, [isFetching])

  const upcomingAppointments = appointments?.filter(
    (apt: any) => new Date(apt.appointmentDate) >= new Date() && apt.status === 'SCHEDULED'
  ).slice(0, 5) || []

  const todayAppointments = appointments?.filter(
    (apt: any) => {
      const aptDate = new Date(apt.appointmentDate)
      const today = new Date()
      return aptDate.toDateString() === today.toDateString() && apt.status === 'SCHEDULED'
    }
  ) || []

  const stats = [
    {
      name: "Today's Appointments",
      value: todayAppointments.length,
      icon: Calendar,
      color: 'bg-blue-500',
      link: '/doctor/appointments',
    },
    {
      name: 'Upcoming Appointments',
      value: appointments?.filter((apt: any) => new Date(apt.appointmentDate) >= new Date() && apt.status === 'SCHEDULED').length || 0,
      icon: Clock,
      color: 'bg-indigo-500',
      link: '/doctor/appointments',
    },
    {
      name: 'Total Patients',
      value: patients?.length || 0,
      icon: Users,
      color: 'bg-green-500',
      link: '/doctor/patients',
    },
    {
      name: 'Visit Notes',
      value: visitNotes?.length || 0,
      icon: FileText,
      color: 'bg-purple-500',
      link: '/doctor/visit-notes',
    },
    {
      name: 'Prescriptions',
      value: prescriptions?.length || 0,
      icon: Pill,
      color: 'bg-pink-500',
      link: '/doctor/prescriptions',
    },
  ]

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back! Here's your overview for today.</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            {isFetching ? (
              <>
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
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

      {/* Today's Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-lg rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-500" />
              Today's Appointments
            </h2>
            <button
              onClick={() => navigate('/doctor/appointments')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {todayAppointments.length > 0 ? (
              todayAppointments.map((apt: any) => (
                <div
                  key={apt.id}
                  className="p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
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
                      {apt.reason && (
                        <p className="text-sm text-gray-500 mt-1">Reason: {apt.reason}</p>
                      )}
                    </div>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
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
              onClick={() => navigate('/doctor/patients')}
              className="w-full text-left p-4 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center">
                <Users className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <p className="font-semibold text-gray-900">View Patients</p>
                  <p className="text-sm text-gray-600">Manage patient records</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => navigate('/doctor/visit-notes')}
              className="w-full text-left p-4 bg-purple-50 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-purple-600 mr-3" />
                <div>
                  <p className="font-semibold text-gray-900">Create Visit Note</p>
                  <p className="text-sm text-gray-600">Add new patient visit record</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => navigate('/doctor/prescriptions')}
              className="w-full text-left p-4 bg-pink-50 rounded-lg border border-pink-100 hover:bg-pink-100 transition-colors"
            >
              <div className="flex items-center">
                <Pill className="h-5 w-5 text-pink-600 mr-3" />
                <div>
                  <p className="font-semibold text-gray-900">Write Prescription</p>
                  <p className="text-sm text-gray-600">Prescribe medications</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => navigate('/doctor/availability')}
              className="w-full text-left p-4 bg-indigo-50 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors"
            >
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-indigo-600 mr-3" />
                <div>
                  <p className="font-semibold text-gray-900">Manage Availability</p>
                  <p className="text-sm text-gray-600">Update your schedule</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}



