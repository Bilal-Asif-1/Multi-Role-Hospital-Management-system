import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi, doctorsApi, nursesApi, patientsApi } from '../services/api'
import toast from 'react-hot-toast'
import { User, Phone, Mail, Calendar, Building, Award, Hash, Save, Upload, X, Clock, FileText, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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

export default function UnapprovedUserSettings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [cvFile, setCvFile] = useState<{ name: string; data: string; type: string } | null>(null)
  const [licenseImage, setLicenseImage] = useState<string | null>(null)
  
  // Availability state for doctors
  const [availabilityTiming, setAvailabilityTiming] = useState({ startTime: '09:00', endTime: '17:00' })
  const [selectedDays, setSelectedDays] = useState<number[]>([])

  // Fetch user profile
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: () => usersApi.getById(user?.id || ''),
    enabled: !!user?.id,
  })

  const [formData, setFormData] = useState({
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
    // Nurse fields
    // Patient fields
    address: '',
    bloodGroup: '',
    allergies: '',
    medicalHistory: '',
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

  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        phone: userProfile.phone || '',
        email: userProfile.email || '',
        cnic: userProfile.cnic || '',
        dateOfBirth: userProfile.dateOfBirth ? new Date(userProfile.dateOfBirth).toISOString().split('T')[0] : '',
        gender: userProfile.gender || '',
        specialization: userProfile.doctorProfile?.specialization || '',
        licenseNumber: userProfile.doctorProfile?.licenseNumber || userProfile.nurseProfile?.licenseNumber || '',
        department: userProfile.doctorProfile?.department || userProfile.nurseProfile?.department || '',
        address: userProfile.patientProfile?.address || '',
        bloodGroup: userProfile.patientProfile?.bloodGroup || '',
        allergies: userProfile.patientProfile?.allergies || '',
        medicalHistory: userProfile.patientProfile?.medicalHistory || '',
      })
      
      // Load profile image if exists
      const savedImage = localStorage.getItem(`profileImage_${user?.id}`)
      if (savedImage) {
        setImagePreview(savedImage)
      }
      // Load CV and license image if exists based on role
      if (user?.role === 'DOCTOR') {
        const savedCV = localStorage.getItem(`doctorCV_${user?.id}`)
        if (savedCV) {
          try {
            const cvData = JSON.parse(savedCV)
            setCvFile(cvData)
          } catch (e) {
            console.error('Failed to parse CV data')
          }
        }
        const savedLicense = localStorage.getItem(`doctorLicense_${user?.id}`)
        if (savedLicense) {
          setLicenseImage(savedLicense)
        }
      } else if (user?.role === 'NURSE') {
        const savedCV = localStorage.getItem(`nurseCV_${user?.id}`)
        if (savedCV) {
          try {
            const cvData = JSON.parse(savedCV)
            setCvFile(cvData)
          } catch (e) {
            console.error('Failed to parse CV data')
          }
        }
        const savedLicense = localStorage.getItem(`nurseLicense_${user?.id}`)
        if (savedLicense) {
          setLicenseImage(savedLicense)
        }
      }
    }
  }, [userProfile, user?.id])

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      // Update user basic info and mark profile as completed
      await usersApi.update(user?.id || '', {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        cnic: data.cnic || null,
        dateOfBirth: data.dateOfBirth || null,
        gender: data.gender || null,
        profileCompleted: true, // Mark profile as completed - this will make it appear in admin's pending approvals
      })

      // Update role-specific profile
      if (user?.role === 'DOCTOR') {
        // Get CV and license from localStorage to save to database
        const savedCV = localStorage.getItem(`doctorCV_${user?.id}`)
        const savedLicense = localStorage.getItem(`doctorLicense_${user?.id}`)
        
        let cvData = null
        let cvFileName = null
        let cvFileType = null
        if (savedCV) {
          try {
            const cvObj = JSON.parse(savedCV)
            cvData = cvObj.data
            cvFileName = cvObj.name
            cvFileType = cvObj.type
          } catch (e) {
            console.error('Failed to parse CV data')
          }
        }
        
        await doctorsApi.update(userProfile?.doctorProfile?.id || '', {
          specialization: data.specialization || null,
          licenseNumber: data.licenseNumber || null,
          department: data.department || null,
          cvData: cvData || null,
          cvFileName: cvFileName || null,
          cvFileType: cvFileType || null,
          licenseImage: savedLicense || null,
        })
        
        // Update availability schedule for doctors
        if (data.availability && data.availability.length > 0) {
          await doctorsApi.updateAvailability(data.availability)
        }
      } else if (user?.role === 'NURSE') {
        // Get CV and license from localStorage to save to database
        const savedCV = localStorage.getItem(`nurseCV_${user?.id}`)
        const savedLicense = localStorage.getItem(`nurseLicense_${user?.id}`)
        
        let cvData = null
        let cvFileName = null
        let cvFileType = null
        if (savedCV) {
          try {
            const cvObj = JSON.parse(savedCV)
            cvData = cvObj.data
            cvFileName = cvObj.name
            cvFileType = cvObj.type
          } catch (e) {
            console.error('Failed to parse CV data')
          }
        }
        
        await nursesApi.update(userProfile?.nurseProfile?.id || '', {
          licenseNumber: data.licenseNumber || null,
          department: data.department || null,
          cvData: cvData || null,
          cvFileName: cvFileName || null,
          cvFileType: cvFileType || null,
          licenseImage: savedLicense || null,
        })
      } else if (user?.role === 'PATIENT') {
        // Find patient profile ID from userProfile
        const patientId = userProfile?.patientProfile?.id
        if (patientId) {
          await patientsApi.update(patientId, {
            address: data.address || null,
            bloodGroup: data.bloodGroup || null,
            allergies: data.allergies || null,
            medicalHistory: data.medicalHistory || null,
          })
        }
      }
    },
    onSuccess: () => {
      toast.success('Profile updated successfully! Your request will be reviewed by admin.')
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] })
      // Redirect to pending approval page
      navigate('/pending-approval')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update profile')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Prepare availability data for doctors
    let availabilityData = []
    if (user?.role === 'DOCTOR' && selectedDays.length > 0) {
      availabilityData = selectedDays.map((dayValue) => ({
        dayOfWeek: dayValue,
        startTime: availabilityTiming.startTime,
        endTime: availabilityTiming.endTime,
        isAvailable: true,
      }))
    }
    
    updateProfileMutation.mutate({ ...formData, availability: availabilityData })
    setLoading(false)
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
    }
    toast.success('Profile image removed')
  }

  const handleCVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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
        // Store CV based on role
        const storageKey = user.role === 'DOCTOR' ? `doctorCV_${user.id}` : `nurseCV_${user.id}`
        localStorage.setItem(storageKey, JSON.stringify(cvData))
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
      // Remove CV based on role
      const storageKey = user.role === 'DOCTOR' ? `doctorCV_${user.id}` : `nurseCV_${user.id}`
      localStorage.removeItem(storageKey)
    }
    toast.success('CV removed')
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
        // Store license based on role
        const storageKey = user.role === 'DOCTOR' ? `doctorLicense_${user.id}` : `nurseLicense_${user.id}`
        localStorage.setItem(storageKey, base64String)
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
      // Remove license based on role
      const storageKey = user.role === 'DOCTOR' ? `doctorLicense_${user.id}` : `nurseLicense_${user.id}`
      localStorage.removeItem(storageKey)
    }
    toast.success('License photo removed')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
              Complete Your Profile
            </h1>
            <p className="text-gray-600">
              Please fill in all required information. Your registration will be reviewed by admin after submission.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture Section - Show for DOCTOR and NURSE */}
            {(user?.role === 'DOCTOR' || user?.role === 'NURSE') && (
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-bold text-black mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Picture
              </h2>
              <div className="flex items-center space-x-4">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                    <User className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <label className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 cursor-pointer transition-colors">
                    <Upload className="h-4 w-4 mr-2" />
                    {imagePreview ? 'Update Picture' : 'Choose Image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Supported formats: JPG, PNG, GIF (Max 5MB)
                  </p>
                </div>
              </div>
            </div>
            )}

            {/* Personal Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-bold text-black mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-2">First Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Last Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Email</label>
                  <input
                    type="email"
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    value={formData.email}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-2">CNIC Number</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    value={formData.cnic}
                    onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Date of Birth</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                  {age !== null && (
                    <p className="text-xs text-gray-500 mt-1">Age: {age} years</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Gender</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Doctor-specific fields */}
            {user?.role === 'DOCTOR' && (
              <>
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-xl font-bold text-black mb-4 flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Doctor Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-black mb-2">Specialization *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                        placeholder="e.g., Cardiology, Pediatrics"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-black mb-2">License Number *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                        value={formData.licenseNumber}
                        onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-black mb-2">Department</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Availability Schedule */}
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-xl font-bold text-black mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Availability Schedule
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-bold text-black mb-2">Start Time</label>
                      <input
                        type="time"
                        value={availabilityTiming.startTime}
                        onChange={(e) => setAvailabilityTiming({ ...availabilityTiming, startTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-black mb-2">End Time</label>
                      <input
                        type="time"
                        value={availabilityTiming.endTime}
                        onChange={(e) => setAvailabilityTiming({ ...availabilityTiming, endTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">Select Days</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {daysOfWeek.map((day) => (
                        <label
                          key={day.value}
                          className={`flex items-center space-x-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                            selectedDays.includes(day.value)
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-black border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedDays.includes(day.value)}
                            onChange={() => handleDayToggle(day.value)}
                            className="hidden"
                          />
                          <span className="text-sm font-bold">{day.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CV Upload */}
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-xl font-bold text-black mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Curriculum Vitae (CV)
                  </h2>
                  {cvFile ? (
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-gray-600" />
                        <div>
                          <p className="text-sm font-bold text-black">{cvFile.name}</p>
                          <p className="text-xs text-gray-500">CV uploaded</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCV}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 cursor-pointer transition-colors">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload CV
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleCVUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        PDF, DOC, DOCX (Max 10MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Medical License Photo */}
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-xl font-bold text-black mb-4 flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Medical License Photo
                  </h2>
                  {licenseImage ? (
                    <div className="space-y-3">
                      <img
                        src={licenseImage}
                        alt="Medical License"
                        className="max-w-md h-48 object-contain border-2 border-gray-200 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLicense}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-sm"
                      >
                        Remove License Photo
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 cursor-pointer transition-colors">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload License Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLicenseUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        JPG, PNG, GIF (Max 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Nurse-specific fields */}
            {user?.role === 'NURSE' && (
              <>
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-xl font-bold text-black mb-4 flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    Nurse Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-black mb-2">License Number *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                        value={formData.licenseNumber}
                        onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-black mb-2">Department</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* CV Upload for Nurses */}
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-xl font-bold text-black mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Curriculum Vitae (CV)
                  </h2>
                  {cvFile ? (
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-gray-600" />
                        <div>
                          <p className="text-sm font-bold text-black">{cvFile.name}</p>
                          <p className="text-xs text-gray-500">CV uploaded</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCV}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 cursor-pointer transition-colors">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload CV
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleCVUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        PDF, DOC, DOCX (Max 10MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Medical License Photo for Nurses */}
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-xl font-bold text-black mb-4 flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Medical License Photo
                  </h2>
                  {licenseImage ? (
                    <div className="space-y-3">
                      <img
                        src={licenseImage}
                        alt="Medical License"
                        className="max-w-md h-48 object-contain border-2 border-gray-200 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLicense}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-sm"
                      >
                        Remove License Photo
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 cursor-pointer transition-colors">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload License Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLicenseUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        JPG, PNG, GIF (Max 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Patient-specific fields */}
            {user?.role === 'PATIENT' && (
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-bold text-black mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Patient Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">Address</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">Blood Group</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-black mb-2">Allergies</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                      placeholder="List any allergies"
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-black mb-2">Medical History</label>
                    <textarea
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black min-h-[100px]"
                      placeholder="Enter your medical history"
                      value={formData.medicalHistory}
                      onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/pending-approval')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-black font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || updateProfileMutation.isPending}
                className="px-6 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-900 disabled:opacity-50 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{loading || updateProfileMutation.isPending ? 'Saving...' : 'Save & Submit for Review'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

