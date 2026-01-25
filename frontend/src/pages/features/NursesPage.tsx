import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi, tasksApi, patientsApi } from '../../services/api'
import toast from 'react-hot-toast'
import { UserPlus, Clock, AlertCircle, CheckCircle, XCircle, User } from 'lucide-react'
import { format } from 'date-fns'

export default function NursesPage() {
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [selectedNurse, setSelectedNurse] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Fetch all nurses
  const { data: nurses, isLoading: isLoadingNurses } = useQuery({
    queryKey: ['nurses'],
    queryFn: () => usersApi.getAll('NURSE'),
  })

  // Fetch all tasks to show nurse workload
  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.getAll(),
  })

  // Fetch patients for task assignment
  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsApi.getAll(),
  })

  const createTaskMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setShowTaskModal(false)
      setSelectedNurse(null)
      toast.success('Task assigned successfully')
    },
    onError: () => {
      toast.error('Failed to assign task')
    },
  })

  // Calculate task counts for each nurse
  const getNurseTaskCount = (nurseId: string) => {
    const nurseTasks = tasks?.filter((task: any) => 
      task.assignedTo === nurseId && 
      (task.status === 'PENDING' || task.status === 'IN_PROGRESS')
    ) || []
    return nurseTasks.length
  }

  const handleAssignTask = (nurseId: string) => {
    setSelectedNurse(nurseId)
    setShowTaskModal(true)
  }

  const handleSubmitTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    createTaskMutation.mutate({
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      assignedTo: selectedNurse || '',
      priority: formData.get('priority') as string || 'MEDIUM',
      dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : undefined,
      patientId: formData.get('patientId') as string || undefined,
    })
  }

  // Filter active nurses
  const activeNurses = nurses?.filter((nurse: any) => nurse.isActive) || []

  return (
    <div className="pl-6 pr-8 pt-6 pb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-black">Available Nurses</h1>
          <p className="text-black font-bold mt-1">
            View on-duty nurses and assign tasks
          </p>
        </div>
      </div>

      {isLoadingNurses ? (
        <div className="text-center py-12 text-black font-bold">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeNurses.length > 0 ? (
            activeNurses.map((nurse: any) => {
              const taskCount = getNurseTaskCount(nurse.id)
              const isAvailable = taskCount < 5 // Consider available if less than 5 tasks
              
              return (
                <div
                  key={nurse.id}
                  className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="bg-black rounded-full p-3">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-bold text-black">
                          {nurse.firstName} {nurse.lastName}
                        </h3>
                        <p className="text-sm text-black">{nurse.email}</p>
                        {nurse.phone && (
                          <p className="text-sm text-black">Phone: {nurse.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      {isAvailable ? (
                        <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Available
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Busy
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center text-sm text-black">
                        <Clock className="h-4 w-4 mr-1" />
                        <span className="font-bold">Active Tasks: {taskCount}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAssignTask(nurse.id)}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors font-bold"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assign Task
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="col-span-full text-center py-12 text-black font-bold">
              No active nurses found
            </div>
          )}
        </div>
      )}

      {/* Task Assignment Modal */}
      {showTaskModal && selectedNurse && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-black">Assign Task</h3>
              <button
                onClick={() => {
                  setShowTaskModal(false)
                  setSelectedNurse(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitTask} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  Task Title *
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder="e.g., Check patient vitals"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={4}
                  placeholder="Task details and instructions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Priority *
                  </label>
                  <select
                    name="priority"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM" selected>Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Due Date
                  </label>
                  <input
                    name="dueDate"
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  Related Patient (Optional)
                </label>
                <select
                  name="patientId"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black"
                >
                  <option value="">Select Patient</option>
                  {patients?.map((patient: any) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.user?.firstName} {patient.user?.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTaskModal(false)
                    setSelectedNurse(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-black font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 font-bold disabled:opacity-50"
                >
                  {createTaskMutation.isPending ? 'Assigning...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


