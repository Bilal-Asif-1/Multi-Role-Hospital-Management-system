interface PatientSummaryCardProps {
  patient: any
  assignedDoctor?: any
  assignedNurse?: any
}

export function PatientSummaryCard({
  patient,
  assignedDoctor,
  assignedNurse,
}: PatientSummaryCardProps) {
  if (!patient) return null

  const { user } = patient
  const gender = patient?.gender || user?.gender
  const cnic = patient?.cnic || user?.cnic
  const dateOfBirth = patient?.dateOfBirth || user?.dateOfBirth

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl p-4 shadow">
        <h3 className="text-lg font-bold text-black mb-2">Patient</h3>
        <p className="text-black font-bold">
          {user?.firstName} {user?.lastName}
        </p>
        <p className="text-sm text-black">{user?.email}</p>
        {user?.phone && <p className="text-sm text-black">{user.phone}</p>}
        {gender && <p className="text-sm text-black"><span className="font-semibold">Gender:</span> {gender}</p>}
        {cnic && <p className="text-sm text-black"><span className="font-semibold">CNIC:</span> {cnic}</p>}
        {dateOfBirth && <p className="text-sm text-black"><span className="font-semibold">DOB:</span> {new Date(dateOfBirth).toLocaleDateString()}</p>}
      </div>
      <div className="bg-white rounded-xl p-4 shadow">
        <h3 className="text-lg font-bold text-black mb-2">Assigned Staff</h3>
        <div className="space-y-2 text-sm text-black">
          {assignedDoctor ? (
            <p>
              <span className="font-bold">Doctor:</span> {assignedDoctor.firstName}{' '}
              {assignedDoctor.lastName}
            </p>
          ) : (
            <p>No doctor assigned</p>
          )}
          {assignedNurse ? (
            <p>
              <span className="font-bold">Nurse:</span> {assignedNurse.firstName}{' '}
              {assignedNurse.lastName}
            </p>
          ) : (
            <p>No nurse assigned</p>
          )}
        </div>
      </div>
    </div>
  )
}


