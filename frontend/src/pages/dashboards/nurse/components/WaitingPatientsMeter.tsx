import { Users } from 'lucide-react'
import { useMemo } from 'react'

interface WaitingPatientsMeterProps {
  patientQueue: any[]
}

export default function WaitingPatientsMeter({ patientQueue }: WaitingPatientsMeterProps) {
  const waitingPatients = useMemo(() => {
    return patientQueue?.filter((q: any) => q.status === 'WAITING') || []
  }, [patientQueue])

  const totalQueue = patientQueue?.length || 0
  const waitingCount = waitingPatients.length
  const percentage = totalQueue > 0 ? Math.round((waitingCount / totalQueue) * 100) : 0

  return (
    <div className="bg-white shadow-lg rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-black flex items-center">
          <Users className="h-5 w-5 mr-2 text-black" />
          Waiting Patients
        </h2>
      </div>

      <div className="space-y-4">
        {/* Meter Display */}
        <div className="relative">
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg className="transform -rotate-90" width="128" height="128" viewBox="0 0 128 128">
                {/* Background Circle */}
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  fill="none"
                />
                {/* Progress Circle */}
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#000000"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${percentage * 3.516} 352`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              {/* Center Text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-black">{waitingCount}</p>
                  <p className="text-xs text-black font-bold">Waiting</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-bold text-black mb-1">Total Queue</p>
            <p className="text-xl font-bold text-black">{totalQueue}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-bold text-black mb-1">Percentage</p>
            <p className="text-xl font-bold text-black">{percentage}%</p>
          </div>
        </div>

        {/* Empty State */}
        {waitingCount === 0 && (
          <p className="text-center text-black py-4 font-bold text-sm">
            No patients waiting
          </p>
        )}
      </div>
    </div>
  )
}


