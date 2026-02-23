import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi, doctorsApi, nursesApi, patientsApi } from '../services/api'
import toast from 'react-hot-toast'
import { User, Phone, Mail, Calendar, Building, Award, Hash, Save, Upload, X, Clock, FileText, Download } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
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

// Country code, flag emoji, name, and expected local number length (digits only)
const PHONE_COUNTRIES: { code: string; flag: string; name: string; digits: number }[] = [
  { code: '+93', flag: '🇦🇫', name: 'Afghanistan', digits: 9 },
  { code: '+54', flag: '🇦🇷', name: 'Argentina', digits: 10 },
  { code: '+61', flag: '🇦🇺', name: 'Australia', digits: 9 },
  { code: '+43', flag: '🇦🇹', name: 'Austria', digits: 10 },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh', digits: 10 },
  { code: '+55', flag: '🇧🇷', name: 'Brazil', digits: 11 },
  { code: '+1', flag: '🇨🇦', name: 'Canada', digits: 10 },
  { code: '+86', flag: '🇨🇳', name: 'China', digits: 11 },
  { code: '+57', flag: '🇨🇴', name: 'Colombia', digits: 10 },
  { code: '+45', flag: '🇩🇰', name: 'Denmark', digits: 8 },
  { code: '+20', flag: '🇪🇬', name: 'Egypt', digits: 10 },
  { code: '+358', flag: '🇫🇮', name: 'Finland', digits: 9 },
  { code: '+33', flag: '🇫🇷', name: 'France', digits: 9 },
  { code: '+49', flag: '🇩🇪', name: 'Germany', digits: 10 },
  { code: '+91', flag: '🇮🇳', name: 'India', digits: 10 },
  { code: '+62', flag: '🇮🇩', name: 'Indonesia', digits: 10 },
  { code: '+98', flag: '🇮🇷', name: 'Iran', digits: 10 },
  { code: '+353', flag: '🇮🇪', name: 'Ireland', digits: 9 },
  { code: '+39', flag: '🇮🇹', name: 'Italy', digits: 10 },
  { code: '+81', flag: '🇯🇵', name: 'Japan', digits: 10 },
  { code: '+7', flag: '🇰🇿', name: 'Kazakhstan', digits: 10 },
  { code: '+60', flag: '🇲🇾', name: 'Malaysia', digits: 9 },
  { code: '+52', flag: '🇲🇽', name: 'Mexico', digits: 10 },
  { code: '+31', flag: '🇳🇱', name: 'Netherlands', digits: 9 },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria', digits: 10 },
  { code: '+47', flag: '🇳🇴', name: 'Norway', digits: 8 },
  { code: '+92', flag: '🇵🇰', name: 'Pakistan', digits: 10 },
  { code: '+48', flag: '🇵🇱', name: 'Poland', digits: 9 },
  { code: '+7', flag: '🇷🇺', name: 'Russia', digits: 10 },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia', digits: 9 },
  { code: '+65', flag: '🇸🇬', name: 'Singapore', digits: 8 },
  { code: '+27', flag: '🇿🇦', name: 'South Africa', digits: 9 },
  { code: '+34', flag: '🇪🇸', name: 'Spain', digits: 9 },
  { code: '+46', flag: '🇸🇪', name: 'Sweden', digits: 9 },
  { code: '+41', flag: '🇨🇭', name: 'Switzerland', digits: 9 },
  { code: '+90', flag: '🇹🇷', name: 'Turkey', digits: 10 },
  { code: '+971', flag: '🇦🇪', name: 'UAE', digits: 9 },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom', digits: 10 },
  { code: '+1', flag: '🇺🇸', name: 'United States', digits: 10 },
]

