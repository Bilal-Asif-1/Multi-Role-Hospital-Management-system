import { useQuery } from '@tanstack/react-query'
import { patientsApi, vitalsApi } from '../../../../services/api'
import { User, Calendar, Droplet, Scale } from 'lucide-react'
import { format, differenceInYears } from 'date-fns'

interface PatientInfoChartProps {
  patientId?: string
}

export default function PatientInfoChart({ patientId }: PatientInfoChartProps) {
  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: () => patientsApi.getMyProfile(),
    refetchInterval: 30000,
  })

  const { data: latestVitals } = useQuery({
    queryKey: ['vitals-latest', patientId],
    queryFn: () => vitalsApi.getLatest(patientId!),
    enabled: !!patientId,
    refetchInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="bg-white shadow-lg rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h3>
        <div className="text-center py-12">
          <p className="text-gray-500">No patient data available</p>
        </div>
      </div>
    )
  }

  // Calculate age from date of birth
  const age = patient.dateOfBirth
    ? differenceInYears(new Date(), new Date(patient.dateOfBirth))
    : null

  const infoItems = [
    {
      label: 'Age',
      value: age !== null ? `${age} years` : 'N/A',
      icon: Calendar,
      color: 'bg-black',
    },
    {
      label: 'Gender',
      value: patient.gender || 'N/A',
      icon: User,
      color: 'bg-black',
    },
    {
      label: 'Weight',
      value: latestVitals?.weight ? `${latestVitals.weight} kg` : patient.weight || 'N/A',
      icon: Scale,
      color: 'bg-black',
    },
    {
      label: 'Blood Group',
      value: patient.bloodGroup || 'N/A',
      icon: Droplet,
      color: 'bg-black',
    },
  ]

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 cursor-pointer">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <User className="h-5 w-5 mr-2 text-black" />
        Patient Information
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {infoItems.map((item, index) => {
          const Icon = item.icon
          return (
            <div
              key={index}
              className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border border-gray-200 hover:shadow-md hover:scale-[1.02] transition-all duration-300"
            >
              <div className="flex items-center space-x-3">
                <div className={`${item.color} rounded-lg p-3`}>
                  <Icon className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-700 mb-1">{item.label}</p>
                  <p className="text-xl font-bold text-gray-900">{item.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

