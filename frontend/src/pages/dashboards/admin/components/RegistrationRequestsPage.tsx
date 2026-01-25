import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi, doctorsApi } from '../../../../services/api'
import { CheckCircle, XCircle, User, Mail, Phone, Calendar, Building, Award, Hash, Eye, Clock, FileText, Download } from 'lucide-react'
import toast from 'react-hot-toast'

const daysOfWeek = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
]

export default function RegistrationRequestsPage() {
  const queryClient = useQueryClient()
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [cvFile, setCvFile] = useState<{ name: string; data: string } | null>(null)
  const [licenseImage, setLicenseImage] = useState<string | null>(null)
  const [availability, setAvailability] = useState<any[]>([])

  // Fetch availability when doctor is selected
  useEffect(() => {
    if (selectedUser?.role === 'DOCTOR' && selectedUser?.doctorProfile?.id) {
      doctorsApi.getAvailability(selectedUser.doctorProfile.id)
        .then((data) => setAvailability(data || []))
        .catch(() => setAvailability([]))
    } else {
      setAvailability([])
    }
  }, [selectedUser])

  // Load images from database (doctorProfile) and localStorage (fallback) when user is selected
  useEffect(() => {
    if (selectedUser?.id) {
      // Profile image - try localStorage first (admin might not have user's localStorage)
      const savedImage = localStorage.getItem(`profileImage_${selectedUser.id}`)
      setProfileImage(savedImage || null)
      
      // CV and License - try database first, then localStorage as fallback
      if (selectedUser.role === 'DOCTOR' && selectedUser.doctorProfile) {
        // Load from database if available
        if (selectedUser.doctorProfile.cvData && selectedUser.doctorProfile.cvFileName) {
          setCvFile({
            name: selectedUser.doctorProfile.cvFileName,
            data: selectedUser.doctorProfile.cvData,
            type: selectedUser.doctorProfile.cvFileType || 'application/pdf'
          })
        } else {
          // Fallback to localStorage
          const savedCV = localStorage.getItem(`doctorCV_${selectedUser.id}`)
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
        
        // License image - try database first
        if (selectedUser.doctorProfile.licenseImage) {
          setLicenseImage(selectedUser.doctorProfile.licenseImage)
        } else {
          // Fallback to localStorage
          const savedLicense = localStorage.getItem(`doctorLicense_${selectedUser.id}`)
          setLicenseImage(savedLicense || null)
        }
      } else if (selectedUser.role === 'NURSE' && selectedUser.nurseProfile) {
        // Load from database if available
        if (selectedUser.nurseProfile.cvData && selectedUser.nurseProfile.cvFileName) {
          setCvFile({
            name: selectedUser.nurseProfile.cvFileName,
            data: selectedUser.nurseProfile.cvData,
            type: selectedUser.nurseProfile.cvFileType || 'application/pdf'
          })
        } else {
          // Fallback to localStorage
          const savedCV = localStorage.getItem(`nurseCV_${selectedUser.id}`)
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
        
        // License image - try database first
        if (selectedUser.nurseProfile.licenseImage) {
          setLicenseImage(selectedUser.nurseProfile.licenseImage)
        } else {
          // Fallback to localStorage
          const savedLicense = localStorage.getItem(`nurseLicense_${selectedUser.id}`)
          setLicenseImage(savedLicense || null)
        }
      } else {
        setCvFile(null)
        setLicenseImage(null)
      }
    } else {
      setProfileImage(null)
      setCvFile(null)
      setLicenseImage(null)
    }
  }, [selectedUser?.id, selectedUser?.doctorProfile, selectedUser?.nurseProfile])

  const { data: pendingUsers, isLoading, error } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async () => {
      try {
        const result = await usersApi.getPendingApprovals()
        // Filter out any invalid users (users that might have been deleted)
        const validUsers = Array.isArray(result) 
          ? result.filter(user => user && user.id && user.email)
          : []
        return validUsers
      } catch (err: any) {
        console.error('Error fetching pending approvals:', err)
        toast.error(err?.response?.data?.message || 'Failed to load registration requests')
        return []
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const approveMutation = useMutation({
    mutationFn: (userId: string) => usersApi.approve(userId),
    onSuccess: () => {
      toast.success('User approved successfully')
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setSelectedUser(null)
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to approve user'
      if (errorMessage.includes('not found')) {
        toast.error('User not found. The user may have been deleted. Refreshing list...')
        queryClient.invalidateQueries({ queryKey: ['pending-approvals'] })
        setSelectedUser(null)
      } else {
        toast.error(errorMessage)
      }
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (userId: string) => usersApi.reject(userId),
    onSuccess: () => {
      toast.success('Registration rejected. User can resubmit their profile.')
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setSelectedUser(null)
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to reject user'
      if (errorMessage.includes('not found')) {
        toast.error('User not found. The user may have been deleted. Refreshing list...')
        queryClient.invalidateQueries({ queryKey: ['pending-approvals'] })
        setSelectedUser(null)
      } else {
        toast.error(errorMessage)
      }
    },
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-black font-bold">Loading registration requests...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-bold">Error loading registration requests</p>
          <p className="text-red-600 text-sm mt-1">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">Registration Requests</h2>
          <p className="text-gray-600 mt-1">
            Review and approve pending user registrations
          </p>
        </div>
        <div className="bg-yellow-100 rounded-lg px-4 py-2">
          <p className="text-sm font-bold text-yellow-800">
            {Array.isArray(pendingUsers) ? pendingUsers.length : 0} Pending Request{Array.isArray(pendingUsers) && pendingUsers.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {Array.isArray(pendingUsers) && pendingUsers.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pendingUsers.map((user: any) => (
            <div
              key={user.id}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 rounded-full p-3">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{user.role}</p>
                  </div>
                </div>
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800">
                  Pending
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-700">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  {user.email}
                </div>
                {user.phone && (
                  <div className="flex items-center text-sm text-gray-700">
                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                    {user.phone}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-700">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  Registered: {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Role-specific information */}
              {user.role === 'DOCTOR' && user.doctorProfile && (
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center mb-2">
                    <Award className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="text-sm font-bold text-black">Doctor Details</span>
                  </div>
                  {user.doctorProfile.specialization && (
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Specialization:</span> {user.doctorProfile.specialization}
                    </p>
                  )}
                  {user.doctorProfile.licenseNumber && (
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">License:</span> {user.doctorProfile.licenseNumber}
                    </p>
                  )}
                  {user.doctorProfile.department && (
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Department:</span> {user.doctorProfile.department}
                    </p>
                  )}
                </div>
              )}

              {user.role === 'NURSE' && user.nurseProfile && (
                <div className="bg-green-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center mb-2">
                    <Building className="h-4 w-4 mr-2 text-green-600" />
                    <span className="text-sm font-bold text-black">Nurse Details</span>
                  </div>
                  {user.nurseProfile.department && (
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Department:</span> {user.nurseProfile.department}
                    </p>
                  )}
                  {user.nurseProfile.licenseNumber && (
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">License:</span> {user.nurseProfile.licenseNumber}
                    </p>
                  )}
                </div>
              )}

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedUser(user)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-black hover:bg-gray-50 font-bold flex items-center justify-center"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </button>
                <button
                  onClick={() => approveMutation.mutate(user.id)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold disabled:opacity-50 flex items-center justify-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reject this registration? The user will need to resubmit their profile.')) {
                      rejectMutation.mutate(user.id)
                    }
                  }}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold disabled:opacity-50 flex items-center justify-center"
                  title="Reject - User can resubmit profile"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-black mb-2">No Pending Requests</h3>
          <p className="text-gray-600">All registration requests have been processed.</p>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-black">User Details</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-500 hover:text-black font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Profile Picture */}
              {(selectedUser.role === 'DOCTOR' || selectedUser.role === 'NURSE') && (
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-lg font-bold text-black mb-3 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Profile Picture
                  </h4>
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                      <User className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
              )}

              {/* Personal Information */}
              <div className="border-b border-gray-200 pb-4">
                <h4 className="text-lg font-bold text-black mb-3 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-bold text-gray-600 mb-1">First Name</p>
                    <p className="text-black">{selectedUser.firstName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-600 mb-1">Last Name</p>
                    <p className="text-black">{selectedUser.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-600 mb-1">Email</p>
                    <p className="text-black">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-600 mb-1">Phone</p>
                    <p className="text-black">{selectedUser.phone || 'N/A'}</p>
                  </div>
                  {selectedUser.cnic && (
                    <div>
                      <p className="text-sm font-bold text-gray-600 mb-1">CNIC Number</p>
                      <p className="text-black">{selectedUser.cnic}</p>
                    </div>
                  )}
                  {selectedUser.dateOfBirth && (
                    <div>
                      <p className="text-sm font-bold text-gray-600 mb-1">Date of Birth</p>
                      <p className="text-black">{new Date(selectedUser.dateOfBirth).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedUser.gender && (
                    <div>
                      <p className="text-sm font-bold text-gray-600 mb-1">Gender</p>
                      <p className="text-black">{selectedUser.gender}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-gray-600 mb-1">Role</p>
                    <p className="text-black">{selectedUser.role}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-600 mb-1">Registration Date</p>
                    <p className="text-black">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {selectedUser.role === 'DOCTOR' && selectedUser.doctorProfile && (
                <>
                  {/* Doctor Profile */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-bold text-black mb-3 flex items-center">
                      <Award className="h-5 w-5 mr-2" />
                      Doctor Profile
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedUser.doctorProfile.specialization && (
                        <div>
                          <p className="text-sm font-bold text-gray-600 mb-1">Specialization</p>
                          <p className="text-black">{selectedUser.doctorProfile.specialization}</p>
                        </div>
                      )}
                      {selectedUser.doctorProfile.licenseNumber && (
                        <div>
                          <p className="text-sm font-bold text-gray-600 mb-1">License Number</p>
                          <p className="text-black">{selectedUser.doctorProfile.licenseNumber}</p>
                        </div>
                      )}
                      {selectedUser.doctorProfile.department && (
                        <div>
                          <p className="text-sm font-bold text-gray-600 mb-1">Department</p>
                          <p className="text-black">{selectedUser.doctorProfile.department}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Availability Schedule */}
                  {availability.length > 0 && (
                    <div className="border-b border-gray-200 pb-4">
                      <h4 className="text-lg font-bold text-black mb-3 flex items-center">
                        <Clock className="h-5 w-5 mr-2" />
                        Availability Schedule
                      </h4>
                      <div className="space-y-2">
                        {availability.map((avail: any) => (
                          <div key={avail.dayOfWeek} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="font-bold text-black">{daysOfWeek[avail.dayOfWeek]}</span>
                            <span className="text-black">
                              {avail.startTime} - {avail.endTime}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CV */}
                  <div className="border-b border-gray-200 pb-4">
                    <h4 className="text-lg font-bold text-black mb-3 flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Curriculum Vitae (CV)
                    </h4>
                    {cvFile ? (
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-gray-600" />
                          <div>
                            <p className="text-sm font-bold text-black">{cvFile.name}</p>
                            <p className="text-xs text-gray-500">CV available</p>
                          </div>
                        </div>
                        <a
                          href={cvFile.data}
                          download={cvFile.name}
                          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 font-bold text-sm flex items-center"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download CV
                        </a>
                      </div>
                    ) : (
                      <p className="text-gray-500">No CV uploaded</p>
                    )}
                  </div>

                  {/* Medical License Photo */}
                  <div className="border-b border-gray-200 pb-4">
                    <h4 className="text-lg font-bold text-black mb-3 flex items-center">
                      <Award className="h-5 w-5 mr-2" />
                      Medical License Photo
                    </h4>
                    {licenseImage ? (
                      <img
                        src={licenseImage}
                        alt="Medical License"
                        className="max-w-md h-64 object-contain border-2 border-gray-200 rounded-lg"
                      />
                    ) : (
                      <p className="text-gray-500">No license photo uploaded</p>
                    )}
                  </div>
                </>
              )}

              {selectedUser.role === 'NURSE' && selectedUser.nurseProfile && (
                <>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-bold text-black mb-3 flex items-center">
                      <Building className="h-5 w-5 mr-2" />
                      Nurse Profile
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedUser.nurseProfile.department && (
                        <div>
                          <p className="text-sm font-bold text-gray-600 mb-1">Department</p>
                          <p className="text-black">{selectedUser.nurseProfile.department}</p>
                        </div>
                      )}
                      {selectedUser.nurseProfile.licenseNumber && (
                        <div>
                          <p className="text-sm font-bold text-gray-600 mb-1">License Number</p>
                          <p className="text-black">{selectedUser.nurseProfile.licenseNumber}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CV */}
                  <div className="border-b border-gray-200 pb-4">
                    <h4 className="text-lg font-bold text-black mb-3 flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Curriculum Vitae (CV)
                    </h4>
                    {cvFile ? (
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-gray-600" />
                          <div>
                            <p className="text-sm font-bold text-black">{cvFile.name}</p>
                            <p className="text-xs text-gray-500">CV available</p>
                          </div>
                        </div>
                        <a
                          href={cvFile.data}
                          download={cvFile.name}
                          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 font-bold text-sm flex items-center"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download CV
                        </a>
                      </div>
                    ) : (
                      <p className="text-gray-500">No CV uploaded</p>
                    )}
                  </div>

                  {/* Medical License Photo */}
                  <div className="border-b border-gray-200 pb-4">
                    <h4 className="text-lg font-bold text-black mb-3 flex items-center">
                      <Award className="h-5 w-5 mr-2" />
                      Medical License Photo
                    </h4>
                    {licenseImage ? (
                      <img
                        src={licenseImage}
                        alt="Medical License"
                        className="max-w-md h-64 object-contain border-2 border-gray-200 rounded-lg"
                      />
                    ) : (
                      <p className="text-gray-500">No license photo uploaded</p>
                    )}
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-black hover:bg-gray-50 font-bold"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    approveMutation.mutate(selectedUser.id)
                  }}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold disabled:opacity-50 flex items-center justify-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve User
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reject this registration? The user will need to resubmit their profile.')) {
                      rejectMutation.mutate(selectedUser.id)
                    }
                  }}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold disabled:opacity-50 flex items-center justify-center"
                  title="Reject - User can resubmit profile"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


