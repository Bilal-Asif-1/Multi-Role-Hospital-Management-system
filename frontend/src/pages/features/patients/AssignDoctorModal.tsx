import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { doctorsApi, appointmentsApi } from '../../../services/api'
import { X, Calendar, Clock, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, addDays } from 'date-fns'

interface AssignDoctorModalProps {
  open: boolean
  patient: any
  onClose: () => void
}

export function AssignDoctorModal({ open, patient, onClose }: AssignDoctorModalProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    specialization: '',
    appointmentDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    appointmentTime: '09:00',
    doctorId: '',
    reason: '',
  })

  const { data: doctors, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ['all-doctors'],
    queryFn: () => doctorsApi.getAll(),
    enabled: open,
  })

  const { data: availableDoctors, isLoading: isLoadingAvailable } = useQuery({
    queryKey: [
      'available-doctors',
      formData.specialization,
      formData.appointmentDate,
      formData.appointmentTime,
    ],
    queryFn: () =>
      doctorsApi.getAvailable({
        specialization: formData.specialization,
        start: formData.appointmentDate && formData.appointmentTime
          ? `${formData.appointmentDate}T${formData.appointmentTime}:00`
          : undefined,
      }),
    enabled: open && !!formData.specialization && !!formData.appointmentDate && !!formData.appointmentTime,
  })

  const createAppointmentMutation = useMutation({
    mutationFn: (data: any) => appointmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      queryClient.invalidateQueries({ queryKey: ['patient-overview'] })
      toast.success('Doctor assigned successfully! Appointment created.')
      onClose()
      setFormData({
        specialization: '',
        appointmentDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        appointmentTime: '09:00',
        doctorId: '',
        reason: '',
      })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to assign doctor')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.doctorId) {
      toast.error('Please select a doctor')
      return
    }
    if (!formData.appointmentDate || !formData.appointmentTime) {
      toast.error('Please select appointment date and time')
      return
    }

    createAppointmentMutation.mutate({
      patientId: patient.userId || patient.user?.id,
      doctorId: formData.doctorId,
      appointmentDate: new Date(`${formData.appointmentDate}T${formData.appointmentTime}:00`),
      appointmentTime: formData.appointmentTime,
      reason: formData.reason || 'Assigned by admin',
      status: 'SCHEDULED',
    })
  }

  if (!open) return null

  const fieldClass =
    'w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black'

  // Get unique specializations from all doctors
  const specializations = Array.from(
    new Set(doctors?.map((d: any) => d.specialization).filter(Boolean) || [])
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 sticky top-0 bg-white">
          <div className="flex items-center space-x-3">
            <User className="h-6 w-6 text-black" />
            <div>
              <h2 className="text-2xl font-bold text-black">Assign Doctor</h2>
              <p className="text-sm text-gray-600">
                {patient?.user?.firstName} {patient?.user?.lastName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-black hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-black mb-2">
                Specialization
              </label>
              <select
                className={fieldClass}
                value={formData.specialization}
                onChange={(e) =>
                  setFormData({ ...formData, specialization: e.target.value, doctorId: '' })
                }
                required
                disabled={false}
                autoComplete="off"
              >
                <option value="">Select Specialization</option>
                {specializations.map((spec: string) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-black mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Appointment Date
                </label>
                <input
                  type="date"
                  className={fieldClass}
                  value={formData.appointmentDate}
                  onChange={(e) =>
                    setFormData({ ...formData, appointmentDate: e.target.value, doctorId: '' })
                  }
                  min={format(new Date(), 'yyyy-MM-dd')}
                  required
                  disabled={false}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Appointment Time
                </label>
                <input
                  type="time"
                  className={fieldClass}
                  value={formData.appointmentTime}
                  onChange={(e) =>
                    setFormData({ ...formData, appointmentTime: e.target.value, doctorId: '' })
                  }
                  required
                  disabled={false}
                  autoComplete="off"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2">
                Select Doctor
              </label>
              {isLoadingAvailable ? (
                <p className="text-gray-600">Loading available doctors...</p>
              ) : availableDoctors && availableDoctors.length > 0 ? (
                <select
                  className={fieldClass}
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  required
                  disabled={false}
                  autoComplete="off"
                >
                  <option value="">Select Doctor</option>
                  {availableDoctors.map((doctor: any) => (
                    <option key={doctor.userId} value={doctor.userId}>
                      Dr. {doctor.user?.firstName} {doctor.user?.lastName} · {doctor.specialization}
                      {doctor.department && ` · ${doctor.department}`}
                    </option>
                  ))}
                </select>
              ) : formData.specialization ? (
                <p className="text-red-600 font-bold">
                  No available doctors found for this specialization and time slot.
                </p>
              ) : (
                <p className="text-gray-600">Please select specialization first</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2">
                Reason / Concern
              </label>
              <textarea
                className={`${fieldClass} min-h-[80px]`}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Enter reason for appointment..."
                disabled={false}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md font-bold text-black hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createAppointmentMutation.isPending || !formData.doctorId}
              className="flex-1 px-4 py-2 bg-black text-white rounded-md font-bold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createAppointmentMutation.isPending ? 'Assigning...' : 'Assign Doctor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

