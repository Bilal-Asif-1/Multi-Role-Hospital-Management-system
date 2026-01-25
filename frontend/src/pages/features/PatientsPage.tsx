import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { patientsApi, appointmentsApi, visitNotesApi, prescriptionsApi, doctorsApi, labRecordsApi } from '../../services/api'
import { Plus, Search, Settings, Calendar, Bed, Trash2, User, Mail, Phone, CreditCard, Eye, Filter, Receipt, FileText, Clock, FlaskConical, Download, X } from 'lucide-react'
import { useRole } from '../../hooks/useRole'
import { WalkInRegistrationModal } from './patients/WalkInRegistrationModal'
import { TodaysReceiptsModal } from './patients/TodaysReceiptsModal'
import { AdminUserSettingsView } from '../dashboards/admin/components/AdminUserSettingsView'
import toast from 'react-hot-toast'

export default function PatientsPage() {
  const [search, setSearch] = useState('')
  const [filterGender, setFilterGender] = useState<string>('')
  const [filterNewlyAdded, setFilterNewlyAdded] = useState<string>('')
  const [showWalkIn, setShowWalkIn] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [selectedSettingsPatient, setSelectedSettingsPatient] = useState<any>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showReceiptsModal, setShowReceiptsModal] = useState(false)
  const [showLabReportsModal, setShowLabReportsModal] = useState(false)
  const [selectedPatientForLabReports, setSelectedPatientForLabReports] = useState<any>(null)
  const { user, isDoctor, isAdmin } = useRole()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

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

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients', search],
    queryFn: () => patientsApi.getAll(search || undefined),
  })

  // For doctors, get their related data to filter patients
  const { data: appointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.getAll(),
    enabled: isDoctor && !!user?.id,
  })

  const { data: visitNotes } = useQuery({
    queryKey: ['visit-notes'],
    queryFn: () => visitNotesApi.getAll(),
    enabled: isDoctor && !!user?.id,
  })

  const { data: prescriptions } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: () => prescriptionsApi.getAll(),
    enabled: isDoctor && !!user?.id,
  })

  const { data: doctorProfile } = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: () => doctorsApi.getMyProfile(),
    enabled: isDoctor && !!user?.id,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => patientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      toast.success('Patient deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete patient')
    },
  })

  const handleDelete = (patient: any) => {
    if (window.confirm(`Are you sure you want to delete patient ${patient.user?.firstName} ${patient.user?.lastName}? This action cannot be undone.`)) {
      deleteMutation.mutate(patient.id)
    }
  }

  const uniqueGenders = Array.from(
    new Set(patients?.map((p: any) => p.gender).filter(Boolean) || [])
  ).sort()

  // Filter patients: For doctors, show only patients they've dealt with
  const filteredPatients = useMemo(() => {
    if (!patients) return []
    
    let basePatients = patients
    
    if (isDoctor && user?.id) {
      // Get patient User IDs (not Patient IDs) that this doctor has dealt with
      // Note: appointments.patientId and prescriptions.patientId are User.id, not Patient.id
      const treatedPatientUserIds = new Set<string>()
      
      // From appointments (doctorId is user.id, patientId is User.id)
      appointments?.forEach((apt: any) => {
        if (apt.doctorId === user.id && apt.patientId) {
          treatedPatientUserIds.add(apt.patientId)
        }
      })
      
      // From visit notes (doctorId is doctor.id, patientId is Patient.id - need to get userId)
      visitNotes?.forEach((note: any) => {
        if (doctorProfile?.id && note.doctorId === doctorProfile.id && note.patientId) {
          // Find the patient and get their userId
          const patient = patients?.find((p: any) => p.id === note.patientId)
          if (patient?.userId) {
            treatedPatientUserIds.add(patient.userId)
          }
        }
      })
      
      // From prescriptions (doctorId is user.id, patientId is Patient.id - need to get userId)
      prescriptions?.forEach((pres: any) => {
        if (pres.doctorId === user.id && pres.patientId) {
          // Find the patient and get their userId
          const patient = patients?.find((p: any) => p.id === pres.patientId)
          if (patient?.userId) {
            treatedPatientUserIds.add(patient.userId)
          }
        }
      })
      
      // Filter patients to show only those the doctor has dealt with
      // Compare patient.userId (User.id) with treatedPatientUserIds (User.id)
      basePatients = patients.filter((patient: any) => 
        treatedPatientUserIds.has(patient.userId)
      )
    }
    
    // Apply search and filter filters
    return basePatients.filter((patient: any) => {
      // Search filter
      const matchesSearch =
        !search ||
        patient.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        patient.user?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
        patient.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        patient.user?.phone?.toLowerCase().includes(search.toLowerCase())

      // Gender filter
      const matchesGender = !filterGender || patient.gender === filterGender

      // Newly Added filter
      let matchesNewlyAdded = true
      if (filterNewlyAdded === 'today') {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const patientDate = patient.createdAt ? new Date(patient.createdAt) : null
        if (patientDate) {
          patientDate.setHours(0, 0, 0, 0)
          matchesNewlyAdded = patientDate.getTime() === today.getTime()
        } else {
          matchesNewlyAdded = false
        }
      } else if (filterNewlyAdded === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const patientDate = patient.createdAt ? new Date(patient.createdAt) : null
        if (patientDate) {
          matchesNewlyAdded = patientDate >= weekAgo
        } else {
          matchesNewlyAdded = false
        }
      } else if (filterNewlyAdded === 'month') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        const patientDate = patient.createdAt ? new Date(patient.createdAt) : null
        if (patientDate) {
          matchesNewlyAdded = patientDate >= monthAgo
        } else {
          matchesNewlyAdded = false
        }
      }

      return matchesSearch && matchesGender && matchesNewlyAdded
    })
  }, [patients, appointments, visitNotes, prescriptions, isAdmin, isDoctor, user?.id, doctorProfile?.id, search, filterGender, filterNewlyAdded])

  return (
    <div className="pl-6 pr-8 pt-6 pb-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-extrabold text-black">Patients</h1>
        {isAdmin && (
          <div className="flex space-x-3">
            <button
              onClick={() => setShowReceiptsModal(true)}
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-bold text-black shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all"
            >
              <Receipt className="h-5 w-5 mr-2" />
              Receipts
            </button>
            <button
              onClick={() => setShowWalkIn(true)}
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-bold text-white bg-black hover:bg-gray-900"
            >
              <Plus className="h-5 w-5 mr-2" />
              Walk-in Registration
            </button>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-black focus:border-black"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-black" />
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black text-sm font-bold text-black opacity-60"
          >
            <option value="">All Genders</option>
            {uniqueGenders.map((gender) => (
              <option key={gender} value={gender}>
                {gender}
              </option>
            ))}
          </select>
          <select
            value={filterNewlyAdded}
            onChange={(e) => setFilterNewlyAdded(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black text-sm font-bold text-black opacity-60"
          >
            <option value="">All Patients</option>
            <option value="today">Added Today</option>
            <option value="week">Added This Week</option>
            <option value="month">Added This Month</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-black font-bold">Loading...</div>
      ) : (
        <>
          {filteredPatients && filteredPatients.length > 0 ? (
            <div className="grid grid-cols-4 gap-6" key={refreshKey}>
              {filteredPatients.map((patient: any) => {
                // Get profile photo from localStorage
                const profileImage = patient.user?.id 
                  ? localStorage.getItem(`profileImage_${patient.user.id}`)
                  : null;
                
                return (
                  <div
                    key={patient.id}
                    className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col items-center text-center mb-4">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt={`${patient.user?.firstName} ${patient.user?.lastName}`}
                          className="h-16 w-16 rounded-full object-cover mb-3 shadow-lg"
                        />
                      ) : (
                        <div className="bg-black rounded-full p-4 mb-3">
                          <User className="h-8 w-8 text-white" />
                        </div>
                      )}
                      <h3 className="text-lg font-bold text-black mb-3">
                        {patient.user?.firstName} {patient.user?.lastName}
                      </h3>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      {patient.user?.email && (
                        <div className="flex items-center text-black">
                          <Mail className="h-4 w-4 mr-2 text-black flex-shrink-0" />
                          <span className="text-sm font-bold truncate">{patient.user.email}</span>
                        </div>
                      )}
                      {patient.user?.phone && (
                        <div className="flex items-center text-black">
                          <Phone className="h-4 w-4 mr-2 text-black flex-shrink-0" />
                          <span className="text-sm font-bold truncate">{patient.user.phone}</span>
                        </div>
                      )}
                      {patient.user?.cnic && (
                        <div className="flex items-center text-black">
                          <CreditCard className="h-4 w-4 mr-2 text-black flex-shrink-0" />
                          <span className="text-sm font-bold truncate">{patient.user.cnic}</span>
                        </div>
                      )}
                      {patient.gender && (
                        <div className="flex items-center text-black">
                          <User className="h-4 w-4 mr-2 text-black flex-shrink-0" />
                          <span className="text-sm font-bold truncate">{patient.gender}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-center space-x-2 pt-4 border-t border-gray-200">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedSettingsPatient(patient)
                              setShowSettingsModal(true)
                            }}
                            className="text-black hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                            title="View Settings"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(patient)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50"
                            title="Delete Patient"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {isDoctor && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigate('/doctor/appointments', { state: { selectedPatient: patient } })}
                            className="text-black hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                            title="Book Appointment"
                          >
                            <Calendar className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/doctor/visit-notes`, { state: { selectedPatient: patient } })}
                            className="text-black hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                            title="View Medical Records"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPatientForLabReports(patient)
                              setShowLabReportsModal(true)
                            }}
                            className="text-black hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                            title="View Lab Reports"
                          >
                            <FlaskConical className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white shadow-lg rounded-xl p-12">
              <div className="text-center">
                <User className="h-12 w-12 text-black mx-auto mb-3" />
                <p className="text-black font-bold">
                  {isDoctor ? 'No patients found. You will see patients here once you have appointments, visit notes, or prescriptions with them.' : 'No patients found'}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Only show registration modal for admins */}
      {isAdmin && (
        <WalkInRegistrationModal open={showWalkIn} onClose={() => setShowWalkIn(false)} />
      )}

      {/* Only show receipts modal for admins */}
      {isAdmin && (
        <TodaysReceiptsModal open={showReceiptsModal} onClose={() => setShowReceiptsModal(false)} />
      )}

      {/* Settings Modal */}
      {showSettingsModal && selectedSettingsPatient && isAdmin && (
        <AdminUserSettingsView
          userType="patient"
          userId={selectedSettingsPatient.id}
          onClose={() => {
            setShowSettingsModal(false)
            setSelectedSettingsPatient(null)
          }}
        />
      )}

      {/* Lab Reports Modal */}
      {showLabReportsModal && selectedPatientForLabReports && (
        <PatientLabReportsModal
          patient={selectedPatientForLabReports}
          onClose={() => {
            setShowLabReportsModal(false)
            setSelectedPatientForLabReports(null)
          }}
        />
      )}
    </div>
  )
}

// Patient Lab Reports Modal Component
function PatientLabReportsModal({ patient, onClose }: { patient: any; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { isDoctor, isAdmin } = useRole()
  
  const { data: labRecords, isLoading } = useQuery({
    queryKey: ['lab-records', patient.id],
    queryFn: () => labRecordsApi.getAll(patient.id),
    enabled: !!patient.id,
  })

  const deleteMutation = useMutation({
    mutationFn: labRecordsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-records', patient.id] })
      queryClient.invalidateQueries({ queryKey: ['lab-records'] })
      toast.success('Lab report deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete lab report')
    },
  })

  const handleDeleteLabReport = (labId: string) => {
    if (window.confirm('Are you sure you want to delete this lab report? This action cannot be undone.')) {
      deleteMutation.mutate(labId)
    }
  }

  const handleDownload = (lab: any) => {
    if (lab.attachments && lab.attachments.length > 0) {
      const attachment = lab.attachments[0]
      if (attachment.filePath) {
        try {
          // Decode base64
          const binaryString = atob(attachment.filePath)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          const blob = new Blob([bytes], { type: attachment.fileType || 'application/pdf' })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = attachment.fileName || 'lab-report'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        } catch (error) {
          console.error('Error downloading file:', error)
          toast.error('Failed to download file')
        }
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-black">Lab Reports</h2>
            <p className="text-sm text-gray-600 mt-1">
              {patient.user?.firstName} {patient.user?.lastName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black p-2 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-12 text-black font-bold">Loading lab reports...</div>
          ) : labRecords && labRecords.length > 0 ? (
            <div className="space-y-4">
              {labRecords.map((lab: any) => (
                <div key={lab.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-black">{lab.testName}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            lab.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : lab.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {lab.status || 'PENDING'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Date: {new Date(lab.testDate).toLocaleDateString()}
                      </p>
                      {lab.results && (
                        <div className="mt-2">
                          <p className="text-sm font-bold text-black">Results:</p>
                          <p className="text-sm text-black">{lab.results}</p>
                        </div>
                      )}
                      {lab.notes && (
                        <div className="mt-2">
                          <p className="text-sm font-bold text-black">Notes:</p>
                          <p className="text-sm text-black italic">{lab.notes}</p>
                        </div>
                      )}
                      {lab.attachments && lab.attachments.length > 0 && (
                        <div className="mt-3 flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-black" />
                          <span className="text-sm text-black">
                            {lab.attachments[0].fileName || 'Report file attached'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex flex-col space-y-2">
                      {lab.attachments && lab.attachments.length > 0 && (
                        <button
                          onClick={() => handleDownload(lab)}
                          className="flex items-center px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-900 text-sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </button>
                      )}
                      {(isDoctor || isAdmin) && (
                        <button
                          onClick={() => handleDeleteLabReport(lab.id)}
                          disabled={deleteMutation.isPending}
                          className="flex items-center justify-center px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete lab report"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FlaskConical className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-black font-bold">No lab reports available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}




