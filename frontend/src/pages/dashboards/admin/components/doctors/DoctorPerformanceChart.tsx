import { BarChart3, TrendingUp } from 'lucide-react'

interface DoctorPerformanceChartProps {
  workload: {
    totalAppointments: number
    todayAppointments: number
    upcomingAppointments: number
    completedAppointments: number
    activePatients: number
    totalPrescriptions: number
  }
}

export function DoctorPerformanceChart({ workload }: DoctorPerformanceChartProps) {
  const completionRate =
    workload.totalAppointments > 0
      ? Math.round((workload.completedAppointments / workload.totalAppointments) * 100)
      : 0

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-black flex items-center">
        <BarChart3 className="h-5 w-5 mr-2" /> Performance Metrics
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4">
          <p className="text-sm font-bold text-black">Completion Rate</p>
          <div className="flex items-end space-x-2 mt-2">
            <p className="text-3xl font-bold text-black">{completionRate}%</p>
            <TrendingUp className="h-5 w-5 text-black mb-1" />
          </div>
        </div>

        <div className="p-4">
          <p className="text-sm font-bold text-black">Today's Appointments</p>
          <p className="text-3xl font-bold text-black mt-2">{workload.todayAppointments}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-black">Appointment Progress</span>
          <span className="text-sm font-bold text-black">
            {workload.completedAppointments} / {workload.totalAppointments}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-black h-3 rounded-full transition-all"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>
    </div>
  )
}

