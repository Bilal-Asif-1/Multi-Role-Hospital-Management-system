interface AdmissionsTabProps {
  admissions: any[]
}

export function AdmissionsTab({ admissions }: AdmissionsTabProps) {
  if (!admissions || admissions.length === 0) {
    return <p className="text-black font-bold">No admissions or bed assignments recorded.</p>
  }

  return (
    <div className="space-y-4">
      {admissions.map((admission) => (
        <div key={admission.id} className="bg-white rounded-xl p-4 shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">
                {new Date(admission.assignedAt).toLocaleString()}
              </p>
              <p className="text-lg font-bold text-black">
                Room {admission.bed?.room?.roomNumber} · Bed {admission.bed?.label}
              </p>
              <p className="text-sm text-black">
                Status:{' '}
                <span className="font-bold">
                  {admission.status}
                </span>
              </p>
            </div>
            {admission.releasedAt && (
              <p className="text-sm text-gray-500">
                Released {new Date(admission.releasedAt).toLocaleString()}
              </p>
            )}
          </div>
          {admission.notes && <p className="text-sm text-black mt-2">{admission.notes}</p>}
        </div>
      ))}
    </div>
  )
}


