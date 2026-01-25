import { useQuery } from '@tanstack/react-query'
import { shiftsApi } from '../../../../../services/api'
import { Calendar, Clock } from 'lucide-react'

interface DoctorDutyRosterProps {
  doctorId: string
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function DoctorDutyRoster({ doctorId }: DoctorDutyRosterProps) {
  const { data: shifts, isLoading } = useQuery({
    queryKey: ['doctor-shifts', doctorId],
    queryFn: () => shiftsApi.getDoctorShifts(doctorId),
    enabled: !!doctorId,
  })

  if (isLoading) {
    return <p className="text-black font-bold">Loading shifts...</p>
  }

  if (!shifts || shifts.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 font-bold">No shifts scheduled</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-black flex items-center">
        <Calendar className="h-5 w-5 mr-2" /> Duty Roster
      </h3>
      <div className="space-y-2">
        {shifts.map((shift: any) => (
          <div
            key={shift.id}
            className={`p-3 rounded-md border ${
              shift.status === 'ACTIVE'
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-black" />
                <p className="text-black font-bold">
                  {dayNames[shift.dayOfWeek]}: {shift.startTime} - {shift.endTime}
                </p>
              </div>
              <span
                className={`px-2 py-1 text-xs font-bold rounded ${
                  shift.status === 'ACTIVE'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-700'
                }`}
              >
                {shift.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

