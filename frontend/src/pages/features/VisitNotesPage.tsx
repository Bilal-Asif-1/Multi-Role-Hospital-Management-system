import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { visitNotesApi, patientsApi, doctorsApi } from '../../services/api'
import { useRole } from '../../hooks/useRole'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Plus, FileText, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

export default function VisitNotesPage() {
  const [showModal, setShowModal] = useState(false)
  const [selectedPatientFilter, setSelectedPatientFilter] = useState<any | null>(null)
  const queryClient = useQueryClient()
  const { isDoctor, isAdmin, user } = useRole()
  const location = useLocation()

  // Get doctor profile for filtering
  const { data: doctorProfile } = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: () => doctorsApi.getMyProfile(),
    enabled: isDoctor && !!user?.id,
  })

  // Pre-fill patient filter if coming from patient page
  useEffect(() => {
    if (location.state?.selectedPatient) {
      setSelectedPatientFilter(location.state.selectedPatient)
    }
  }, [location.state])

  const { data: allVisitNotes, isLoading, refetch } = useQuery({
    queryKey: ['visit-notes'],
    queryFn: () => visitNotesApi.getAll(),
    refetchOnWindowFocus: true,
  })


  // Filter visit notes by selected patient if provided
  // Backend already filters by doctor, so we don't need to filter again
  const visitNotes = useMemo(() => {
    if (!allVisitNotes) return []
    
    let filtered = allVisitNotes
    
    // Only filter by selected patient if provided
    if (selectedPatientFilter) {
      filtered = filtered.filter((note: any) => 
        note.patientId === selectedPatientFilter.id || 
        note.patient?.id === selectedPatientFilter.id ||
        note.patient?.userId === selectedPatientFilter.userId
      )
    }
    
    return filtered
  }, [allVisitNotes, selectedPatientFilter])

  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsApi.getAll(),
  })

  const createMutation = useMutation({
    mutationFn: visitNotesApi.create,
    onSuccess: async (data) => {
      // Invalidate and refetch to show new note immediately
      queryClient.invalidateQueries({ queryKey: ['visit-notes'] })
      // Wait a bit for backend to process, then refetch
      setTimeout(async () => {
        await refetch()
      }, 500)
      setShowModal(false)
      toast.success('Visit note created successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create visit note')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: visitNotesApi.delete,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['visit-notes'] })
      await refetch()
      toast.success('Visit note deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete visit note')
    },
  })

  const handleDelete = (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this visit note? This action cannot be undone.')) {
      deleteMutation.mutate(noteId)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createMutation.mutate({
      patientId: formData.get('patientId') as string,
      visitDate: new Date(),
      chiefComplaint: formData.get('chiefComplaint') as string,
      diagnosis: formData.get('diagnosis') as string,
      treatmentPlan: formData.get('treatmentPlan') as string,
      notes: formData.get('notes') as string,
    })
  }

  // Filter patients for doctors to show only their existing patients
  const filteredPatients = useMemo(() => {
    if (!patients) return []
    
    if (!isDoctor) {
      return patients
    }
    
    // For doctors, filter to show only patients they have appointments/visit notes/prescriptions with
    // This is handled in the backend or can be filtered client-side if needed
    return patients
  }, [patients, isDoctor])

  return (
    <div className="pl-6 pr-8 pt-6 pb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-black">Visit Notes (EHR)</h1>
          {selectedPatientFilter && (
            <p className="text-sm text-gray-600 mt-1">
              Showing notes for: {selectedPatientFilter.user?.firstName} {selectedPatientFilter.user?.lastName}
            </p>
          )}
          {!selectedPatientFilter && (
            <p className="text-sm text-gray-600 mt-1">
              {visitNotes?.length || 0} visit note{visitNotes?.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-black hover:bg-gray-900"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Visit Note
        </button>
      </div>

      {selectedPatientFilter && (
        <div className="mb-4">
          <button
            onClick={() => setSelectedPatientFilter(null)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear patient filter
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-black font-bold">Loading...</div>
      ) : !allVisitNotes || visitNotes?.length === 0 ? (
        <div className="bg-white shadow-lg rounded-xl p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-black font-bold">No visit notes found</p>
          {selectedPatientFilter && (
            <p className="text-sm text-gray-600 mt-2">No visit notes found for this patient.</p>
          )}
          {!selectedPatientFilter && isDoctor && (
            <p className="text-sm text-gray-600 mt-2">Create your first visit note using the "Add Visit Note" button above.</p>
          )}
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="p-3 border-b border-gray-200">
            <p className="text-sm font-bold text-black">
              Total: {visitNotes?.length || 0} visit note{visitNotes?.length !== 1 ? 's' : ''}
            </p>
          </div>
          <ul className="divide-y divide-gray-200">
            {visitNotes?.map((note: any) => (
              <li key={note.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-start">
                    <FileText className="h-5 w-5 text-black mr-3 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-bold text-black">
                            {note.patient?.user?.firstName} {note.patient?.user?.lastName || 'Unknown Patient'}
                          </p>
                          {note.doctor && (
                            <span className="text-xs text-gray-500">
                              (Dr. {note.doctor?.user?.firstName} {note.doctor?.user?.lastName})
                            </span>
                          )}
                        </div>
                        {(isDoctor || isAdmin) && (
                          <button
                            onClick={() => handleDelete(note.id)}
                            disabled={deleteMutation.isPending}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete visit note"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-600">
                        {format(new Date(note.visitDate), 'MMM dd, yyyy')}
                      </p>
                      {note.chiefComplaint && (
                        <p className="text-sm text-black mt-2">
                          <strong>Chief Complaint:</strong> {note.chiefComplaint}
                        </p>
                      )}
                      {note.diagnosis && (
                        <p className="text-sm text-black mt-1">
                          <strong>Diagnosis:</strong> {note.diagnosis}
                        </p>
                      )}
                      {note.treatmentPlan && (
                        <p className="text-sm text-black mt-1">
                          <strong>Treatment Plan:</strong> {note.treatmentPlan}
                        </p>
                      )}
                      {note.notes && (
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Notes:</strong> {note.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-black mb-4">Add Visit Note</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <select 
                  name="patientId" 
                  required 
                  className="w-full px-3 py-2 border rounded-md"
                  defaultValue={selectedPatientFilter?.id || ''}
                >
                  <option value="">Select Patient</option>
                  {filteredPatients?.map((patient: any) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.user?.firstName} {patient.user?.lastName}
                    </option>
                  ))}
                </select>
                <textarea
                  name="chiefComplaint"
                  placeholder="Chief Complaint"
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
                <textarea
                  name="diagnosis"
                  placeholder="Diagnosis"
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
                <textarea
                  name="treatmentPlan"
                  placeholder="Treatment Plan"
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
                <textarea
                  name="notes"
                  placeholder="Additional Notes"
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-black font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 font-bold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}





