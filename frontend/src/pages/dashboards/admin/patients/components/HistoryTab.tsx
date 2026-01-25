interface HistoryTabProps {
  overview: any
}

export function HistoryTab({ overview }: HistoryTabProps) {
  const stateLogs = overview.stateLogs || []
  const visitNotes = overview.patient?.visitNotes || []
  const labRecords = overview.patient?.labRecords || []
  const prescriptions = overview.patient?.prescriptions || []

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl p-4 shadow">
        <h3 className="text-lg font-bold text-black mb-2">State Changes</h3>
        {stateLogs.length === 0 ? (
          <p className="text-sm text-black">No state changes recorded.</p>
        ) : (
          <ul className="space-y-2">
            {stateLogs.map((log: any) => (
              <li key={log.id} className="border border-gray-100 rounded-lg p-3">
                <p className="text-sm font-bold text-black">{log.toState}</p>
                <p className="text-xs text-gray-500">
                  {new Date(log.createdAt).toLocaleString()}
                </p>
                {log.context && <p className="text-xs text-black mt-1">{log.context}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-xl p-4 shadow">
        <h3 className="text-lg font-bold text-black mb-2">Visit Notes</h3>
        {visitNotes.length === 0 ? (
          <p className="text-sm text-black">No visit notes recorded.</p>
        ) : (
          <ul className="space-y-2 text-sm text-black">
            {visitNotes.map((note: any) => (
              <li key={note.id} className="border border-gray-100 rounded-lg p-3">
                <p className="font-bold">{note.doctor?.user?.firstName} {note.doctor?.user?.lastName}</p>
                <p>{note.chiefComplaint || 'No complaint recorded'}</p>
                <p className="text-xs text-gray-500">
                  {new Date(note.visitDate).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-xl p-4 shadow">
        <h3 className="text-lg font-bold text-black mb-2">Lab Records</h3>
        {labRecords.length === 0 ? (
          <p className="text-sm text-black">No lab records.</p>
        ) : (
          <ul className="space-y-2 text-sm text-black">
            {labRecords.map((record: any) => (
              <li key={record.id} className="border border-gray-100 rounded-lg p-3">
                <p className="font-bold">{record.testName}</p>
                <p>Status: {record.status || 'N/A'}</p>
                <p className="text-xs text-gray-500">
                  {new Date(record.testDate).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-xl p-4 shadow">
        <h3 className="text-lg font-bold text-black mb-2">Prescriptions</h3>
        {prescriptions.length === 0 ? (
          <p className="text-sm text-black">No prescriptions issued.</p>
        ) : (
          <ul className="space-y-2 text-sm text-black">
            {prescriptions.map((rx: any) => (
              <li key={rx.id} className="border border-gray-100 rounded-lg p-3">
                <p className="font-bold">{rx.doctor?.firstName} {rx.doctor?.lastName}</p>
                <p>{Array.isArray(rx.medications) ? rx.medications.length : 0} medications</p>
                <p className="text-xs text-gray-500">
                  {new Date(rx.prescribedDate).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}


