import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doctorsApi } from '../../../../../services/api'
import toast from 'react-hot-toast'
import { Edit, Save, X } from 'lucide-react'

interface DoctorInlineEditProps {
  doctor: any
  field: string
  label: string
  type?: 'text' | 'select'
  options?: string[]
}

export function DoctorInlineEdit({
  doctor,
  field,
  label,
  type = 'text',
  options,
}: DoctorInlineEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(doctor[field] || '')
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: (data: any) => doctorsApi.update(doctor.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      queryClient.invalidateQueries({ queryKey: ['doctor', doctor.id] })
      setIsEditing(false)
      toast.success('Doctor updated successfully')
    },
    onError: () => {
      toast.error('Failed to update doctor')
    },
  })

  const handleSave = () => {
    updateMutation.mutate({ [field]: value })
  }

  const handleCancel = () => {
    setValue(doctor[field] || '')
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2">
        {type === 'select' ? (
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded-md focus:ring-black focus:border-black text-sm"
          >
            {options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded-md focus:ring-black focus:border-black text-sm"
          />
        )}
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="text-green-600 hover:text-green-800"
          title="Save"
        >
          <Save className="h-4 w-4" />
        </button>
        <button onClick={handleCancel} className="text-red-600 hover:text-red-800" title="Cancel">
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-black font-bold">{value || 'N/A'}</span>
      <button
        onClick={() => setIsEditing(true)}
        className="text-gray-500 hover:text-black"
        title="Edit"
      >
        <Edit className="h-3 w-3" />
      </button>
    </div>
  )
}

