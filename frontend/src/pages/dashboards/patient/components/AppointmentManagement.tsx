import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appointmentsApi, doctorsApi } from '../../../../services/api'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../../../contexts/AuthContext'
import AppointmentsList from './AppointmentsList'
import BookAppointmentModal from './BookAppointmentModal'
import RescheduleModal from './RescheduleModal'

export default function AppointmentManagement() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showBookModal, setShowBookModal] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)

  const { data: appointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.getAll(),
    refetchInterval: 15000,
  })

  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorsApi.getAll(),
  })

  const createMutation = useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Appointment booked successfully')
      setShowBookModal(false)
    },
    onError: () => {
      toast.error('Failed to book appointment')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: appointmentsApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Appointment cancelled')
    },
  })

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, appointmentDate, appointmentTime }: any) =>
      appointmentsApi.reschedule(id, appointmentDate, appointmentTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Appointment rescheduled')
      setShowRescheduleModal(false)
      setSelectedAppointment(null)
    },
  })

  const patientAppointments = appointments?.filter((apt: any) => apt.patientId === user?.id) || []

  const handleBookAppointment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createMutation.mutate({
      patientId: user?.id,
      doctorId: formData.get('doctorId') as string,
      appointmentDate: new Date(formData.get('appointmentDate') as string),
      appointmentTime: formData.get('appointmentTime') as string,
      reason: formData.get('reason') as string,
    })
  }

  const handleReschedule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    rescheduleMutation.mutate({
      id: selectedAppointment.id,
      appointmentDate: formData.get('appointmentDate') as string,
      appointmentTime: formData.get('appointmentTime') as string,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-black">Appointment Management</h2>
        <button
          onClick={() => setShowBookModal(true)}
          className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
        >
          <Plus className="h-5 w-5 mr-2" />
          Book Appointment
        </button>
      </div>

      <AppointmentsList
        appointments={patientAppointments}
        onReschedule={(apt) => {
          setSelectedAppointment(apt)
          setShowRescheduleModal(true)
        }}
        onCancel={(id) => cancelMutation.mutate(id)}
      />

      {showBookModal && (
        <BookAppointmentModal
          doctors={doctors}
          onSubmit={handleBookAppointment}
          onClose={() => setShowBookModal(false)}
          loading={createMutation.isPending}
        />
      )}

      {showRescheduleModal && selectedAppointment && (
        <RescheduleModal
          appointment={selectedAppointment}
          onSubmit={handleReschedule}
          onClose={() => {
            setShowRescheduleModal(false)
            setSelectedAppointment(null)
          }}
          loading={rescheduleMutation.isPending}
        />
      )}
    </div>
  )
}
