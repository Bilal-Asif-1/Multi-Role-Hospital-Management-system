interface StaffTabProps {
  overview: any
}

export function StaffTab({ overview }: StaffTabProps) {
  const doctors = overview.appointments
    ? overview.appointments.reduce((acc: any[], appointment: any) => {
        if (!appointment.doctor) return acc
        if (!acc.find((doc) => doc.id === appointment.doctor.id)) {
          acc.push(appointment.doctor)
        }
        return acc
      }, [])
    : []

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-4 shadow">
        <h3 className="text-lg font-bold text-black mb-2">Assigned Doctor</h3>
        {overview.assignedDoctor ? (
          <p className="text-black font-bold">
            {overview.assignedDoctor.firstName} {overview.assignedDoctor.lastName}
          </p>
        ) : (
          <p className="text-sm text-black">No doctor assigned.</p>
        )}
      </div>

      <div className="bg-white rounded-xl p-4 shadow">
        <h3 className="text-lg font-bold text-black mb-2">Assigned Nurse</h3>
        {overview.assignedNurse ? (
          <p className="text-black font-bold">
            {overview.assignedNurse.firstName} {overview.assignedNurse.lastName}
          </p>
        ) : (
          <p className="text-sm text-black">No nurse assigned.</p>
        )}
      </div>

      <div className="bg-white rounded-xl p-4 shadow">
        <h3 className="text-lg font-bold text-black mb-2">Care Team</h3>
        {doctors.length > 0 ? (
          <ul className="space-y-2 text-sm text-black">
            {doctors.map((doctor: any) => (
              <li key={doctor.id} className="flex justify-between">
                <span className="font-bold">
                  {doctor.firstName} {doctor.lastName}
                </span>
                <span>{doctor.email}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-black">No doctors recorded in appointments.</p>
        )}
      </div>
    </div>
  )
}


