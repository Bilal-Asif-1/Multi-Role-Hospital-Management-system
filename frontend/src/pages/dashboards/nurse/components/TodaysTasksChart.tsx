import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'
import { useMemo } from 'react'

interface TodaysTasksChartProps {
  tasks: any[]
}

const COLORS = ['#000000', '#1f2937', '#374151']

export default function TodaysTasksChart({ tasks }: TodaysTasksChartProps) {
  const taskData = useMemo(() => {
    const today = new Date()
    const todayTasks = tasks?.filter((task: any) => {
      if (!task.createdAt) return false
      const taskDate = new Date(task.createdAt)
      return taskDate.toDateString() === today.toDateString()
    }) || []

    const byPriority = {
      URGENT: todayTasks.filter((t: any) => t.priority === 'URGENT').length,
      HIGH: todayTasks.filter((t: any) => t.priority === 'HIGH').length,
      NORMAL: todayTasks.filter((t: any) => t.priority === 'NORMAL').length,
    }

    return [
      { name: 'Urgent', value: byPriority.URGENT },
      { name: 'High', value: byPriority.HIGH },
      { name: 'Normal', value: byPriority.NORMAL },
    ]
  }, [tasks])

  const totalTasks = taskData.reduce((sum, item) => sum + item.value, 0)

  if (totalTasks === 0) {
    return (
      <div className="bg-white shadow-lg rounded-xl p-6">
        <h2 className="text-xl font-bold text-black mb-4">Today's Tasks</h2>
        <div className="flex items-center justify-center h-64">
          <p className="text-black font-bold">No tasks for today</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-lg rounded-xl p-6">
      <h2 className="text-xl font-bold text-black mb-4">Today's Tasks</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={taskData}>
          <XAxis dataKey="name" tick={{ fill: '#000', fontSize: 12, fontWeight: 'bold' }} />
          <YAxis tick={{ fill: '#000', fontSize: 12, fontWeight: 'bold' }} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {taskData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 text-center">
        <p className="text-sm font-bold text-black">
          Total Tasks Today: {totalTasks}
        </p>
      </div>
    </div>
  )
}


