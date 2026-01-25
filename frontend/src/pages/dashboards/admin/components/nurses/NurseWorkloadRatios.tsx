import { useQuery } from '@tanstack/react-query'
import { nursesApi } from '../../../../../services/api'
import { Users, Activity, FileText, CheckCircle } from 'lucide-react'

interface NurseWorkloadRatiosProps {
  nurseId: string
}

export function NurseWorkloadRatios({ nurseId }: NurseWorkloadRatiosProps) {
  const { data: workload, isLoading } = useQuery({
    queryKey: ['nurse-workload', nurseId],
    queryFn: () => nursesApi.getWorkload(nurseId),
    enabled: !!nurseId,
  })

  const { data: assignedPatients } = useQuery({
    queryKey: ['nurse-assigned-patients', nurseId],
    queryFn: () => nursesApi.getAssignedPatients(nurseId),
    enabled: !!nurseId,
  })

  if (isLoading) {
    return <p className="text-black font-bold">Loading workload...</p>
  }

  if (!workload) {
    return null
  }

  const patientCount = assignedPatients?.length || workload.assignedPatients
  const taskCompletionRate =
    workload.activeTasks + workload.completedTasks > 0
      ? Math.round(
          (workload.completedTasks / (workload.activeTasks + workload.completedTasks)) * 100,
        )
      : 0

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-black flex items-center">
        <Activity className="h-5 w-5 mr-2" /> Workload & Ratios
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="h-5 w-5 text-blue-600" />
            <p className="text-sm font-bold text-blue-600">Assigned Patients</p>
          </div>
          <p className="text-3xl font-bold text-blue-900">{patientCount}</p>
          <p className="text-xs text-blue-700 mt-1">
            {patientCount <= 4 ? 'Optimal' : patientCount <= 8 ? 'Moderate' : 'High'} workload
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm font-bold text-green-600">Task Completion</p>
          </div>
          <p className="text-3xl font-bold text-green-900">{taskCompletionRate}%</p>
          <p className="text-xs text-green-700 mt-1">
            {workload.completedTasks} / {workload.activeTasks + workload.completedTasks} tasks
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center space-x-2 mb-2">
            <FileText className="h-5 w-5 text-purple-600" />
            <p className="text-sm font-bold text-purple-600">Nursing Notes</p>
          </div>
          <p className="text-3xl font-bold text-purple-900">{workload.totalNursingNotes}</p>
          <p className="text-xs text-purple-700 mt-1">
            {workload.todayNursingNotes} today
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="h-5 w-5 text-orange-600" />
            <p className="text-sm font-bold text-orange-600">Active Tasks</p>
          </div>
          <p className="text-3xl font-bold text-orange-900">{workload.activeTasks}</p>
          <p className="text-xs text-orange-700 mt-1">Pending completion</p>
        </div>
      </div>

      {patientCount > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-bold text-gray-700 mb-1">Patient-to-Nurse Ratio</p>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  patientCount <= 4
                    ? 'bg-green-500'
                    : patientCount <= 8
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${Math.min((patientCount / 12) * 100, 100)}%` }}
              />
            </div>
            <span className="text-sm font-bold text-black">{patientCount}:1</span>
          </div>
        </div>
      )}
    </div>
  )
}

