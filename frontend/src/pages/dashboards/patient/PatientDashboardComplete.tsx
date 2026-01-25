import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  appointmentsApi, labRecordsApi, prescriptionsApi, 
  visitNotesApi, patientsApi, notificationsApi 
} from '../../../services/api'
import { useAuth } from '../../../contexts/AuthContext'
import { useLocation } from 'react-router-dom'
import DashboardHome from './components/DashboardHome'
import AppointmentManagement from './components/AppointmentManagement'
import MedicalRecords from './components/MedicalRecords'
import LabReports from './components/LabReports'
import PrescriptionsView from './components/PrescriptionsView'
import PatientNotifications from './components/PatientNotifications'
import AccountSettings from './components/AccountSettings'

export default function PatientDashboardComplete() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'records' | 'labs' | 'prescriptions' | 'notifications' | 'settings'>(
    (location.state as any)?.activeTab || 'overview'
  )

  // Update active tab when location state changes
  useEffect(() => {
    if ((location.state as any)?.activeTab) {
      setActiveTab((location.state as any).activeTab)
    }
  }, [location.state])

  // Real-time data queries
  const { data: appointments, isFetching: fetchingAppointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.getAll(),
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  })

  const { data: labRecords, isFetching: fetchingLabRecords } = useQuery({
    queryKey: ['lab-records'],
    queryFn: () => labRecordsApi.getAll(),
    refetchInterval: 20000,
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


  const { data: patient } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: async () => {
      const patients = await patientsApi.getAll()
      return patients?.find((p: any) => p.userId === user?.id)
    },
    enabled: !!user?.id,
  })

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll(true),
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  })

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 10000,
  })

  // Filter patient-specific data
  const patientAppointments = appointments?.filter((apt: any) => apt.patientId === user?.id) || []
  const patientLabRecords = labRecords?.filter((lab: any) => lab.patientId === patient?.id) || []
  const patientPrescriptions = prescriptions?.filter((pres: any) => pres.patientId === patient?.id) || []
  const patientVisitNotes = visitNotes?.filter((note: any) => note.patientId === patient?.id) || []

  return (
    <div className="flex flex-col h-full">
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pl-6 pr-8 pt-6 pb-6">

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <DashboardHome
          appointments={patientAppointments}
          labRecords={patientLabRecords}
          prescriptions={patientPrescriptions}
          visitNotes={patientVisitNotes}
        />
      )}

      {activeTab === 'appointments' && (
        <AppointmentManagement />
      )}

      {activeTab === 'records' && (
        <MedicalRecords
          visitNotes={patientVisitNotes}
          patient={patient}
        />
      )}

      {activeTab === 'labs' && (
        <LabReports labRecords={patientLabRecords} />
      )}

      {activeTab === 'prescriptions' && (
        <PrescriptionsView prescriptions={patientPrescriptions} />
      )}

      {activeTab === 'notifications' && (
        <PatientNotifications
          notifications={notifications}
          queryClient={queryClient}
        />
      )}

      {activeTab === 'settings' && (
        <AccountSettings />
      )}
      </div>
    </div>
  )
}

