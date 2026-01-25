import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { doctorsApi } from '../../services/api'
import toast from 'react-hot-toast'
import { Calendar, Clock } from 'lucide-react'

const daysOfWeek = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

export default function AvailabilityPage() {
  const [showModal, setShowModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: doctorProfile } = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: () => doctorsApi.getMyProfile(),
  })

  const { data: availability } = useQuery({
    queryKey: ['doctor-availability', doctorProfile?.id],
    queryFn: () => doctorsApi.getAvailability(doctorProfile?.id || ''),
    enabled: !!doctorProfile?.id,
  })

  const updateMutation = useMutation({
    mutationFn: doctorsApi.updateAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-availability'] })
      setShowModal(false)
      toast.success('Availability updated successfully')
    },
    onError: () => {
      toast.error('Failed to update availability')
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const availability = []
    
    for (let i = 0; i < 7; i++) {
      const dayEnabled = formData.get(`day-${i}-enabled`) === 'on'
      if (dayEnabled) {
        availability.push({
          dayOfWeek: i,
          startTime: formData.get(`day-${i}-start`) as string,
          endTime: formData.get(`day-${i}-end`) as string,
          isAvailable: true,
        })
      }
    }

    updateMutation.mutate(availability)
  }

  return (
    <div className="pl-6 pr-8 pt-6 pb-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-extrabold text-black">Doctor Availability</h1>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-black hover:bg-gray-900"
        >
          <Calendar className="h-5 w-5 mr-2" />
          Update Availability
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {availability?.length > 0 ? (
            availability.map((avail: any) => {
              const day = daysOfWeek.find(d => d.value === avail.dayOfWeek)
              return (
                <li key={avail.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-black mr-3" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-black">
                          {day?.label}
                        </p>
                        <p className="text-sm text-black flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {avail.startTime} - {avail.endTime}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                        avail.isAvailable ? 'bg-black text-white' : 'bg-gray-800 text-white'
                      }`}>
                        {avail.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                </li>
              )
            })
          ) : (
            <li className="px-4 py-4 text-center text-black font-bold">
              No availability set. Click "Update Availability" to set your schedule.
            </li>
          )}
        </ul>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-black mb-4">Update Availability</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {daysOfWeek.map((day) => (
                  <div key={day.value} className="border rounded-md p-4">
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id={`day-${day.value}-enabled`}
                        name={`day-${day.value}-enabled`}
                        className="mr-2"
                      />
                      <label htmlFor={`day-${day.value}-enabled`} className="font-bold text-black">
                        {day.label}
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-2 ml-6">
                      <div>
                        <label className="block text-sm font-bold text-black mb-1">Start Time</label>
                        <input
                          type="time"
                          name={`day-${day.value}-start`}
                          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-black"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-black mb-1">End Time</label>
                        <input
                          type="time"
                          name={`day-${day.value}-end`}
                          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-black"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-black font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 font-bold"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

