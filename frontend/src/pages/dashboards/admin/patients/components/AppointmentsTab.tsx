interface AppointmentsTabProps {
  appointments: any[]
}

export function AppointmentsTab({ appointments }: AppointmentsTabProps) {
  if (!appointments || appointments.length === 0) {
    return <p className="text-black font-bold">No appointments scheduled.</p>
  }

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
              Time
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
              Doctor
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
              Reason
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {appointments.map((appointment) => (
            <tr key={appointment.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm text-black font-bold">
                {new Date(appointment.appointmentDate).toLocaleDateString()}
              </td>
              <td className="px-4 py-2 text-sm text-black font-bold">{appointment.appointmentTime}</td>
              <td className="px-4 py-2 text-sm text-black">
                {appointment.doctor
                  ? `${appointment.doctor.firstName} ${appointment.doctor.lastName}`
                  : '—'}
              </td>
              <td className="px-4 py-2 text-sm">
                <span className="px-2 py-1 rounded-full bg-black text-white text-xs font-bold">
                  {appointment.status}
                </span>
              </td>
              <td className="px-4 py-2 text-sm text-black">{appointment.reason || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


