import { useState } from 'react'
import { ShiftCalendar } from './ShiftCalendar'
import { Calendar } from 'lucide-react'

export default function ShiftCalendarPage() {
  const [viewType, setViewType] = useState<'all' | 'doctor' | 'nurse'>('all')

  return (
    <div className="pl-6 pr-8 pt-6 pb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-black flex items-center">
            <Calendar className="h-8 w-8 mr-3" /> Shift Calendar
          </h1>
          <p className="text-black mt-2 font-bold">Visualize staff coverage and schedules</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewType('all')}
            className={`px-4 py-2 rounded-md font-bold transition-colors ${
              viewType === 'all'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-black hover:bg-gray-200'
            }`}
          >
            All Staff
          </button>
          <button
            onClick={() => setViewType('doctor')}
            className={`px-4 py-2 rounded-md font-bold transition-colors ${
              viewType === 'doctor'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-black hover:bg-gray-200'
            }`}
          >
            Doctors Only
          </button>
          <button
            onClick={() => setViewType('nurse')}
            className={`px-4 py-2 rounded-md font-bold transition-colors ${
              viewType === 'nurse'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-black hover:bg-gray-200'
            }`}
          >
            Nurses Only
          </button>
        </div>
      </div>


      <ShiftCalendar type={viewType} />
    </div>
  )
}

