import { User, Phone, Mail, Calendar, MapPin, Droplet, CreditCard, Scale, Upload, X } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../../../contexts/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { patientsApi, vitalsApi, usersApi } from '../../../../services/api'
import toast from 'react-hot-toast'
import { format, differenceInYears } from 'date-fns'

export default function AccountSettings() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Fetch patient profile data
  const { data: patientProfile, isLoading } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: () => patientsApi.getMyProfile(),
    enabled: !!user?.id,
  })

  const [formData, setFormData] = useState({
    // User fields
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    // Patient fields
    dateOfBirth: '',
    gender: '',
    cnic: '',
    address: '',
    bloodGroup: '',
    allergies: '',
    medicalHistory: '',
    emergencyContact: '',
    emergencyPhone: '',
    weight: '',
    height: '',
    // Password fields
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Fetch latest vitals for weight
  const { data: latestVitals } = useQuery({
    queryKey: ['latest-vitals', patientProfile?.id],
    queryFn: () => vitalsApi.getLatest(patientProfile?.id!),
    enabled: !!patientProfile?.id,
    refetchInterval: 30000,
  })

  // Update form data when patient profile loads
  useEffect(() => {
    if (patientProfile) {
      setFormData((prev) => ({
        firstName: patientProfile.user?.firstName || user?.firstName || '',
        lastName: patientProfile.user?.lastName || user?.lastName || '',
        phone: patientProfile.user?.phone || '',
        email: patientProfile.user?.email || user?.email || '',
        dateOfBirth: patientProfile.dateOfBirth
          ? format(new Date(patientProfile.dateOfBirth), 'yyyy-MM-dd')
          : '',
        gender: patientProfile.gender || '',
        cnic: patientProfile.cnic || '',
        address: patientProfile.address || '',
        bloodGroup: patientProfile.bloodGroup || '',
        allergies: patientProfile.allergies || '',
        medicalHistory: patientProfile.medicalHistory || '',
        emergencyContact: patientProfile.emergencyContact || '',
        emergencyPhone: patientProfile.emergencyPhone || '',
        weight: prev.weight || (latestVitals?.weight ? latestVitals.weight.toString() : ''),
        height: prev.height || (latestVitals?.height ? latestVitals.height.toString() : ''),
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
      // Load profile image if exists (from localStorage for now)
      const savedImage = localStorage.getItem(`profileImage_${user?.id}`)
      if (savedImage) {
        setImagePreview(savedImage)
      }
    }
  }, [patientProfile, user, latestVitals])

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => patientsApi.updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-profile'] })
      toast.success('Profile updated successfully')
      setLoading(false)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update profile')
      setLoading(false)
    },
  })

  const updateWeightMutation = useMutation({
    mutationFn: (weightData: any) => vitalsApi.create(weightData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['latest-vitals'] })
      queryClient.invalidateQueries({ queryKey: ['vitals'] })
      toast.success('Weight updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update weight')
    },
  })

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Update profile
    updateProfileMutation.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone || null,
      dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
      gender: formData.gender || null,
      cnic: formData.cnic || null,
      address: formData.address || null,
      bloodGroup: formData.bloodGroup || null,
      allergies: formData.allergies || null,
      medicalHistory: formData.medicalHistory || null,
      emergencyContact: formData.emergencyContact || null,
      emergencyPhone: formData.emergencyPhone || null,
    })

    // Update weight and height if changed and patient ID exists
    if (patientProfile?.id && user?.id) {
      const weightValue = formData.weight ? parseFloat(formData.weight) : null
      const heightValue = formData.height ? parseFloat(formData.height) : null
      
      // Only update if weight or height has changed
      const currentWeight = latestVitals?.weight ? parseFloat(latestVitals.weight.toString()) : null
      const currentHeight = latestVitals?.height ? parseFloat(latestVitals.height.toString()) : null
      
      if ((weightValue !== null && !isNaN(weightValue) && weightValue > 0 && currentWeight !== weightValue) ||
          (heightValue !== null && !isNaN(heightValue) && heightValue > 0 && currentHeight !== heightValue)) {
        updateWeightMutation.mutate({
          patientId: patientProfile.id,
          recordedBy: user.id,
          ...(weightValue !== null && !isNaN(weightValue) && weightValue > 0 && { weight: weightValue }),
          ...(heightValue !== null && !isNaN(heightValue) && heightValue > 0 && { height: heightValue }),
          recordedAt: new Date().toISOString(),
        })
      }
    }
  }

  // Calculate age from dateOfBirth - reactive to formData.dateOfBirth changes (for display only)
  const calculatedAge = useMemo(() => {
    if (!formData.dateOfBirth) return null
    try {
      const birthDate = new Date(formData.dateOfBirth)
      if (isNaN(birthDate.getTime())) return null
      return differenceInYears(new Date(), birthDate)
    } catch (error) {
      return null
    }
  }, [formData.dateOfBirth])

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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setImagePreview(base64String)
      // Save to localStorage
      if (user?.id) {
        localStorage.setItem(`profileImage_${user.id}`, base64String)
        // Dispatch custom event to update profile icon in navbar
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
      // Dispatch custom event to update profile icon in navbar
      window.dispatchEvent(new Event('profileImageUpdated'))
    }
    toast.success('Profile image removed')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-black">Account Settings</h2>

      {/* Profile Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Profile Info Box */}
        <div className="bg-white shadow-lg rounded-xl p-4">
          <div className="flex flex-col items-start justify-center h-full">
            <h4 className="text-3xl font-extrabold text-black mb-2">
              {formData.firstName} {formData.lastName}
            </h4>
            <p className="text-lg text-black mb-2 font-bold">Patient Profile</p>
            {calculatedAge !== null && (
              <p className="text-xl text-black font-bold">Age: {calculatedAge} years</p>
            )}
          </div>
        </div>

        {/* Right: Image Upload Box */}
        <div className="bg-white shadow-lg rounded-xl p-3">
          <h3 className="text-sm font-bold text-black mb-2 flex items-center">
            <User className="h-3.5 w-3.5 mr-1.5 text-black" />
            Profile Picture
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
            {/* Left: Image */}
            <div className="flex justify-center md:justify-start">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
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
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                  <User className="h-10 w-10 text-gray-400" />
                </div>
              )}
            </div>
            {/* Right: Buttons and Info */}
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
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
                <CreditCard className="h-4 w-4 mr-1 text-black" />
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
              <label className="block text-sm font-bold text-black mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-black" />
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2 flex items-center">
                <Scale className="h-4 w-4 mr-1 text-black" />
                Weight (kg)
              </label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                min="0"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                placeholder="Enter weight in kg"
              />
              {latestVitals?.weight && (
                <p className="text-xs text-black mt-1">
                  Last recorded: {latestVitals.weight} kg
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2 flex items-center">
                <Scale className="h-4 w-4 mr-1 text-black" />
                Height (cm)
              </label>
              <input
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                min="0"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                placeholder="Enter height in cm"
              />
              {latestVitals?.height && (
                <p className="text-xs text-black mt-1">
                  Last recorded: {latestVitals.height} cm
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2 flex items-center">
                <Droplet className="h-4 w-4 mr-1 text-black" />
                Blood Group
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
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
            <div>
              <label className="block text-sm font-bold text-black mb-2 flex items-center">
                <Phone className="h-4 w-4 mr-1 text-black" />
                Emergency Contact
              </label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                placeholder="Emergency Contact Name"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2 flex items-center">
                <MapPin className="h-4 w-4 mr-1 text-black" />
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full h-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black resize-none"
                placeholder="Street address, City, Country"
              />
            </div>
          </div>
          <div className="flex justify-center">
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
                  disabled={changePasswordMutation.isPending}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-black hover:bg-gray-50 font-bold disabled:opacity-50"
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
  )
}
