import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Activity } from 'lucide-react'

interface DoctorPerformanceChartProps {
  appointments?: any[]
  prescriptions?: any[]
  visitNotes?: any[]
}

// Black and gray shades for dark theme
const COLORS = ['#000000', '#1f2937', '#374151', '#4b5563', '#6b7280']

export default function DoctorPerformanceChart({
  appointments,
  prescriptions,
  visitNotes,
}: DoctorPerformanceChartProps) {
  const performanceData = useMemo(() => {
    // Safely calculate total appointments (all statuses except CANCELLED)
    const totalAppointments = (appointments && Array.isArray(appointments))
      ? appointments.filter((apt: any) => apt?.status !== 'CANCELLED').length
      : 0

    // Safely calculate completed appointments
    const completedAppointments = (appointments && Array.isArray(appointments))
      ? appointments.filter((apt: any) => apt?.status === 'COMPLETED').length
      : 0

    // Safely calculate total prescriptions
    const totalPrescriptions = (prescriptions && Array.isArray(prescriptions))
      ? prescriptions.length
      : 0

    // Safely calculate total visit notes
    const totalVisitNotes = (visitNotes && Array.isArray(visitNotes))
      ? visitNotes.length
      : 0

    // Calculate total activities (all non-cancelled appointments + prescriptions + visit notes)
    const totalActivities = totalAppointments + totalPrescriptions + totalVisitNotes

    // Return empty array if no data
    if (totalActivities === 0 || totalActivities === null || totalActivities === undefined) {
      return []
    }

    return [
      {
        name: 'Total Appointments',
        value: totalAppointments,
        percentage: totalActivities > 0 ? ((totalAppointments / totalActivities) * 100).toFixed(1) : '0',
        completed: completedAppointments,
      },
      {
        name: 'Prescriptions',
        value: totalPrescriptions,
        percentage: totalActivities > 0 ? ((totalPrescriptions / totalActivities) * 100).toFixed(1) : '0',
      },
      {
        name: 'Visit Notes',
        value: totalVisitNotes,
        percentage: totalActivities > 0 ? ((totalVisitNotes / totalActivities) * 100).toFixed(1) : '0',
      },
    ].filter((item) => item.value > 0) // Only show items with value > 0
  }, [appointments, prescriptions, visitNotes])

  const totalCompleted = useMemo(() => {
    return performanceData.reduce((sum, item) => sum + item.value, 0)
  }, [performanceData])

  if (performanceData.length === 0) {
    return (
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="h-5 w-5 text-black" />
          <h3 className="text-lg font-bold text-black">Performance Overview</h3>
        </div>
        <div className="text-center py-12">
          <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-black font-bold">No performance data available</p>
          <p className="text-sm text-gray-500 mt-2">Book appointments, create prescriptions, or add visit notes to see your performance overview.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-black" />
          <h3 className="text-lg font-bold text-black">Performance Overview</h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-black">{totalCompleted}</p>
          <p className="text-xs text-gray-500">Total Activities</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Pie Chart */}
        <div className="w-full lg:w-1/2">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Pie
                data={performanceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={70}
                fill="#000000"
                dataKey="value"
                isAnimationActive={false}
              >
                {performanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend with Details */}
        <div className="w-full lg:w-1/2 space-y-2">
          {performanceData.map((item, index) => (
            <div
              key={item.name}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div>
                  <p className="text-xs font-bold text-black">{item.name}</p>
                  {item.name === 'Total Appointments' && (item as any).completed > 0 && (
                    <p className="text-xs text-gray-400">{(item as any).completed} completed</p>
                  )}
                  <p className="text-xs text-gray-500">{item.percentage}%</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-black">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

