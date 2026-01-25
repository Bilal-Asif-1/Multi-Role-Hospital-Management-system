import { useQuery } from '@tanstack/react-query'
import { vitalsApi } from '../../../../services/api'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format, subDays } from 'date-fns'
import { Activity } from 'lucide-react'

interface VitalsTrendChartProps {
  patientId?: string
}

export default function VitalsTrendChart({ patientId }: VitalsTrendChartProps) {
  const { data: vitals, isLoading } = useQuery({
    queryKey: ['vitals', patientId],
    queryFn: () => vitalsApi.getAll(patientId),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    enabled: !!patientId,
  })

  // Process vitals data for chart
  const chartData = vitals?.map((vital: any) => {
    const date = new Date(vital.recordedAt || vital.createdAt)
    return {
      date: format(date, 'MMM dd'),
      fullDate: format(date, 'MMM dd, yyyy HH:mm'),
      bloodPressure: vital.bloodPressure ? parseFloat(vital.bloodPressure.split('/')[0]) : null,
      heartRate: vital.heartRate || null,
      temperature: vital.temperature || null,
      weight: vital.weight || null,
      oxygenSaturation: vital.oxygenSaturation || null,
    }
  }).sort((a: any, b: any) => {
    return new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()
  }) || []

  if (isLoading) {
    return (
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    )
  }

  if (!vitals || vitals.length === 0) {
    return (
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="h-5 w-5 text-indigo-500" />
          <h3 className="text-lg font-semibold text-gray-900">Vitals Trend Chart</h3>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">No vitals data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-lg rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-indigo-500" />
          <h3 className="text-lg font-semibold text-gray-900">Vitals Trend Chart</h3>
        </div>
        <div className="text-sm text-gray-500">
          Real-time updates every 30 seconds
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Values', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(value: any, name: string) => {
              if (value === null || value === undefined) return 'N/A'
              if (name === 'bloodPressure') return `${value} mmHg (Systolic)`
              if (name === 'heartRate') return `${value} bpm`
              if (name === 'temperature') return `${value} °C`
              if (name === 'weight') return `${value} kg`
              if (name === 'oxygenSaturation') return `${value} %`
              return value
            }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          
          {/* Blood Pressure Line */}
          {chartData.some((d: any) => d.bloodPressure !== null) && (
            <Line
              type="monotone"
              dataKey="bloodPressure"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Blood Pressure (Systolic)"
              connectNulls={false}
            />
          )}

          {/* Heart Rate Line */}
          {chartData.some((d: any) => d.heartRate !== null) && (
            <Line
              type="monotone"
              dataKey="heartRate"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Heart Rate (bpm)"
              connectNulls={false}
            />
          )}

          {/* Temperature Line */}
          {chartData.some((d: any) => d.temperature !== null) && (
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Temperature (°C)"
              connectNulls={false}
            />
          )}

          {/* Weight Line */}
          {chartData.some((d: any) => d.weight !== null) && (
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Weight (kg)"
              connectNulls={false}
            />
          )}

          {/* Oxygen Saturation Line */}
          {chartData.some((d: any) => d.oxygenSaturation !== null) && (
            <Line
              type="monotone"
              dataKey="oxygenSaturation"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="SpO2 (%)"
              connectNulls={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-600">Blood Pressure</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-600">Heart Rate</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span className="text-gray-600">Temperature</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-600">Weight</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <span className="text-gray-600">SpO2</span>
        </div>
      </div>
    </div>
  )
}



