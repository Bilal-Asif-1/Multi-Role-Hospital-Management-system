import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nursesApi, usersApi, departmentsApi, shiftsApi } from '../../../../services/api'
import toast from 'react-hot-toast'
import {
  Search,
  Mail,
  Phone,
  Building,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  X,
  Save,
  User,
  Upload,
  CreditCard,
  Award,
  FileText,
  MapPin,
  Hash,
  UserCog,
  Filter,
  Clock,
  Calendar,
} from 'lucide-react'
import { NurseWardAssignments } from './nurses/NurseWardAssignments'
import { NurseWorkloadRatios } from './nurses/NurseWorkloadRatios'
import { NurseAssignedPatients } from './nurses/NurseAssignedPatients'
import { RelationViewer } from '../../../../components/RelationViewer'
import { AdminUserSettingsView } from './AdminUserSettingsView'

export default function NursesManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAvailability, setFilterAvailability] = useState<string>('')
  const [selectedNurse, setSelectedNurse] = useState<any>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showWorkloadModal, setShowWorkloadModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [selectedSettingsNurse, setSelectedSettingsNurse] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [cvFile, setCvFile] = useState<{ name: string; data: string; type: string } | null>(null)
  const [licenseImage, setLicenseImage] = useState<string | null>(null)
  const [availabilityTiming, setAvailabilityTiming] = useState({ startTime: '09:00', endTime: '17:00' })
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [initialAvailabilityTiming, setInitialAvailabilityTiming] = useState({ startTime: '09:00', endTime: '17:00' })
  const [initialSelectedDays, setInitialSelectedDays] = useState<number[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
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

  const { data: nurses, isLoading } = useQuery({
    queryKey: ['nurses'],
    queryFn: () => nursesApi.getAll(),
  })

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getAll(),
  })

  const { data: nurseDetail } = useQuery({
    queryKey: ['nurse', selectedNurse?.id],
    queryFn: () => nursesApi.getById(selectedNurse?.id),
    enabled: !!selectedNurse?.id && (showViewModal || showEditModal),
  })

  const { data: nurseWorkload } = useQuery({
    queryKey: ['nurse-workload', selectedNurse?.id],
    queryFn: () => nursesApi.getWorkload(selectedNurse?.id),
    enabled: !!selectedNurse?.id && showWorkloadModal,
  })

  const { data: nurseShifts } = useQuery({
    queryKey: ['nurse-shifts', selectedNurse?.id],
    queryFn: () => shiftsApi.getNurseShifts(selectedNurse?.id),
    enabled: !!selectedNurse?.id && showEditModal,
  })

  // Update availability state when nurse shifts load
  useEffect(() => {
    if (nurseShifts && nurseShifts.length > 0) {
      const firstShift = nurseShifts[0]
      if (firstShift) {
        const timing = {
          startTime: firstShift.startTime || '09:00',
          endTime: firstShift.endTime || '17:00',
        }
        setAvailabilityTiming(timing)
        setInitialAvailabilityTiming(timing)
      }
      const days = nurseShifts.map((s: any) => s.dayOfWeek)
      setSelectedDays(days)
      setInitialSelectedDays(days)
    } else {
      setSelectedDays([])
      setInitialSelectedDays([])
      setAvailabilityTiming({ startTime: '09:00', endTime: '17:00' })
      setInitialAvailabilityTiming({ startTime: '09:00', endTime: '17:00' })
    }
  }, [nurseShifts])


  const createMutation = useMutation({
    mutationFn: (data: any) => usersApi.create({ ...data, role: 'NURSE' }),
    onSuccess: async (data: any) => {
      // Save profile image, CV, and license to localStorage after user creation
      const userId = data?.id
      if (userId) {
        if (imagePreview) {
          localStorage.setItem(`profileImage_${userId}`, imagePreview)
          window.dispatchEvent(new Event('profileImageUpdated'))
        }
        if (cvFile) {
          localStorage.setItem(`nurseCV_${userId}`, JSON.stringify(cvFile))
        }
        if (licenseImage) {
          localStorage.setItem(`nurseLicense_${userId}`, licenseImage)
        }
      }
      
      // Create shifts if days are selected
      if (selectedDays.length > 0) {
        try {
          // Get the nurse ID from the created user
          setTimeout(async () => {
            const nurses = await nursesApi.getAll()
            const newNurse = nurses.find((n: any) => n.userId === userId)
            if (newNurse && newNurse.id) {
              for (const dayValue of selectedDays) {
                await shiftsApi.createNurseShift({
                  nurseId: newNurse.id,
                  dayOfWeek: dayValue,
                  startTime: availabilityTiming.startTime,
                  endTime: availabilityTiming.endTime,
                  status: 'ACTIVE',
                })
              }
            }
          }, 1000)
        } catch (err) {
          console.error('Failed to create nurse shifts:', err)
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['nurses'] })
      setShowAddModal(false)
      setFormData({})
      setImagePreview(null)
      setCvFile(null)
      setLicenseImage(null)
      setSelectedDays([])
      setAvailabilityTiming({ startTime: '09:00', endTime: '17:00' })
      toast.success('Nurse added successfully')
    },
    onError: (error: any) => {
      console.error('Error adding nurse:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to add nurse'
      toast.error(errorMessage)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => nursesApi.update(selectedNurse?.id, data),
    onSuccess: async () => {
      // Update shifts if availability changed
      const availabilityChanged = 
        selectedDays.length !== initialSelectedDays.length ||
        selectedDays.some(day => !initialSelectedDays.includes(day)) ||
        initialSelectedDays.some(day => !selectedDays.includes(day)) ||
        availabilityTiming.startTime !== initialAvailabilityTiming.startTime ||
        availabilityTiming.endTime !== initialAvailabilityTiming.endTime

      if (availabilityChanged && selectedNurse?.id) {
        try {
          // Get existing shifts and delete them
          const existingShifts = await shiftsApi.getNurseShifts(selectedNurse.id)
          for (const shift of existingShifts) {
            try {
              await shiftsApi.deleteNurseShift(shift.id)
            } catch (deleteErr) {
              console.warn('Failed to delete shift:', shift.id, deleteErr)
            }
          }
          
          // Create new shifts for selected days
          if (selectedDays.length > 0 && availabilityTiming.startTime && availabilityTiming.endTime) {
            const shiftPromises = selectedDays.map(async (dayValue) => {
              try {
                const dayNum = typeof dayValue === 'number' ? dayValue : Number(dayValue)
                if (isNaN(dayNum)) {
                  console.error('Invalid day value:', dayValue)
                  return
                }
                await shiftsApi.createNurseShift({
                  nurseId: selectedNurse.id,
                  dayOfWeek: dayNum,
                  startTime: availabilityTiming.startTime,
                  endTime: availabilityTiming.endTime,
                  status: 'ACTIVE',
                })
              } catch (createErr: any) {
                console.warn('Failed to create shift for day', dayValue, ':', createErr?.response?.data?.message || createErr?.message || createErr)
                // Silently fail - shifts can be updated separately if needed
              }
            })
            await Promise.all(shiftPromises)
          }
        } catch (err: any) {
          console.error('Failed to update nurse shifts:', err?.response?.data || err)
          // Don't show error toast - main update was successful, shifts can be updated separately
        }
      }

      // Save CV and license to localStorage if updated
      if (selectedNurse?.user?.id) {
        if (cvFile) {
          localStorage.setItem(`nurseCV_${selectedNurse.user.id}`, JSON.stringify(cvFile))
        }
        if (licenseImage) {
          localStorage.setItem(`nurseLicense_${selectedNurse.user.id}`, licenseImage)
        }
      }

      queryClient.invalidateQueries({ queryKey: ['nurses'] })
      queryClient.invalidateQueries({ queryKey: ['nurse', selectedNurse?.id] })
      queryClient.invalidateQueries({ queryKey: ['nurse-shifts', selectedNurse?.id] })
      setShowEditModal(false)
      setSelectedNurse(null)
      setCvFile(null)
      setLicenseImage(null)
      setSelectedDays([])
      setAvailabilityTiming({ startTime: '09:00', endTime: '17:00' })
      toast.success('Nurse updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update nurse')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nurses'] })
      toast.success('Nurse deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete nurse')
    },
  })

  // Helper function to check if a nurse is currently on shift
  const isNurseOnShift = (nurse: any) => {
    if (!nurse.shifts || nurse.shifts.length === 0) {
      return false
    }

    const now = new Date()
    const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    const previousDay = currentDay === 0 ? 6 : currentDay - 1 // 6 = Saturday, previous day for Sunday
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    // Check if nurse has shifts that match current day/time
    return nurse.shifts.some((shift: any) => {
      if (shift.status !== 'ACTIVE') return false

      const startTime = shift.startTime // HH:mm format (e.g., "21:00")
      const endTime = shift.endTime     // HH:mm format (e.g., "05:00")
      const shiftDay = shift.dayOfWeek

      // Handle overnight shifts (when endTime < startTime, e.g., 9 PM to 5 AM)
      if (endTime < startTime) {
        // Overnight shift spans two days
        if (shiftDay === currentDay) {
          // Checking today's shift: we're in the first part (e.g., Monday 9 PM - midnight)
          return currentTime >= startTime
        } else if (shiftDay === previousDay) {
          // Checking previous day's shift: we're in the second part (e.g., Monday 2 AM from Sunday 9 PM shift)
          return currentTime <= endTime
        }
        return false
      } else {
        // Same-day shift: only check if it's for today
        if (shiftDay === currentDay) {
          return currentTime >= startTime && currentTime <= endTime
        }
        return false
      }
    })
  }

  const filteredNurses = nurses?.filter((nurse: any) => {
    const matchesSearch =
      !searchTerm ||
      nurse.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nurse.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nurse.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())

    // Availability filter - check if nurse is currently on shift
    let matchesAvailability = true
    if (filterAvailability === 'available') {
      matchesAvailability = isNurseOnShift(nurse)
    } else if (filterAvailability === 'unavailable') {
      matchesAvailability = !isNurseOnShift(nurse)
    }

    return matchesSearch && matchesAvailability
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
      department: '',
      licenseNumber: '',
      address: '',
      salary: 0,
    })
    setImagePreview(null)
    setCvFile(null)
    setLicenseImage(null)
    setShowAddModal(true)
  }

  const handleEdit = (nurse: any) => {
    setSelectedNurse(nurse)
    setFormData({
      firstName: nurse.user?.firstName || '',
      lastName: nurse.user?.lastName || '',
      email: nurse.user?.email || '',
      phone: nurse.user?.phone || '',
      cnic: nurse.user?.cnic || '',
      dateOfBirth: nurse.user?.dateOfBirth 
        ? new Date(nurse.user.dateOfBirth).toISOString().split('T')[0]
        : '',
      gender: nurse.user?.gender || '',
      department: nurse.department || '',
      licenseNumber: nurse.licenseNumber || '',
      address: nurse.user?.address || '',
      salary: nurse.salary || 0,
    })
    // Load CV and license if exists
    if (nurse.cvData) {
      setCvFile({
        name: nurse.cvFileName || 'CV',
        data: nurse.cvData,
        type: nurse.cvFileType || 'application/pdf',
      })
    } else {
      // Try localStorage as fallback
      const savedCV = localStorage.getItem(`nurseCV_${nurse.user?.id}`)
      if (savedCV) {
        try {
          setCvFile(JSON.parse(savedCV))
        } catch {
          setCvFile(null)
        }
      } else {
        setCvFile(null)
      }
    }
    if (nurse.licenseImage) {
      setLicenseImage(nurse.licenseImage)
    } else {
      // Try localStorage as fallback
      const savedLicense = localStorage.getItem(`nurseLicense_${nurse.user?.id}`)
      setLicenseImage(savedLicense || null)
    }
    setShowEditModal(true)
  }

  const handleWorkload = (nurse: any) => {
    setSelectedNurse(nurse)
    setShowWorkloadModal(true)
  }

  const handleViewSettings = (nurse: any) => {
    setSelectedSettingsNurse(nurse)
    setShowSettingsModal(true)
  }

  const handleDelete = (nurse: any) => {
    if (window.confirm(`Are you sure you want to delete ${nurse.user?.firstName} ${nurse.user?.lastName}?`)) {
      deleteMutation.mutate(nurse.user?.id)
    }
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

  const handleCVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
      toast.error('Please select a PDF, DOC, or DOCX file')
      return
    }

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

  const handleDayToggle = (dayValue: number) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayValue)) {
        return prev.filter((d) => d !== dayValue)
      } else {
        return [...prev, dayValue]
      }
    })
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (showAddModal) {
      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password) {
        toast.error('Please fill in all required fields')
        return
      }
      
      // Prepare data for nurse creation
      const nurseData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        password: formData.password,
        cnic: formData.cnic?.trim() || null,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
        gender: formData.gender || null,
        department: formData.department?.trim() || null,
        licenseNumber: formData.licenseNumber?.trim() || null,
        address: formData.address?.trim() || null,
        salary: formData.salary ? parseFloat(formData.salary.toString()) : 0,
      }
      
      // Save profile image, CV, and license to localStorage if provided
      if (imagePreview && formData.email) {
        // We'll save it after user is created with their ID
      }
      if (cvFile && formData.email) {
        // We'll save it after user is created with their ID
      }
      if (licenseImage && formData.email) {
        // We'll save it after user is created with their ID
      }
      
      createMutation.mutate(nurseData)
    } else if (showEditModal) {
      // Prepare update data with proper formatting
      const updateData: any = {}
      
      // Only include fields that have values (not empty strings)
      if (formData.firstName && formData.firstName.trim()) {
        updateData.firstName = formData.firstName.trim()
      }
      if (formData.lastName && formData.lastName.trim()) {
        updateData.lastName = formData.lastName.trim()
      }
      if (formData.phone && formData.phone.trim()) {
        updateData.phone = formData.phone.trim()
      }
      if (formData.cnic && formData.cnic.trim()) {
        updateData.cnic = formData.cnic.trim()
      }
      if (formData.dateOfBirth && formData.dateOfBirth.trim()) {
        try {
          const date = new Date(formData.dateOfBirth)
          if (!isNaN(date.getTime())) {
            updateData.dateOfBirth = date.toISOString()
          }
        } catch (e) {
          console.error('Invalid date:', formData.dateOfBirth)
        }
      }
      if (formData.gender && formData.gender.trim()) {
        updateData.gender = formData.gender.trim()
      }
      
      // Nurse-specific fields - always include if defined (can be null)
      if (formData.department !== undefined) {
        updateData.department = formData.department?.trim() || null
      }
      if (formData.licenseNumber !== undefined) {
        updateData.licenseNumber = formData.licenseNumber?.trim() || null
      }
      if (formData.salary !== undefined) {
        if (formData.salary === '' || formData.salary === null) {
          updateData.salary = null
        } else {
          const salaryNum = typeof formData.salary === 'number' 
            ? formData.salary 
            : parseFloat(formData.salary.toString())
          if (!isNaN(salaryNum)) {
            updateData.salary = salaryNum
          } else {
            updateData.salary = null
          }
        }
      }
      
      updateMutation.mutate(updateData)
    }
  }


  if (isLoading) {
    return (
      <div className="pl-6 pr-8 pt-6 pb-6">
        <p className="text-black font-bold">Loading nurses...</p>
      </div>
    )
  }

  return (
    <div className="pl-6 pr-8 pt-6 pb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-black">Nurses Management</h1>
          <p className="text-black mt-2 font-bold">Manage all nurses in the hospital</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-900 transition-colors flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" /> Add Nurse
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search nurses by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-black focus:border-black"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-black" />
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

      {/* Nurses Grid */}
      {filteredNurses && filteredNurses.length > 0 ? (
        <div className="grid grid-cols-4 gap-6" key={refreshKey}>
          {filteredNurses.map((nurse: any) => {
            // Get profile photo from localStorage
            const profileImage = nurse.user?.id 
              ? localStorage.getItem(`profileImage_${nurse.user.id}`)
              : null;
            
            return (
            <div
              key={nurse.id}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col items-center text-center mb-4">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={`${nurse.user?.firstName} ${nurse.user?.lastName}`}
                    className="h-16 w-16 rounded-full object-cover mb-3 shadow-lg"
                  />
                ) : (
                  <div className="bg-black rounded-full p-4 mb-3">
                    <UserCog className="h-8 w-8 text-white" />
                  </div>
                )}
                <h3 className="text-lg font-bold text-black mb-3">
                  {nurse.user?.firstName} {nurse.user?.lastName}
                </h3>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-black">
                  <Building className="h-4 w-4 mr-2 text-black flex-shrink-0" />
                  <span className="text-sm font-bold truncate">{nurse.department || 'N/A'}</span>
                </div>
                {nurse.user?.cnic && (
                  <div className="flex items-center text-black">
                    <CreditCard className="h-4 w-4 mr-2 text-black flex-shrink-0" />
                    <span className="text-sm font-bold truncate">{nurse.user.cnic}</span>
                  </div>
                )}
                <div className="flex items-center text-black">
                  <Mail className="h-4 w-4 mr-2 text-black flex-shrink-0" />
                  <span className="text-sm font-bold truncate">{nurse.user?.email}</span>
                </div>
                {nurse.user?.phone && (
                  <div className="flex items-center text-black">
                    <Phone className="h-4 w-4 mr-2 text-black flex-shrink-0" />
                    <span className="text-sm font-bold truncate">{nurse.user.phone}</span>
                  </div>
                )}
                {nurse.licenseNumber && (
                  <div className="flex items-center text-black">
                    <Award className="h-4 w-4 mr-2 text-black flex-shrink-0" />
                    <span className="text-sm font-bold truncate">{nurse.licenseNumber}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleViewSettings(nurse)}
                  className="text-black hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                  title="View Settings"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleWorkload(nurse)}
                  className="text-black hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                  title="View Workload"
                >
                  <BarChart3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleEdit(nurse)}
                  className="text-black hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(nurse)}
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
            <p className="text-black font-bold">No nurses found</p>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-black">
                {showAddModal ? 'Add Nurse' : 'Edit Nurse'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setShowEditModal(false)
                  setFormData({})
                  setImagePreview(null)
                  setCvFile(null)
                  setLicenseImage(null)
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
                      value={formData.firstName}
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
                      value={formData.email}
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
                      placeholder="+92 300 1234567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-1 flex items-center">
                      <Hash className="h-4 w-4 mr-1" />
                      CNIC Number
                    </label>
                    <input
                      type="text"
                      value={formData.cnic}
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
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-1">Gender</label>
                    <select
                      value={formData.gender}
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
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Professional Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-black mb-1 flex items-center">
                      <Building className="h-4 w-4 mr-1" />
                      Department
                    </label>
                    <select
                      value={formData.department}
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
                      <Award className="h-4 w-4 mr-1" />
                      License Number
                    </label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                      placeholder="Nursing License Number"
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
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-black mb-1 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      Address
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black resize-none"
                      placeholder="Street address, City, Country"
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
                            onChange={handleCVUpload}
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

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setShowEditModal(false)
                    setFormData({})
                    setImagePreview(null)
                    setCvFile(null)
                    setLicenseImage(null)
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
                  {showAddModal ? 'Add Nurse' : 'Update Nurse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && nurseDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-black">
                {nurseDetail.user?.firstName} {nurseDetail.user?.lastName}
              </h2>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedNurse(null)
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
                  <p className="text-black font-bold">{nurseDetail.user?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-600">Phone</p>
                  <p className="text-black font-bold">{nurseDetail.user?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-600">Department</p>
                  <p className="text-black font-bold">{nurseDetail.department || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-600">License Number</p>
                  <p className="text-black font-bold">{nurseDetail.licenseNumber || 'N/A'}</p>
                </div>
              </div>
              <NurseWardAssignments nurseId={selectedNurse?.id} />
              <NurseAssignedPatients nurseId={selectedNurse?.id} />
              <RelationViewer entityType="Nurse" entityId={selectedNurse?.id} />
            </div>
          </div>
        </div>
      )}

      {/* Workload Modal */}
      {showWorkloadModal && nurseWorkload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-black">
                Workload - {selectedNurse?.user?.firstName} {selectedNurse?.user?.lastName}
              </h2>
              <button
                onClick={() => {
                  setShowWorkloadModal(false)
                  setSelectedNurse(null)
                }}
                className="text-black hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <NurseWorkloadRatios nurseId={selectedNurse?.id} />
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && selectedSettingsNurse && (
        <AdminUserSettingsView
          userType="nurse"
          userId={selectedSettingsNurse.id}
          onClose={() => {
            setShowSettingsModal(false)
            setSelectedSettingsNurse(null)
          }}
        />
      )}
    </div>
  )
}
