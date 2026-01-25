import { useQuery } from '@tanstack/react-query'
import { appointmentsApi, prescriptionsApi, visitNotesApi, labRecordsApi } from '../../../services/api'
import { Calendar, Pill, FileText, FlaskConical, Clock, DollarSign, Heart, Wifi } from 'lucide-react'
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

  const { data: prescriptions, isFetching: fetchingPrescriptions } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: () => prescriptionsApi.getAll(),
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
  })


  const { data: visitNotes, isFetching: fetchingVisitNotes } = useQuery({
    queryKey: ['visit-notes'],
    queryFn: () => visitNotesApi.getAll(),
    refetchInterval: 25000,
    refetchOnWindowFocus: true,
  })

  const { data: labRecords, isFetching: fetchingLabRecords } = useQuery({
    queryKey: ['lab-records'],
    queryFn: () => labRecordsApi.getAll(),
    refetchInterval: 25000,
    refetchOnWindowFocus: true,
  })

  const isFetching = fetchingAppointments || fetchingPrescriptions || fetchingVisitNotes || fetchingLabRecords

  useEffect(() => {
    if (!isFetching) {
      setLastUpdate(new Date())
    }
  }, [isFetching])

  const upcomingAppointments = appointments?.filter(
    (apt: any) => new Date(apt.appointmentDate) >= new Date() && apt.status === 'SCHEDULED'
  ).slice(0, 3) || []

  const stats = [
    {
      name: 'Upcoming Appointments',
      value: upcomingAppointments.length,
      icon: Calendar,
      color: 'bg-blue-500',
      link: '/patient/appointments',
    },
    {
      name: 'Active Prescriptions',
      value: prescriptions?.length || 0,
      icon: Pill,
      color: 'bg-green-500',
      link: '/patient/prescriptions',
    },
    {
      name: 'Medical Records',
      value: (visitNotes?.length || 0) + (labRecords?.length || 0),
      icon: FileText,
      color: 'bg-purple-500',
      link: '/patient/records',
    },
  ]

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patient Portal</h1>
            <p className="text-gray-600 mt-2">Your health information at your fingertips</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            {isFetching ? (
              <>
                <div className="h-2 w-2 bg-indigo-500 rounded-full animate-pulse"></div>
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
                  {stat.amount && (
                    <p className="text-xs text-gray-500 mt-1">${Number(stat.amount).toFixed(2)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Access</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/patient/appointments')}
              className="w-full text-left p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-semibold text-gray-900">Book Appointment</p>
                  <p className="text-sm text-gray-600">Schedule a visit with your doctor</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => navigate('/patient/records')}
              className="w-full text-left p-4 bg-purple-50 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-purple-600 mr-3" />
                <div>
                  <p className="font-semibold text-gray-900">View Medical Records</p>
                  <p className="text-sm text-gray-600">Access your health history</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => navigate('/patient/prescriptions')}
              className="w-full text-left p-4 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center">
                <Pill className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <p className="font-semibold text-gray-900">My Prescriptions</p>
                  <p className="text-sm text-gray-600">View current medications</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Appointments - Moved to bottom */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-500" />
            Upcoming Appointments
          </h2>
          <button
            onClick={() => navigate('/patient/appointments')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All
          </button>
        </div>
        <div className="space-y-3">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((apt: any) => (
              <div
                key={apt.id}
                className="p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      {format(new Date(apt.appointmentDate), 'MMM dd, yyyy')} at {apt.appointmentTime}
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
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No upcoming appointments</p>
              <button
                onClick={() => navigate('/patient/appointments')}
                className="mt-3 text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                Book an Appointment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



