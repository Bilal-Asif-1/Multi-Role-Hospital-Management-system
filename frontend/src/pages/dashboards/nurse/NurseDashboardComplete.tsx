import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { 
  patientsApi, appointmentsApi, 
  tasksApi, patientQueueApi, notificationsApi
} from '../../../services/api'
import { 
  Activity, ClipboardList, Users, 
  Bell, Wifi
} from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../../../contexts/AuthContext'
import { useQueryClient } from '@tanstack/react-query'
import WorkloadOverview from './components/WorkloadOverview'
import PatientQueueManagement from './components/PatientQueueManagement'
import NursingNotes from './components/NursingNotes'
import TaskManagement from './components/TaskManagement'
import NurseSettings from './components/NurseSettings'
import NursePerformanceChart from './components/NursePerformanceChart'
import TodaysTasksChart from './components/TodaysTasksChart'

export default function NurseDashboardComplete() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const location = useLocation()
  const initialTab = (location.state as any)?.activeTab || 'overview'
  const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'notes' | 'tasks' | 'settings'>(initialTab as any)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Update activeTab when location.state changes
  useEffect(() => {
    const tabFromState = (location.state as any)?.activeTab
    if (tabFromState) {
      setActiveTab(tabFromState)
    }
  }, [location.state])

  // Real-time data queries
  const { data: patients, isFetching: fetchingPatients } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsApi.getAll(),
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
  })

  const { data: appointments, isFetching: fetchingAppointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.getAll(),
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  })

  const { data: patientQueue, isFetching: fetchingQueue } = useQuery({
    queryKey: ['patient-queue'],
    queryFn: () => patientQueueApi.getAll(),
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  })

  const { data: tasks, isFetching: fetchingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.getAll(),
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  })

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 10000,
  })

  const isFetching = fetchingPatients || fetchingAppointments || fetchingQueue || fetchingTasks

  useEffect(() => {
    if (!isFetching) {
      setLastUpdate(new Date())
    }
  }, [isFetching])

  // Calculate Workload Overview KPIs
  const checkedInPatients = patientQueue?.filter((q: any) => q.status === 'WAITING' || q.status === 'IN_CONSULTATION') || []
  const todayAppointments = appointments?.filter((apt: any) => {
    const aptDate = new Date(apt.appointmentDate)
    return aptDate.toDateString() === new Date().toDateString()
  }) || []
  const pendingTasks = tasks?.filter((t: any) => t.status === 'PENDING') || []

  const waitingPatients = patientQueue?.filter((q: any) => q.status === 'WAITING') || []

  const workloadKPIs = [
    { 
      name: 'Checked-In Patients', 
      value: checkedInPatients.length, 
      icon: Users, 
      color: 'bg-black',
      link: 'queue'
    },
    { 
      name: "Today's Appointments", 
      value: todayAppointments.length, 
      icon: Activity, 
      color: 'bg-black',
      link: 'appointments'
    },
    { 
      name: 'Pending Tasks', 
      value: pendingTasks.length, 
      icon: ClipboardList, 
      color: 'bg-black',
      link: 'tasks'
    },
    { 
      name: 'Waiting Patients', 
      value: waitingPatients.length, 
      icon: Users, 
      color: 'bg-black',
      link: 'queue'
    },
  ]


  return (
    <div className="pl-6 pr-8 pt-6 pb-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-black">
              {activeTab === 'overview' && 'Dashboard'}
              {activeTab === 'queue' && 'Patient Queue'}
              {activeTab === 'notes' && 'Nursing Notes'}
              {activeTab === 'tasks' && 'Tasks'}
              {activeTab === 'settings' && 'Settings'}
            </h1>
          </div>
        </div>
      </div>

      {/* Welcome Banner - Only show on overview tab */}
      {activeTab === 'overview' && (
        <div className="mb-6 bg-gradient-to-r from-black via-gray-900 to-black rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-extrabold text-white mb-2">
                Welcome, {user?.firstName} {user?.lastName}!
              </h2>
              <p className="text-white/90 font-bold">
                Manage your clinical operations, patient care, and daily tasks efficiently.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Queued Patients Section - Only show on overview tab */}
      {activeTab === 'overview' && checkedInPatients.length > 0 && (
        <div className="mb-6 bg-white shadow-lg rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black flex items-center">
              <Users className="h-5 w-5 mr-2 text-black" />
              Queued Patients ({checkedInPatients.length})
            </h2>
            <button
              onClick={() => setActiveTab('queue')}
              className="text-sm text-black hover:text-gray-700 font-bold"
            >
              View All →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {checkedInPatients.slice(0, 6).map((patient: any) => (
              <div
                key={patient.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => setActiveTab('queue')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-black">
                      {patient.patient?.user?.firstName} {patient.patient?.user?.lastName}
                    </p>
                    <p className="text-sm text-black mt-1">
                      Checked in: {format(new Date(patient.checkedInAt), 'HH:mm')}
                    </p>
                    {patient.doctor && (
                      <p className="text-sm text-black mt-1">
                        Doctor: {patient.doctor.firstName} {patient.doctor.lastName}
                      </p>
                    )}
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    patient.status === 'WAITING' ? 'bg-yellow-100 text-yellow-800' :
                    patient.status === 'IN_CONSULTATION' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {patient.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Tab Content */}
      {activeTab === 'overview' && (
        <WorkloadOverview 
          kpis={workloadKPIs}
          checkedInPatients={checkedInPatients}
          todayAppointments={todayAppointments}
          pendingTasks={pendingTasks}
          tasks={tasks || []}
          onNavigate={setActiveTab}
        />
      )}

      {activeTab === 'queue' && (
        <PatientQueueManagement 
          queue={patientQueue}
          patients={patients}
          appointments={appointments}
          queryClient={queryClient}
        />
      )}

      {activeTab === 'notes' && (
        <NursingNotes 
          patients={patients}
          queryClient={queryClient}
          userId={user?.id || ''}
        />
      )}

      {activeTab === 'tasks' && (
        <TaskManagement 
          tasks={tasks}
          queryClient={queryClient}
        />
      )}

      {activeTab === 'settings' && (
        <NurseSettings />
      )}
    </div>
  )
}
