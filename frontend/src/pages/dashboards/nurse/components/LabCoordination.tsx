import { useMutation, useQueryClient } from '@tanstack/react-query'
import { labRecordsApi } from '../../../../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface LabCoordinationProps {
  labRecords: any[]
  queryClient: any
}

export default function LabCoordination({ labRecords, queryClient }: LabCoordinationProps) {
  const updateLabStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      labRecordsApi.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-records'] })
      toast.success('Lab status updated')
    },
  })

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Lab Coordination</h2>
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="space-y-3">
          {labRecords && labRecords.length > 0 ? (
            labRecords.map((lab: any) => (
              <div key={lab.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{lab.testName}</h3>
                    <p className="text-sm text-gray-600">
                      Patient: {lab.patient?.user?.firstName} {lab.patient?.user?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Date: {format(new Date(lab.testDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      lab.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      lab.status === 'COLLECTED' ? 'bg-blue-100 text-blue-800' :
                      lab.status === 'SENT' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {lab.status || 'PENDING'}
                    </span>
                    {lab.status === 'PENDING' && (
                      <button
                        onClick={() => updateLabStatusMutation.mutate({ id: lab.id, status: 'COLLECTED' })}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Mark Collected
                      </button>
                    )}
                    {lab.status === 'COLLECTED' && (
                      <button
                        onClick={() => updateLabStatusMutation.mutate({ id: lab.id, status: 'SENT' })}
                        className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        Mark Sent
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">No lab records</p>
          )}
        </div>
      </div>
    </div>
  )
}



