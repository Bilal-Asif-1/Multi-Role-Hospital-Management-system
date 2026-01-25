import { useQuery } from '@tanstack/react-query'
import { nursesApi } from '../../../../../services/api'
import { Users, MapPin, UserCog } from 'lucide-react'

interface NurseAssignedPatientsProps {
  nurseId: string
}

export function NurseAssignedPatients({ nurseId }: NurseAssignedPatientsProps) {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['nurse-assigned-patients', nurseId],
    queryFn: () => nursesApi.getAssignedPatients(nurseId),
    enabled: !!nurseId,
  })

  if (isLoading) {
    return <p className="text-black font-bold">Loading assigned patients...</p>
  }

  if (!assignments || assignments.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 font-bold">No assigned patients</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-black flex items-center">
        <Users className="h-5 w-5 mr-2" /> Assigned Patients ({assignments.length})
      </h3>

      <div className="space-y-2">
        {assignments.map((assignment: any) => (
          <div key={assignment.id} className="bg-gray-50 p-3 rounded-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-black font-bold">
                  {assignment.patient?.user?.firstName} {assignment.patient?.user?.lastName}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-3 w-3 mr-1" />
                    Room {assignment.bed?.room?.roomNumber} - Bed {assignment.bed?.label}
                  </div>
                  {assignment.doctor && (
                    <div className="flex items-center text-sm text-gray-600">
                      <UserCog className="h-3 w-3 mr-1" />
                      Dr. {assignment.doctor?.user?.firstName} {assignment.doctor?.user?.lastName}
                    </div>
                  )}
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-bold rounded bg-green-100 text-green-800">
                Active
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