export default function UnapprovedUserSettings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // After registration we pass registeredUser so profile fetches the new user even if auth context hasn't updated yet
  const registeredUser = (location.state as any)?.registeredUser
  const effectiveUser = registeredUser ?? user
  const effectiveUserId = effectiveUser?.id ?? ''
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [cvFile, setCvFile] = useState<{ name: string; data: string; type: string } | null>(null)
  const [licenseImage, setLicenseImage] = useState<string | null>(null)
  
  // Availability state for doctors
  const [availabilityTiming, setAvailabilityTiming] = useState({ startTime: '09:00', endTime: '17:00' })
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [phoneCountryCode, setPhoneCountryCode] = useState('+92')

  // Fetch user profile (use effectiveUserId so we load the newly registered user's profile, not stale auth user)
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['user-profile', effectiveUserId],
    queryFn: () => usersApi.getById(effectiveUserId),
    enabled: !!effectiveUserId,
  })

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    cnic: '',
    dateOfBirth: '',
    gender: '',
    specialization: '',
    licenseNumber: '',
    department: '',
    address: '',
    bloodGroup: '',
    allergies: '',
    medicalHistory: '',
  })

  type ValidationErrors = Record<string, string>
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateFirstName = (v: string) => {
    if (!v.trim()) return 'First name is required'
    if (v.trim().length < 2) return 'At least 2 characters required'
    if (v.trim().length > 50) return 'Maximum 50 characters'
    if (!/^[a-zA-Z\s'-]+$/.test(v.trim())) return 'Only letters, spaces, hyphens and apostrophes allowed'
    return ''
  }
  const validateLastName = (v: string) => {
    if (!v.trim()) return 'Last name is required'
    if (v.trim().length < 2) return 'At least 2 characters required'
    if (v.trim().length > 50) return 'Maximum 50 characters'
    if (!/^[a-zA-Z\s'-]+$/.test(v.trim())) return 'Only letters, spaces, hyphens and apostrophes allowed'
    return ''
  }
  const getPhoneDigitsForCountry = (code: string) => PHONE_COUNTRIES.find((c) => c.code === code)?.digits ?? 10

  const validatePhone = (countryCode: string, v: string) => {
    if (!v.trim()) return 'Phone number is required'
    const digits = v.replace(/\D/g, '')
    const required = getPhoneDigitsForCountry(countryCode)
    if (digits.length !== required) return `Enter ${required} digits for this country (without country code)`
    return ''
  }
  // Format CNIC as XXXXX-XXXXXXX-X (13 digits max, dashes auto-inserted)
  const formatCnic = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 13)
    if (digits.length <= 5) return digits
    if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`
  }
  const validateCnic = (v: string) => {
    if (!v.trim()) return 'CNIC is required'
    const cleaned = v.replace(/\D/g, '')
    if (cleaned.length !== 13) return 'CNIC must be 13 digits (format: xxxxx-xxxxxxx-x)'
    return ''
  }
  const validateDateOfBirth = (v: string) => {
    if (!v.trim()) return 'Date of birth is required'
    const d = new Date(v)
    if (isNaN(d.getTime())) return 'Invalid date'
    if (d > new Date()) return 'Date of birth cannot be in the future'
    const age = differenceInYears(new Date(), d)
    if (age < 0 || age > 120) return 'Please enter a valid date'
    return ''
  }
  const validateGender = (v: string) => (!v || !v.trim() ? 'Gender is required' : '')
  const validateRequired = (v: string, name: string) => (!v || !v.trim() ? `${name} is required` : '')
  const validateMaxLength = (v: string, max: number, name: string) =>
    v.length > max ? `${name} must be at most ${max} characters` : ''

  // Allergies & medical history: required but any text accepted (e.g. "none", "n/a")
  const validateAllergies = (v: string) => {
    if (!v.trim()) return 'Allergies is required (enter "none" if none)'
    return validateMaxLength(v, 500, 'Allergies')
  }
  const validateMedicalHistory = (v: string) => {
    if (!v.trim()) return 'Medical history is required (enter "none" if none)'
    return validateMaxLength(v, 2000, 'Medical history')
  }
  const validateAddress = (v: string) => {
    if (!v.trim()) return 'Address is required'
    return validateMaxLength(v, 300, 'Address')
  }

  const validateForm = (): boolean => {
    const e: ValidationErrors = {}
    e.firstName = validateFirstName(formData.firstName)
    e.lastName = validateLastName(formData.lastName)
    e.phone = validatePhone(phoneCountryCode, formData.phone)
    e.cnic = validateCnic(formData.cnic)
    e.dateOfBirth = validateDateOfBirth(formData.dateOfBirth)
    e.gender = validateGender(formData.gender)

    if (effectiveUser?.role === 'DOCTOR') {
      e.specialization = validateRequired(formData.specialization, 'Specialization')
      e.licenseNumber = validateRequired(formData.licenseNumber, 'License number')
      if (!cvFile) e.cv = 'CV is required'
      if (!licenseImage) e.license = 'Medical license photo is required'
    }
    if (effectiveUser?.role === 'NURSE') {
      e.licenseNumber = validateRequired(formData.licenseNumber, 'License number')
      if (!cvFile) e.cv = 'CV is required'
      if (!licenseImage) e.license = 'Medical license photo is required'
    }
    if (effectiveUser?.role === 'PATIENT') {
      e.address = validateAddress(formData.address)
      e.allergies = validateAllergies(formData.allergies)
      e.medicalHistory = validateMedicalHistory(formData.medicalHistory)
    }

    setErrors(e)
    setTouched({
      firstName: true,
      lastName: true,
      phone: true,
      cnic: true,
      dateOfBirth: true,
      gender: true,
      specialization: true,
      licenseNumber: true,
      address: true,
      allergies: true,
      medicalHistory: true,
    })
    return !Object.values(e).some((x) => x !== '')
  }

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
      let phoneLocal = userProfile.phone || ''
      let countryCode = '+92'
      if (phoneLocal.startsWith('+')) {
        const matched = PHONE_COUNTRIES.find((c) => phoneLocal.startsWith(c.code))
        if (matched) {
          countryCode = matched.code
          phoneLocal = phoneLocal.slice(matched.code.length).replace(/\D/g, '')
        } else {
          phoneLocal = phoneLocal.replace(/\D/g, '')
        }
      } else {
        phoneLocal = (phoneLocal || '').replace(/\D/g, '')
      }
      setPhoneCountryCode(countryCode)
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        phone: phoneLocal,
        email: userProfile.email || '',
        cnic: formatCnic(userProfile.cnic || ''),
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
      const savedImage = localStorage.getItem(`profileImage_${effectiveUserId}`)
      if (savedImage) {
        setImagePreview(savedImage)
      }
      // Load CV and license image if exists based on role
      if (effectiveUser?.role === 'DOCTOR') {
        const savedCV = localStorage.getItem(`doctorCV_${effectiveUserId}`)
        if (savedCV) {
          try {
            const cvData = JSON.parse(savedCV)
            setCvFile(cvData)
          } catch (e) {
            console.error('Failed to parse CV data')
          }
        }
        const savedLicense = localStorage.getItem(`doctorLicense_${effectiveUserId}`)
        if (savedLicense) {
          setLicenseImage(savedLicense)
        }
      } else if (effectiveUser?.role === 'NURSE') {
        const savedCV = localStorage.getItem(`nurseCV_${effectiveUserId}`)
        if (savedCV) {
          try {
            const cvData = JSON.parse(savedCV)
            setCvFile(cvData)
          } catch (e) {
            console.error('Failed to parse CV data')
          }
        }
        const savedLicense = localStorage.getItem(`nurseLicense_${effectiveUserId}`)
        if (savedLicense) {
          setLicenseImage(savedLicense)
        }
      }
    }
  }, [userProfile, effectiveUserId, effectiveUser?.role])

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const fullPhone = data.phone ? (data.phoneCountryCode || '+92') + String(data.phone).replace(/\D/g, '') : null
      await usersApi.update(effectiveUserId, {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: fullPhone,
        cnic: data.cnic || null,
        dateOfBirth: data.dateOfBirth || null,
        gender: data.gender || null,
        profileCompleted: true, // Mark profile as completed - this will make it appear in admin's pending approvals
      })

      // Update role-specific profile
      if (effectiveUser?.role === 'DOCTOR') {
        // Get CV and license from localStorage to save to database
        const savedCV = localStorage.getItem(`doctorCV_${effectiveUserId}`)
        const savedLicense = localStorage.getItem(`doctorLicense_${effectiveUserId}`)
        
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
      } else if (effectiveUser?.role === 'NURSE') {
        // Get CV and license from localStorage to save to database
        const savedCV = localStorage.getItem(`nurseCV_${effectiveUserId}`)
        const savedLicense = localStorage.getItem(`nurseLicense_${effectiveUserId}`)
        
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
      } else if (effectiveUser?.role === 'PATIENT') {
        const patientId = userProfile?.patientProfile?.id
        if (patientId) {
          await patientsApi.update(patientId, {
            gender: data.gender || null,
            cnic: data.cnic || null,
            dateOfBirth: data.dateOfBirth || null,
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
    if (!validateForm()) {
      toast.error('Please fix the errors in the form.')
      return
    }
    setLoading(true)
    let availabilityData: any[] = []
    if (effectiveUser?.role === 'DOCTOR' && selectedDays.length > 0) {
      availabilityData = selectedDays.map((dayValue) => ({
        dayOfWeek: dayValue,
        startTime: availabilityTiming.startTime,
        endTime: availabilityTiming.endTime,
        isAvailable: true,
      }))
    }
    updateProfileMutation.mutate({ ...formData, phoneCountryCode, availability: availabilityData })
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
      if (effectiveUserId) {
        localStorage.setItem(`profileImage_${effectiveUserId}`, base64String)
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
    if (effectiveUserId) {
      localStorage.removeItem(`profileImage_${effectiveUserId}`)
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
      if (effectiveUserId) {
        // Store CV based on role
        const storageKey = effectiveUser?.role === 'DOCTOR' ? `doctorCV_${effectiveUserId}` : `nurseCV_${effectiveUserId}`
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
    if (effectiveUserId) {
      // Remove CV based on role
      const storageKey = effectiveUser?.role === 'DOCTOR' ? `doctorCV_${effectiveUserId}` : `nurseCV_${effectiveUserId}`
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
      if (effectiveUserId) {
        // Store license based on role
        const storageKey = effectiveUser?.role === 'DOCTOR' ? `doctorLicense_${effectiveUserId}` : `nurseLicense_${effectiveUserId}`
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
    if (effectiveUserId) {
      // Remove license based on role
      const storageKey = effectiveUser?.role === 'DOCTOR' ? `doctorLicense_${effectiveUserId}` : `nurseLicense_${effectiveUserId}`
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
            {(effectiveUser?.role === 'DOCTOR' || effectiveUser?.role === 'NURSE') && (
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
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.firstName}
                    onChange={(e) => {
                      setFormData({ ...formData, firstName: e.target.value })
                      if (touched.firstName) setErrors((prev) => ({ ...prev, firstName: validateFirstName(e.target.value) }))
                    }}
                    onBlur={() => {
                      setTouched((p) => ({ ...p, firstName: true }))
                      setErrors((p) => ({ ...p, firstName: validateFirstName(formData.firstName) }))
                    }}
                  />
                  {errors.firstName && <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Last Name *</label>
                  <input
                    type="text"
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.lastName}
                    onChange={(e) => {
                      setFormData({ ...formData, lastName: e.target.value })
                      if (touched.lastName) setErrors((prev) => ({ ...prev, lastName: validateLastName(e.target.value) }))
                    }}
                    onBlur={() => {
                      setTouched((p) => ({ ...p, lastName: true }))
                      setErrors((p) => ({ ...p, lastName: validateLastName(formData.lastName) }))
                    }}
                  />
                  {errors.lastName && <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>}
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
                  <div className="flex gap-2">
                    <select
                      className={`w-[140px] px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                      value={phoneCountryCode}
                      onChange={(e) => {
                        setPhoneCountryCode(e.target.value)
                        if (touched.phone) setErrors((p) => ({ ...p, phone: validatePhone(e.target.value, formData.phone) }))
                      }}
                    >
                      {PHONE_COUNTRIES.map((c) => (
                        <option key={`${c.code}-${c.name}`} value={c.code}>{c.flag} {c.code} {c.name}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      required
                      inputMode="numeric"
                      maxLength={getPhoneDigitsForCountry(phoneCountryCode) + 2}
                      placeholder={`${getPhoneDigitsForCountry(phoneCountryCode)} digits`}
                      className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                      value={formData.phone}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, getPhoneDigitsForCountry(phoneCountryCode))
                        setFormData({ ...formData, phone: v })
                        if (touched.phone) setErrors((prev) => ({ ...prev, phone: validatePhone(phoneCountryCode, v) }))
                      }}
                      onBlur={() => {
                        setTouched((p) => ({ ...p, phone: true }))
                        setErrors((p) => ({ ...p, phone: validatePhone(phoneCountryCode, formData.phone) }))
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {phoneCountryCode} — {getPhoneDigitsForCountry(phoneCountryCode)} digits (without country code)
                  </p>
                  {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-2">CNIC Number *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="xxxxx-xxxxxxx-x"
                    maxLength={15}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black ${errors.cnic ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.cnic}
                    onChange={(e) => {
                      const formatted = formatCnic(e.target.value)
                      setFormData({ ...formData, cnic: formatted })
                      if (touched.cnic) setErrors((prev) => ({ ...prev, cnic: validateCnic(formatted) }))
                    }}
                    onBlur={() => {
                      setTouched((p) => ({ ...p, cnic: true }))
                      setErrors((p) => ({ ...p, cnic: validateCnic(formData.cnic) }))
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">13 digits; dashes added automatically.</p>
                  {errors.cnic && <p className="text-sm text-red-600 mt-1">{errors.cnic}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Date of Birth *</label>
                  <input
                    type="date"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.dateOfBirth}
                    onChange={(e) => {
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                      if (touched.dateOfBirth) setErrors((prev) => ({ ...prev, dateOfBirth: validateDateOfBirth(e.target.value) }))
                    }}
                    onBlur={() => {
                      setTouched((p) => ({ ...p, dateOfBirth: true }))
                      setErrors((p) => ({ ...p, dateOfBirth: validateDateOfBirth(formData.dateOfBirth) }))
                    }}
                  />
                  {errors.dateOfBirth && <p className="text-sm text-red-600 mt-1">{errors.dateOfBirth}</p>}
                  {age !== null && !errors.dateOfBirth && <p className="text-xs text-gray-500 mt-1">Age: {age} years</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Gender *</label>
                  <select
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black ${errors.gender ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.gender}
                    onChange={(e) => {
                      setFormData({ ...formData, gender: e.target.value })
                      if (touched.gender) setErrors((p) => ({ ...p, gender: validateGender(e.target.value) }))
                    }}
                    onBlur={() => {
                      setTouched((p) => ({ ...p, gender: true }))
                      setErrors((p) => ({ ...p, gender: validateGender(formData.gender) }))
                    }}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <p className="text-sm text-red-600 mt-1">{errors.gender}</p>}
                </div>
              </div>
            </div>

            {/* Doctor-specific fields */}
            {effectiveUser?.role === 'DOCTOR' && (
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
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black ${errors.specialization ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="e.g., Cardiology, Pediatrics"
                        value={formData.specialization}
                        onChange={(e) => {
                          setFormData({ ...formData, specialization: e.target.value })
                          if (touched.specialization) setErrors((p) => ({ ...p, specialization: validateRequired(e.target.value, 'Specialization') }))
                        }}
                        onBlur={() => {
                          setTouched((p) => ({ ...p, specialization: true }))
                          setErrors((p) => ({ ...p, specialization: validateRequired(formData.specialization, 'Specialization') }))
                        }}
                      />
                      {errors.specialization && <p className="text-sm text-red-600 mt-1">{errors.specialization}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-black mb-2">License Number *</label>
                      <input
                        type="text"
                        required
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black ${errors.licenseNumber ? 'border-red-500' : 'border-gray-300'}`}
                        value={formData.licenseNumber}
                        onChange={(e) => {
                          setFormData({ ...formData, licenseNumber: e.target.value })
                          if (touched.licenseNumber) setErrors((p) => ({ ...p, licenseNumber: validateRequired(e.target.value, 'License number') }))
                        }}
                        onBlur={() => {
                          setTouched((p) => ({ ...p, licenseNumber: true }))
                          setErrors((p) => ({ ...p, licenseNumber: validateRequired(formData.licenseNumber, 'License number') }))
                        }}
                      />
                      {errors.licenseNumber && <p className="text-sm text-red-600 mt-1">{errors.licenseNumber}</p>}
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
                <div className={`border-b border-gray-200 pb-6 ${errors.cv ? 'rounded-lg border-2 border-red-500 p-4' : ''}`}>
                  <h2 className="text-xl font-bold text-black mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Curriculum Vitae (CV) *
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
                          onChange={(e) => { handleCVUpload(e); setErrors((p) => ({ ...p, cv: '' })) }}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        PDF, DOC, DOCX (Max 10MB)
                      </p>
                    </div>
                  )}
                  {errors.cv && <p className="text-sm text-red-600 mt-2">{errors.cv}</p>}
                </div>

                {/* Medical License Photo */}
                <div className={`border-b border-gray-200 pb-6 ${errors.license ? 'rounded-lg border-2 border-red-500 p-4' : ''}`}>
                  <h2 className="text-xl font-bold text-black mb-4 flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Medical License Photo *
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
                          onChange={(e) => { handleLicenseUpload(e); setErrors((p) => ({ ...p, license: '' })) }}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        JPG, PNG, GIF (Max 5MB)
                      </p>
                    </div>
                  )}
                  {errors.license && <p className="text-sm text-red-600 mt-2">{errors.license}</p>}
                </div>
              </>
            )}

            {/* Nurse-specific fields */}
            {effectiveUser?.role === 'NURSE' && (
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
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black ${errors.licenseNumber ? 'border-red-500' : 'border-gray-300'}`}
                        value={formData.licenseNumber}
                        onChange={(e) => {
                          setFormData({ ...formData, licenseNumber: e.target.value })
                          if (touched.licenseNumber) setErrors((p) => ({ ...p, licenseNumber: validateRequired(e.target.value, 'License number') }))
                        }}
                        onBlur={() => {
                          setTouched((p) => ({ ...p, licenseNumber: true }))
                          setErrors((p) => ({ ...p, licenseNumber: validateRequired(formData.licenseNumber, 'License number') }))
                        }}
                      />
                      {errors.licenseNumber && <p className="text-sm text-red-600 mt-1">{errors.licenseNumber}</p>}
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
                <div className={`border-b border-gray-200 pb-6 ${errors.cv ? 'rounded-lg border-2 border-red-500 p-4' : ''}`}>
                  <h2 className="text-xl font-bold text-black mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Curriculum Vitae (CV) *
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
                          onChange={(e) => { handleCVUpload(e); setErrors((p) => ({ ...p, cv: '' })) }}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        PDF, DOC, DOCX (Max 10MB)
                      </p>
                    </div>
                  )}
                  {errors.cv && <p className="text-sm text-red-600 mt-2">{errors.cv}</p>}
                </div>

                {/* Medical License Photo for Nurses */}
                <div className={`border-b border-gray-200 pb-6 ${errors.license ? 'rounded-lg border-2 border-red-500 p-4' : ''}`}>
                  <h2 className="text-xl font-bold text-black mb-4 flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Medical License Photo *
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
                          onChange={(e) => { handleLicenseUpload(e); setErrors((p) => ({ ...p, license: '' })) }}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        JPG, PNG, GIF (Max 5MB)
                      </p>
                    </div>
                  )}
                  {errors.license && <p className="text-sm text-red-600 mt-2">{errors.license}</p>}
                </div>
              </>
            )}

            {/* Patient-specific fields */}
            {effectiveUser?.role === 'PATIENT' && (
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-bold text-black mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Patient Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">Address *</label>
                    <input
                      type="text"
                      maxLength={301}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Full address (max 300 characters)"
                      value={formData.address}
                      onChange={(e) => {
                        setFormData({ ...formData, address: e.target.value })
                        if (touched.address) setErrors((p) => ({ ...p, address: validateAddress(e.target.value) }))
                      }}
                      onBlur={() => {
                        setTouched((p) => ({ ...p, address: true }))
                        setErrors((p) => ({ ...p, address: validateAddress(formData.address) }))
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.address.length}/300</p>
                    {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
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
                    <label className="block text-sm font-bold text-black mb-2">Allergies *</label>
                    <input
                      type="text"
                      maxLength={501}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black ${errors.allergies ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="e.g. none if none (max 500 characters)"
                      value={formData.allergies}
                      onChange={(e) => {
                        setFormData({ ...formData, allergies: e.target.value })
                        if (touched.allergies) setErrors((p) => ({ ...p, allergies: validateAllergies(e.target.value) }))
                      }}
                      onBlur={() => {
                        setTouched((p) => ({ ...p, allergies: true }))
                        setErrors((p) => ({ ...p, allergies: validateAllergies(formData.allergies) }))
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.allergies.length}/500</p>
                    {errors.allergies && <p className="text-sm text-red-600 mt-1">{errors.allergies}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-black mb-2">Medical History *</label>
                    <textarea
                      maxLength={2001}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black min-h-[100px] ${errors.medicalHistory ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="e.g. none if none (max 2000 characters)"
                      value={formData.medicalHistory}
                      onChange={(e) => {
                        setFormData({ ...formData, medicalHistory: e.target.value })
                        if (touched.medicalHistory) setErrors((p) => ({ ...p, medicalHistory: validateMedicalHistory(e.target.value) }))
                      }}
                      onBlur={() => {
                        setTouched((p) => ({ ...p, medicalHistory: true }))
                        setErrors((p) => ({ ...p, medicalHistory: validateMedicalHistory(formData.medicalHistory) }))
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.medicalHistory.length}/2000</p>
                    {errors.medicalHistory && <p className="text-sm text-red-600 mt-1">{errors.medicalHistory}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Validation guide */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-bold text-blue-900 mb-2">Form validation rules</h3>
              <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                <li><strong>First Name / Last Name:</strong> Letters, space, hyphen or apostrophe only (min 2 characters).</li>
                <li><strong>Phone:</strong> Select country (flag), then enter only the required digits for that country (e.g. Pakistan 10, UAE 9).</li>
                <li><strong>CNIC:</strong> Required; 13 digits in format xxxxx-xxxxxxx-x (dashes added automatically).</li>
                <li><strong>Date of Birth:</strong> Required; valid date in the past.</li>
                <li><strong>Gender:</strong> Required.</li>
                <li><strong>Address:</strong> Required (patients); max 300 characters.</li>
                <li><strong>Allergies:</strong> Required (patients); e.g. "none" if none; max 500 characters.</li>
                <li><strong>Medical History:</strong> Required (patients); e.g. "none" if none; max 2000 characters.</li>
                {effectiveUser?.role === 'DOCTOR' && (
                  <li><strong>Doctor:</strong> Specialization, License Number, CV and License Photo are required.</li>
                )}
                {effectiveUser?.role === 'NURSE' && (
                  <li><strong>Nurse:</strong> License Number, CV and License Photo are required.</li>
                )}
                <li>Fields marked with <strong>*</strong> are required.</li>
              </ul>
            </div>

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

