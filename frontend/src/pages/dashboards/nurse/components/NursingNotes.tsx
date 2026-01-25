import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { nursingNotesApi } from '../../../../services/api'
import { Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface NursingNotesProps {
  patients: any[]
  queryClient: any
  userId: string
}

export default function NursingNotes({
  patients,
  queryClient,
  userId,
}: NursingNotesProps) {
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState('')
  const [noteData, setNoteData] = useState({
    noteType: 'OBSERVATION',
    content: '',
    observations: '',
    interventions: '',
  })

  const noteMutation = useMutation({
    mutationFn: nursingNotesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nursing-notes'] })
      toast.success('Nursing note created successfully')
      setShowNoteModal(false)
      resetForm()
    },
    onError: () => {
      toast.error('Failed to create nursing note')
    },
  })

  const resetForm = () => {
    setSelectedPatient('')
    setNoteData({
      noteType: 'OBSERVATION',
      content: '',
      observations: '',
      interventions: '',
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    noteMutation.mutate({
      patientId: selectedPatient,
      ...noteData,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div></div>
        <button
          onClick={() => setShowNoteModal(true)}
          className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 font-bold"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Nursing Note
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-xl p-6">
        <p className="text-black font-bold">Nursing notes interface would display all notes here</p>
      </div>

      {showNoteModal && (
        <NoteModal
          patients={patients}
          selectedPatient={selectedPatient}
          noteData={noteData}
          onPatientChange={setSelectedPatient}
          onNoteChange={setNoteData}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowNoteModal(false)
            resetForm()
          }}
          loading={noteMutation.isPending}
        />
      )}
    </div>
  )
}

function NoteModal({
  patients,
  selectedPatient,
  noteData,
  onPatientChange,
  onNoteChange,
  onSubmit,
  onClose,
  loading,
}: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold text-black">Add Nursing Note</h3>
          <button onClick={onClose} className="text-black hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-black mb-1">Patient *</label>
            <select
              required
              value={selectedPatient}
              onChange={(e) => onPatientChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
            >
              <option value="">Select Patient</option>
              {patients?.map((p: any) => (
                <option key={p.id} value={p.userId}>
                  {p.user?.firstName} {p.user?.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-black mb-1">Note Type</label>
            <select
              value={noteData.noteType}
              onChange={(e) => onNoteChange({ ...noteData, noteType: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
            >
              <option value="OBSERVATION">Observation</option>
              <option value="INTERVENTION">Intervention</option>
              <option value="ASSESSMENT">Assessment</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-black mb-1">Content *</label>
            <textarea
              required
              value={noteData.content}
              onChange={(e) => onNoteChange({ ...noteData, content: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black resize-none"
              placeholder="Enter note content..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-black mb-1">Observations</label>
            <textarea
              value={noteData.observations}
              onChange={(e) => onNoteChange({ ...noteData, observations: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black resize-none"
              placeholder="Patient observations..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-black mb-1">Interventions</label>
            <textarea
              value={noteData.interventions}
              onChange={(e) => onNoteChange({ ...noteData, interventions: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black resize-none"
              placeholder="Nursing interventions performed..."
            />
          </div>
          <div className="flex space-x-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-black hover:bg-gray-50 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-3 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 font-bold"
            >
              {loading ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}



