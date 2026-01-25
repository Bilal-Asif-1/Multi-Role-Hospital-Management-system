import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { useMemo } from 'react'

interface NursePerformanceChartProps {
  tasks: any[]
}

const COLORS = ['#000000', '#1f2937', '#374151', '#4b5563', '#6b7280']

export default function NursePerformanceChart({
  tasks,
}: NursePerformanceChartProps) {
  const performanceData = useMemo(() => {
    const completedTasks = tasks?.filter((t: any) => t.status === 'COMPLETED') || []
    const pendingTasks = tasks?.filter((t: any) => t.status === 'PENDING') || []
    const inProgressTasks = tasks?.filter((t: any) => t.status === 'IN_PROGRESS') || []

    return [
      { name: 'Completed Tasks', value: completedTasks.length },
      { name: 'Pending Tasks', value: pendingTasks.length },
      { name: 'In Progress', value: inProgressTasks.length },
    ]
  }, [tasks])

  const totalTasks = tasks?.length || 0
  const completedCount = performanceData[0]?.value || 0
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0

  const totalCompleted = performanceData.reduce((sum, item) => sum + item.value, 0)

  if (totalTasks === 0) {
    return (
      <div className="bg-white shadow-lg rounded-xl p-6">
        <h2 className="text-xl font-bold text-black mb-4">Performance Matrix</h2>
        <div className="flex items-center justify-center h-64">
          <p className="text-black font-bold">No performance data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-lg rounded-xl p-6">
      <h2 className="text-xl font-bold text-black mb-4">Performance Matrix</h2>
      <div className="flex items-center justify-center">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={performanceData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
            >
              {performanceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-center space-y-2">
        <p className="text-sm font-bold text-black">
          Total Completed: {completedCount}
        </p>
        <p className="text-xs text-black">
          Completion Rate: {completionRate}%
        </p>
      </div>
    </div>
  )
}

