import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { doctorsApi, usersApi, departmentsApi } from '../../../../services/api'
import toast from 'react-hot-toast'
import {
  UserCog,
  Search,
  Mail,
  Phone,
  Stethoscope,
  Building,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  X,
  Save,
  Settings,
  CreditCard,
  Upload,
  FileText,
  Calendar,
  Clock,
  Briefcase,
  Award,
  Filter,
  User,
} from 'lucide-react'
import { DoctorDutyRoster } from './doctors/DoctorDutyRoster'
import { DoctorAssignedPatients } from './doctors/DoctorAssignedPatients'
import { DoctorPerformanceChart } from './doctors/DoctorPerformanceChart'
import { DoctorInlineEdit } from './doctors/DoctorInlineEdit'
import { RelationViewer } from '../../../../components/RelationViewer'
import { AdminUserSettingsView } from './AdminUserSettingsView'

export default function DoctorsManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState<string>('')
  const [filterSpecialization, setFilterSpecialization] = useState<string>('')
  const [filterAvailability, setFilterAvailability] = useState<string>('')
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showWorkloadModal, setShowWorkloadModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [selectedSettingsDoctor, setSelectedSettingsDoctor] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})
  const [refreshKey, setRefreshKey] = useState(0)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [availabilityTiming, setAvailabilityTiming] = useState({ startTime: '09:00', endTime: '17:00' })
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [initialAvailabilityTiming, setInitialAvailabilityTiming] = useState({ startTime: '09:00', endTime: '17:00' })
  const [initialSelectedDays, setInitialSelectedDays] = useState<number[]>([])
  const [cvFile, setCvFile] = useState<{ name: string; data: string; type: string } | null>(null)
  const [licenseImage, setLicenseImage] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ]

  // Listen for profile image updates
  useEffect(() => {
    const handleProfileImageUpdate = () => {
      setRefreshKey(prev => prev + 1)
    }
    window.addEventListener('profileImageUpdated', handleProfileImageUpdate)
    return () => {
      window.removeEventListener('profileImageUpdated', handleProfileImageUpdate)
    }
  }, [])

  const { data: doctors, isLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorsApi.getAll(),
  })

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getAll(),
  })

  const { data: doctorDetail } = useQuery({
    queryKey: ['doctor', selectedDoctor?.id],
    queryFn: () => doctorsApi.getById(selectedDoctor?.id),
    enabled: !!selectedDoctor?.id && (showViewModal || showEditModal),
  })

  const { data: doctorWorkload } = useQuery({
    queryKey: ['doctor-workload', selectedDoctor?.id],
    queryFn: () => doctorsApi.getWorkload(selectedDoctor?.id),
    enabled: !!selectedDoctor?.id && showWorkloadModal,
  })

  const { data: doctorAvailability } = useQuery({
    queryKey: ['doctor-availability', selectedDoctor?.id],
    queryFn: () => doctorsApi.getAvailability(selectedDoctor?.id),
    enabled: !!selectedDoctor?.id && showEditModal,
  })

  const updateAvailabilityMutation = useMutation({
    mutationFn: (data: { doctorId: string; availability: any[] }) => 
      doctorsApi.updateAvailabilityByAdmin(data.doctorId, data.availability),
  })


  const createMutation = useMutation({
    mutationFn: (data: any) => usersApi.create({ ...data, role: 'DOCTOR' }),
    onSuccess: (data: any) => {
      // Save profile image, CV, and license to localStorage after user creation
      const userId = data?.id
      if (userId) {
        if (imagePreview) {
          localStorage.setItem(`profileImage_${userId}`, imagePreview)
          window.dispatchEvent(new Event('profileImageUpdated'))
        }
        if (cvFile) {
          localStorage.setItem(`doctorCV_${userId}`, JSON.stringify(cvFile))
        }
        if (licenseImage) {
          localStorage.setItem(`doctorLicense_${userId}`, licenseImage)
        }
        
        // Save availability schedule if days are selected
        if (selectedDays.length > 0) {
          const availabilityArray = selectedDays.map((dayValue) => ({
            dayOfWeek: dayValue,
            startTime: availabilityTiming.startTime,
            endTime: availabilityTiming.endTime,
            isAvailable: true,
          }))
          
          // We need to get the doctor ID from the created user
          // Since we just created a user, we need to fetch the doctor profile
          setTimeout(() => {
            doctorsApi.getAll().then((doctors: any) => {
              const newDoctor = doctors.find((d: any) => d.userId === userId)
              if (newDoctor && newDoctor.id) {
                // Update availability for the new doctor
                doctorsApi.updateAvailability(availabilityArray).then(() => {
                  queryClient.invalidateQueries({ queryKey: ['doctors'] })
                }).catch((err) => {
                  console.error('Failed to save availability:', err)
                })
              }
            })
          }, 1000)
        }
      }
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      setShowAddModal(false)
      setFormData({})
      setImagePreview(null)
      setCvFile(null)
      setLicenseImage(null)
      setSelectedDays([])
      setAvailabilityTiming({ startTime: '09:00', endTime: '17:00' })
      toast.success('Doctor added successfully')
    },
    onError: (error: any) => {
      console.error('Error adding doctor:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to add doctor'
      toast.error(errorMessage)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => doctorsApi.update(selectedDoctor?.id, data),
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update doctor')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      toast.success('Doctor deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete doctor')
    },
  })

  // Get unique departments and specializations for filters
  const uniqueDepartments = Array.from(
    new Set(doctors?.map((d: any) => d.department).filter(Boolean) || [])
  ).sort()

  const uniqueSpecializations = Array.from(
    new Set(doctors?.map((d: any) => d.specialization).filter(Boolean) || [])
  ).sort()

  // Helper function to check if a doctor is currently on shift
  const isDoctorOnShift = (doctor: any) => {
    if (!doctor.availability || doctor.availability.length === 0) {
      return false
    }

    const now = new Date()
    const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    const previousDay = currentDay === 0 ? 6 : currentDay - 1 // 6 = Saturday, previous day for Sunday
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    // Check if doctor has availability that matches current day/time
    return doctor.availability.some((avail: any) => {
      if (!avail.isAvailable) return false

      const startTime = avail.startTime // HH:mm format (e.g., "21:00")
      const endTime = avail.endTime     // HH:mm format (e.g., "05:00")
      const availDay = avail.dayOfWeek

      // Handle overnight shifts (when endTime < startTime, e.g., 9 PM to 5 AM)
      if (endTime < startTime) {
        // Overnight shift spans two days
        if (availDay === currentDay) {
          // Checking today's shift: we're in the first part (e.g., Monday 9 PM - midnight)
          return currentTime >= startTime
        } else if (availDay === previousDay) {
          // Checking previous day's shift: we're in the second part (e.g., Monday 2 AM from Sunday 9 PM shift)
          return currentTime <= endTime
        }
        return false
      } else {
        // Same-day shift: only check if it's for today
        if (availDay === currentDay) {
          return currentTime >= startTime && currentTime <= endTime
        }
        return false
      }
    })
  }

  const filteredDoctors = doctors?.filter((doctor: any) => {
    // Search filter
    const matchesSearch =
      !searchTerm ||
      doctor.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase())

    // Department filter
    const matchesDepartment = !filterDepartment || doctor.department === filterDepartment

    // Specialization filter
    const matchesSpecialization = !filterSpecialization || doctor.specialization === filterSpecialization

    // Availability filter - check if doctor is currently on shift
    let matchesAvailability = true
    if (filterAvailability === 'available') {
      matchesAvailability = isDoctorOnShift(doctor)
    } else if (filterAvailability === 'unavailable') {
      matchesAvailability = !isDoctorOnShift(doctor)
    }

    return matchesSearch && matchesDepartment && matchesSpecialization && matchesAvailability
  })

  const handleAdd = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      cnic: '',
      dateOfBirth: '',
      gender: '',
      specialization: '',
      department: '',
      licenseNumber: '',
    })
    setImagePreview(null)
    setCvFile(null)
    setLicenseImage(null)
    setSelectedDays([])
    setAvailabilityTiming({ startTime: '09:00', endTime: '17:00' })
    setShowAddModal(true)
  }

  const handleEdit = (doctor: any) => {
    setSelectedDoctor(doctor)
    setShowEditModal(true)
  }

  // Update form data when doctor detail loads
  useEffect(() => {
    if (doctorDetail && showEditModal) {
      setFormData({
        firstName: doctorDetail.user?.firstName ?? '',
        lastName: doctorDetail.user?.lastName ?? '',
        email: doctorDetail.user?.email ?? '',
        phone: doctorDetail.user?.phone ?? '',
        cnic: doctorDetail.user?.cnic ?? '',
        dateOfBirth: doctorDetail.user?.dateOfBirth 
          ? new Date(doctorDetail.user.dateOfBirth).toISOString().split('T')[0]
          : '',
        gender: doctorDetail.user?.gender ?? '',
        specialization: doctorDetail.specialization ?? '',
        department: doctorDetail.department ?? '',
        licenseNumber: doctorDetail.licenseNumber ?? '',
        bio: doctorDetail.bio ?? '',
        appointmentFees: doctorDetail.appointmentFees ?? 0,
        salary: doctorDetail.salary ?? 0,
      })
      // Load CV and license if exists
      if (doctorDetail.cvData) {
        setCvFile({
          name: doctorDetail.cvFileName || 'CV',
          data: doctorDetail.cvData,
          type: doctorDetail.cvFileType || 'application/pdf',
        })
      } else {
        setCvFile(null)
      }
      if (doctorDetail.licenseImage) {
        setLicenseImage(doctorDetail.licenseImage)
      } else {
        setLicenseImage(null)
      }
    }
  }, [doctorDetail, showEditModal])

  // Update availability state when doctor availability loads
  useEffect(() => {
    if (doctorAvailability && doctorAvailability.length > 0) {
      const firstAvail = doctorAvailability[0]
      if (firstAvail) {
        const timing = {
          startTime: firstAvail.startTime || '09:00',
          endTime: firstAvail.endTime || '17:00',
        }
        setAvailabilityTiming(timing)
        setInitialAvailabilityTiming(timing)
      }
      const days = doctorAvailability.map((a: any) => a.dayOfWeek)
      setSelectedDays(days)
      setInitialSelectedDays(days)
    } else {
      setSelectedDays([])
      setInitialSelectedDays([])
      setAvailabilityTiming({ startTime: '09:00', endTime: '17:00' })
      setInitialAvailabilityTiming({ startTime: '09:00', endTime: '17:00' })
    }
  }, [doctorAvailability])

  const handleDayToggle = (dayValue: number) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayValue)) {
        return prev.filter((d) => d !== dayValue)
      } else {
        return [...prev, dayValue]
      }
    })
  }

  const handleCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('CV file size should be less than 10MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setCvFile({
        name: file.name,
        data: base64String,
        type: file.type,
      })
      toast.success('CV uploaded successfully')
    }
    reader.readAsDataURL(file)
  }

  const handleLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('License image size should be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setLicenseImage(base64String)
      toast.success('License photo uploaded successfully')
    }
    reader.readAsDataURL(file)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setImagePreview(base64String)
      toast.success('Profile picture uploaded successfully')
    }
    reader.readAsDataURL(file)
  }

  const handleView = (doctor: any) => {
    setSelectedDoctor(doctor)
    setShowViewModal(true)
  }

  const handleWorkload = (doctor: any) => {
    setSelectedDoctor(doctor)
    setShowWorkloadModal(true)
  }

  const handleViewSettings = (doctor: any) => {
    setSelectedSettingsDoctor(doctor)
    setShowSettingsModal(true)
  }

  const handleDelete = (doctor: any) => {
    if (window.confirm(`Are you sure you want to delete Dr. ${doctor.user?.firstName} ${doctor.user?.lastName}?`)) {
      deleteMutation.mutate(doctor.user?.id)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (showAddModal) {
      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password) {
        toast.error('Please fill in all required fields')
        return
      }
      
      // Prepare data for doctor creation
      const doctorData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        password: formData.password,
        cnic: formData.cnic?.trim() || null,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
        gender: formData.gender || null,
        specialization: formData.specialization?.trim() || null,
        department: formData.department?.trim() || null,
        licenseNumber: formData.licenseNumber?.trim() || null,
      }
      createMutation.mutate(doctorData)
    } else if (showEditModal) {
      // Prepare update data
      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || null,
        cnic: formData.cnic || null,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
        gender: formData.gender || null,
        specialization: formData.specialization || null,
        department: formData.department || null,
        licenseNumber: formData.licenseNumber || null,
        bio: formData.bio || null,
        appointmentFees: formData.appointmentFees !== undefined ? formData.appointmentFees : null,
        salary: formData.salary !== undefined ? formData.salary : null,
      }

      // Add CV and license if uploaded
      if (cvFile) {
        updateData.cvData = cvFile.data
        updateData.cvFileName = cvFile.name
        updateData.cvFileType = cvFile.type
      }

      if (licenseImage) {
        updateData.licenseImage = licenseImage
      }

      // Check if availability has changed
      const availabilityChanged = 
        selectedDays.length !== initialSelectedDays.length ||
        selectedDays.some(day => !initialSelectedDays.includes(day)) ||
        initialSelectedDays.some(day => !selectedDays.includes(day)) ||
        availabilityTiming.startTime !== initialAvailabilityTiming.startTime ||
        availabilityTiming.endTime !== initialAvailabilityTiming.endTime

      // Update doctor profile
      updateMutation.mutate(updateData, {
        onSuccess: () => {
          // Only update availability if it has changed and days are selected
          if (availabilityChanged && selectedDays.length > 0) {
            const availabilityArray = selectedDays.map((dayValue) => ({
              dayOfWeek: dayValue,
              startTime: availabilityTiming.startTime,
              endTime: availabilityTiming.endTime,
              isAvailable: true,
            }))

            // Use doctorDetail.id if available, otherwise selectedDoctor.id
            const doctorIdToUpdate = doctorDetail?.id || selectedDoctor?.id

            if (!doctorIdToUpdate) {
              toast.error('Doctor ID not found. Cannot update availability.')
              return
            }

            updateAvailabilityMutation.mutate(
              { doctorId: doctorIdToUpdate, availability: availabilityArray },
              {
                onSuccess: () => {
                  queryClient.invalidateQueries({ queryKey: ['doctors'] })
                  queryClient.invalidateQueries({ queryKey: ['doctor', selectedDoctor?.id] })
                  queryClient.invalidateQueries({ queryKey: ['doctor-availability', selectedDoctor?.id] })
                  setShowEditModal(false)
                  setSelectedDoctor(null)
                  setFormData({})
                  setCvFile(null)
                  setLicenseImage(null)
                  toast.success('Doctor profile and availability updated successfully')
                },
                onError: (error: any) => {
                  console.error('Availability update error:', error)
                  console.error('Error details:', error?.response?.data)
                  toast.error(error?.response?.data?.message || 'Profile updated but failed to update availability. Please check console for details.')
                  // Still invalidate queries and close modal
                  queryClient.invalidateQueries({ queryKey: ['doctors'] })
                  queryClient.invalidateQueries({ queryKey: ['doctor', selectedDoctor?.id] })
                  queryClient.invalidateQueries({ queryKey: ['doctor-availability', selectedDoctor?.id] })
                }
              }
            )
          } else if (availabilityChanged && selectedDays.length === 0) {
            // Time changed but no days selected - show warning
            toast.error('Please select at least one day to update availability time')
            queryClient.invalidateQueries({ queryKey: ['doctors'] })
            queryClient.invalidateQueries({ queryKey: ['doctor', selectedDoctor?.id] })
          } else {
            // Availability not changed, just update profile
            queryClient.invalidateQueries({ queryKey: ['doctors'] })
            queryClient.invalidateQueries({ queryKey: ['doctor', selectedDoctor?.id] })
            setShowEditModal(false)
            setSelectedDoctor(null)
            setFormData({})
            setCvFile(null)
            setLicenseImage(null)
            toast.success('Doctor profile updated successfully')
          }
        },
        onError: (error: any) => {
          console.error('Profile update error:', error)
          toast.error(error?.response?.data?.message || 'Failed to update doctor profile')
        }
      })
    }
  }


  if (isLoading) {
    return (
      <div className="pl-6 pr-8 pt-6 pb-6">
        <p className="text-black font-bold">Loading doctors...</p>
      </div>
    )
  }

  return (
    <div className="pl-6 pr-8 pt-6 pb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-black">Doctors Management</h1>
          <p className="text-black mt-2 font-bold">Manage all doctors in the hospital</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-900 transition-colors flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" /> Add Doctor
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search doctors by name, email, or specialization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-black focus:border-black"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-black" />
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black text-sm font-bold text-black opacity-60"
          >
            <option value="">All Departments</option>
            {uniqueDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <select
            value={filterSpecialization}
            onChange={(e) => setFilterSpecialization(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black text-sm font-bold text-black opacity-60"
          >
            <option value="">All Specializations</option>
            {uniqueSpecializations.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
          <select
            value={filterAvailability}
            onChange={(e) => setFilterAvailability(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black text-sm font-bold text-black opacity-60"
          >
            <option value="">All</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
      </div>

      {/* Doctors Grid */}
      {filteredDoctors && filteredDoctors.length > 0 ? (
        <div className="grid grid-cols-4 gap-6" key={refreshKey}>
          {filteredDoctors.map((doctor: any) => {
            // Get profile photo from localStorage
            const profileImage = doctor.user?.id 
              ? localStorage.getItem(`profileImage_${doctor.user.id}`)
              : null;
            
            return (
            <div
              key={doctor.id}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col items-center text-center mb-4">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={`${doctor.user?.firstName} ${doctor.user?.lastName}`}
                    className="h-16 w-16 rounded-full object-cover mb-3 shadow-lg"
                  />
                ) : (
                  <div className="bg-black rounded-full p-4 mb-3">
                    <UserCog className="h-8 w-8 text-white" />
                  </div>
                )}
                <h3 className="text-lg font-bold text-black mb-3">
                  Dr. {doctor.user?.firstName} {doctor.user?.lastName}
                </h3>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-black">
                  <Stethoscope className="h-4 w-4 mr-2 text-black flex-shrink-0" />
                  <span className="text-sm font-bold truncate">{doctor.specialization || 'N/A'}</span>
                </div>
                {doctor.user?.cnic && (
                  <div className="flex items-center text-black">
                    <CreditCard className="h-4 w-4 mr-2 text-black flex-shrink-0" />
                    <span className="text-sm font-bold truncate">{doctor.user.cnic}</span>
                  </div>
                )}
                <div className="flex items-center text-black">
                  <Building className="h-4 w-4 mr-2 text-black flex-shrink-0" />
                  <span className="text-sm font-bold truncate">{doctor.department || 'N/A'}</span>
                </div>
                <div className="flex items-center text-black">
                  <Mail className="h-4 w-4 mr-2 text-black flex-shrink-0" />
                  <span className="text-sm font-bold truncate">{doctor.user?.email}</span>
                </div>
                {doctor.user?.phone && (
                  <div className="flex items-center text-black">
                    <Phone className="h-4 w-4 mr-2 text-black flex-shrink-0" />
                    <span className="text-sm font-bold truncate">{doctor.user.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleViewSettings(doctor)}
                  className="text-black hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                  title="View Settings"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleWorkload(doctor)}
                  className="text-black hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                  title="View Workload"
                >
                  <BarChart3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleEdit(doctor)}
                  className="text-black hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(doctor)}
                  className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-xl p-12">
          <div className="text-center">
            <UserCog className="h-12 w-12 text-black mx-auto mb-3" />
            <p className="text-black font-bold">No doctors found</p>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-black">
                {showAddModal ? 'Add Doctor' : 'Edit Doctor'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setShowEditModal(false)
                  setFormData({})
                  setImagePreview(null)
                  setCvFile(null)
                  setLicenseImage(null)
                  setSelectedDays([])
                  setAvailabilityTiming({ startTime: '09:00', endTime: '17:00' })
                }}
                className="text-black hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture - Only for Add Modal */}
              {showAddModal && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-black mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2 text-black" />
                    Profile Picture
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="flex justify-center">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Profile"
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => setImagePreview(null)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                          <User className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="inline-flex items-center px-3 py-1.5 text-xs bg-black text-white rounded-lg hover:bg-gray-900 cursor-pointer transition-colors">
                        <Upload className="h-3 w-3 mr-1" />
                        {imagePreview ? 'Update Picture' : 'Choose Image'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Supported formats: JPG, PNG, GIF (Max 5MB)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-black mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName || ''}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-1 flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                      disabled={showEditModal}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-1 flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-1 flex items-center">
                      <CreditCard className="h-4 w-4 mr-1" />
                      CNIC Number
                    </label>
                    <input
                      type="text"
                      value={formData.cnic || ''}
                      onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                      placeholder="12345-1234567-1"
                      maxLength={15}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth || ''}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-1">Gender</label>
                    <select
                      value={formData.gender || ''}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {showAddModal && (
                    <div>
                      <label className="block text-sm font-bold text-black mb-1">Password *</label>
                      <input
                        type="password"
                        required
                        value={formData.password || ''}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h3 className="text-lg font-bold text-black mb-4">Professional Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-black mb-1 flex items-center">
                      <Briefcase className="h-4 w-4 mr-1" />
                      Specialization
                    </label>
                    <input
                      type="text"
                      value={formData.specialization || ''}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                      placeholder="e.g., Cardiology, Pediatrics"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-1 flex items-center">
                      <Award className="h-4 w-4 mr-1" />
                      License Number
                    </label>
                    <input
                      type="text"
                      value={formData.licenseNumber || ''}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                      placeholder="Medical License Number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-1 flex items-center">
                      <Building className="h-4 w-4 mr-1" />
                      Department
                    </label>
                    <select
                      value={formData.department || ''}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                    >
                      <option value="">Select Department</option>
                      {departments?.map((dept: any) => (
                        <option key={dept.id} value={dept.name}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-1 flex items-center">
                      <CreditCard className="h-4 w-4 mr-1" />
                      Appointment Fees (PKR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.appointmentFees !== undefined && formData.appointmentFees !== null ? formData.appointmentFees : 0}
                      onChange={(e) => setFormData({ ...formData, appointmentFees: e.target.value || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-1 flex items-center">
                      <CreditCard className="h-4 w-4 mr-1" />
                      Salary (PKR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.salary !== undefined && formData.salary !== null ? formData.salary : 0}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Availability Schedule - For both Add and Edit Modal */}
              <div>
                <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Availability Schedule
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold text-black mb-1 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={availabilityTiming.startTime}
                      onChange={(e) => setAvailabilityTiming({ ...availabilityTiming, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-1 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      End Time
                    </label>
                    <input
                      type="time"
                      value={availabilityTiming.endTime}
                      onChange={(e) => setAvailabilityTiming({ ...availabilityTiming, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Select Days
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                      {daysOfWeek.map((day) => (
                        <label key={day.value} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedDays.includes(day.value)}
                            onChange={() => handleDayToggle(day.value)}
                            className="rounded border-gray-300 text-black focus:ring-black"
                          />
                          <span className="text-sm font-bold text-black">{day.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

              {/* CV and License Photo - For both Add and Edit Modal */}
              <div>
                <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Documents
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* CV Upload Section */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-xs font-bold text-black mb-2 flex items-center">
                      <FileText className="h-3.5 w-3.5 mr-1.5" />
                      Curriculum Vitae (CV)
                    </h3>
                    {cvFile ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 p-2 bg-white rounded border border-gray-200">
                          <FileText className="h-5 w-5 text-black flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-black truncate">{cvFile.name}</p>
                            <p className="text-xs text-gray-500">CV uploaded</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCvFile(null)}
                          className="w-full inline-flex items-center justify-center px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-bold"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
                        <FileText className="h-6 w-6 text-gray-400 mx-auto mb-1.5" />
                        <p className="text-xs font-bold text-black mb-1.5">No CV uploaded</p>
                        <label className="inline-flex items-center px-2.5 py-1 text-xs bg-black text-white rounded hover:bg-gray-900 cursor-pointer transition-colors font-bold">
                          <Upload className="h-3 w-3 mr-1" />
                          Upload CV
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleCvUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-1.5">
                          PDF, DOC, DOCX (Max 10MB)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* License Photo Section */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-xs font-bold text-black mb-2 flex items-center">
                      <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                      Medical License Photo
                    </h3>
                    {licenseImage ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center p-1.5 bg-white rounded border border-gray-200">
                          <img
                            src={licenseImage}
                            alt="Medical License"
                            className="max-w-full max-h-24 rounded object-contain"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setLicenseImage(null)}
                          className="w-full inline-flex items-center justify-center px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-bold"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
                        <CreditCard className="h-6 w-6 text-gray-400 mx-auto mb-1.5" />
                        <p className="text-xs font-bold text-black mb-1.5">No license photo uploaded</p>
                        <label className="inline-flex items-center px-2.5 py-1 text-xs bg-black text-white rounded hover:bg-gray-900 cursor-pointer transition-colors font-bold">
                          <Upload className="h-3 w-3 mr-1" />
                          Upload License Photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLicenseUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-1.5">
                          JPG, PNG, GIF (Max 5MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setShowEditModal(false)
                    setFormData({})
                    setCvFile(null)
                    setLicenseImage(null)
                    setSelectedDays([])
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-black hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {showAddModal ? 'Add' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && doctorDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-black">
                Dr. {doctorDetail.user?.firstName} {doctorDetail.user?.lastName}
              </h2>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedDoctor(null)
                }}
                className="text-black hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-bold text-gray-600">Email</p>
                  <p className="text-black font-bold">{doctorDetail.user?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-600">Phone</p>
                  <p className="text-black font-bold">{doctorDetail.user?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-600">Specialization</p>
                  <DoctorInlineEdit
                    doctor={doctorDetail}
                    field="specialization"
                    label="Specialization"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-600">Department</p>
                  <DoctorInlineEdit doctor={doctorDetail} field="department" label="Department" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-600">License Number</p>
                  <p className="text-black font-bold">{doctorDetail.licenseNumber || 'N/A'}</p>
                </div>
              </div>
              {doctorDetail.bio && (
                <div>
                  <p className="text-sm font-bold text-gray-600">Bio</p>
                  <p className="text-black">{doctorDetail.bio}</p>
                </div>
              )}
              <DoctorDutyRoster doctorId={selectedDoctor?.id} />
              <DoctorAssignedPatients doctorId={selectedDoctor?.id} />
              <RelationViewer entityType="Doctor" entityId={selectedDoctor?.id} />
            </div>
          </div>
        </div>
      )}

      {/* Workload Modal */}
      {showWorkloadModal && doctorWorkload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-black">
                Workload - Dr. {selectedDoctor?.user?.firstName} {selectedDoctor?.user?.lastName}
              </h2>
              <button
                onClick={() => {
                  setShowWorkloadModal(false)
                  setSelectedDoctor(null)
                }}
                className="text-black hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <DoctorPerformanceChart workload={doctorWorkload} />
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && selectedSettingsDoctor && (
        <AdminUserSettingsView
          userType="doctor"
          userId={selectedSettingsDoctor.id || selectedSettingsDoctor.userId}
          onClose={() => {
            setShowSettingsModal(false)
            setSelectedSettingsDoctor(null)
          }}
        />
      )}
    </div>
  )
}
