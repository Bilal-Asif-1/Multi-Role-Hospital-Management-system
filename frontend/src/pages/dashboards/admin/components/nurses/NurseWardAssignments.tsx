import { useQuery } from '@tanstack/react-query'
import { shiftsApi } from '../../../../../services/api'
import { MapPin, Calendar, Clock } from 'lucide-react'

interface NurseWardAssignmentsProps {
  nurseId: string
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function NurseWardAssignments({ nurseId }: NurseWardAssignmentsProps) {
  const { data: shifts, isLoading } = useQuery({
    queryKey: ['nurse-shifts', nurseId],
    queryFn: () => shiftsApi.getNurseShifts(nurseId),
    enabled: !!nurseId,
  })

  if (isLoading) {
    return <p className="text-black font-bold">Loading ward assignments...</p>
  }

  if (!shifts || shifts.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 font-bold">No ward assignments</p>
      </div>
    )
  }

  const wards = Array.from(new Set(shifts.map((s: any) => s.ward).filter(Boolean)))

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-black flex items-center">
        <MapPin className="h-5 w-5 mr-2" /> Ward Assignments
      </h3>

      {wards.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-bold text-gray-600 mb-2">Assigned Wards:</p>
          <div className="flex flex-wrap gap-2">
            {wards.map((ward: string) => (
              <span
                key={ward}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold"
              >
                {ward}
              </span>
            ))}
          </div>
        </div>
      )}

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
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-black" />
                <div>
                  <p className="text-black font-bold">
                    {dayNames[shift.dayOfWeek]}: {shift.startTime} - {shift.endTime}
                  </p>
                  {shift.ward && (
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {shift.ward}
                    </p>
                  )}
                </div>
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

