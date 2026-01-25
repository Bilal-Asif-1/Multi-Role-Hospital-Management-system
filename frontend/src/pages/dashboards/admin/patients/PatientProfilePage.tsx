import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { patientsApi } from '../../../../services/api'
import { OverviewTab } from './components/OverviewTab'
import { AppointmentsTab } from './components/AppointmentsTab'
import { AdmissionsTab } from './components/AdmissionsTab'
import { StaffTab } from './components/StaffTab'
import { HistoryTab } from './components/HistoryTab'
import { RelationViewer } from '../../../../components/RelationViewer'
import { AssignDoctorModal } from '../../../features/patients/AssignDoctorModal'
import { ArrowLeft, UserPlus } from 'lucide-react'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'appointments', label: 'Appointments' },
  { id: 'admissions', label: 'Admissions' },
  { id: 'staff', label: 'Staff' },
  { id: 'related', label: 'Related' },
  { id: 'history', label: 'History' },
]

export default function PatientProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [showAssignDoctor, setShowAssignDoctor] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['patient-overview', id],
    queryFn: () => patientsApi.getOverview(id as string),
    enabled: !!id,
  })

  if (isLoading || !data) {
    return <div className="p-6 text-black font-bold">Loading patient...</div>
  }

  const { patient } = data

  return (
    <div className="pl-6 pr-8 pt-6 pb-6 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-black font-bold hover:text-gray-700"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Patients
      </button>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-black">
            {patient.user?.firstName} {patient.user?.lastName}
          </h1>
          <p className="text-sm text-gray-600">
            ID: {patient.id.slice(0, 8)} · Current state: {patient.currentState}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAssignDoctor(true)}
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-bold text-white bg-black hover:bg-gray-900"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Assign Doctor
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-bold border-b-2 ${
                activeTab === tab.id
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <section>
        {activeTab === 'overview' && <OverviewTab overview={data} />}
        {activeTab === 'appointments' && <AppointmentsTab appointments={data.appointments} />}
        {activeTab === 'admissions' && <AdmissionsTab admissions={data.admissions} />}
        {activeTab === 'staff' && <StaffTab overview={data} />}
        {activeTab === 'related' && <RelationViewer entityType="Patient" entityId={patient.id} />}
        {activeTab === 'history' && <HistoryTab overview={data} />}
      </section>

      {/* Assign Doctor Modal */}
      {showAssignDoctor && (
        <AssignDoctorModal
          open={showAssignDoctor}
          patient={patient}
          onClose={() => setShowAssignDoctor(false)}
        />
      )}
    </div>
  )
}


