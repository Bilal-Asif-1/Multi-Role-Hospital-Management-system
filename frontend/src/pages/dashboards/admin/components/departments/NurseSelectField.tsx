import { useQuery } from '@tanstack/react-query'
import { nursesApi } from '../../../../../services/api'
import { X } from 'lucide-react'

interface NurseSelectFieldProps {
  selectedNurses: string[]
  onNursesChange: (nurseIds: string[]) => void
}

export function NurseSelectField({ selectedNurses, onNursesChange }: NurseSelectFieldProps) {
  const { data: nurses } = useQuery({
    queryKey: ['nurses'],
    queryFn: () => nursesApi.getAll(),
  })

  const selectedNursesData = nurses?.filter((nurse: any) => selectedNurses.includes(nurse.id)) || []

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nurseId = e.target.value
    if (nurseId && !selectedNurses.includes(nurseId)) {
      onNursesChange([...selectedNurses, nurseId])
    }
  }

  const removeNurse = (nurseId: string) => {
    onNursesChange(selectedNurses.filter((id) => id !== nurseId))
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
        <option value="">Select Nurse</option>
        {nurses
          ?.filter((nurse: any) => !selectedNurses.includes(nurse.id))
          .map((nurse: any) => (
            <option key={nurse.id} value={nurse.id}>
              {nurse.user?.firstName} {nurse.user?.lastName} - {nurse.user?.email}
            </option>
          ))}
      </select>

      {selectedNursesData.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedNursesData.map((nurse: any) => (
            <span
              key={nurse.id}
              className="inline-flex items-center px-3 py-1 bg-black text-white rounded-full text-sm font-bold"
            >
              {nurse.user?.firstName} {nurse.user?.lastName}
              <button
                type="button"
                onClick={() => removeNurse(nurse.id)}
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

