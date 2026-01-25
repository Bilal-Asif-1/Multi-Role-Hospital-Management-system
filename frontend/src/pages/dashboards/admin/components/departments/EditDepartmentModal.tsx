import { X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { doctorsApi } from '../../../../../services/api'
import { RoomSelectField } from './RoomSelectField'
import { DoctorSelectField } from './DoctorSelectField'
import { NurseSelectField } from './NurseSelectField'

interface EditDepartmentModalProps {
  isOpen: boolean
  department: any
  formData: { name: string; description: string; headDoctorId: string }
  onClose: () => void
  onSubmit: (e: React.FormEvent, selectedItems: any) => void
  onChange: (data: { name: string; description: string; headDoctorId: string }) => void
  isPending: boolean
}

export function EditDepartmentModal({
  isOpen,
  department,
  formData,
  onClose,
  onSubmit,
  onChange,
  isPending,
}: EditDepartmentModalProps) {
  const [selectedRooms, setSelectedRooms] = useState<string[]>([])
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([])
  const [selectedNurses, setSelectedNurses] = useState<string[]>([])

  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorsApi.getAll(),
    enabled: isOpen,
  })

  // Pre-populate with existing department data
  useEffect(() => {
    if (isOpen && department) {
      setSelectedRooms(department.rooms?.map((room: any) => room.id) || [])
      setSelectedDoctors(department.doctors?.map((doctor: any) => doctor.id) || [])
      setSelectedNurses(department.nurses?.map((nurse: any) => nurse.id) || [])
    }
  }, [isOpen, department])

  const fieldClass =
    'w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(e, {
      rooms: selectedRooms,
      doctors: selectedDoctors,
      nurses: selectedNurses,
    })
  }

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedRooms([])
      setSelectedDoctors([])
      setSelectedNurses([])
    }
  }, [isOpen])

  if (!isOpen || !department) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-black">Edit Department</h2>
          <button onClick={onClose} className="text-black hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-black border-b border-gray-200 pb-2">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-black mb-2">Department Name *</label>
                <input
                  type="text"
                  className={fieldClass}
                  value={formData.name}
                  onChange={(e) => onChange({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Cardiology"
                  disabled={false}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-2">Head Doctor</label>
                <select
                  className={fieldClass}
                  value={formData.headDoctorId}
                  onChange={(e) => onChange({ ...formData, headDoctorId: e.target.value })}
                  disabled={false}
                  autoComplete="off"
                >
                  <option value="">Select Head Doctor (Optional)</option>
                  {doctors?.map((doctor: any) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.user?.firstName} {doctor.user?.lastName} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-2">Rooms</label>
                <RoomSelectField selectedRooms={selectedRooms} onRoomsChange={setSelectedRooms} />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-2">Doctors</label>
                <DoctorSelectField selectedDoctors={selectedDoctors} onDoctorsChange={setSelectedDoctors} />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-2">Nurses</label>
                <NurseSelectField selectedNurses={selectedNurses} onNursesChange={setSelectedNurses} />
              </div>
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
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-black text-white rounded-md font-bold hover:bg-gray-900 disabled:opacity-50"
            >
              {isPending ? 'Updating...' : 'Update Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
