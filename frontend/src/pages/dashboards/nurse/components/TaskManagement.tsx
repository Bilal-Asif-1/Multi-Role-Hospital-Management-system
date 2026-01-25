import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../../../../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface TaskManagementProps {
  tasks: any[]
  queryClient: any
}

export default function TaskManagement({ tasks, queryClient }: TaskManagementProps) {
  const completeTaskMutation = useMutation({
    mutationFn: tasksApi.markCompleted,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task marked as completed')
    },
  })

  // Filter to show only pending and in-progress tasks (or show all but mark completed differently)
  const activeTasks = tasks?.filter((task: any) => task.status !== 'COMPLETED') || []
  const completedTasks = tasks?.filter((task: any) => task.status === 'COMPLETED') || []

  return (
    <div className="space-y-6">
      {/* Active Tasks */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <h2 className="text-xl font-bold text-black mb-4">Pending Tasks</h2>
        <div className="space-y-3">
          {activeTasks && activeTasks.length > 0 ? (
            activeTasks.map((task: any) => (
              <div key={task.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{task.title}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        task.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                        task.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    {task.patient && (
                      <p className="text-sm text-gray-500 mt-1">
                        Patient: {task.patient.user?.firstName} {task.patient.user?.lastName}
                      </p>
                    )}
                    {task.dueDate && (
                      <p className="text-sm text-gray-500 mt-1">
                        Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                  {task.status !== 'COMPLETED' && (
                    <button
                      onClick={() => completeTaskMutation.mutate(task.id)}
                      disabled={completeTaskMutation.isPending}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {completeTaskMutation.isPending ? 'Completing...' : 'Mark Complete'}
                    </button>
                  )}
                    {task.status === 'COMPLETED' && (
                    <span className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg font-semibold">
                      Completed
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">No pending tasks</p>
          )}
        </div>
      </div>

      {/* Completed Tasks (Optional - can be collapsed/hidden) */}
      {completedTasks && completedTasks.length > 0 && (
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-xl font-bold text-black mb-4">Completed Tasks</h2>
          <div className="space-y-3">
            {completedTasks.map((task: any) => (
              <div key={task.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 opacity-75">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-600 line-through">{task.title}</h3>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-600">
                        COMPLETED
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                    {task.patient && (
                      <p className="text-sm text-gray-400 mt-1">
                        Patient: {task.patient.user?.firstName} {task.patient.user?.lastName}
                      </p>
                    )}
                    {task.completedAt && (
                      <p className="text-sm text-gray-400 mt-1">
                        Completed: {format(new Date(task.completedAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    )}
                  </div>
                  <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold">
                    ✓ Completed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}



