import { useQuery } from '@tanstack/react-query'
import { visitNotesApi, labRecordsApi } from '../../services/api'
import { FileText, FlaskConical } from 'lucide-react'
import { format } from 'date-fns'

export default function MedicalRecordsPage() {
  const { data: visitNotes, isLoading: notesLoading } = useQuery({
    queryKey: ['visit-notes'],
    queryFn: () => visitNotesApi.getAll(),
  })

  const { data: labRecords, isLoading: labLoading } = useQuery({
    queryKey: ['lab-records'],
    queryFn: () => labRecordsApi.getAll(),
  })

  if (notesLoading || labLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Medical Records</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Visit Notes</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {visitNotes?.length > 0 ? (
              visitNotes.map((note: any) => (
                <li key={note.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-start">
                      <FileText className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(note.visitDate), 'MMM dd, yyyy')}
                        </p>
                        {note.chiefComplaint && (
                          <p className="text-sm text-gray-700 mt-2">
                            <strong>Chief Complaint:</strong> {note.chiefComplaint}
                          </p>
                        )}
                        {note.diagnosis && (
                          <p className="text-sm text-gray-700 mt-1">
                            <strong>Diagnosis:</strong> {note.diagnosis}
                          </p>
                        )}
                        {note.treatmentPlan && (
                          <p className="text-sm text-gray-700 mt-1">
                            <strong>Treatment Plan:</strong> {note.treatmentPlan}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-4 text-center text-gray-500">No visit notes found</li>
            )}
          </ul>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Lab Records</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {labRecords?.length > 0 ? (
              labRecords.map((record: any) => (
                <li key={record.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-start">
                      <FlaskConical className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {record.testName}
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
              ))
            ) : (
              <li className="px-4 py-4 text-center text-gray-500">No lab records found</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}





