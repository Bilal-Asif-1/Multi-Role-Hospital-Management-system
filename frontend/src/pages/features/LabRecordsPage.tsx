import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { labRecordsApi, patientsApi } from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, FlaskConical } from 'lucide-react'
import { format } from 'date-fns'

export default function LabRecordsPage() {
  const [showModal, setShowModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: labRecords, isLoading } = useQuery({
    queryKey: ['lab-records'],
    queryFn: () => labRecordsApi.getAll(),
  })

  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsApi.getAll(),
  })

  const createMutation = useMutation({
    mutationFn: labRecordsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-records'] })
      setShowModal(false)
      toast.success('Lab record created successfully')
    },
    onError: () => {
      toast.error('Failed to create lab record')
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createMutation.mutate({
      patientId: formData.get('patientId') as string,
      testName: formData.get('testName') as string,
      testDate: new Date(),
      results: formData.get('results') as string,
      status: formData.get('status') as string,
      notes: formData.get('notes') as string,
    })
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Lab Records</h1>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Lab Record
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {labRecords?.map((record: any) => (
              <li key={record.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-start">
                    <FlaskConical className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {record.testName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {record.patient?.user?.firstName} {record.patient?.user?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(record.testDate), 'MMM dd, yyyy')}
                      </p>
                      {record.results && (
                        <p className="text-sm text-gray-700 mt-2">{record.results}</p>
                      )}
                      {record.status && (
                        <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                          record.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          record.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {record.status}
                        </span>
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
            <h3 className="text-lg font-bold mb-4">Add Lab Record</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <select name="patientId" required className="w-full px-3 py-2 border rounded-md">
                  <option value="">Select Patient</option>
                  {patients?.map((patient: any) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.user?.firstName} {patient.user?.lastName}
                    </option>
                  ))}
                </select>
                <input
                  name="testName"
                  placeholder="Test Name"
                  required
                  className="w-full px-3 py-2 border rounded-md"
                />
                <select name="status" className="w-full px-3 py-2 border rounded-md">
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                </select>
                <textarea
                  name="results"
                  placeholder="Results"
                  className="w-full px-3 py-2 border rounded-md"
                  rows={4}
                />
                <textarea
                  name="notes"
                  placeholder="Notes"
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
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





