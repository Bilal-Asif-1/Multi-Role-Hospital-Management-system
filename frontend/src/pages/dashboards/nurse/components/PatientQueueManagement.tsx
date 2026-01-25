import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { patientQueueApi } from '../../../../services/api'
import { Plus, X, Clock } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface PatientQueueManagementProps {
  queue: any[]
  patients: any[]
  appointments: any[]
  queryClient: any
}

export default function PatientQueueManagement({
  queue,
  patients,
  appointments,
  queryClient,
}: PatientQueueManagementProps) {
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState('')
  const [priority, setPriority] = useState('NORMAL')

  const checkInMutation = useMutation({
    mutationFn: patientQueueApi.checkIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-queue'] })
      toast.success('Patient checked in successfully')
      setShowCheckInModal(false)
      resetForm()
    },
    onError: () => {
      toast.error('Failed to check in patient')
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      patientQueueApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-queue'] })
      toast.success('Patient status updated')
    },
  })

  const resetForm = () => {
    setSelectedPatient('')
    setSelectedAppointment('')
    setPriority('NORMAL')
  }

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault()
    checkInMutation.mutate({
      patientId: selectedPatient,
      appointmentId: selectedAppointment || undefined,
      priority,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div></div>
        <button
          onClick={() => setShowCheckInModal(true)}
          className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 font-bold"
        >
          <Plus className="h-5 w-5 mr-2" />
          Check-In Patient
        </button>
      </div>

      {/* Queue Status Dashboard */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-bold text-black">Waiting</h3>
            <p className="text-2xl font-bold text-black">
              {queue?.filter((q: any) => q.status === 'WAITING').length || 0}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-bold text-black">In Consultation</h3>
            <p className="text-2xl font-bold text-black">
              {queue?.filter((q: any) => q.status === 'IN_CONSULTATION').length || 0}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-bold text-black">Completed</h3>
            <p className="text-2xl font-bold text-black">
              {queue?.filter((q: any) => q.status === 'COMPLETED').length || 0}
            </p>
          </div>
        </div>

        {/* Queue List */}
        <div className="space-y-3">
          {queue && queue.length > 0 ? (
            queue.map((item: any) => (
              <div key={item.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-black">
                      {item.patient?.user?.firstName} {item.patient?.user?.lastName}
                    </p>
                    <p className="text-sm text-black flex items-center mt-1">
                      <Clock className="h-4 w-4 mr-1 text-black" />
                      Checked in: {format(new Date(item.checkedInAt), 'MMM dd, HH:mm')}
                    </p>
                    {item.doctor && (
                      <p className="text-sm text-black">
                        Doctor: {item.doctor.firstName} {item.doctor.lastName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      item.status === 'WAITING' ? 'bg-gray-700 text-white' :
                      item.status === 'IN_CONSULTATION' ? 'bg-gray-800 text-white' :
                      'bg-black text-white'
                    }`}>
                      {item.status.replace('_', ' ')}
                    </span>
                    {item.status === 'WAITING' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'IN_CONSULTATION' })}
                        className="px-3 py-1 text-sm bg-black text-white rounded hover:bg-gray-900 font-bold"
                      >
                        Start Consultation
                      </button>
                    )}
                    {item.status === 'IN_CONSULTATION' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'COMPLETED' })}
                        className="px-3 py-1 text-sm bg-black text-white rounded hover:bg-gray-900 font-bold"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-black py-8 font-bold">No patients in queue</p>
          )}
        </div>
      </div>

      {/* Check-In Modal */}
      {showCheckInModal && (
        <CheckInModal
          patients={patients}
          appointments={appointments}
          selectedPatient={selectedPatient}
          selectedAppointment={selectedAppointment}
          priority={priority}
          onPatientChange={setSelectedPatient}
          onAppointmentChange={setSelectedAppointment}
          onPriorityChange={setPriority}
          onSubmit={handleCheckIn}
          onClose={() => {
            setShowCheckInModal(false)
            resetForm()
          }}
          loading={checkInMutation.isPending}
        />
      )}
    </div>
  )
}

function CheckInModal({
  patients,
  appointments,
  selectedPatient,
  selectedAppointment,
  priority,
  onPatientChange,
  onAppointmentChange,
  onPriorityChange,
  onSubmit,
  onClose,
  loading,
}: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-black">Check-In Patient</h3>
          <button onClick={onClose} className="text-black hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-black mb-2">Patient</label>
            <select
              required
              value={selectedPatient}
              onChange={(e) => onPatientChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
            >
              <option value="">Select Patient</option>
              {patients?.map((p: any) => (
                <option key={p.id} value={p.userId}>
                  {p.user?.firstName} {p.user?.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-black mb-2">Appointment (Optional)</label>
            <select
              value={selectedAppointment}
              onChange={(e) => onAppointmentChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
            >
              <option value="">No Appointment</option>
              {appointments?.map((apt: any) => (
                <option key={apt.id} value={apt.id}>
                  {apt.patient?.firstName} {apt.patient?.lastName} - {format(new Date(apt.appointmentDate), 'MMM dd')} {apt.appointmentTime}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-black mb-2">Priority</label>
            <select
              value={priority}
              onChange={(e) => onPriorityChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
            >
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-black hover:bg-gray-50 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 font-bold"
            >
              {loading ? 'Checking In...' : 'Check-In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}



