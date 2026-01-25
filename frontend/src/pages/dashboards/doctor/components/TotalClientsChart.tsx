import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Users } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns'

interface TotalClientsChartProps {
  appointments?: any[]
  patients?: any[]
}

export default function TotalClientsChart({
  appointments,
  patients,
}: TotalClientsChartProps) {
  const chartData = useMemo(() => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    
    // Get unique patient IDs from appointments this month
    const thisMonthAppointments = (appointments && Array.isArray(appointments))
      ? appointments.filter((apt: any) => {
          const aptDate = new Date(apt.appointmentDate)
          return isWithinInterval(aptDate, { start: monthStart, end: monthEnd })
        })
      : []

    const uniquePatientIds = new Set<string>()
    thisMonthAppointments.forEach((apt: any) => {
      if (apt.patientId) {
        uniquePatientIds.add(apt.patientId)
      }
    })

    const totalClients = uniquePatientIds.size

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
      const dayUniquePatients = new Set<string>()
      dayAppointments.forEach((apt: any) => {
        if (apt.patientId) {
          dayUniquePatients.add(apt.patientId)
        }
      })
      return {
        date: format(day, 'MMM dd'),
        clients: dayUniquePatients.size,
      }
    })

    return { totalClients, dailyData }
  }, [appointments, patients])

  if (chartData.totalClients === 0 && chartData.dailyData.every((d) => d.clients === 0)) {
    return (
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="h-5 w-5 text-black" />
          <h3 className="text-lg font-bold text-black">Total Clients This Month</h3>
        </div>
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-black font-bold">No clients this month</p>
          <p className="text-sm text-gray-500 mt-2">Clients will appear here once you have appointments with them.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-black" />
          <h3 className="text-lg font-bold text-black">Total Clients This Month</h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-black">{chartData.totalClients}</p>
          <p className="text-xs text-gray-500">Unique Clients</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData.dailyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
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
          <Bar 
            dataKey="clients" 
            fill="#000000"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}


