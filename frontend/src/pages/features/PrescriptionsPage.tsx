import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { prescriptionsApi, patientsApi, appointmentsApi, visitNotesApi, doctorsApi } from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Pill, X, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { useRole } from '../../hooks/useRole'

interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
}

export default function PrescriptionsPage() {
  const [showModal, setShowModal] = useState(false)
  const [medications, setMedications] = useState<Medication[]>([
    { name: '', dosage: '', frequency: '', duration: '' }
  ])
  const queryClient = useQueryClient()
  const { user, isDoctor, isAdmin } = useRole()

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: () => prescriptionsApi.getAll(),
  })

  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsApi.getAll(),
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

  const { data: doctorProfile } = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: () => doctorsApi.getMyProfile(),
    enabled: isDoctor && !!user?.id,
  })

  // Filter patients dropdown: For doctors, show only patients they've dealt with
  const filteredPatients = useMemo(() => {
    if (!patients) return []
    
    if (isAdmin) {
      // Admin sees all patients
      return patients
    }
    
    if (isDoctor && user?.id) {
      // Get patient User IDs (not Patient IDs) that this doctor has dealt with
      // Note: appointments.patientId is User.id, but prescriptions.patientId and visitNotes.patientId are Patient.id
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
      return patients.filter((patient: any) => 
        treatedPatientUserIds.has(patient.userId)
      )
    }
    
    // For other roles, return all patients
    return patients
  }, [patients, appointments, visitNotes, prescriptions, isAdmin, isDoctor, user?.id, doctorProfile?.id])

  const createMutation = useMutation({
    mutationFn: prescriptionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] })
      setShowModal(false)
      setMedications([{ name: '', dosage: '', frequency: '', duration: '' }])
      toast.success('Prescription created successfully')
    },
    onError: () => {
      toast.error('Failed to create prescription')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: prescriptionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] })
      toast.success('Prescription deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete prescription')
    },
  })

  const handleDelete = (prescriptionId: string) => {
    if (window.confirm('Are you sure you want to delete this prescription? This action cannot be undone.')) {
      deleteMutation.mutate(prescriptionId)
    }
  }

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '' }])
  }

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index))
    }
  }

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications]
    updated[index] = { ...updated[index], [field]: value }
    setMedications(updated)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    // Filter out empty medications
    const validMedications = medications.filter(
      (med) => med.name.trim() && med.dosage.trim() && med.frequency.trim() && med.duration.trim()
    )

    if (validMedications.length === 0) {
      toast.error('Please add at least one medication')
      return
    }

    createMutation.mutate({
      patientId: formData.get('patientId') as string,
      medications: validMedications,
      instructions: formData.get('instructions') as string,
    })
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setMedications([{ name: '', dosage: '', frequency: '', duration: '' }])
  }

  return (
    <div className="pl-6 pr-8 pt-6 pb-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-extrabold text-black">Prescriptions</h1>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-black hover:bg-gray-900"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Prescription
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-black font-bold">Loading...</div>
      ) : (
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {prescriptions?.map((prescription: any) => (
              <li key={prescription.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <Pill className="h-5 w-5 text-black mr-3 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-black">
                          {prescription.patient?.user?.firstName} {prescription.patient?.user?.lastName}
                        </p>
                        <p className="text-sm text-black">
                          {format(new Date(prescription.prescribedDate), 'MMM dd, yyyy')}
                        </p>
                        {prescription.medications && (
                          <div className="mt-2">
                            {Array.isArray(prescription.medications) ? (
                              prescription.medications.map((med: any, idx: number) => (
                                <p key={idx} className="text-sm text-black">
                                  {med.name} - {med.dosage} - {med.frequency} {med.duration && `- ${med.duration}`}
                                </p>
                              ))
                            ) : (
                              <p className="text-sm text-black">
                                {JSON.stringify(prescription.medications)}
                              </p>
                            )}
                          </div>
                        )}
                        {prescription.instructions && (
                          <p className="text-sm text-black mt-1">
                            Instructions: {prescription.instructions}
                          </p>
                        )}
                      </div>
                    </div>
                    {(isDoctor || isAdmin) && (
                      <button
                        onClick={() => handleDelete(prescription.id)}
                        disabled={deleteMutation.isPending}
                        className="ml-4 text-red-500 hover:text-red-700 disabled:opacity-50"
                        title="Delete prescription"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-black">Add Prescription</h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Patient Selection */}
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Patient *</label>
                  <select name="patientId" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black">
                    <option value="">Select Patient</option>
                    {filteredPatients && filteredPatients.length > 0 ? (
                      filteredPatients.map((patient: any) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.user?.firstName} {patient.user?.lastName}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No patients available</option>
                    )}
                  </select>
                </div>

                {/* Medications */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-bold text-black">Medications *</label>
                    <button
                      type="button"
                      onClick={addMedication}
                      className="flex items-center px-3 py-1 text-sm bg-gray-100 text-black rounded-md hover:bg-gray-200 font-bold"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Medicine
                    </button>
                  </div>
                  <div className="space-y-3">
                    {medications.map((medication, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-bold text-black">Medicine #{index + 1}</span>
                          {medications.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMedication(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Medication Name *</label>
                            <input
                              type="text"
                              value={medication.name}
                              onChange={(e) => updateMedication(index, 'name', e.target.value)}
                              placeholder="e.g., Paracetamol"
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-black focus:border-black"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Dosage *</label>
                            <input
                              type="text"
                              value={medication.dosage}
                              onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                              placeholder="e.g., 500mg"
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-black focus:border-black"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Frequency *</label>
                            <input
                              type="text"
                              value={medication.frequency}
                              onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                              placeholder="e.g., 2x daily"
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-black focus:border-black"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Duration *</label>
                            <input
                              type="text"
                              value={medication.duration}
                              onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                              placeholder="e.g., 7 days"
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-black focus:border-black"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Instructions</label>
                  <textarea
                    name="instructions"
                    placeholder="Additional instructions for the patient..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                    rows={3}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-black font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}





