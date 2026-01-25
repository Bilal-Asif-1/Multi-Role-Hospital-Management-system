import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { doctorsApi, appointmentsApi } from '../../../../services/api'

interface BookAppointmentModalProps {
  doctors: any[]
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onClose: () => void
  loading: boolean
}

export default function BookAppointmentModal({
  doctors,
  onSubmit,
  onClose,
  loading,
}: BookAppointmentModalProps) {
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')

  // Find selected doctor data
  const selectedDoctorData = useMemo(() => {
    if (!selectedDoctorId || !doctors) return null
    return doctors.find((doctor: any) => doctor.userId === selectedDoctorId)
  }, [selectedDoctorId, doctors])

  // Fetch selected doctor's availability
  const { data: doctorAvailability } = useQuery({
    queryKey: ['doctor-availability', selectedDoctorData?.id],
    queryFn: () => doctorsApi.getAvailability(selectedDoctorData?.id || ''),
    enabled: !!selectedDoctorData?.id,
  })

  // Get appointments for selected doctor on selected date to check conflicts
  const { data: doctorAppointments } = useQuery({
    queryKey: ['doctor-appointments', selectedDoctorId, selectedDate],
    queryFn: () => appointmentsApi.getAll(),
    enabled: !!selectedDoctorId && !!selectedDate,
    select: (data) => {
      if (!selectedDate) return []
      const selectedDateObj = new Date(selectedDate)
      selectedDateObj.setHours(0, 0, 0, 0)
      
      return data.filter((apt: any) => {
        if (apt.doctorId !== selectedDoctorId) return false
        const aptDate = new Date(apt.appointmentDate)
        aptDate.setHours(0, 0, 0, 0)
        return aptDate.getTime() === selectedDateObj.getTime() && 
               apt.status !== 'CANCELLED'
      })
    },
  })

  // Generate available time slots for selected doctor on selected date
  const availableTimeSlots = useMemo(() => {
    if (!doctorAvailability || !selectedDate || !selectedDoctorId) return []
    
    const selectedDateObj = new Date(selectedDate)
    const dayOfWeek = selectedDateObj.getDay()
    
    // Find availability for this day
    const dayAvailability = doctorAvailability.filter((avail: any) => 
      avail.dayOfWeek === dayOfWeek && avail.isAvailable
    )
    
    if (dayAvailability.length === 0) return []
    
    const slots: string[] = []
    const bookedSlots = new Set(
      (doctorAppointments || []).map((apt: any) => apt.appointmentTime)
    )
    
    // Generate slots for each availability window
    dayAvailability.forEach((avail: any) => {
      const startTime = avail.startTime.split(':')
      const endTime = avail.endTime.split(':')
      const startHours = parseInt(startTime[0])
      const startMinutes = parseInt(startTime[1])
      const endHours = parseInt(endTime[0])
      const endMinutes = parseInt(endTime[1])
      
      let currentHours = startHours
      let currentMinutes = startMinutes
      
      // Handle overnight shifts
      const isOvernight = endHours < startHours || (endHours === startHours && endMinutes < startMinutes)
      
      while (true) {
        const timeString = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`
        
        // Check if we've reached the end time
        if (!isOvernight) {
          if (currentHours > endHours || (currentHours === endHours && currentMinutes >= endMinutes)) {
            break
          }
        } else {
          // For overnight, continue until 23:59, then handle next day
          if (currentHours === 23 && currentMinutes >= 30) {
            break
          }
        }
        
        // Only add slot if not already booked
        if (!bookedSlots.has(timeString)) {
          slots.push(timeString)
        }
        
        // Add 30 minutes
        currentMinutes += 30
        if (currentMinutes >= 60) {
          currentMinutes = 0
          currentHours += 1
          if (currentHours >= 24) {
            currentHours = 0
          }
        }
        
        // Break if we've gone too far (for overnight shifts)
        if (isOvernight && currentHours === 0 && currentMinutes > endMinutes) {
          break
        }
      }
    })
    
    return slots.sort()
  }, [doctorAvailability, selectedDate, selectedDoctorId, doctorAppointments])

  const handleDoctorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDoctorId(e.target.value)
    setSelectedTime('')
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value)
    setSelectedTime('')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Book Appointment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Doctor *</label>
            <select
              name="doctorId"
              required
              value={selectedDoctorId}
              onChange={handleDoctorChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Doctor</option>
              {doctors?.map((doc: any) => (
                <option key={doc.id} value={doc.userId}>
                  Dr. {doc.user?.firstName} {doc.user?.lastName} - {doc.specialization}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
            <input
              type="date"
              name="appointmentDate"
              required
              value={selectedDate}
              onChange={handleDateChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {selectedDoctorId && selectedDate && availableTimeSlots.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Available Time Slots *</label>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                {availableTimeSlots.map((slot: string) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    className={`px-3 py-2 text-sm font-bold rounded-md transition-all ${
                      selectedTime === slot
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              <input
                type="hidden"
                name="appointmentTime"
                value={selectedTime}
                required
              />
            </div>
          )}
          {selectedDoctorId && selectedDate && availableTimeSlots.length === 0 && (
            <div>
              <p className="text-sm text-gray-600">No available time slots for this doctor on selected date</p>
            </div>
          )}
          {(!selectedDoctorId || !selectedDate) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
              <input
                type="time"
                name="appointmentTime"
                required
                disabled={selectedDoctorId && selectedDate && availableTimeSlots.length > 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
            <textarea
              name="reason"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Reason for visit..."
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (selectedDoctorId && selectedDate && !selectedTime)}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}



