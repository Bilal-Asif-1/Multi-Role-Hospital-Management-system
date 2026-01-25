import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Calendar } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns'

interface AppointmentsThisMonthChartProps {
  appointments?: any[]
}

export default function AppointmentsThisMonthChart({
  appointments,
}: AppointmentsThisMonthChartProps) {
  const chartData = useMemo(() => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    
    // Get appointments this month
    const thisMonthAppointments = (appointments && Array.isArray(appointments))
      ? appointments.filter((apt: any) => {
          const aptDate = new Date(apt.appointmentDate)
          return isWithinInterval(aptDate, { start: monthStart, end: monthEnd })
        })
      : []

    const totalAppointments = thisMonthAppointments.length

    // Get daily breakdown for the last 7 days
    const last7Days = eachDayOfInterval({
      start: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      end: now,
    })

    const dailyData = last7Days.map((day) => {
      const dayAppointments = thisMonthAppointments.filter((apt: any) => {
        const aptDate = new Date(apt.appointmentDate)
        return aptDate.toDateString() === day.toDateString()
      })
      return {
        date: format(day, 'MMM dd'),
        appointments: dayAppointments.length,
      }
    })

    return { totalAppointments, dailyData }
  }, [appointments])

  if (chartData.totalAppointments === 0 && chartData.dailyData.every((d) => d.appointments === 0)) {
    return (
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="h-5 w-5 text-black" />
          <h3 className="text-lg font-bold text-black">Appointments This Month</h3>
        </div>
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-black font-bold">No appointments this month</p>
          <p className="text-sm text-gray-500 mt-2">Appointments will appear here once scheduled.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-black" />
          <h3 className="text-lg font-bold text-black">Appointments This Month</h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-black">{chartData.totalAppointments}</p>
          <p className="text-xs text-gray-500">Total Appointments</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData.dailyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            stroke="#000000"
            style={{ fontSize: '12px', fill: '#000000' }}
          />
          <YAxis 
            stroke="#000000"
            style={{ fontSize: '12px', fill: '#000000' }}
          />
          <Line 
            type="monotone" 
            dataKey="appointments" 
            stroke="#000000"
            strokeWidth={2}
            dot={{ fill: '#000000', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}


