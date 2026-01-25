import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { shiftsApi, doctorsApi, nursesApi } from '../../../../services/api'
import { Calendar as CalendarIcon, Clock, Users, UserCog } from 'lucide-react'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'

interface ShiftCalendarProps {
  type: 'doctor' | 'nurse' | 'all'
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const dayNamesFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function ShiftCalendar({ type }: ShiftCalendarProps) {
  const [selectedWeek, setSelectedWeek] = useState(new Date())

  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 0 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorsApi.getAll(),
    enabled: type === 'doctor' || type === 'all',
  })

  const { data: nurses } = useQuery({
    queryKey: ['nurses'],
    queryFn: () => nursesApi.getAll(),
    enabled: type === 'nurse' || type === 'all',
  })

  const doctorShiftsQueries = useQuery({
    queryKey: ['all-doctor-shifts'],
    queryFn: async () => {
      if (!doctors) return []
      const allShiftsWithDoctors = await Promise.all(
        doctors.map(async (doctor: any) => {
          // Get shifts from DoctorShift table
          const shifts = await shiftsApi.getDoctorShifts(doctor.id).catch(() => [])
          
          // Also get availability from DoctorAvailability table
          let availabilityShifts: any[] = []
          if (doctor.availability && doctor.availability.length > 0) {
            availabilityShifts = doctor.availability
              .filter((avail: any) => avail.isAvailable)
              .map((avail: any) => ({
                id: avail.id,
                dayOfWeek: avail.dayOfWeek,
                startTime: avail.startTime,
                endTime: avail.endTime,
                status: 'ACTIVE',
                doctorId: doctor.id,
                doctorName: doctor.user
                  ? `${doctor.user.firstName} ${doctor.user.lastName}`
                  : 'Unknown',
                type: 'doctor',
                source: 'availability', // Mark as from availability
              }))
          }
          
          // Combine both shifts and availability
          const allShifts = [
            ...shifts.map((shift: any) => ({
              ...shift,
              doctorId: doctor.id,
              doctorName: doctor.user
                ? `${doctor.user.firstName} ${doctor.user.lastName}`
                : 'Unknown',
              type: 'doctor',
              source: 'shift',
            })),
            ...availabilityShifts,
          ]
          
          return allShifts
        }),
      )
      return allShiftsWithDoctors.flat()
    },
    enabled: (type === 'doctor' || type === 'all') && !!doctors,
  })

  const nurseShiftsQueries = useQuery({
    queryKey: ['all-nurse-shifts'],
    queryFn: async () => {
      if (!nurses) return []
      const allShiftsWithNurses = await Promise.all(
        nurses.map(async (nurse: any) => {
          const shifts = await shiftsApi.getNurseShifts(nurse.id)
          return shifts.map((shift: any) => ({
            ...shift,
            nurseId: nurse.id,
            nurseName: nurse.user
              ? `${nurse.user.firstName} ${nurse.user.lastName}`
              : 'Unknown',
            type: 'nurse',
          }))
        }),
      )
      return allShiftsWithNurses.flat()
    },
    enabled: (type === 'nurse' || type === 'all') && !!nurses,
  })

  const allShifts = useMemo(() => {
    const shifts: any[] = []
    
    // Filter based on type
    if (type === 'doctor' || type === 'all') {
      if (doctorShiftsQueries.data) {
        shifts.push(...doctorShiftsQueries.data)
      }
    }
    
    if (type === 'nurse' || type === 'all') {
      if (nurseShiftsQueries.data) {
        shifts.push(...nurseShiftsQueries.data)
      }
    }
    
    return shifts
  }, [doctorShiftsQueries.data, nurseShiftsQueries.data, type])

  const shiftsByDay = useMemo(() => {
    const grouped: Record<number, any[]> = {}
    weekDays.forEach((day, dayIndex) => {
      grouped[dayIndex] = allShifts.filter((shift) => shift.dayOfWeek === dayIndex)
    })
    return grouped
  }, [allShifts, weekDays])

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-black flex items-center">
          <CalendarIcon className="h-6 w-6 mr-2" /> Shift Calendar
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}
            className="px-3 py-1 border border-gray-300 rounded-md text-black font-bold hover:bg-gray-50"
          >
            ← Prev
          </button>
          <span className="px-4 py-1 text-black font-bold">
            {format(weekStart, 'MMM dd')} - {format(addDays(weekStart, 6), 'MMM dd, yyyy')}
          </span>
          <button
            onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
            className="px-3 py-1 border border-gray-300 rounded-md text-black font-bold hover:bg-gray-50"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, dayIndex) => (
          <div key={dayIndex} className="border border-gray-200 rounded-lg p-2">
            <div className="text-center mb-2">
              <p className="text-xs font-bold text-gray-600">{dayNames[dayIndex]}</p>
              <p className="text-sm font-bold text-black">{format(day, 'dd')}</p>
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {shiftsByDay[dayIndex]?.map((shift, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded text-xs shadow-md"
                >
                  <div className="flex items-center space-x-1 mb-1">
                    {shift.type === 'doctor' ? (
                      <UserCog className="h-3 w-3 text-black" />
                    ) : (
                      <Users className="h-3 w-3 text-black" />
                    )}
                    <span className="font-bold text-black text-xs">
                      {shift.type === 'doctor' ? shift.doctorName : shift.nurseName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-2 w-2 text-gray-600" />
                    <span className="text-gray-700 text-xs">
                      {shift.startTime} - {shift.endTime}
                    </span>
                  </div>
                  {shift.ward && (
                    <p className="text-xs text-gray-600 mt-1">Ward: {shift.ward}</p>
                  )}
                  <span className="inline-block mt-1 px-1 py-0.5 rounded text-xs font-bold text-black">
                    {shift.status}
                  </span>
                </div>
              ))}
              {(!shiftsByDay[dayIndex] || shiftsByDay[dayIndex].length === 0) && (
                <p className="text-xs text-gray-400 text-center py-2">No shifts</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

