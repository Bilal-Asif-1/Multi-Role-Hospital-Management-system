import { Calendar, FlaskConical, Pill, FileText, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface PersonalSnapshotProps {
  appointments: any[]
  labRecords: any[]
  prescriptions: any[]
  visitNotes: any[]
}

export default function PersonalSnapshot({
  appointments,
  labRecords,
  prescriptions,
  visitNotes,
}: PersonalSnapshotProps) {
  const upcomingAppointments = appointments?.filter(
    (apt: any) => new Date(apt.appointmentDate) >= new Date() && apt.status === 'SCHEDULED'
  ).slice(0, 3) || []

  const recentLabReports = labRecords?.slice(0, 3) || []
  const activePrescriptions = prescriptions?.filter((pres: any) => {
    if (!pres.validUntil) return true
    return new Date(pres.validUntil) >= new Date()
  }).slice(0, 3) || []

  const recentConsultations = appointments?.slice(0, 3) || []

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Personal Snapshot</h2>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow-lg rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="bg-blue-500 rounded-lg p-3">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 ml-4">
              <p className="text-sm font-medium text-gray-600">Upcoming Appointments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{upcomingAppointments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="bg-purple-500 rounded-lg p-3">
              <FlaskConical className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 ml-4">
              <p className="text-sm font-medium text-gray-600">Recent Lab Reports</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{recentLabReports.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="bg-green-500 rounded-lg p-3">
              <Pill className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 ml-4">
              <p className="text-sm font-medium text-gray-600">Active Prescriptions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{activePrescriptions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="bg-indigo-500 rounded-lg p-3">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 ml-4">
              <p className="text-sm font-medium text-gray-600">Recent Consultations</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{recentConsultations.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-500" />
          Upcoming Appointments
        </h3>
        <div className="space-y-3">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((apt: any) => (
              <div key={apt.id} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      {format(new Date(apt.appointmentDate), 'MMM dd, yyyy')} at {apt.appointmentTime}
                    </p>
                    {apt.reason && (
                      <p className="text-sm text-gray-500 mt-1">Reason: {apt.reason}</p>
                    )}
                  </div>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {apt.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">No upcoming appointments</p>
          )}
        </div>
      </div>

      {/* Recent Lab Reports */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FlaskConical className="h-5 w-5 mr-2 text-purple-500" />
          Recent Lab Reports
        </h3>
        <div className="space-y-3">
          {recentLabReports.length > 0 ? (
            recentLabReports.map((lab: any) => (
              <div key={lab.id} className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{lab.testName}</p>
                    <p className="text-sm text-gray-600">
                      Date: {format(new Date(lab.testDate), 'MMM dd, yyyy')}
                    </p>
                    <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${
                      lab.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {lab.status || 'PENDING'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">No lab reports</p>
          )}
        </div>
      </div>

      {/* Active Prescriptions */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Pill className="h-5 w-5 mr-2 text-green-500" />
          Active Prescriptions
        </h3>
        <div className="space-y-3">
          {activePrescriptions.length > 0 ? (
            activePrescriptions.map((pres: any) => (
              <div key={pres.id} className="p-4 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {Array.isArray(pres.medications) ? pres.medications.map((m: any) => m.name).join(', ') : 'Prescription'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Prescribed: {format(new Date(pres.prescribedDate), 'MMM dd, yyyy')}
                    </p>
                    {pres.validUntil && (
                      <p className="text-sm text-gray-500 mt-1">
                        Valid until: {format(new Date(pres.validUntil), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">No active prescriptions</p>
          )}
        </div>
      </div>

      {/* Recent Consultations */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-indigo-500" />
          Recent Consultations Summary
        </h3>
        <div className="space-y-3">
          {recentConsultations.length > 0 ? (
            recentConsultations.map((appointment: any) => (
              <div key={appointment.id} className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <div>
                  <p className="font-semibold text-gray-900">
                    Appointment: {format(new Date(appointment.appointmentDate), 'MMM dd, yyyy')} at {appointment.appointmentTime}
                  </p>
                  {appointment.doctor && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Doctor:</span> Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                    </p>
                  )}
                  {appointment.reason && (
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="font-medium">Reason:</span> {appointment.reason}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Status: {appointment.status}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">No recent consultations</p>
          )}
        </div>
      </div>
    </div>
  )
}



