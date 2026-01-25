import { useQuery } from '@tanstack/react-query'
import { doctorsApi } from '../../../../../services/api'
import { X } from 'lucide-react'

interface DoctorSelectFieldProps {
  selectedDoctors: string[]
  onDoctorsChange: (doctorIds: string[]) => void
}

export function DoctorSelectField({ selectedDoctors, onDoctorsChange }: DoctorSelectFieldProps) {
  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorsApi.getAll(),
  })

  const selectedDoctorsData = doctors?.filter((doctor: any) => selectedDoctors.includes(doctor.id)) || []

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const doctorId = e.target.value
    if (doctorId && !selectedDoctors.includes(doctorId)) {
      onDoctorsChange([...selectedDoctors, doctorId])
    }
  }

  const removeDoctor = (doctorId: string) => {
    onDoctorsChange(selectedDoctors.filter((id) => id !== doctorId))
  }

  return (
    <div className="space-y-2">
      <select
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black"
        value=""
        onChange={handleSelectChange}
        disabled={false}
        autoComplete="off"
      >
        <option value="">Select Doctor</option>
        {doctors
          ?.filter((doctor: any) => !selectedDoctors.includes(doctor.id))
          .map((doctor: any) => (
            <option key={doctor.id} value={doctor.id}>
              Dr. {doctor.user?.firstName} {doctor.user?.lastName} - {doctor.specialization || 'N/A'}
            </option>
          ))}
      </select>

      {selectedDoctorsData.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedDoctorsData.map((doctor: any) => (
            <span
              key={doctor.id}
              className="inline-flex items-center px-3 py-1 bg-black text-white rounded-full text-sm font-bold"
            >
              Dr. {doctor.user?.firstName} {doctor.user?.lastName}
              <button
                type="button"
                onClick={() => removeDoctor(doctor.id)}
                className="ml-2 hover:text-gray-300"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

