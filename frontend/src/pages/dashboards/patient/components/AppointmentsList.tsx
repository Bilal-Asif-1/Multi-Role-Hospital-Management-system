import { Calendar, Clock, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface AppointmentsListProps {
  appointments: any[]
  onReschedule: (appointment: any) => void
  onCancel: (id: string) => void
}

export default function AppointmentsList({
  appointments,
  onReschedule,
  onCancel,
}: AppointmentsListProps) {
  return (
    <div className="bg-white shadow-lg rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Appointments</h3>
      <div className="space-y-3">
        {appointments.length > 0 ? (
          appointments.map((apt: any) => (
            <div key={apt.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    {format(new Date(apt.appointmentDate), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <Clock className="h-4 w-4 mr-1" />
                    {apt.appointmentTime}
                  </p>
                  {apt.reason && (
                    <p className="text-sm text-gray-500 mt-1">Reason: {apt.reason}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    apt.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                    apt.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    apt.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {apt.status}
                  </span>
                  {apt.status === 'SCHEDULED' && (
                    <>
                      <button
                        onClick={() => onReschedule(apt)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Reschedule"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => onCancel(apt.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Cancel"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-8">No appointments found</p>
        )}
      </div>
    </div>
  )
}



