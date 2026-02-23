import { useQuery } from '@tanstack/react-query'
import { doctorsApi, nursesApi, patientsApi, shiftsApi } from '../../../../services/api'
import { Settings, User, Calendar, Clock, Building, Award, FileText, X, Download, Eye, History, FlaskConical, Pill } from 'lucide-react'
import { format } from 'date-fns'
import { useState, useEffect } from 'react'

interface AdminUserSettingsViewProps {
  userType: 'doctor' | 'nurse' | 'patient'
  userId: string
  onClose: () => void
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function AdminUserSettingsView({
  userType,
  userId,
  onClose,
}: AdminUserSettingsViewProps) {
  const [showLicenseModal, setShowLicenseModal] = useState(false)
  const [licenseImage, setLicenseImage] = useState<string | null>(null)
  const [cvFile, setCvFile] = useState<{ name: string; data: string; type: string } | null>(null)

  const { data: settings, isLoading, error } = useQuery({
    queryKey: [`${userType}-settings`, userId],
    queryFn: async () => {
      try {
        if (userType === 'doctor') return await doctorsApi.getSettings(userId)
        if (userType === 'nurse') return await nursesApi.getSettings(userId)
        return await patientsApi.getSettings(userId)
      } catch (err: any) {
        console.error(`Error fetching ${userType} settings:`, err)
        throw err
      }
    },
    enabled: !!userId,
    retry: 1,
  })

  // Load CV and License from settings (backend) or localStorage (fallback)
  useEffect(() => {
    if (settings) {
      // First try to get from backend
      if (settings.cv) {
        setCvFile(settings.cv)
      }
      if (settings.license) {
        setLicenseImage(settings.license)
      }

      // Fallback to localStorage if not in backend
      const user = settings?.profile?.user || settings?.profile
      const localStorageUserId = user?.id
      
      if (localStorageUserId && !settings.cv && !settings.license) {
        if (userType === 'doctor') {
          const savedCV = localStorage.getItem(`doctorCV_${localStorageUserId}`)
          if (savedCV) {
            try {
              const cvData = JSON.parse(savedCV)
              setCvFile(cvData)
            } catch (e) {
              console.error('Failed to parse CV data')
            }
          }
          const savedLicense = localStorage.getItem(`doctorLicense_${localStorageUserId}`)
          if (savedLicense) {
            setLicenseImage(savedLicense)
          }
        } else if (userType === 'nurse') {
          const savedCV = localStorage.getItem(`nurseCV_${localStorageUserId}`)
          if (savedCV) {
            try {
              const cvData = JSON.parse(savedCV)
              setCvFile(cvData)
            } catch (e) {
              console.error('Failed to parse CV data')
            }
          }
          const savedLicense = localStorage.getItem(`nurseLicense_${localStorageUserId}`)
          if (savedLicense) {
            setLicenseImage(savedLicense)
          }
        }
      }
    }
  }, [settings, userType])

  const { data: shifts } = useQuery({
    queryKey: [`${userType}-shifts`, userId],
    queryFn: () => {
      if (userType === 'doctor') return shiftsApi.getDoctorShifts(userId)
      if (userType === 'nurse') return shiftsApi.getNurseShifts(userId)
      return Promise.resolve([])
    },
    enabled: !!userId && (userType === 'doctor' || userType === 'nurse'),
  })

  const patientId = userType === 'patient' && settings?.profile ? (settings.profile as any).id : null
  const { data: patientOverview } = useQuery({
    queryKey: ['patient-overview', patientId],
    queryFn: () => patientsApi.getOverview(patientId as string),
    enabled: !!patientId,
  })

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6">
          <p className="text-black font-bold">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-black">Error</h3>
            <button onClick={onClose} className="text-black hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-red-600 mb-4">
            {(error as any)?.response?.data?.message || 
             (error as any)?.message || 
             `Failed to load ${userType} settings`}
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-black text-white rounded-md font-bold hover:bg-gray-900"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6">
          <p className="text-black font-bold">No settings found</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-black text-white rounded-md font-bold hover:bg-gray-900"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  const profile = settings.profile
  const user = profile?.user || profile

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 sticky top-0 bg-white">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-black" />
            <div>
              <h2 className="text-2xl font-bold text-black">
                {userType === 'doctor' && 'Doctor'} {userType === 'nurse' && 'Nurse'}{' '}
                {userType === 'patient' && 'Patient'} Settings
              </h2>
              <p className="text-sm text-gray-600">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-black hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Information */}
          <section className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-black mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" /> Profile Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-bold text-gray-600">First Name</p>
                <p className="text-black font-bold">{user?.firstName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600">Last Name</p>
                <p className="text-black font-bold">{user?.lastName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600">Email</p>
                <p className="text-black font-bold">{user?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600">Phone</p>
                <p className="text-black font-bold">{user?.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600">Date of Birth</p>
                <p className="text-black font-bold">
                  {(user?.dateOfBirth || (userType === 'patient' && (profile as any)?.dateOfBirth))
                    ? format(new Date((user?.dateOfBirth || (profile as any)?.dateOfBirth) as string), 'MMM dd, yyyy')
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600">Gender</p>
                <p className="text-black font-bold">{user?.gender || (userType === 'patient' && (profile as any)?.gender) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600">CNIC</p>
                <p className="text-black font-bold">{user?.cnic || (userType === 'patient' && (profile as any)?.cnic) || 'N/A'}</p>
              </div>
              {(user?.address || (userType === 'patient' && (profile as any)?.address)) && (
                <div className="col-span-2">
                  <p className="text-sm font-bold text-gray-600">Address</p>
                  <p className="text-black font-bold">{user?.address || (profile as any)?.address}</p>
                </div>
              )}
            </div>
          </section>

          {/* Role-Specific Information */}
          {userType === 'doctor' && (
            <>
              <section className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                  <Award className="h-5 w-5 mr-2" /> Professional Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-bold text-gray-600">Specialization</p>
                    <p className="text-black font-bold">{profile?.specialization || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-600">Department</p>
                    <p className="text-black font-bold">{profile?.department || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-600">License Number</p>
                    <p className="text-black font-bold">{profile?.licenseNumber || 'N/A'}</p>
                  </div>
                  {profile?.bio && (
                    <div className="col-span-2">
                      <p className="text-sm font-bold text-gray-600">Bio</p>
                      <p className="text-black">{profile.bio}</p>
                    </div>
                  )}
                </div>
              </section>

              {settings.availability && settings.availability.length > 0 && (
                <section className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2" /> Availability
                  </h3>
                  <div className="space-y-2">
                    {settings.availability.map((avail: any, idx: number) => (
                      <div key={idx} className="bg-white p-3 rounded-md border border-gray-200">
                        <p className="text-black font-bold">
                          {dayNames[avail.dayOfWeek]}: {avail.startTime} - {avail.endTime}
                        </p>
                        <p className="text-sm text-gray-600">
                          Status: {avail.isAvailable ? 'Available' : 'Unavailable'}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {shifts && shifts.length > 0 && (
                <section className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2" /> Shifts
                  </h3>
                  <div className="space-y-2">
                    {shifts.map((shift: any) => (
                      <div key={shift.id} className="bg-white p-3 rounded-md border border-gray-200">
                        <p className="text-black font-bold">
                          {dayNames[shift.dayOfWeek]}: {shift.startTime} - {shift.endTime}
                        </p>
                        <p className="text-sm text-gray-600">Status: {shift.status}</p>
                        {shift.location && (
                          <p className="text-sm text-gray-600">Location: {shift.location}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* CV Section */}
              {cvFile && (
                <section className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2" /> CV / Resume
                  </h3>
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-black font-bold">{cvFile.name}</p>
                        <p className="text-sm text-gray-600">Type: {cvFile.type}</p>
                      </div>
                      <button
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = cvFile.data
                          link.download = cvFile.name
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download CV</span>
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* License Section */}
              {licenseImage && (
                <section className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                    <Award className="h-5 w-5 mr-2" /> License
                  </h3>
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-black font-bold">License Image</p>
                      <button
                        onClick={() => setShowLicenseModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View License</span>
                      </button>
                    </div>
                    <div className="w-full h-48 bg-gray-100 rounded-md overflow-hidden">
                      <img
                        src={licenseImage}
                        alt="License"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

          {userType === 'nurse' && (
            <>
              <section className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                  <Building className="h-5 w-5 mr-2" /> Professional Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-bold text-gray-600">Department</p>
                    <p className="text-black font-bold">{profile?.department || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-600">License Number</p>
                    <p className="text-black font-bold">{profile?.licenseNumber || 'N/A'}</p>
                  </div>
                </div>
              </section>

              {shifts && shifts.length > 0 && (
                <section className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2" /> Shifts
                  </h3>
                  <div className="space-y-2">
                    {shifts.map((shift: any) => (
                      <div key={shift.id} className="bg-white p-3 rounded-md border border-gray-200">
                        <p className="text-black font-bold">
                          {dayNames[shift.dayOfWeek]}: {shift.startTime} - {shift.endTime}
                        </p>
                        <p className="text-sm text-gray-600">Status: {shift.status}</p>
                        {shift.ward && (
                          <p className="text-sm text-gray-600">Ward: {shift.ward}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* CV Section */}
              {cvFile && (
                <section className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2" /> CV / Resume
                  </h3>
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-black font-bold">{cvFile.name}</p>
                        <p className="text-sm text-gray-600">Type: {cvFile.type}</p>
                      </div>
                      <button
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = cvFile.data
                          link.download = cvFile.name
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download CV</span>
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* License Section */}
              {licenseImage && (
                <section className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                    <Award className="h-5 w-5 mr-2" /> License
                  </h3>
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-black font-bold">License Image</p>
                      <button
                        onClick={() => setShowLicenseModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View License</span>
                      </button>
                    </div>
                    <div className="w-full h-48 bg-gray-100 rounded-md overflow-hidden">
                      <img
                        src={licenseImage}
                        alt="License"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

          {userType === 'patient' && (
            <>
              <section className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" /> Medical Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-bold text-gray-600">Blood Group</p>
                    <p className="text-black font-bold">{profile?.bloodGroup || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-600">Allergies</p>
                    <p className="text-black font-bold">{profile?.allergies || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-600">Emergency Contact</p>
                    <p className="text-black font-bold">{profile?.emergencyContact || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-600">Emergency Phone</p>
                    <p className="text-black font-bold">{profile?.emergencyPhone || '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-bold text-gray-600">Medical History</p>
                    <p className="text-black whitespace-pre-wrap">{profile?.medicalHistory || '—'}</p>
                  </div>
                </div>
              </section>

              {/* Visit Notes (Past clinical notes) */}
              {(profile as any)?.visitNotes?.length > 0 && (
                <section className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                    <History className="h-5 w-5 mr-2" /> Visit Notes (Past History)
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {(profile as any).visitNotes.map((note: any) => (
                      <div key={note.id} className="bg-white p-3 rounded-md border border-gray-200">
                        <p className="text-xs text-gray-500">
                          {format(new Date(note.visitDate), 'MMM dd, yyyy')}
                          {note.doctor?.user && (
                            <span className="ml-2">
                              • Dr. {note.doctor.user.firstName} {note.doctor.user.lastName}
                            </span>
                          )}
                        </p>
                        {note.chiefComplaint && <p className="text-sm mt-1"><span className="font-bold text-gray-600">Chief complaint:</span> {note.chiefComplaint}</p>}
                        {note.diagnosis && <p className="text-sm mt-1"><span className="font-bold text-gray-600">Diagnosis:</span> {note.diagnosis}</p>}
                        {note.treatmentPlan && <p className="text-sm mt-1"><span className="font-bold text-gray-600">Treatment:</span> {note.treatmentPlan}</p>}
                        {note.notes && <p className="text-sm mt-1 text-gray-700">{note.notes}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Lab Records */}
              {(profile as any)?.labRecords?.length > 0 && (
                <section className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                    <FlaskConical className="h-5 w-5 mr-2" /> Lab Records
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(profile as any).labRecords.map((lab: any) => (
                      <div key={lab.id} className="bg-white p-3 rounded-md border border-gray-200 flex justify-between items-start">
                        <div>
                          <p className="text-black font-bold">{lab.testName}</p>
                          <p className="text-xs text-gray-500">{format(new Date(lab.testDate), 'MMM dd, yyyy')}</p>
                          {lab.results && <p className="text-sm mt-1 text-gray-700">{lab.results}</p>}
                          {lab.status && <p className="text-xs mt-1">Status: {lab.status}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Prescriptions */}
              {(profile as any)?.prescriptions?.length > 0 && (
                <section className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                    <Pill className="h-5 w-5 mr-2" /> Prescriptions
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(profile as any).prescriptions.map((rx: any) => (
                      <div key={rx.id} className="bg-white p-3 rounded-md border border-gray-200">
                        <p className="text-xs text-gray-500">
                          {format(new Date(rx.prescribedDate), 'MMM dd, yyyy')}
                          {rx.doctor && (
                            <span className="ml-2">• Dr. {rx.doctor.firstName} {rx.doctor.lastName}</span>
                          )}
                        </p>
                        <p className="text-sm mt-1 text-black font-bold">Medications</p>
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{typeof rx.medications === 'object' ? JSON.stringify(rx.medications, null, 2) : rx.medications}</pre>
                        {rx.instructions && <p className="text-sm mt-1"><span className="font-bold text-gray-600">Instructions:</span> {rx.instructions}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Appointments (from overview) */}
              {patientOverview?.appointments?.length > 0 && (
                <section className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2" /> Appointments History
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {patientOverview.appointments.map((apt: any) => (
                      <div key={apt.id} className="bg-white p-3 rounded-md border border-gray-200 flex justify-between items-center">
                        <div>
                          <p className="text-black font-bold">{format(new Date(apt.appointmentDate), 'MMM dd, yyyy')} at {apt.appointmentTime}</p>
                          <p className="text-xs text-gray-500">Status: {apt.status}</p>
                          {apt.doctor && <p className="text-xs">Dr. {apt.doctor.firstName} {apt.doctor.lastName}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* State History (from overview) */}
              {patientOverview?.stateLogs?.length > 0 && (
                <section className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                    <History className="h-5 w-5 mr-2" /> State History
                  </h3>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {patientOverview.stateLogs.map((log: any, idx: number) => (
                      <div key={log.id || idx} className="bg-white px-3 py-2 rounded border border-gray-200 flex items-center gap-2 text-sm">
                        <span className="text-gray-500">{format(new Date(log.createdAt), 'MMM dd, HH:mm')}</span>
                        <span>{log.fromState || '—'} → <strong>{log.toState}</strong></span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {/* License Modal */}
      {showLicenseModal && licenseImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-black">License Image</h3>
              <button
                onClick={() => setShowLicenseModal(false)}
                className="text-black hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="w-full">
              <img
                src={licenseImage}
                alt="License"
                className="w-full h-auto rounded-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

