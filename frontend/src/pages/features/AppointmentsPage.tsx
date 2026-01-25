import { useMemo, useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  appointmentsApi,
  doctorsApi,
  patientQueueApi,
  patientsApi,
  invoicesApi,
} from '../../services/api'
import { useRole } from '../../hooks/useRole'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Search, X } from 'lucide-react'
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
} from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addMinutes, isAfter, isBefore, parseISO } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = { 'en-US': enUS }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })
const fieldClass =
  'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black text-black disabled:bg-gray-100 disabled:cursor-not-allowed'
const cardClass = 'bg-white rounded-xl shadow p-4'

export default function AppointmentsPage() {
  const { isAdmin, isDoctor, user } = useRole()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [patientSearchTerm, setPatientSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null)
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [formState, setFormState] = useState({
    patientId: '',
    concern: '',
    specialization: '',
    appointmentDate: '',
    appointmentTime: '',
    doctorId: isDoctor ? user?.id || '' : '',
  })

  // Pre-fill patient if coming from patient page
  useEffect(() => {
    if (location.state?.selectedPatient) {
      const patient = location.state.selectedPatient
      setSelectedPatient(patient)
      setFormState(prev => ({
        ...prev,
        patientId: patient.userId || patient.user?.id,
      }))
      setPatientSearchTerm(`${patient.user?.firstName} ${patient.user?.lastName}`)
    }
  }, [location.state])

  // For doctors, get their appointments only. For admins, get all appointments.
  const { data: allAppointments = [], isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.getAll(),
    refetchOnWindowFocus: true,
  })


  // Filter appointments for doctors to show only their appointments
  // Backend already filters by doctorId for doctors, but we do client-side filtering as well
  const appointments = useMemo(() => {
    if (!allAppointments) return []
    
    // Backend already filters by doctorId, but we ensure it here too
    if (isDoctor && user?.id) {
      const filtered = allAppointments.filter((apt: any) => apt.doctorId === user.id)
      return filtered
    }
    return allAppointments
  }, [allAppointments, isDoctor, user?.id])

  // For doctors, get their patients only (those they have appointments/visit notes/prescriptions with)
  const { data: allPatients = [] } = useQuery({
    queryKey: ['patients-search', patientSearchTerm],
    queryFn: () => patientsApi.getAll(patientSearchTerm || undefined),
    enabled: patientSearchTerm.length > 0,
  })

  // Filter patients for doctors to show only their existing patients
  const patients = useMemo(() => {
    if (isDoctor && user?.id && patientSearchTerm.length > 0) {
      // Get patient IDs from appointments
      const patientUserIds = new Set<string>()
      allAppointments.forEach((apt: any) => {
        if (apt.doctorId === user.id && apt.patientId) {
          patientUserIds.add(apt.patientId)
        }
      })
      // Filter patients to show only those the doctor has appointments with
      return allPatients.filter((patient: any) => 
        patientUserIds.has(patient.userId)
      )
    }
    return allPatients
  }, [allPatients, allAppointments, isDoctor, user?.id, patientSearchTerm])

  const { data: allDoctors } = useQuery({
    queryKey: ['all-doctors'],
    queryFn: () => doctorsApi.getAll(),
  })

  const availableSpecializations = useMemo(() => {
    if (!allDoctors) return []
    const specializations = allDoctors
      .map((doctor: any) => doctor.specialization)
      .filter((spec: string) => spec && spec.trim() !== '')
    return Array.from(new Set(specializations)).sort()
  }, [allDoctors])

  const filteredPatients = useMemo(() => {
    if (!patientSearchTerm.trim()) return []
    const search = patientSearchTerm.toLowerCase().trim()
    return patients.filter((patient: any) => {
      const firstName = patient.user?.firstName?.toLowerCase() || ''
      const lastName = patient.user?.lastName?.toLowerCase() || ''
      const fullName = `${firstName} ${lastName}`.trim()
      const email = patient.user?.email?.toLowerCase() || ''
      return fullName.includes(search) || email.includes(search)
    }).slice(0, 10) // Limit to 10 results
  }, [patients, patientSearchTerm])

  // For doctors, get their own profile data (needed for queue filtering)
  const { data: doctorProfile } = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: () => doctorsApi.getMyProfile(),
    enabled: isDoctor && !!user?.id,
  })

  // Fetch queue - filter by doctor User ID if doctor role (since PatientQueue.doctorId references User.id)
  const { data: queue = [] } = useQuery({
    queryKey: ['patient-queue', isDoctor ? user?.id : undefined],
    queryFn: () => patientQueueApi.getAll(undefined, isDoctor && user?.id ? user.id : undefined),
    refetchInterval: 15000,
    enabled: !isDoctor || (isDoctor && !!user?.id),
  })

  // Filter queue to show only WAITING status entries for display
  // Backend already filters by doctorId, but we also filter by status here
  const filteredQueue = useMemo(() => {
    let filtered = queue
    
    // Additional client-side filter by doctor if doctor role (just in case)
    if (isDoctor && user?.id) {
      filtered = filtered.filter((entry: any) => entry.doctorId === user.id)
    }
    
    // Show only WAITING status entries
    filtered = filtered.filter((entry: any) => entry.status === 'WAITING')
    
    return filtered
  }, [queue, isDoctor, user?.id])

  // Get today's appointments that don't have queue entries yet
  const todayAppointmentsForQueue = useMemo(() => {
    if (!appointments || appointments.length === 0) return []
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Get appointments for today with SCHEDULED or CONFIRMED status
    const todayApts = appointments.filter((apt: any) => {
      const aptDate = new Date(apt.appointmentDate)
      aptDate.setHours(0, 0, 0, 0)
      
      return aptDate.getTime() === today.getTime() && 
             (apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED')
    })
    
    // Get patient IDs that are already in queue
    const queuedPatientIds = new Set(
      filteredQueue.map((q: any) => q.patientId)
    )
    
    // Get queued patient User IDs (from appointments in queue)
    const queuedAppointmentIds = new Set(
      filteredQueue.map((q: any) => q.appointmentId).filter(Boolean)
    )
    
    // Filter out appointments that already have queue entries
    return todayApts
      .filter((apt: any) => !queuedAppointmentIds.has(apt.id)) // Filter by appointment ID, not patient ID
      .map((apt: any) => ({
        id: `apt-${apt.id}`, // Unique ID for appointment-based entries
        appointmentId: apt.id,
        patientId: apt.patientId, // This is User.id, will be converted to Patient.id when creating queue entry
        patient: apt.patient, // Appointment has patient as User object directly (with firstName, lastName)
        doctorId: apt.doctorId,
        status: 'WAITING',
        isFromAppointment: true, // Flag to identify appointment-based entries
        appointmentTime: apt.appointmentTime,
        appointmentDate: apt.appointmentDate,
        checkedInAt: apt.appointmentDate, // Use appointment date as sort key
      }))
  }, [appointments, filteredQueue])

  // Combine queue entries with appointment-based entries
  const combinedQueue = useMemo(() => {
    return [...filteredQueue, ...todayAppointmentsForQueue]
  }, [filteredQueue, todayAppointmentsForQueue])

  // Sort queue: newest entries first (by checkedInAt/appointmentDate descending)
  const sortedQueue = useMemo(() => {
    return [...combinedQueue].sort((a: any, b: any) => {
      const dateA = new Date(a.checkedInAt || a.appointmentDate || a.createdAt || 0).getTime()
      const dateB = new Date(b.checkedInAt || b.appointmentDate || b.createdAt || 0).getTime()
      return dateB - dateA // Newest first
    })
  }, [combinedQueue])

  // Fetch all doctors with the selected specialization
  const { data: doctorsBySpecialization } = useQuery({
    queryKey: ['doctors-by-specialization', formState.specialization],
    queryFn: () => doctorsApi.getAll(),
    enabled: !!formState.specialization,
    select: (data) => {
      if (!formState.specialization) return []
      return data.filter((doctor: any) => 
        doctor.specialization?.toLowerCase() === formState.specialization.toLowerCase()
      )
    },
  })

  // Fetch available doctors when date and time are also selected
  const { data: availableDoctors } = useQuery({
    queryKey: [
      'available-doctors',
      formState.specialization,
      formState.appointmentDate,
      formState.appointmentTime,
    ],
    queryFn: () =>
      doctorsApi.getAvailable({
        specialization: formState.specialization,
        start: combineDateTime(formState.appointmentDate, formState.appointmentTime)?.toISOString(),
      }),
    enabled:
      !!formState.specialization && !!formState.appointmentDate && !!formState.appointmentTime,
  })

  // Always show all doctors for the selected specialization (don't filter by time)
  const suggestedDoctors = useMemo(() => {
    return doctorsBySpecialization || []
  }, [doctorsBySpecialization])


  // Fetch selected doctor's availability
  const selectedDoctorData = useMemo(() => {
    if (isDoctor && doctorProfile) {
      return doctorProfile
    }
    if (!formState.doctorId || !allDoctors) return null
    return allDoctors.find((doctor: any) => doctor.userId === formState.doctorId)
  }, [formState.doctorId, allDoctors, isDoctor, doctorProfile])

  // For doctors, use their own availability. For admins, use selected doctor's availability
  const doctorIdForAvailability = isDoctor ? doctorProfile?.id : selectedDoctorData?.id
  const doctorUserIdForAppointments = isDoctor ? user?.id : formState.doctorId
  
  const { data: doctorAvailability } = useQuery({
    queryKey: ['doctor-availability', doctorIdForAvailability],
    queryFn: () => doctorsApi.getAvailability(doctorIdForAvailability || ''),
    enabled: !!doctorIdForAvailability && (isDoctor ? !!doctorProfile : !!selectedDoctorData),
  })

  // Get appointments for selected doctor on selected date to check conflicts
  const { data: doctorAppointments } = useQuery({
    queryKey: ['doctor-appointments', doctorUserIdForAppointments, formState.appointmentDate],
    queryFn: () => appointmentsApi.getAll(),
    enabled: !!doctorUserIdForAppointments && !!formState.appointmentDate,
    select: (data) => {
      if (!formState.appointmentDate) return []
      const selectedDate = new Date(formState.appointmentDate)
      selectedDate.setHours(0, 0, 0, 0)
      
      return data.filter((apt: any) => {
        if (apt.doctorId !== doctorUserIdForAppointments) return false
        const aptDate = new Date(apt.appointmentDate)
        aptDate.setHours(0, 0, 0, 0)
        return aptDate.getTime() === selectedDate.getTime() && 
               apt.status !== 'CANCELLED'
      })
    },
  })

  // Generate available time slots for selected doctor on selected date
  const availableTimeSlots = useMemo(() => {
    if (!doctorAvailability || !formState.appointmentDate) return []
    if (!isDoctor && !formState.doctorId) return []
    if (isDoctor && !doctorProfile?.id) return []
    
    const selectedDate = new Date(formState.appointmentDate)
    const dayOfWeek = selectedDate.getDay()
    
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
  }, [doctorAvailability, formState.appointmentDate, formState.doctorId, doctorAppointments])

  const events = useMemo(
    () => {
      const mappedEvents = appointments.map((appointment: any) => {
        const patientName = appointment.patient?.firstName && appointment.patient?.lastName
          ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
          : appointment.patient?.firstName || 'Patient'
        
        const doctorName = appointment.doctor?.firstName || ''
        const startDate = combineDateTime(appointment.appointmentDate, appointment.appointmentTime)
        
        if (!startDate || isNaN(startDate.getTime())) {
          console.warn('Invalid date/time for appointment:', appointment.id, appointment.appointmentDate, appointment.appointmentTime)
          return null
        }
        
        return {
          id: appointment.id,
          title: `${patientName}${doctorName ? ` · Dr. ${doctorName}` : ''}`,
          start: startDate,
          end: addMinutes(startDate, 30),
          resource: appointment,
        }
      }).filter(Boolean) // Remove any null entries
      
      return mappedEvents
    },
    [appointments],
  )

  const createInvoiceMutation = useMutation({
    mutationFn: invoicesApi.create,
  })

  const createMutation = useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: async (appointment) => {
      // Invoice is now automatically created by backend when appointment is created
      // No need to create invoice manually here
      toast.success('Appointment scheduled successfully')
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] }) // Refresh invoices in case one was created
      setFormState({
        patientId: '',
        concern: '',
        specialization: '',
        appointmentDate: '',
        appointmentTime: '',
        doctorId: isDoctor ? user?.id || '' : '',
      })
      setSelectedPatient(null)
      setPatientSearchTerm('')
      setShowPatientDropdown(false)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Unable to schedule appointment')
    },
  })

  const handlePatientSelect = (patient: any) => {
    setSelectedPatient(patient)
    setFormState({ ...formState, patientId: patient.userId || patient.user?.id })
    setPatientSearchTerm(`${patient.user?.firstName} ${patient.user?.lastName}`)
    setShowPatientDropdown(false)
  }

  const handlePatientSearchChange = (value: string) => {
    setPatientSearchTerm(value)
    setShowPatientDropdown(value.length > 0)
    if (!value) {
      setSelectedPatient(null)
      setFormState({ ...formState, patientId: '' })
    }
  }

  const rescheduleMutation = useMutation({
    mutationFn: ({
      id,
      appointmentDate,
      appointmentTime,
    }: {
      id: string
      appointmentDate: string
      appointmentTime: string
    }) => appointmentsApi.reschedule(id, appointmentDate, appointmentTime),
    onSuccess: () => {
      toast.success('Appointment rescheduled')
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      setSelectedEvent(null)
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.cancel(id),
    onSuccess: () => {
      toast.success('Appointment cancelled')
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      setSelectedEvent(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to cancel appointment')
    },
  })

  // Get all patients to find Patient ID from User ID
  const { data: allPatientsData = [] } = useQuery({
    queryKey: ['all-patients-for-queue'],
    queryFn: () => patientsApi.getAll(),
  })

  const queueMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      // If it's an appointment-based entry (starts with 'apt-'), create queue entry first
      if (id.startsWith('apt-')) {
        const appointmentId = id.replace('apt-', '')
        
        const appointment = appointments.find((apt: any) => apt.id === appointmentId)
        if (!appointment) {
          console.error('Appointment not found:', appointmentId)
          throw new Error('Appointment not found')
        }
        
        // Find Patient record from User ID (appointment.patientId is User.id)
        const patientRecord = allPatientsData.find((p: any) => p.userId === appointment.patientId)
        if (!patientRecord) {
          console.error('Patient record not found for userId:', appointment.patientId)
          throw new Error('Patient record not found. Please try again.')
        }
        
        try {
          // Create queue entry with Patient ID
          const queueEntry = await patientQueueApi.checkIn({
            patientId: patientRecord.id, // Use Patient.id, not User.id
            appointmentId: appointment.id,
            doctorId: appointment.doctorId,
            priority: 'NORMAL',
          })
          
          // Then update status if needed
          if (status !== 'WAITING') {
            return await patientQueueApi.updateStatus(queueEntry.id, status)
          }
          return queueEntry
        } catch (checkInError: any) {
          console.error('Error creating queue entry:', checkInError)
          throw new Error(checkInError?.response?.data?.message || 'Failed to create queue entry. You may need nurse/admin to check-in the patient first.')
        }
      }
      
      // Regular queue entry update
      return await patientQueueApi.updateStatus(id, status)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['patient-queue'] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Queue updated successfully')
    },
    onError: (error: any) => {
      console.error('Queue mutation error:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update queue'
      toast.error(errorMessage)
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!formState.appointmentTime) {
      toast.error('Please select a time slot')
      return
    }
    if (isDoctor && !formState.patientId) {
      toast.error('Please select a patient')
      return
    }
    if (!isDoctor && !formState.doctorId) {
      toast.error('Please select a doctor')
      return
    }
    createMutation.mutate({
      patientId: formState.patientId,
      doctorId: isDoctor ? user?.id : formState.doctorId,
      appointmentDate: formState.appointmentDate,
      appointmentTime: formState.appointmentTime,
      reason: formState.concern,
    })
  }

  return (
    <div className="pl-6 pr-8 pt-6 pb-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-black">Appointment Calendar</h1>
          <p className="text-black font-bold mt-1">Weekly overview with real-time queue</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-4 relative">
          <style>{`
            .rbc-calendar {
              margin-top: 0 !important;
              padding-top: 0 !important;
              border-radius: 12px !important;
              overflow: hidden !important;
            }
            .rbc-toolbar {
              margin-bottom: 12px !important;
              padding-bottom: 0 !important;
              border: 1px solid #e5e7eb !important;
              border-radius: 12px !important;
              padding: 12px !important;
            }
            .rbc-time-view {
              border-radius: 12px !important;
              overflow: hidden !important;
              border: 1px solid #e5e7eb !important;
            }
            .rbc-time-header {
              border-radius: 12px 12px 0 0 !important;
              border-top: none !important;
            }
            .rbc-time-header-content {
              border-top: none !important;
            }
            .rbc-time-header-gutter {
              border-top: none !important;
            }
            .rbc-time-content {
              border-radius: 0 0 12px 12px !important;
            }
            .rbc-time-header {
              margin-top: 0 !important;
              padding-top: 0 !important;
              margin-bottom: 0 !important;
              padding-bottom: 0 !important;
            }
            .rbc-time-header-content {
              margin-top: 0 !important;
              padding-top: 0 !important;
              margin-bottom: 0 !important;
              padding-bottom: 0 !important;
            }
            .rbc-time-gutter {
              padding-top: 0 !important;
              margin-top: 0 !important;
            }
            .rbc-time-content {
              padding-top: 0 !important;
              margin-top: 0 !important;
            }
            .rbc-time-header-gutter {
              padding-top: 0 !important;
              margin-top: 0 !important;
              padding-bottom: 0 !important;
              margin-bottom: 0 !important;
              height: auto !important;
              min-height: 0 !important;
            }
            .rbc-time-gutter .rbc-time-slot {
              padding-top: 0 !important;
              margin-top: 0 !important;
            }
            .rbc-time-header-gutter .rbc-time-slot {
              padding-top: 0 !important;
              margin-top: 0 !important;
            }
            .rbc-time-slot {
              padding-top: 0 !important;
              margin-top: 0 !important;
            }
            .rbc-header {
              padding-top: 0 !important;
              margin-top: 0 !important;
              padding-bottom: 0 !important;
              margin-bottom: 0 !important;
              height: 30px !important;
              min-height: 30px !important;
              line-height: 30px !important;
              border-bottom: none !important;
            }
            .rbc-header + .rbc-header {
              padding-top: 0 !important;
              border-top: none !important;
            }
            .rbc-time-header {
              height: 30px !important;
              min-height: 30px !important;
              border-bottom: none !important;
            }
            .rbc-time-header-content {
              border-bottom: none !important;
            }
            .rbc-time-header-gutter {
              border-bottom: none !important;
            }
            .rbc-time-view {
              overflow-y: auto !important;
              scroll-behavior: smooth !important;
            }
            .rbc-time-content {
              overflow-y: auto !important;
              scroll-behavior: smooth !important;
              padding-top: 0 !important;
            }
            .rbc-time-view > .rbc-time-content {
              padding-top: 0 !important;
            }
            .rbc-time-slot:first-child {
              margin-top: 0 !important;
            }
          `}</style>
          {isLoading ? (
            <p className="text-black font-bold">Loading appointments...</p>
          ) : (
            <BigCalendar
              localizer={localizer}
              events={events}
              defaultView="week"
              views={['week', 'day']}
              selectable
              style={{ height: 520 }}
              scrollToTime={new Date(1970, 0, 1, 8, 0, 0)}
              onSelectEvent={(event) => setSelectedEvent(event.resource)}
              onSelectSlot={(slot) => {
                setFormState((prev) => ({
                  ...prev,
                  appointmentDate: slot.start.toISOString().split('T')[0],
                  appointmentTime: slot.start.toTimeString().slice(0, 5),
                }))
              }}
              eventPropGetter={(event) => ({
                style: {
                  backgroundColor: statusColor(event.resource.status),
                  borderRadius: 8,
                  color: '#fff',
                },
              })}
              components={{
                timeGutterHeader: () => (
                  <div className="text-center font-bold text-black text-xs py-0">Time</div>
                ),
                header: ({ label }: any) => {
                  // Hide "Time" from the header row, show it only in time gutter
                  if (label === 'Time') {
                    return <div className="rbc-header"></div>
                  }
                  return <div className="rbc-header">{label}</div>
                },
              }}
            />
          )}
        </div>

        <div className="space-y-6">
          <div className={cardClass}>
            <h3 className="text-lg font-bold text-black mb-3">
              {isDoctor ? 'Book Appointment for Patient' : 'New Appointment'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    required
                    placeholder={isDoctor ? "Search Your Patient by Name or Email" : "Search Patient by Name or Email"}
                    className={`${fieldClass} pl-10 pr-10`}
                    value={patientSearchTerm}
                    onChange={(e) => handlePatientSearchChange(e.target.value)}
                    onFocus={() => {
                      if (patientSearchTerm) setShowPatientDropdown(true)
                    }}
                  />
                  {selectedPatient && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(null)
                        setPatientSearchTerm('')
                        setFormState({ ...formState, patientId: '' })
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {showPatientDropdown && filteredPatients.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredPatients.map((patient: any) => (
                      <div
                        key={patient.id}
                        onClick={() => handlePatientSelect(patient)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <p className="font-bold text-black">
                          {patient.user?.firstName} {patient.user?.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{patient.user?.email}</p>
                      </div>
                    ))}
                  </div>
                )}
                {showPatientDropdown && patientSearchTerm && filteredPatients.length === 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4">
                    <p className="text-sm text-gray-600">
                      {isDoctor ? 'No patients found. Patients must have an existing appointment with you.' : 'No patients found'}
                    </p>
                  </div>
                )}
              </div>
              <input
                placeholder="Concern / Reason"
                className={fieldClass}
                value={formState.concern}
                onChange={(e) => setFormState({ ...formState, concern: e.target.value })}
              />
              {!isDoctor && (
                <>
                  <select
                    className={fieldClass}
                    value={formState.specialization}
                    onChange={(e) => setFormState({ ...formState, specialization: e.target.value, doctorId: '', appointmentTime: '' })}
                    required
                  >
                    <option value="">Select Specialization</option>
                    {availableSpecializations.map((spec: string) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                  <select
                    required
                    className={fieldClass}
                    value={formState.doctorId}
                    onChange={(e) => setFormState({ ...formState, doctorId: e.target.value, appointmentTime: '' })}
                    disabled={!formState.specialization || !suggestedDoctors || suggestedDoctors.length === 0}
                  >
                    <option value="">
                      {!formState.specialization
                        ? 'Please select specialization first'
                        : !suggestedDoctors || suggestedDoctors.length === 0
                        ? 'No doctors found for this specialization'
                        : 'Select Doctor'}
                    </option>
                    {suggestedDoctors && suggestedDoctors.length > 0 && suggestedDoctors.map((doctor: any) => (
                      <option key={doctor.userId} value={doctor.userId}>
                        Dr. {doctor.user?.firstName} {doctor.user?.lastName} · {doctor.specialization}
                      </option>
                    ))}
                  </select>
                </>
              )}
              <input
                type="date"
                required
                className={fieldClass}
                value={formState.appointmentDate}
                onChange={(e) => {
                  setFormState({ ...formState, appointmentDate: e.target.value, appointmentTime: '' })
                }}
                min={new Date().toISOString().split('T')[0]}
                disabled={isDoctor ? !formState.patientId : !formState.doctorId}
              />
              {((isDoctor && doctorProfile?.id) || (!isDoctor && formState.doctorId)) && formState.appointmentDate && availableTimeSlots.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Available Time Slots</label>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-md">
                    {availableTimeSlots.map((slot: string) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setFormState({ ...formState, appointmentTime: slot })}
                        className={`px-3 py-2 text-sm font-bold rounded-md transition-all ${
                          formState.appointmentTime === slot
                            ? 'bg-black text-white'
                            : 'bg-gray-100 text-black hover:bg-gray-200'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {((isDoctor && doctorProfile?.id) || (!isDoctor && formState.doctorId)) && formState.appointmentDate && availableTimeSlots.length === 0 && (
                <p className="text-sm text-gray-600">
                  {isDoctor ? 'No available time slots on selected date. Please check your availability settings.' : 'No available time slots for this doctor on selected date'}
                </p>
              )}
              <button
                type="submit"
                disabled={createMutation.isPending || (isDoctor && !formState.patientId)}
                className="w-full px-4 py-2 bg-black text-white rounded-md font-bold hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? 'Scheduling...' : 'Schedule'}
              </button>
            </form>
          </div>

          <div className={cardClass}>
            <h3 className="text-lg font-bold text-black mb-2">Waiting Queue</h3>
            <div className="space-y-2 h-[200px] overflow-y-auto">
              {sortedQueue.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[150px]">
                  <p className="text-sm text-black">No patients in queue.</p>
                </div>
              ) : (
                sortedQueue.map((entry: any) => {
                  // Handle both queue entries (patient.user structure) and appointment-based entries (patient as User object)
                  let patientName = 'Unknown Patient'
                  if (entry.patient?.user?.firstName) {
                    // Queue entry structure
                    patientName = `${entry.patient.user.firstName} ${entry.patient.user.lastName || ''}`.trim()
                  } else if (entry.patient?.firstName) {
                    // Appointment-based entry (patient is User object directly)
                    patientName = `${entry.patient.firstName} ${entry.patient.lastName || ''}`.trim()
                  } else if (entry.patientName) {
                    patientName = entry.patientName
                  }
                  
                  const appointmentTime = entry.appointmentTime || entry.patient?.appointmentTime
                  const appointmentDate = entry.appointmentDate || entry.patient?.appointmentDate
                  
                  // Check if appointment time has arrived or passed
                  let isAppointmentTimeArrived = false
                  let isAppointmentTimePassed = false
                  
                  if (appointmentTime && appointmentDate) {
                    try {
                      const dateStr = appointmentDate instanceof Date 
                        ? appointmentDate.toISOString().split('T')[0] 
                        : typeof appointmentDate === 'string' 
                          ? appointmentDate.split('T')[0] 
                          : appointmentDate
                      
                      const appointmentDateTime = combineDateTime(dateStr, appointmentTime)
                      
                      if (appointmentDateTime) {
                        const now = new Date()
                        // Check if appointment time has arrived (now >= appointment time)
                        isAppointmentTimeArrived = !isBefore(now, appointmentDateTime)
                        // Check if appointment time slot has completely passed (30 minutes after appointment time)
                        const appointmentEndTime = addMinutes(appointmentDateTime, 30)
                        isAppointmentTimePassed = isAfter(now, appointmentEndTime)
                      }
                    } catch (error) {
                      console.error('Error parsing appointment date/time:', error)
                      // If parsing fails, allow start by default
                      isAppointmentTimeArrived = true
                    }
                  } else {
                    // If no appointment time, allow start (for non-appointment queue entries)
                    isAppointmentTimeArrived = true
                  }
                  
                  return (
                    <div key={entry.id} className="border border-gray-100 rounded-lg p-2 text-sm text-black">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-bold text-sm">{patientName}</p>
                        {entry.isFromAppointment && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs">Appt</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        {appointmentTime && <span>Time: {appointmentTime}</span>}
                        <span className="text-gray-500">Status: {entry.status || 'WAITING'}</span>
                      </div>
                      <div className="flex space-x-2 pt-1.5">
                        {entry.status === 'WAITING' && isAppointmentTimeArrived && !isAppointmentTimePassed && (
                          <button
                            onClick={() => {
                              queueMutation.mutate({ id: entry.id, status: 'IN_CONSULTATION' })
                            }}
                            disabled={queueMutation.isPending}
                            className="px-2 py-0.5 bg-black text-white rounded text-xs font-bold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {queueMutation.isPending ? 'Processing...' : 'Start'}
                          </button>
                        )}
                        {entry.status === 'WAITING' && !isAppointmentTimeArrived && (
                          <div className="flex flex-col">
                            {appointmentDate && (
                              <span className="text-xs text-gray-400 mb-0.5">
                                {format(new Date(appointmentDate), 'MMM dd, yyyy')}
                              </span>
                            )}
                            <span className="px-2 py-0.5 text-xs text-gray-500">Waiting for appointment time</span>
                          </div>
                        )}
                        {entry.status === 'WAITING' && isAppointmentTimePassed && (
                          <button
                            onClick={() => {
                              queueMutation.mutate({ id: entry.id, status: 'COMPLETED' })
                            }}
                            disabled={queueMutation.isPending}
                            className="px-2 py-0.5 bg-gray-600 text-white rounded text-xs font-bold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {queueMutation.isPending ? 'Processing...' : 'Mark as Finished'}
                          </button>
                        )}
                        {entry.status === 'IN_CONSULTATION' && (
                          <button
                            onClick={() => {
                              queueMutation.mutate({ id: entry.id, status: 'COMPLETED' })
                            }}
                            disabled={queueMutation.isPending}
                            className="px-2 py-0.5 bg-black text-white rounded text-xs font-bold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {queueMutation.isPending ? 'Processing...' : 'Complete'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {selectedEvent && (
            <div className={cardClass}>
              <h3 className="text-lg font-bold text-black mb-2">Appointment Details</h3>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-black">
                  <span className="font-bold">Patient:</span> {selectedEvent.patient?.firstName} {selectedEvent.patient?.lastName}
                </p>
                {!isDoctor && (
                  <p className="text-sm text-black">
                    <span className="font-bold">Doctor:</span> {selectedEvent.doctor?.firstName} {selectedEvent.doctor?.lastName}
                  </p>
                )}
                <p className="text-sm text-black">
                  <span className="font-bold">Date:</span> {new Date(selectedEvent.appointmentDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-black">
                  <span className="font-bold">Time:</span> {selectedEvent.appointmentTime}
                </p>
                <p className="text-sm text-black">
                  <span className="font-bold">Status:</span> <span className="capitalize">{selectedEvent.status.toLowerCase()}</span>
                </p>
                {selectedEvent.reason && (
                  <p className="text-sm text-black">
                    <span className="font-bold">Reason:</span> {selectedEvent.reason}
                  </p>
                )}
              </div>
              
              {(isAdmin || isDoctor) && selectedEvent.status !== 'CANCELLED' && selectedEvent.status !== 'COMPLETED' && (
                <div className="space-y-2 border-t border-gray-200 pt-3">
                  {isAdmin && (
                    <button
                      onClick={() =>
                        rescheduleMutation.mutate({
                          id: selectedEvent.id,
                          appointmentDate: formState.appointmentDate || selectedEvent.appointmentDate,
                          appointmentTime: formState.appointmentTime || selectedEvent.appointmentTime,
                        })
                      }
                      disabled={rescheduleMutation.isPending || (!formState.appointmentDate && !formState.appointmentTime)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md font-bold text-black hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {rescheduleMutation.isPending ? 'Rescheduling...' : 'Apply Form Slot'}
                    </button>
                  )}
                  {(isAdmin || isDoctor) && (
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to cancel this appointment?')) {
                          cancelMutation.mutate(selectedEvent.id)
                        }
                      }}
                      disabled={cancelMutation.isPending}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Appointment'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const combineDateTime = (date?: string | Date, time?: string) => {
  if (!date || !time) return undefined
  
  // Handle both string and Date objects
  let dateStr: string
  if (date instanceof Date) {
    // Convert Date to YYYY-MM-DD format
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    dateStr = `${year}-${month}-${day}`
  } else {
    dateStr = date
  }
  
  return new Date(`${dateStr}T${time}`)
}

const statusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return '#0f172a'
    case 'CANCELLED':
      return '#475569'
    case 'RESCHEDULED':
      return '#1f2937'
    default:
      return '#000000'
  }
}



