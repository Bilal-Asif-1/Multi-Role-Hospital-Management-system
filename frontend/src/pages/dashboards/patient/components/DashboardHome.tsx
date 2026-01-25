import { Activity, TrendingUp, Users, Calendar } from 'lucide-react'
import { useAuth } from '../../../../contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { patientsApi } from '../../../../services/api'
import { useNavigate } from 'react-router-dom'
import BMICalculatorChart from './BMICalculatorChart'
import AppointmentCards from './AppointmentCards'
import PatientInfoChart from './PatientInfoChart'

export default function DashboardHome({
  appointments,
  labRecords,
  prescriptions,
  visitNotes,
}: DashboardHomeProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // Fetch patient profile to get patient ID
  const { data: patient } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: () => patientsApi.getMyProfile(),
    enabled: !!user?.id,
  })

  const upcomingAppointments = appointments?.filter(
    (apt: any) => new Date(apt.appointmentDate) >= new Date() && apt.status === 'SCHEDULED'
  ).length || 0

  const recentLabReports = labRecords?.length || 0
  const activePrescriptions = prescriptions?.filter((pres: any) => {
    if (!pres.validUntil) return true
    return new Date(pres.validUntil) >= new Date()
  }).length || 0

  const recentConsultations = appointments?.length || 0

  return (
    <div className="space-y-6">
      <h2 className="text-4xl font-extrabold text-gray-900">Dashboard</h2>

      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-black via-gray-900 to-black rounded-xl shadow-lg p-8 text-white">
        <h3 className="text-2xl font-bold mb-2">
          Welcome, <span className="font-extrabold">{user?.firstName} {user?.lastName}</span>!
        </h3>
        <p className="text-gray-300 font-semibold">
          Access your medical records, appointments, prescriptions, and more all in one place.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div 
          onClick={() => navigate('/patient', { state: { activeTab: 'appointments' } })}
          className="bg-white overflow-hidden shadow-lg rounded-xl p-5 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="bg-black rounded-lg p-3">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 ml-4">
              <p className="text-sm font-bold text-black">Upcoming Appointments</p>
              <p className="text-2xl font-bold text-black mt-1">{upcomingAppointments}</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/patient', { state: { activeTab: 'labs' } })}
          className="bg-white overflow-hidden shadow-lg rounded-xl p-5 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="bg-black rounded-lg p-3">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 ml-4">
              <p className="text-sm font-bold text-black">Lab Reports</p>
              <p className="text-2xl font-bold text-black mt-1">{recentLabReports}</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/patient', { state: { activeTab: 'prescriptions' } })}
          className="bg-white overflow-hidden shadow-lg rounded-xl p-5 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="bg-black rounded-lg p-3">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 ml-4">
              <p className="text-sm font-bold text-black">Active Prescriptions</p>
              <p className="text-2xl font-bold text-black mt-1">{activePrescriptions}</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/patient', { state: { activeTab: 'appointments' } })}
          className="bg-white overflow-hidden shadow-lg rounded-xl p-5 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="bg-black rounded-lg p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 ml-4">
              <p className="text-sm font-bold text-black">Consultations</p>
              <p className="text-2xl font-bold text-black mt-1">{recentConsultations}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section - Side by Side */}
      {patient?.id && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* BMI Calculator Chart - Half Width */}
          <BMICalculatorChart patientId={patient.id} />

          {/* Patient Information Chart - Half Width */}
          <PatientInfoChart patientId={patient.id} />
        </div>
      )}

      {/* Appointment Cards with Vitals Charts - Moved to bottom */}
      {patient?.id && (
        <AppointmentCards patientId={patient.id} />
      )}
    </div>
  )
}

