import { User, Phone, Mail, Upload, X, Briefcase, Award, Building, FileText, Download, CreditCard, Hash, Calendar, Clock } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../../../contexts/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { doctorsApi } from '../../../../services/api'
import { usersApi } from '../../../../services/api'
import toast from 'react-hot-toast'
import { differenceInYears } from 'date-fns'

const daysOfWeek = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

export default function DoctorSettings() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [cvFile, setCvFile] = useState<{ name: string; data: string } | null>(null)
  const [licenseImage, setLicenseImage] = useState<string | null>(null)

  // Fetch doctor profile data
  const { data: doctorProfile, isLoading } = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: () => doctorsApi.getMyProfile(),
    enabled: !!user?.id,
  })

  // Fetch availability
  const { data: availability } = useQuery({
    queryKey: ['doctor-availability', doctorProfile?.id],
    queryFn: () => doctorsApi.getAvailability(doctorProfile?.id || ''),
    enabled: !!doctorProfile?.id,
  })

  // Initialize availability state - common timing and selected days
  const [availabilityTiming, setAvailabilityTiming] = useState({ startTime: '09:00', endTime: '17:00' })
  const [selectedDays, setSelectedDays] = useState<number[]>([])

  useEffect(() => {
    if (availability && availability.length > 0) {
      // Get common timing from first available day (or use default)
      const firstAvail = availability[0]
      if (firstAvail) {
        setAvailabilityTiming({
          startTime: firstAvail.startTime || '09:00',
          endTime: firstAvail.endTime || '17:00',
        })
      }
      // Get all selected days
      const days = availability.map((a: any) => a.dayOfWeek)
      setSelectedDays(days)
    } else {
      setSelectedDays([])
    }
  }, [availability])

  const updateAvailabilityMutation = useMutation({
    mutationFn: doctorsApi.updateAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-availability'] })
      toast.success('Availability updated successfully')
    },
    onError: () => {
      toast.error('Failed to update availability')
    },
  })

  const handleDayToggle = (dayValue: number) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayValue)) {
        return prev.filter((d) => d !== dayValue)
      } else {
        return [...prev, dayValue]
      }
    })
  }

  const handleUpdateAvailability = (e: React.FormEvent) => {
    e.preventDefault()
    const availabilityArray = selectedDays.map((dayValue) => ({
      dayOfWeek: dayValue,
      startTime: availabilityTiming.startTime,
      endTime: availabilityTiming.endTime,
      isAvailable: true,
    }))

    updateAvailabilityMutation.mutate(availabilityArray)
  }

  const [formData, setFormData] = useState({
    // User fields
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    cnic: '',
    dateOfBirth: '',
    gender: '',
    // Doctor fields
    specialization: '',
    licenseNumber: '',
    department: '',
    // Password fields
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Calculate age from dateOfBirth
  const age = useMemo(() => {
    if (!formData.dateOfBirth) return null
    try {
      const dob = new Date(formData.dateOfBirth)
      return differenceInYears(new Date(), dob)
    } catch {
      return null
    }
  }, [formData.dateOfBirth])

  // Update form data when doctor profile loads
  useEffect(() => {
    if (doctorProfile) {
      setFormData((prev) => ({
        firstName: doctorProfile.user?.firstName || user?.firstName || '',
        lastName: doctorProfile.user?.lastName || user?.lastName || '',
        phone: doctorProfile.user?.phone || '',
        email: doctorProfile.user?.email || user?.email || '',
        cnic: doctorProfile.user?.cnic || '',
        dateOfBirth: doctorProfile.user?.dateOfBirth 
          ? new Date(doctorProfile.user.dateOfBirth).toISOString().split('T')[0]
          : '',
        gender: doctorProfile.user?.gender || '',
        specialization: doctorProfile.specialization || '',
        licenseNumber: doctorProfile.licenseNumber || '',
        department: doctorProfile.department || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
      // Load profile image if exists
      const savedImage = localStorage.getItem(`profileImage_${user?.id}`)
      if (savedImage) {
        setImagePreview(savedImage)
      }
      // Load CV if exists
      const savedCV = localStorage.getItem(`doctorCV_${user?.id}`)
      if (savedCV) {
        try {
          const cvData = JSON.parse(savedCV)
          setCvFile(cvData)
        } catch (e) {
          console.error('Failed to parse CV data')
        }
      }
      // Load license image if exists
      const savedLicense = localStorage.getItem(`doctorLicense_${user?.id}`)
      if (savedLicense) {
        setLicenseImage(savedLicense)
      }
    }
  }, [doctorProfile, user])

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => usersApi.update(user?.id || '', data),
  })

  const updateDoctorMutation = useMutation({
    mutationFn: (data: any) => doctorsApi.updateMyProfile(data),
  })

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Update user profile
    updateProfileMutation.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone || null,
      cnic: formData.cnic || null,
      dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
      gender: formData.gender || null,
    }, {
      onSuccess: () => {
        // Update doctor-specific fields (specialization, licenseNumber, department)
        updateDoctorMutation.mutate({
          specialization: formData.specialization || null,
          licenseNumber: formData.licenseNumber || null,
          department: formData.department || null,
        }, {
            onSuccess: () => {
              // After doctor profile update, also update availability
              const availabilityArray = selectedDays.map((dayValue) => ({
                dayOfWeek: dayValue,
                startTime: availabilityTiming.startTime,
                endTime: availabilityTiming.endTime,
                isAvailable: true,
              }))
              
              updateAvailabilityMutation.mutate(availabilityArray, {
                onSuccess: () => {
                  queryClient.invalidateQueries({ queryKey: ['doctor-profile'] })
                  queryClient.invalidateQueries({ queryKey: ['doctor-availability'] })
                  queryClient.invalidateQueries({ queryKey: ['doctors'] })
                  toast.success('Profile and availability updated successfully')
                  setLoading(false)
                },
                onError: () => {
                  toast.error('Profile updated but failed to update availability')
                  setLoading(false)
                }
              })
            },
            onError: () => {
              toast.error('Failed to update doctor profile')
              setLoading(false)
            }
          })
      },
      onError: () => {
        setLoading(false)
      }
    })
  }

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      usersApi.changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => {
      toast.success('Password updated successfully')
      setShowPasswordModal(false)
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update password. Please check your current password.')
    },
  })

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.currentPassword) {
      toast.error('Please enter your current password')
      return
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    changePasswordMutation.mutate({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    })
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
      if (user?.id) {
        localStorage.setItem(`profileImage_${user.id}`, base64String)
        window.dispatchEvent(new Event('profileImageUpdated'))
      }
      toast.success('Profile image uploaded successfully')
    }
    reader.onerror = () => {
      toast.error('Failed to read image file')
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    if (user?.id) {
      localStorage.removeItem(`profileImage_${user.id}`)
      window.dispatchEvent(new Event('profileImageUpdated'))
    }
    toast.success('Profile image removed')
  }

  const handleCVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Allow PDF and common document formats
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a PDF or Word document')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('CV size should be less than 10MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      const cvData = {
        name: file.name,
        data: base64String,
        type: file.type
      }
      setCvFile(cvData)
      if (user?.id) {
        localStorage.setItem(`doctorCV_${user.id}`, JSON.stringify(cvData))
      }
      toast.success('CV uploaded successfully')
    }
    reader.onerror = () => {
      toast.error('Failed to read CV file')
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveCV = () => {
    setCvFile(null)
    if (user?.id) {
      localStorage.removeItem(`doctorCV_${user.id}`)
    }
    toast.success('CV removed')
  }

  const handleDownloadCV = () => {
    if (cvFile) {
      const link = document.createElement('a')
      link.href = cvFile.data
      link.download = cvFile.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
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
      if (user?.id) {
        localStorage.setItem(`doctorLicense_${user.id}`, base64String)
      }
      toast.success('License photo uploaded successfully')
    }
    reader.onerror = () => {
      toast.error('Failed to read license image file')
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLicense = () => {
    setLicenseImage(null)
    if (user?.id) {
      localStorage.removeItem(`doctorLicense_${user.id}`)
    }
    toast.success('License photo removed')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="pl-6 pr-8 pt-6 pb-6">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-black">Account Settings</h2>

      {/* Profile Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Profile Info Box */}
        <div className="bg-white shadow-lg rounded-xl p-4">
          <div className="flex flex-col items-start justify-center h-full">
            <h4 className="text-xl font-bold text-black mb-1">
              Dr. {formData.firstName} {formData.lastName}
            </h4>
            <p className="text-sm text-black mb-1 font-bold">Doctor Profile</p>
            {formData.specialization && (
              <p className="text-sm text-black font-bold">{formData.specialization}</p>
            )}
          </div>
        </div>

        {/* Right: Image Upload Box */}
        <div className="bg-white shadow-lg rounded-xl p-4">
          <h3 className="text-sm font-bold text-black mb-3 flex items-center">
            <User className="h-4 w-4 mr-2 text-black" />
            Profile Picture
          </h3>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-3">
            {/* Left: Image */}
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
                    onClick={handleRemoveImage}
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
            {/* Right: Buttons and Info */}
            <div className="flex-1 space-y-2">
              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  Upload Profile Picture
                </label>
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
              </div>
              <p className="text-xs text-gray-500">
                Supported formats: JPG, PNG, GIF (Max 5MB)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <h3 className="text-lg font-bold text-black mb-4 flex items-center">
          <User className="h-5 w-5 mr-2 text-black" />
          Personal Information
        </h3>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-black mb-2">First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2">Last Name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2 flex items-center">
                <Mail className="h-4 w-4 mr-1 text-black" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2 flex items-center">
                <Phone className="h-4 w-4 mr-1 text-black" />
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                placeholder="+92 300 1234567"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2 flex items-center">
                <Hash className="h-4 w-4 mr-1 text-black" />
                CNIC Number
              </label>
              <input
                type="text"
                value={formData.cnic}
                onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                placeholder="12345-1234567-1"
                maxLength={15}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2">Date of Birth</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                max={new Date().toISOString().split('T')[0]}
              />
              {age !== null && (
                <p className="text-xs text-gray-500 mt-1">Age: {age} years</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2 flex items-center">
                <Briefcase className="h-4 w-4 mr-1 text-black" />
                Specialization
              </label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                placeholder="e.g., Cardiology, Pediatrics"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2 flex items-center">
                <Award className="h-4 w-4 mr-1 text-black" />
                License Number
              </label>
              <input
                type="text"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                placeholder="Medical License Number"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2 flex items-center">
                <Building className="h-4 w-4 mr-1 text-black" />
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                placeholder="e.g., Emergency, Outpatient"
              />
            </div>
          </div>

          {/* Availability Schedule */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-bold text-black mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-black" />
              Availability Schedule
            </h4>
            
            {/* Timing Selection */}
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Start Time</label>
                  <input
                    type="time"
                    value={availabilityTiming.startTime}
                    onChange={(e) => setAvailabilityTiming({ ...availabilityTiming, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-1">End Time</label>
                  <input
                    type="time"
                    value={availabilityTiming.endTime}
                    onChange={(e) => setAvailabilityTiming({ ...availabilityTiming, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
            </div>

            {/* Days Selection */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-black mb-2">Select Days</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {daysOfWeek.map((day) => (
                  <div key={day.value} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`day-${day.value}`}
                      checked={selectedDays.includes(day.value)}
                      onChange={() => handleDayToggle(day.value)}
                      className="mr-2 w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                    />
                    <label htmlFor={`day-${day.value}`} className="text-sm font-bold text-black cursor-pointer">
                      {day.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* CV and License Photo Section - Horizontal Layout at End */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CV Upload Section */}
        <div className="bg-white shadow-lg rounded-xl p-3">
          <h3 className="text-xs font-bold text-black mb-2 flex items-center">
            <FileText className="h-3.5 w-3.5 mr-1.5 text-black" />
            Curriculum Vitae (CV)
          </h3>
          {cvFile ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded border border-gray-200">
                <FileText className="h-5 w-5 text-black flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-black truncate">{cvFile.name}</p>
                  <p className="text-xs text-gray-500">CV uploaded</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleDownloadCV}
                  className="flex-1 inline-flex items-center justify-center px-2 py-1 text-xs bg-black text-white rounded hover:bg-gray-900 transition-colors font-bold"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={handleRemoveCV}
                  className="flex-1 inline-flex items-center justify-center px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-bold"
                >
                  <X className="h-3 w-3 mr-1" />
                  Remove
                </button>
              </div>
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
        <div className="bg-white shadow-lg rounded-xl p-3">
          <h3 className="text-xs font-bold text-black mb-2 flex items-center">
            <CreditCard className="h-3.5 w-3.5 mr-1.5 text-black" />
            Medical License Photo
          </h3>
          {licenseImage ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center p-1.5 bg-gray-50 rounded border border-gray-200">
                <img
                  src={licenseImage}
                  alt="Medical License"
                  className="max-w-full max-h-24 rounded object-contain"
                />
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = licenseImage
                    link.download = 'medical-license.jpg'
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                  }}
                  className="flex-1 inline-flex items-center justify-center px-2 py-1 text-xs bg-black text-white rounded hover:bg-gray-900 transition-colors font-bold"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={handleRemoveLicense}
                  className="flex-1 inline-flex items-center justify-center px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-bold"
                >
                  <X className="h-3 w-3 mr-1" />
                  Remove
                </button>
                <label className="flex-1 inline-flex items-center justify-center px-2 py-1 text-xs bg-black text-white rounded hover:bg-gray-900 cursor-pointer transition-colors font-bold">
                  <Upload className="h-3 w-3 mr-1" />
                  Update
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLicenseUpload}
                    className="hidden"
                  />
                </label>
              </div>
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

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-black mb-4">Change Password</h3>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-black mb-2">Current Password</label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-2">New Password</label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-black hover:bg-gray-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

