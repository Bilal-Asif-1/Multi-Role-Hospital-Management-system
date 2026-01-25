import { PatientSummaryCard } from './PatientSummaryCard'

interface OverviewTabProps {
  overview: any
}

export function OverviewTab({ overview }: OverviewTabProps) {
  const { patient, currentAssignment, assignedDoctor, assignedNurse } = overview

  return (
    <div className="space-y-6">
      <PatientSummaryCard
        patient={patient}
        assignedDoctor={assignedDoctor}
        assignedNurse={assignedNurse}
      />

      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <div className="bg-white rounded-xl p-4 shadow">
          <h3 className="text-lg font-bold text-black mb-2">Current Assignment</h3>
          {currentAssignment ? (
            <div className="space-y-1 text-sm text-black">
              <p>
                <span className="font-bold">Room:</span> {currentAssignment.bed?.room?.roomNumber}
              </p>
              <p>
                <span className="font-bold">Bed:</span> {currentAssignment.bed?.label}
              </p>
              <p>
                <span className="font-bold">Status:</span> {currentAssignment.status}
              </p>
              <p>
                <span className="font-bold">Assigned:</span>{' '}
                {new Date(currentAssignment.assignedAt).toLocaleString()}
              </p>
              {currentAssignment.notes && <p>{currentAssignment.notes}</p>}
            </div>
          ) : (
            <p className="text-sm text-black">No active bed assignment</p>
          )}
        </div>
      </div>
    </div>
  )
}


