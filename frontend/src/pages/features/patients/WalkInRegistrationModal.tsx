import { useState, useMemo, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { patientsApi, appointmentsApi, roomsApi, doctorsApi, departmentsApi, invoicesApi } from '../../../services/api'
import toast from 'react-hot-toast'
import { RegistrationPrintReceipt } from './RegistrationPrintReceipt'

interface WalkInRegistrationModalProps {
  open: boolean
  onClose: () => void
}

const patientStates = [
  { label: 'In Appointment', value: 'IN_APPOINTMENT' },
  { label: 'Admitted', value: 'ADMITTED' },
]

export function WalkInRegistrationModal({ open, onClose }: WalkInRegistrationModalProps) {
  const queryClient = useQueryClient()
  const fieldClass =
    'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black text-black bg-white transition-colors'
  
  const labelClass = 'block text-sm font-bold text-black mb-1.5'
  const [showPrintReceipt, setShowPrintReceipt] = useState(false)
  const [registrationData, setRegistrationData] = useState<any>(null)
  const [patientType, setPatientType] = useState<'new' | 'old' | null>(null) // null = not selected yet
  const [existingPatient, setExistingPatient] = useState<any>(null)
  const [isSearchingPatient, setIsSearchingPatient] = useState(false)
  const [formState, setFormState] = useState({
    user: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      cnic: '',
    },
    patient: {
      gender: '',
      dateOfBirth: '',
      bloodGroup: '',
      allergies: '',
      medicalHistory: '',
      currentState: 'IN_APPOINTMENT',
      departmentId: '',
    },
    appointment: {
      enabled: true,
      specialization: '',
      concern: '',
      appointmentDate: '',
      appointmentTime: '',
      doctorId: '',
    },
    admission: {
      enabled: false,
      departmentId: '',
      roomId: '',
      bedId: '',
    },
    fees: {
      registrationFee: '500', // Default registration fee
      appointmentFee: '0',
      bedFee: '0',
    },
  })

  const { data: rooms } = useQuery({
    queryKey: ['rooms', 'available'],
    queryFn: () => roomsApi.getAll(),
    enabled: open,
  })

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getAll(),
    enabled: open,
  })

  const { data: allDoctors } = useQuery({
    queryKey: ['all-doctors'],
    queryFn: () => doctorsApi.getAll(),
    enabled: open,
  })

  // Get unique specializations from all doctors
  const availableSpecializations = useMemo(() => {
    if (!allDoctors) return []
    const specializations = allDoctors
      .map((doctor: any) => doctor.specialization)
      .filter((spec: string) => spec && spec.trim() !== '')
    return Array.from(new Set(specializations)).sort()
  }, [allDoctors])

  const availableRooms = useMemo(() => {
    let filtered = rooms?.filter((room: any) => room.status === 'AVAILABLE' || room.status === 'CLEANING')
    
    // Filter by department if selected in admission section
    if (formState.admission.departmentId) {
      filtered = filtered?.filter((room: any) => room.departmentId === formState.admission.departmentId)
    }
    
    return filtered
  }, [rooms, formState.admission.departmentId])

  const availableBeds = useMemo(() => {
    const room = availableRooms?.find((r: any) => r.id === formState.admission.roomId)
    return room?.beds?.filter((bed: any) => bed.status === 'AVAILABLE') ?? []
  }, [availableRooms, formState.admission.roomId])

  // Show beds section when department is selected OR appointment is booked
  const shouldShowBeds = formState.patient.departmentId || (formState.appointment.enabled && formState.appointment.doctorId)

  // Get doctors by specialization only (no date/time filter)
  const suggestedDoctors = useMemo(() => {
    if (!formState.appointment.specialization || !allDoctors) return []
    return allDoctors.filter((doctor: any) => 
      doctor.specialization?.toLowerCase() === formState.appointment.specialization.toLowerCase()
    )
  }, [formState.appointment.specialization, allDoctors])

  // Find selected doctor data
  const selectedDoctorData = useMemo(() => {
    if (!formState.appointment.doctorId || !allDoctors) return null
    return allDoctors.find((doctor: any) => doctor.userId === formState.appointment.doctorId)
  }, [formState.appointment.doctorId, allDoctors])

  // Fetch selected doctor's availability
  const { data: doctorAvailability } = useQuery({
    queryKey: ['doctor-availability', selectedDoctorData?.id],
    queryFn: () => doctorsApi.getAvailability(selectedDoctorData?.id || ''),
    enabled: !!selectedDoctorData?.id,
  })

  // Get appointments for selected doctor on selected date to check conflicts
  const { data: doctorAppointments } = useQuery({
    queryKey: ['doctor-appointments', formState.appointment.doctorId, formState.appointment.appointmentDate],
    queryFn: () => appointmentsApi.getAll(),
    enabled: !!formState.appointment.doctorId && !!formState.appointment.appointmentDate,
    select: (data) => {
      if (!formState.appointment.appointmentDate) return []
      const selectedDate = new Date(formState.appointment.appointmentDate)
      selectedDate.setHours(0, 0, 0, 0)
      
      return data.filter((apt: any) => {
        if (apt.doctorId !== formState.appointment.doctorId) return false
        const aptDate = new Date(apt.appointmentDate)
        aptDate.setHours(0, 0, 0, 0)
        return aptDate.getTime() === selectedDate.getTime() && 
               apt.status !== 'CANCELLED'
      })
    },
  })

  // Update appointment fee when doctor is selected
  useEffect(() => {
    if (formState.appointment.doctorId && selectedDoctorData) {
      const doctorFee = selectedDoctorData.appointmentFees ?? 0
      const feeString = doctorFee.toString()
      setFormState((prev) => {
        // Always update to ensure fee is current
        return {
          ...prev,
          fees: {
            ...prev.fees,
            appointmentFee: feeString,
          },
        }
      })
    } else if (!formState.appointment.doctorId) {
      setFormState((prev) => ({
        ...prev,
        fees: {
          ...prev.fees,
          appointmentFee: '0',
        },
      }))
    }
  }, [formState.appointment.doctorId, selectedDoctorData])

  // Generate available time slots for selected doctor on selected date
  const availableTimeSlots = useMemo(() => {
    if (!doctorAvailability || !formState.appointment.appointmentDate || !formState.appointment.doctorId) return []
    
    const selectedDate = new Date(formState.appointment.appointmentDate)
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
  }, [doctorAvailability, formState.appointment.appointmentDate, formState.appointment.doctorId, doctorAppointments])

  // Reset form when modal closes - MUST be with all hooks at top
  useEffect(() => {
    if (!open) {
      setPatientType(null)
      setExistingPatient(null)
      setShowPrintReceipt(false)
      setRegistrationData(null)
      setFormState({
        user: {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
          cnic: '',
        },
        patient: {
          gender: '',
          dateOfBirth: '',
          bloodGroup: '',
          allergies: '',
          medicalHistory: '',
          currentState: 'IN_APPOINTMENT',
          departmentId: '',
        },
        appointment: {
          enabled: true,
          specialization: '',
          concern: '',
          appointmentDate: '',
          appointmentTime: '',
          doctorId: '',
        },
        admission: {
          enabled: false,
          departmentId: '',
          roomId: '',
          bedId: '',
        },
        fees: {
          registrationFee: '500',
          appointmentFee: '0',
          bedFee: '0',
        },
      })
    }
  }, [open])

  // Function to search for existing patient
  const searchExistingPatient = async () => {
    if (!formState.user.email && !formState.user.phone) {
      toast.error('Please enter email or phone to search for existing patient')
      return
    }

    setIsSearchingPatient(true)
    try {
      // Search patients by email or phone
      const searchTerm = formState.user.email || formState.user.phone
      const patients = await patientsApi.getAll(searchTerm)
      
      // Find exact match by email or phone
      const found = patients?.find((p: any) => 
        p.user?.email?.toLowerCase() === formState.user.email?.toLowerCase() ||
        p.user?.phone === formState.user.phone
      )

      if (found) {
        setExistingPatient(found)
        // Pre-fill form with existing patient data
        setFormState(prev => ({
          ...prev,
          user: {
            ...prev.user,
            firstName: found.user?.firstName || prev.user.firstName,
            lastName: found.user?.lastName || prev.user.lastName,
            email: found.user?.email || prev.user.email,
            phone: found.user?.phone || prev.user.phone,
            cnic: found.user?.cnic || prev.user.cnic,
            password: '', // Don't fill password for old patients
          },
          patient: {
            ...prev.patient,
            gender: found.gender || prev.patient.gender,
            dateOfBirth: found.dateOfBirth ? new Date(found.dateOfBirth).toISOString().split('T')[0] : prev.patient.dateOfBirth,
            bloodGroup: found.bloodGroup || prev.patient.bloodGroup,
            allergies: found.allergies || prev.patient.allergies,
            medicalHistory: found.medicalHistory || prev.patient.medicalHistory,
            departmentId: found.departmentId || prev.patient.departmentId,
          },
        }))
        toast.success('Existing patient found! Form pre-filled with patient data.')
      } else {
        toast.error('No existing patient found with this email or phone. Please register as new patient.')
        setExistingPatient(null)
      }
    } catch (error: any) {
      console.error('Error searching patient:', error)
      toast.error('Error searching for patient. Please try again.')
      setExistingPatient(null)
    } finally {
      setIsSearchingPatient(false)
    }
  }

  const mutation = useMutation({
    mutationFn: async () => {
      // Validate required fields
      if (patientType === 'new' && !formState.user.password) {
        throw new Error('Password is required for new patients')
      }
      if (patientType === 'old' && !existingPatient) {
        throw new Error('Please search and select an existing patient first')
      }

      // For old patients, use existing patient ID, don't create new user
      if (patientType === 'old' && existingPatient) {
        // Update existing patient with new appointment/admission data
        const patientData: any = {
          gender: formState.patient.gender || existingPatient.gender || null,
          dateOfBirth: formState.patient.dateOfBirth ? new Date(formState.patient.dateOfBirth).toISOString() : existingPatient.dateOfBirth || null,
          bloodGroup: formState.patient.bloodGroup?.trim() || existingPatient.bloodGroup || null,
          allergies: formState.patient.allergies?.trim() || existingPatient.allergies || null,
          medicalHistory: formState.patient.medicalHistory?.trim() || existingPatient.medicalHistory || null,
          currentState: formState.patient.currentState || existingPatient.currentState || 'IN_APPOINTMENT',
          departmentId: formState.patient.departmentId || existingPatient.departmentId || null,
        }

        // Update patient data
        const updatedPatient = await patientsApi.update(existingPatient.id, patientData)
        
        // Update user data if needed
        if (formState.user.firstName || formState.user.lastName || formState.user.phone || formState.user.cnic) {
          // Note: User update would need to be done via users API, but for now we'll skip password
          // This could be enhanced later to update user info
        }

        let createdAppointment = null
        let appointmentDoctorId = null
        if (formState.appointment.enabled && formState.appointment.doctorId) {
          const notesParts = []
          if (formState.patient.medicalHistory) notesParts.push(`Medical History: ${formState.patient.medicalHistory}`)
          if (formState.patient.allergies) notesParts.push(`Allergies: ${formState.patient.allergies}`)
          if (formState.patient.bloodGroup) notesParts.push(`Blood Group: ${formState.patient.bloodGroup}`)
          if (formState.user.phone) notesParts.push(`Phone: ${formState.user.phone}`)
          if (formState.user.cnic) notesParts.push(`CNIC: ${formState.user.cnic}`)

          createdAppointment = await appointmentsApi.create({
            patientId: existingPatient.userId,
            doctorId: formState.appointment.doctorId,
            reason: formState.appointment.concern || formState.patient.medicalHistory || 'Walk-in appointment',
            appointmentDate: new Date(formState.appointment.appointmentDate),
            appointmentTime: formState.appointment.appointmentTime,
            notes: notesParts.length > 0 ? notesParts.join('\n') : 'Walk-in registration - Patient revisit.',
          })
          appointmentDoctorId = formState.appointment.doctorId
          queryClient.invalidateQueries({ queryKey: ['appointments'] })
        }

        let createdBedAssignment = null
        if (formState.admission.bedId && formState.admission.roomId) {
          const assignPayload: any = {
            roomId: formState.admission.roomId,
            bedId: formState.admission.bedId,
            patientId: existingPatient.id,
          }
          // Only include doctorId if it exists and is not empty
          if (appointmentDoctorId && appointmentDoctorId.trim() !== '') {
            assignPayload.doctorId = appointmentDoctorId
          }
          // Only include notes if medical history exists and is not empty
          if (formState.patient.medicalHistory && formState.patient.medicalHistory.trim() !== '') {
            assignPayload.notes = `Medical History: ${formState.patient.medicalHistory.trim()}`
          }
          try {
            createdBedAssignment = await roomsApi.assignBed(assignPayload)
          } catch (bedError: any) {
            console.error('Bed assignment error:', bedError)
            // Don't fail the entire registration if bed assignment fails
            toast.error(`Patient updated but bed assignment failed: ${bedError?.response?.data?.message || bedError?.message || 'Unknown error'}`)
          }
          queryClient.invalidateQueries({ queryKey: ['rooms'] })
          queryClient.invalidateQueries({ queryKey: ['rooms', 'available'] })
        }

        // Calculate fees for returning patient
        const registrationFee = parseFloat(formState.fees.registrationFee) || 0
        const appointmentFee = (formState.appointment.enabled && createdAppointment) ? (parseFloat(formState.fees.appointmentFee) || 0) : 0
        const bedFee = (formState.admission.bedId && createdBedAssignment) ? (parseFloat(formState.fees.bedFee) || 0) : 0
        const totalFee = registrationFee + appointmentFee + bedFee

        let createdInvoice = null
        if (totalFee > 0) {
          const invoiceItems = []
          
          if (appointmentFee > 0 && createdAppointment) {
            invoiceItems.push({
              description: 'Appointment Fee',
              quantity: 1,
              unitPrice: appointmentFee,
              total: appointmentFee,
            })
          }
          
          if (bedFee > 0 && createdBedAssignment) {
            invoiceItems.push({
              description: 'Bed/Admission Fee',
              quantity: 1,
              unitPrice: bedFee,
              total: bedFee,
            })
          }

          if (invoiceItems.length > 0) {
            createdInvoice = await invoicesApi.create({
              patientId: updatedPatient.id,
              items: invoiceItems,
              subtotal: totalFee,
              tax: 0,
              discount: 0,
              total: totalFee,
              status: 'PENDING', // Admin will mark as paid manually
              notes: `Registration invoice for returning patient ${updatedPatient.user.firstName} ${updatedPatient.user.lastName}`,
            })
            queryClient.invalidateQueries({ queryKey: ['invoices'] })
          }
        }

        // Store registration data for receipt
        const receiptData = {
          patient: updatedPatient,
          appointment: createdAppointment,
          bedAssignment: createdBedAssignment,
          invoice: createdInvoice,
          fees: {
            registrationFee: 0, // No registration fee for returning patients
            appointmentFee,
            bedFee,
            total: totalFee,
          },
          formData: formState,
          patientType: 'old',
          createdAt: new Date().toISOString(),
        }
        setRegistrationData(receiptData)

        // Save receipt to localStorage
        const savedReceipts = JSON.parse(localStorage.getItem('walkin_receipts') || '[]')
        savedReceipts.push(receiptData)
        localStorage.setItem('walkin_receipts', JSON.stringify(savedReceipts))

        return { patient: updatedPatient, appointment: createdAppointment, bedAssignment: createdBedAssignment, invoice: createdInvoice }
      }

      // For new patients, create new user and patient
      // Clean and prepare user data - convert empty strings to null/undefined
      const userData = {
        firstName: formState.user.firstName.trim(),
        lastName: formState.user.lastName.trim(),
        email: formState.user.email.trim(),
        password: formState.user.password, // Required for new patients
        phone: formState.user.phone?.trim() || null,
        cnic: formState.user.cnic?.trim() || null,
      }

      // Clean and prepare patient data
      const patientData: any = {
        gender: formState.patient.gender || null,
        dateOfBirth: formState.patient.dateOfBirth ? new Date(formState.patient.dateOfBirth).toISOString() : null,
        bloodGroup: formState.patient.bloodGroup?.trim() || null,
        allergies: formState.patient.allergies?.trim() || null,
        medicalHistory: formState.patient.medicalHistory?.trim() || null,
        currentState: formState.patient.currentState || 'IN_APPOINTMENT',
        departmentId: formState.patient.departmentId || null,
      }

      const payload = {
        user: userData,
        patient: patientData,
      }
      const createdPatient = await patientsApi.create(payload)

      let createdAppointment = null
      let appointmentDoctorId = null
      if (formState.appointment.enabled && formState.appointment.doctorId) {
        // Build comprehensive notes with all patient information for doctor portal
        const notesParts = []
        if (formState.patient.medicalHistory) {
          notesParts.push(`Medical History: ${formState.patient.medicalHistory}`)
        }
        if (formState.patient.allergies) {
          notesParts.push(`Allergies: ${formState.patient.allergies}`)
        }
        if (formState.patient.bloodGroup) {
          notesParts.push(`Blood Group: ${formState.patient.bloodGroup}`)
        }
        if (formState.user.phone) {
          notesParts.push(`Phone: ${formState.user.phone}`)
        }
        if (formState.user.cnic) {
          notesParts.push(`CNIC: ${formState.user.cnic}`)
        }
        if (formState.patient.dateOfBirth) {
          notesParts.push(`Date of Birth: ${formState.patient.dateOfBirth}`)
        }
        if (formState.patient.gender) {
          notesParts.push(`Gender: ${formState.patient.gender}`)
        }
        if (formState.patient.departmentId) {
          const dept = departments?.find((d: any) => d.id === formState.patient.departmentId)
          if (dept) {
            notesParts.push(`Department: ${dept.name}`)
          }
        }

        createdAppointment = await appointmentsApi.create({
          patientId: createdPatient.userId,
          doctorId: formState.appointment.doctorId,
          reason: formState.appointment.concern || formState.patient.medicalHistory || 'Walk-in appointment',
          appointmentDate: new Date(formState.appointment.appointmentDate),
          appointmentTime: formState.appointment.appointmentTime,
          notes: notesParts.length > 0 ? notesParts.join('\n') : 'Walk-in registration - All patient information available in patient profile.',
        })
        appointmentDoctorId = formState.appointment.doctorId
        // Invalidate appointments to refresh doctor portal
        queryClient.invalidateQueries({ queryKey: ['appointments'] })
      }

      // Allow bed assignment if bed is selected (whether admission checkbox is checked or not)
      // This allows booking beds when department/appointment is selected
      let createdBedAssignment = null
      if (formState.admission.bedId && formState.admission.roomId) {
        const assignPayload: any = {
          roomId: formState.admission.roomId,
          bedId: formState.admission.bedId,
          patientId: createdPatient.id,
        }
        // Only include doctorId if it exists and is not empty
        if (appointmentDoctorId && appointmentDoctorId.trim() !== '') {
          assignPayload.doctorId = appointmentDoctorId
        }
        // Only include notes if medical history exists and is not empty
        if (formState.patient.medicalHistory && formState.patient.medicalHistory.trim() !== '') {
          assignPayload.notes = `Medical History: ${formState.patient.medicalHistory.trim()}`
        }
        try {
          createdBedAssignment = await roomsApi.assignBed(assignPayload)
        } catch (bedError: any) {
          console.error('Bed assignment error:', bedError)
          // Don't fail the entire registration if bed assignment fails
          toast.error(`Patient created but bed assignment failed: ${bedError?.response?.data?.message || bedError?.message || 'Unknown error'}`)
        }
        // Invalidate rooms to refresh bed status
        queryClient.invalidateQueries({ queryKey: ['rooms'] })
        queryClient.invalidateQueries({ queryKey: ['rooms', 'available'] })
      }

      // Calculate total fees and create invoice
      const registrationFee = parseFloat(formState.fees.registrationFee) || 0
      const appointmentFee = (formState.appointment.enabled && createdAppointment) ? (parseFloat(formState.fees.appointmentFee) || 0) : 0
      const bedFee = (formState.admission.bedId && createdBedAssignment) ? (parseFloat(formState.fees.bedFee) || 0) : 0
      
      const totalFee = registrationFee + appointmentFee + bedFee

      let createdInvoice = null
      if (totalFee > 0) {
        const invoiceItems = []
        
        if (registrationFee > 0) {
          invoiceItems.push({
            description: 'Patient Registration Fee',
            quantity: 1,
            unitPrice: registrationFee,
            total: registrationFee,
          })
        }
        
        if (appointmentFee > 0 && createdAppointment) {
          invoiceItems.push({
            description: 'Appointment Fee',
            quantity: 1,
            unitPrice: appointmentFee,
            total: appointmentFee,
          })
        }
        
        if (bedFee > 0 && createdBedAssignment) {
          invoiceItems.push({
            description: 'Bed/Admission Fee',
            quantity: 1,
            unitPrice: bedFee,
            total: bedFee,
          })
        }

        createdInvoice = await invoicesApi.create({
          patientId: createdPatient.id,
          items: invoiceItems,
          subtotal: totalFee,
          tax: 0,
          discount: 0,
          total: totalFee,
          status: 'PENDING', // Admin will mark as paid manually
          notes: `Registration invoice for ${createdPatient.user.firstName} ${createdPatient.user.lastName}`,
        })
        
        // Invalidate invoices to refresh
        queryClient.invalidateQueries({ queryKey: ['invoices'] })
      }

      // Store registration data for print receipt
      const receiptData = {
        patient: createdPatient,
        appointment: createdAppointment,
        bedAssignment: createdBedAssignment,
        invoice: createdInvoice,
        fees: {
          registrationFee,
          appointmentFee,
          bedFee,
          total: totalFee,
        },
        formData: formState,
        patientType: patientType || 'new',
        createdAt: new Date().toISOString(),
      }
      setRegistrationData(receiptData)

      // Save receipt to localStorage
      const savedReceipts = JSON.parse(localStorage.getItem('walkin_receipts') || '[]')
      savedReceipts.push(receiptData)
      localStorage.setItem('walkin_receipts', JSON.stringify(savedReceipts))

      return { patient: createdPatient, appointment: createdAppointment, bedAssignment: createdBedAssignment, invoice: createdInvoice }
    },
    onSuccess: () => {
      toast.success('Walk-in patient registered successfully! Patient information sent to doctor portal.')
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      // Show print receipt modal
      setShowPrintReceipt(true)
    },
    onError: (error: any) => {
      console.error('Registration error:', error)
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Unable to create patient'
      toast.error(errorMessage)
    },
  })

  const updateForm = (
    section: 'user' | 'patient' | 'appointment' | 'admission' | 'fees',
    key: string,
    value: any,
  ) => {
    setFormState((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }))
  }

  // Early return - MUST be after all hooks
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h2 className="text-2xl font-bold text-black">Walk-in Registration</h2>
            <p className="text-sm text-gray-500">
              Capture patient details, schedule an appointment, and assign resources.
            </p>
          </div>
          <button onClick={onClose} className="text-black font-bold hover:text-gray-700">
            ✕
          </button>
        </div>

        {/* Patient Type Selection - Show only if not selected */}
        {patientType === null && (
          <div className="p-6">
            <h3 className="text-lg font-bold text-black mb-4">Patient Type</h3>
            <p className="text-sm text-gray-600 mb-6">Is this a new patient or returning patient?</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPatientType('new')}
                className="px-6 py-4 bg-white text-black rounded-lg font-bold hover:shadow-lg transition-all text-center shadow-md"
              >
                <div>New Patient</div>
                <div className="text-xs text-gray-600 mt-1">First time registration</div>
              </button>
              <button
                type="button"
                onClick={() => setPatientType('old')}
                className="px-6 py-4 bg-white text-black rounded-lg font-bold hover:shadow-lg transition-all text-center shadow-md"
              >
                <div>Returning Patient</div>
                <div className="text-xs text-gray-600 mt-1">Already registered in system</div>
              </button>
            </div>
          </div>
        )}

        {/* Registration Form - Show only if patient type is selected */}
        {patientType !== null && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              mutation.mutate()
            }}
            className="p-6 space-y-6"
          >
            {/* For old patients, show search fields first */}
            {patientType === 'old' && !existingPatient && (
              <section className="space-y-4 bg-yellow-50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-black">Search Existing Patient</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Enter patient email or phone number to search for existing records
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="email"
                    placeholder="Email"
                    className={fieldClass}
                    value={formState.user.email}
                    onChange={(e) => updateForm('user', 'email', e.target.value)}
                    autoComplete="email"
                  />
                  <input
                    placeholder="Phone"
                    className={fieldClass}
                    value={formState.user.phone}
                    onChange={(e) => updateForm('user', 'phone', e.target.value)}
                    autoComplete="tel"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={searchExistingPatient}
                    disabled={isSearchingPatient || (!formState.user.email && !formState.user.phone)}
                    className="px-4 py-2 bg-black text-white rounded-md font-bold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSearchingPatient ? 'Searching...' : 'Search Patient'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPatientType(null)
                      setExistingPatient(null)
                    }}
                    className="px-4 py-2 bg-black text-white rounded-md font-bold hover:bg-gray-900"
                  >
                    Back
                  </button>
                </div>
              </section>
            )}

            {/* Show success message when old patient found */}
            {patientType === 'old' && existingPatient && (
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-green-800 font-bold">
                  ✓ Existing patient found: {existingPatient.user?.firstName} {existingPatient.user?.lastName}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Patient data has been pre-filled. You can update information if needed. Password is not required for returning patients.
                </p>
              </div>
            )}

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-black">Patient Information</h3>
              {patientType === 'old' && (
                <button
                  type="button"
                  onClick={() => {
                    setPatientType(null)
                    setExistingPatient(null)
                    setFormState(prev => ({ ...prev, user: { ...prev.user, email: '', phone: '', password: '' } }))
                  }}
                  className="text-sm text-black underline hover:text-gray-700"
                >
                  Change Patient Type
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                required
                placeholder="First Name"
                className={fieldClass}
                value={formState.user.firstName}
                onChange={(e) => updateForm('user', 'firstName', e.target.value)}
                autoComplete="given-name"
                disabled={!!existingPatient}
              />
              <input
                required
                placeholder="Last Name"
                className={fieldClass}
                value={formState.user.lastName}
                onChange={(e) => updateForm('user', 'lastName', e.target.value)}
                autoComplete="family-name"
                disabled={!!existingPatient}
              />
              <input
                required
                type="email"
                placeholder="Email"
                className={fieldClass}
                value={formState.user.email}
                onChange={(e) => updateForm('user', 'email', e.target.value)}
                autoComplete="email"
                disabled={!!existingPatient}
              />
              <input
                placeholder="Phone"
                className={fieldClass}
                value={formState.user.phone}
                onChange={(e) => updateForm('user', 'phone', e.target.value)}
                autoComplete="tel"
                disabled={!!existingPatient}
              />
              <input
                placeholder="CNIC"
                className={fieldClass}
                value={formState.user.cnic}
                onChange={(e) => updateForm('user', 'cnic', e.target.value)}
                autoComplete="off"
              />
              {/* Password field - Only for new patients */}
              {patientType === 'new' && (
                <input
                  required
                  type="password"
                  placeholder="Temporary Password"
                  className={fieldClass}
                  value={formState.user.password}
                  onChange={(e) => updateForm('user', 'password', e.target.value)}
                  autoComplete="new-password"
                />
              )}
              <select
                className={fieldClass}
                value={formState.patient.gender}
                onChange={(e) => updateForm('patient', 'gender', e.target.value)}
                disabled={false}
                autoComplete="sex"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="date"
                className={fieldClass}
                value={formState.patient.dateOfBirth}
                onChange={(e) => updateForm('patient', 'dateOfBirth', e.target.value)}
                autoComplete="bday"
                disabled={false}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                className={fieldClass}
                value={formState.patient.departmentId}
                onChange={(e) => updateForm('patient', 'departmentId', e.target.value)}
                disabled={false}
                autoComplete="off"
              >
                <option value="">Checkup by Department (Optional)</option>
                {departments?.map((dept: any) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Medical History"
                className={`${fieldClass} min-h-[80px]`}
                value={formState.patient.medicalHistory}
                onChange={(e) => updateForm('patient', 'medicalHistory', e.target.value)}
                autoComplete="off"
                disabled={false}
              />
            </div>
          </section>

          <section className="space-y-4 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-black">Appointment</h3>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.appointment.enabled}
                  onChange={(e) => updateForm('appointment', 'enabled', e.target.checked)}
                  className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black focus:ring-2 cursor-pointer"
                />
                <span className="ml-2 text-sm font-bold text-black">Schedule appointment</span>
              </label>
            </div>

            {formState.appointment.enabled && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Concern / Reason</label>
                    <input
                      placeholder="Enter reason for appointment..."
                      className={fieldClass}
                      value={formState.appointment.concern}
                      onChange={(e) => updateForm('appointment', 'concern', e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Specialization</label>
                    <select
                      className={fieldClass}
                      value={formState.appointment.specialization}
                      onChange={(e) => {
                        updateForm('appointment', 'specialization', e.target.value)
                        updateForm('appointment', 'doctorId', '')
                        updateForm('appointment', 'appointmentTime', '')
                      }}
                      autoComplete="off"
                    >
                      <option value="">Select Specialization</option>
                      {availableSpecializations.map((spec: string) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Select Doctor</label>
                  <select
                    className={fieldClass}
                    disabled={!formState.appointment.specialization || suggestedDoctors.length === 0}
                    value={formState.appointment.doctorId}
                    onChange={(e) => {
                      updateForm('appointment', 'doctorId', e.target.value)
                      updateForm('appointment', 'appointmentTime', '')
                    }}
                    autoComplete="off"
                  >
                    <option value="">
                      {!formState.appointment.specialization
                        ? 'Please select specialization first'
                        : suggestedDoctors.length === 0
                        ? 'No doctors found for this specialization'
                        : 'Select Doctor'}
                    </option>
                    {suggestedDoctors.length > 0 && suggestedDoctors.map((doctor: any) => (
                      <option key={doctor.userId} value={doctor.userId}>
                        Dr. {doctor.user?.firstName} {doctor.user?.lastName} - {doctor.specialization || 'N/A'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Appointment Date</label>
                  <input
                    type="date"
                    className={fieldClass}
                    value={formState.appointment.appointmentDate}
                    onChange={(e) => {
                      updateForm('appointment', 'appointmentDate', e.target.value)
                      updateForm('appointment', 'appointmentTime', '')
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    disabled={!formState.appointment.doctorId}
                    autoComplete="off"
                  />
                </div>
                {formState.appointment.doctorId && formState.appointment.appointmentDate && availableTimeSlots.length > 0 && (
                  <div>
                    <label className={labelClass}>Available Time Slots</label>
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-md">
                      {availableTimeSlots.map((slot: string) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => updateForm('appointment', 'appointmentTime', slot)}
                          className={`px-3 py-2 text-sm font-bold rounded-md transition-all ${
                            formState.appointment.appointmentTime === slot
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
                {formState.appointment.doctorId && formState.appointment.appointmentDate && availableTimeSlots.length === 0 && (
                  <div>
                    <p className="text-sm text-gray-600">No available time slots for this doctor on selected date</p>
                  </div>
                )}
              </div>
            )}
          </section>
          <section className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-black">Admission</h3>
              <label className="flex items-center text-sm text-black cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.admission.enabled}
                  onChange={(e) => updateForm('admission', 'enabled', e.target.checked)}
                  className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black focus:ring-2 cursor-pointer mr-2"
                />
                Assign bed immediately
              </label>
            </div>

            {/* Show beds when department is selected OR appointment is booked */}
            {(shouldShowBeds || formState.admission.enabled) && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-3 font-semibold">
                  {shouldShowBeds && !formState.admission.enabled 
                    ? 'Available beds for booking:' 
                    : 'Select room and bed for admission:'}
                </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Select Department</label>
                    <select
                      className={fieldClass}
                      value={formState.admission.departmentId}
                      onChange={(e) => {
                        updateForm('admission', 'departmentId', e.target.value)
                        updateForm('admission', 'roomId', '')
                        updateForm('admission', 'bedId', '')
                      }}
                    >
                      <option value="">All Departments</option>
                      {departments?.map((dept: any) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Select Room</label>
                <select
                  className={fieldClass}
                  value={formState.admission.roomId}
                  onChange={(e) => {
                    updateForm('admission', 'roomId', e.target.value)
                    updateForm('admission', 'bedId', '')
                  }}
                >
                  <option value="">Select Room</option>
                  {availableRooms?.map((room: any) => (
                    <option key={room.id} value={room.id}>
                          {room.name || `Room ${room.roomNumber}`}{room.type ? ` · ${room.type}` : ''}
                    </option>
                  ))}
                </select>
                    {formState.admission.departmentId && (!availableRooms || availableRooms.length === 0) && (
                      <p className="text-xs text-gray-500 mt-1">No available rooms in this department</p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Select Bed</label>
                <select
                  className={fieldClass}
                  value={formState.admission.bedId}
                  onChange={(e) => updateForm('admission', 'bedId', e.target.value)}
                      disabled={!formState.admission.roomId}
                >
                  <option value="">Select Bed</option>
                  {availableBeds.map((bed: any) => (
                    <option key={bed.id} value={bed.id}>
                          Bed {bed.label} - Available
                    </option>
                  ))}
                </select>
                    {formState.admission.roomId && availableBeds.length === 0 && (
                      <p className="text-xs text-red-600 mt-1">No available beds in this room</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Fees Section */}
          <section className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-lg font-bold text-black mb-4">Registration Fees</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Registration Fee (PKR) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={fieldClass}
                  value={formState.fees.registrationFee}
                  onChange={(e) => updateForm('fees', 'registrationFee', e.target.value)}
                  required
                />
              </div>
              {formState.appointment.enabled && (
                <div>
                  <label className={labelClass}>Appointment Fee (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`${fieldClass} disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    value={formState.appointment.doctorId && selectedDoctorData ? (selectedDoctorData.appointmentFees ?? 0) : formState.fees.appointmentFee}
                    readOnly
                    disabled={true}
                    title={formState.appointment.doctorId ? `Fee is set automatically based on selected doctor (Dr. ${selectedDoctorData?.user?.firstName} ${selectedDoctorData?.user?.lastName})` : "Select a doctor to see appointment fee"}
                  />
                </div>
              )}
              {(formState.admission.bedId || formState.admission.enabled) && (
                <div>
                  <label className={labelClass}>Bed/Admission Fee (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={fieldClass}
                    value={formState.fees.bedFee}
                    onChange={(e) => updateForm('fees', 'bedFee', e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="mt-4 p-3 bg-white rounded border border-blue-300">
              <div className="flex justify-between items-center">
                <span className="font-bold text-black">Total Fee:</span>
                <span className="text-xl font-extrabold text-black">
                  PKR {(
                    (parseFloat(formState.fees.registrationFee) || 0) +
                    (formState.appointment.enabled ? (parseFloat(formState.fees.appointmentFee) || 0) : 0) +
                    ((formState.admission.bedId || formState.admission.enabled) ? (parseFloat(formState.fees.bedFee) || 0) : 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </section>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-black text-white rounded-md font-bold hover:bg-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || (patientType === 'new' && !formState.user.password) || (patientType === 'old' && !existingPatient)}
              className="px-4 py-2 bg-black text-white rounded-md font-bold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? 'Saving...' : patientType === 'old' ? 'Update & Register' : 'Register'}
            </button>
          </div>
        </form>
        )}
      </div>

      {/* Print Receipt Modal */}
      {showPrintReceipt && registrationData && (
        <RegistrationPrintReceipt
          registrationData={registrationData}
          onClose={() => {
            // Receipt is already saved to localStorage, just close modal
            setShowPrintReceipt(false)
            setRegistrationData(null)
            // Reset form and close registration modal
            setPatientType(null)
            setExistingPatient(null)
            setFormState({
              user: {
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                password: '',
                cnic: '',
              },
              patient: {
                gender: '',
                dateOfBirth: '',
                bloodGroup: '',
                allergies: '',
                medicalHistory: '',
                currentState: 'IN_APPOINTMENT',
                departmentId: '',
              },
              appointment: {
                enabled: true,
                specialization: '',
                concern: '',
                appointmentDate: '',
                appointmentTime: '',
                doctorId: '',
              },
              admission: {
                enabled: false,
                departmentId: '',
                roomId: '',
                bedId: '',
              },
            })
            onClose()
          }}
        />
      )}
    </div>
  )
}

const combineDateTime = (date?: string, time?: string) => {
  if (!date || !time) return undefined
  return new Date(`${date}T${time}`).toISOString()
}
