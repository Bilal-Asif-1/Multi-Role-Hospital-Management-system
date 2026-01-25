import { useQuery } from '@tanstack/react-query'
import { doctorsApi } from '../../../../../services/api'
import { Users, Calendar, MapPin } from 'lucide-react'
import { format } from 'date-fns'

interface DoctorAssignedPatientsProps {
  doctorId: string
}

export function DoctorAssignedPatients({ doctorId }: DoctorAssignedPatientsProps) {
  const { data: assignedData, isLoading } = useQuery({
    queryKey: ['doctor-assigned-patients', doctorId],
    queryFn: () => doctorsApi.getAssignedPatients(doctorId),
    enabled: !!doctorId,
  })

  if (isLoading) {
    return <p className="text-black font-bold">Loading assigned patients...</p>
  }

  const appointments = assignedData?.appointments || []
  const bedAssignments = assignedData?.bedAssignments || []

  if (appointments.length === 0 && bedAssignments.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 font-bold">No assigned patients</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-black flex items-center">
        <Users className="h-5 w-5 mr-2" /> Assigned Patients
      </h3>

      {appointments.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-gray-600 mb-2">Upcoming Appointments</h4>
          <div className="space-y-2">
            {appointments.map((apt: any) => (
              <div key={apt.id} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-black font-bold">
                      {apt.patient?.user?.firstName} {apt.patient?.user?.lastName}
                    </p>
                    <div className="flex items-center space-x-3 mt-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(new Date(apt.appointmentDate), 'MMM dd, yyyy')} at {apt.appointmentTime}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs font-bold rounded bg-blue-100 text-blue-800">
                    {apt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {bedAssignments.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-gray-600 mb-2">Admitted Patients</h4>
          <div className="space-y-2">
            {bedAssignments.map((assignment: any) => (
              <div key={assignment.id} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-black font-bold">
                      {assignment.patient?.user?.firstName} {assignment.patient?.user?.lastName}
                    </p>
                    <div className="flex items-center space-x-3 mt-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-3 w-3 mr-1" />
                        Room {assignment.bed?.room?.roomNumber} - Bed {assignment.bed?.label}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs font-bold rounded bg-green-100 text-green-800">
                    Admitted
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

