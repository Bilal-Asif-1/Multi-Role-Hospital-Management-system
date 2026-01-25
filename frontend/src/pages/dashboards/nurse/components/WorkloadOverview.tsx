import { Users, Calendar, ClipboardList, Bell } from 'lucide-react'
import NursePerformanceChart from './NursePerformanceChart'
import TodaysTasksChart from './TodaysTasksChart'

interface WorkloadOverviewProps {
  kpis: any[]
  checkedInPatients: any[]
  todayAppointments: any[]
  pendingTasks: any[]
  tasks: any[]
  onNavigate: (tab: 'overview' | 'queue' | 'vitals' | 'notes' | 'tasks' | 'labs' | 'notifications' | 'settings') => void
}

export default function WorkloadOverview({
  kpis,
  checkedInPatients,
  todayAppointments,
  pendingTasks,
  tasks,
  onNavigate,
}: WorkloadOverviewProps) {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi: any) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.name}
              onClick={() => onNavigate(kpi.link)}
              className="bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer"
            >
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="bg-black rounded-lg p-3">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 ml-4">
                    <p className="text-sm font-bold text-black">{kpi.name}</p>
                    <p className="text-2xl font-bold text-black mt-1">{kpi.value}</p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Performance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NursePerformanceChart tasks={tasks || []} />
        <TodaysTasksChart tasks={tasks || []} />
      </div>

    </div>
  )
}

