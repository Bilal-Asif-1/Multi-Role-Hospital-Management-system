import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { departmentsApi } from '../../../../services/api'
import { Plus, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { DepartmentCard } from './departments/DepartmentCard'
import { CreateDepartmentModal } from './departments/CreateDepartmentModal'
import { EditDepartmentModal } from './departments/EditDepartmentModal'
import { DepartmentDetailsModal } from './departments/DepartmentDetailsModal'
import { AssignRoomModal } from './departments/AssignRoomModal'
import { AssignDoctorModal } from './departments/AssignDoctorModal'
import { AssignNurseModal } from './departments/AssignNurseModal'

export default function DepartmentsManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showRoomModal, setShowRoomModal] = useState(false)
  const [showDoctorModal, setShowDoctorModal] = useState(false)
  const [showNurseModal, setShowNurseModal] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    headDoctorId: '',
  })
  const queryClient = useQueryClient()

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getAll(),
  })

  const { data: availableRooms } = useQuery({
    queryKey: ['available-rooms'],
    queryFn: () => departmentsApi.getAvailableRooms(),
    enabled: showRoomModal,
  })

  const { data: availableDoctors } = useQuery({
    queryKey: ['available-doctors'],
    queryFn: () => departmentsApi.getAvailableDoctors(),
    enabled: showDoctorModal,
  })

  const { data: availableNurses } = useQuery({
    queryKey: ['available-nurses'],
    queryFn: () => departmentsApi.getAvailableNurses(),
    enabled: showNurseModal,
  })

  const { data: departmentDetails } = useQuery({
    queryKey: ['department-details', selectedDepartment?.id],
    queryFn: () => departmentsApi.getById(selectedDepartment?.id),
    enabled: !!selectedDepartment?.id && showViewModal,
  })

  const createMutation = useMutation({
    mutationFn: async ({ payload, selectedItems }: { payload: any; selectedItems: any }) => {
      // Create department first
      const newDepartment = await departmentsApi.create(payload)
      
      // Then assign rooms, doctors, and nurses
      const assignments = []
      
      // Assign rooms
      for (const roomId of selectedItems.rooms || []) {
        assignments.push(departmentsApi.assignRoom(newDepartment.id, roomId))
      }
      
      // Assign doctors
      for (const doctorId of selectedItems.doctors || []) {
        assignments.push(departmentsApi.assignDoctor(newDepartment.id, doctorId))
      }
      
      // Assign nurses
      for (const nurseId of selectedItems.nurses || []) {
        assignments.push(departmentsApi.assignNurse(newDepartment.id, nurseId))
      }
      
      // Wait for all assignments to complete
      await Promise.all(assignments)
      
      return newDepartment
    },
    onSuccess: (newDepartment: any) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['available-rooms'] })
      queryClient.invalidateQueries({ queryKey: ['available-doctors'] })
      queryClient.invalidateQueries({ queryKey: ['available-nurses'] })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      queryClient.invalidateQueries({ queryKey: ['nurses'] })
      setShowCreateModal(false)
      setFormData({ name: '', description: '', headDoctorId: '' })
      toast.success('Department created and all items assigned successfully')
      // Automatically open the department details modal
      setSelectedDepartment(newDepartment)
      setShowViewModal(true)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create department')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => departmentsApi.update(selectedDepartment?.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['department-details'] })
      setShowEditModal(false)
      setSelectedDepartment(null)
      toast.success('Department updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update department')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      toast.success('Department deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete department')
    },
  })

  const assignRoomMutation = useMutation({
    mutationFn: ({ departmentId, roomId }: { departmentId: string; roomId: string }) =>
      departmentsApi.assignRoom(departmentId, roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['department-details'] })
      queryClient.invalidateQueries({ queryKey: ['available-rooms'] })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      setShowRoomModal(false)
      toast.success('Room assigned successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to assign room')
    },
  })

  const removeRoomMutation = useMutation({
    mutationFn: ({ departmentId, roomId }: { departmentId: string; roomId: string }) =>
      departmentsApi.removeRoom(departmentId, roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['department-details'] })
      queryClient.invalidateQueries({ queryKey: ['available-rooms'] })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      toast.success('Room removed successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to remove room')
    },
  })

  const assignDoctorMutation = useMutation({
    mutationFn: ({ departmentId, doctorId }: { departmentId: string; doctorId: string }) =>
      departmentsApi.assignDoctor(departmentId, doctorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['department-details'] })
      queryClient.invalidateQueries({ queryKey: ['available-doctors'] })
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      setShowDoctorModal(false)
      toast.success('Doctor assigned successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to assign doctor')
    },
  })

  const removeDoctorMutation = useMutation({
    mutationFn: ({ departmentId, doctorId }: { departmentId: string; doctorId: string }) =>
      departmentsApi.removeDoctor(departmentId, doctorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['department-details'] })
      queryClient.invalidateQueries({ queryKey: ['available-doctors'] })
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      toast.success('Doctor removed successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to remove doctor')
    },
  })

  const assignNurseMutation = useMutation({
    mutationFn: ({ departmentId, nurseId }: { departmentId: string; nurseId: string }) =>
      departmentsApi.assignNurse(departmentId, nurseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['department-details'] })
      queryClient.invalidateQueries({ queryKey: ['available-nurses'] })
      queryClient.invalidateQueries({ queryKey: ['nurses'] })
      setShowNurseModal(false)
      toast.success('Nurse assigned successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to assign nurse')
    },
  })

  const removeNurseMutation = useMutation({
    mutationFn: ({ departmentId, nurseId }: { departmentId: string; nurseId: string }) =>
      departmentsApi.removeNurse(departmentId, nurseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['department-details'] })
      queryClient.invalidateQueries({ queryKey: ['available-nurses'] })
      queryClient.invalidateQueries({ queryKey: ['nurses'] })
      toast.success('Nurse removed successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to remove nurse')
    },
  })

  const filteredDepartments = departments?.filter((dept: any) => {
    const matchesSearch = dept.name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const handleCreate = (e: React.FormEvent, selectedItems: any) => {
    e.preventDefault()
    // Clean up empty strings to undefined/null for optional fields
    const payload: any = {
      name: formData.name.trim(),
    }
    if (formData.description?.trim()) {
      payload.description = formData.description.trim()
    }
    if (formData.headDoctorId) {
      payload.headDoctorId = formData.headDoctorId
    }

    createMutation.mutate({ payload, selectedItems })
  }

  const handleEdit = (dept: any) => {
    setSelectedDepartment(dept)
    setFormData({
      name: dept.name,
      description: dept.description || '',
      headDoctorId: dept.headDoctorId || '',
    })
    setShowEditModal(true)
  }

  const handleUpdate = async (e: React.FormEvent, selectedItems: any) => {
    e.preventDefault()
    
    if (!selectedDepartment) return

    // Update basic department info
    const payload: any = {
      name: formData.name.trim(),
    }
    if (formData.headDoctorId) {
      payload.headDoctorId = formData.headDoctorId
    } else {
      payload.headDoctorId = null
    }

    // Update department basic info first
    await updateMutation.mutateAsync(payload)

    // Handle rooms: add new ones and remove unselected ones
    const currentRoomIds = selectedDepartment.rooms?.map((r: any) => r.id) || []
    const selectedRoomIds = selectedItems.rooms || []
    
    // Add new rooms
    const roomsToAdd = selectedRoomIds.filter((id: string) => !currentRoomIds.includes(id))
    for (const roomId of roomsToAdd) {
      await assignRoomMutation.mutateAsync({ departmentId: selectedDepartment.id, roomId })
    }
    
    // Remove unselected rooms
    const roomsToRemove = currentRoomIds.filter((id: string) => !selectedRoomIds.includes(id))
    for (const roomId of roomsToRemove) {
      await removeRoomMutation.mutateAsync({ departmentId: selectedDepartment.id, roomId })
    }

    // Handle doctors: add new ones and remove unselected ones
    const currentDoctorIds = selectedDepartment.doctors?.map((d: any) => d.id) || []
    const selectedDoctorIds = selectedItems.doctors || []
    
    // Add new doctors
    const doctorsToAdd = selectedDoctorIds.filter((id: string) => !currentDoctorIds.includes(id))
    for (const doctorId of doctorsToAdd) {
      await assignDoctorMutation.mutateAsync({ departmentId: selectedDepartment.id, doctorId })
    }
    
    // Remove unselected doctors
    const doctorsToRemove = currentDoctorIds.filter((id: string) => !selectedDoctorIds.includes(id))
    for (const doctorId of doctorsToRemove) {
      await removeDoctorMutation.mutateAsync({ departmentId: selectedDepartment.id, doctorId })
    }

    // Handle nurses: add new ones and remove unselected ones
    const currentNurseIds = selectedDepartment.nurses?.map((n: any) => n.id) || []
    const selectedNurseIds = selectedItems.nurses || []
    
    // Add new nurses
    const nursesToAdd = selectedNurseIds.filter((id: string) => !currentNurseIds.includes(id))
    for (const nurseId of nursesToAdd) {
      await assignNurseMutation.mutateAsync({ departmentId: selectedDepartment.id, nurseId })
    }
    
    // Remove unselected nurses
    const nursesToRemove = currentNurseIds.filter((id: string) => !selectedNurseIds.includes(id))
    for (const nurseId of nursesToRemove) {
      await removeNurseMutation.mutateAsync({ departmentId: selectedDepartment.id, nurseId })
    }

    // Close modal and refresh
    setShowEditModal(false)
    setSelectedDepartment(null)
  }

  const handleDelete = (dept: any) => {
    if (window.confirm(`Are you sure you want to delete ${dept.name}?`)) {
      deleteMutation.mutate(dept.id)
    }
  }

  const handleAssignRoom = (roomId: string) => {
    if (selectedDepartment) {
      assignRoomMutation.mutate({ departmentId: selectedDepartment.id, roomId })
    }
  }

  const handleRemoveRoom = (roomId: string) => {
    if (selectedDepartment && window.confirm('Are you sure you want to remove this room from the department?')) {
      removeRoomMutation.mutate({ departmentId: selectedDepartment.id, roomId })
    }
  }

  const handleAssignDoctor = (doctorId: string) => {
    if (selectedDepartment) {
      assignDoctorMutation.mutate({ departmentId: selectedDepartment.id, doctorId })
    }
  }

  const handleRemoveDoctor = (doctorId: string) => {
    if (selectedDepartment && window.confirm('Are you sure you want to remove this doctor from the department?')) {
      removeDoctorMutation.mutate({ departmentId: selectedDepartment.id, doctorId })
    }
  }

  const handleAssignNurse = (nurseId: string) => {
    if (selectedDepartment) {
      assignNurseMutation.mutate({ departmentId: selectedDepartment.id, nurseId })
    }
  }

  const handleRemoveNurse = (nurseId: string) => {
    if (selectedDepartment && window.confirm('Are you sure you want to remove this nurse from the department?')) {
      removeNurseMutation.mutate({ departmentId: selectedDepartment.id, nurseId })
    }
  }

  if (isLoading) {
    return (
      <div className="pl-6 pr-8 pt-6 pb-6">
        <div className="text-center py-12 text-black font-bold">Loading departments...</div>
      </div>
    )
  }

  return (
    <div className="pl-6 pr-8 pt-6 pb-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-black">Departments Management</h1>
          <p className="text-black mt-2 font-bold">Manage hospital departments and room allocation</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', description: '', headDoctorId: '' })
            setShowCreateModal(true)
          }}
          className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-900 font-bold flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Department
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-black" />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full max-w-md focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments && filteredDepartments.length > 0 ? (
          filteredDepartments.map((dept: any) => (
            <DepartmentCard
              key={dept.id}
              department={dept}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-black font-bold">No departments found</div>
        )}
      </div>

      {/* Modals */}
      <CreateDepartmentModal
        isOpen={showCreateModal}
        formData={formData}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        onChange={setFormData}
        isPending={createMutation.isPending}
      />

      <EditDepartmentModal
        isOpen={showEditModal}
        department={selectedDepartment}
        formData={formData}
        onClose={() => {
          setShowEditModal(false)
          setSelectedDepartment(null)
        }}
        onSubmit={handleUpdate}
        onChange={setFormData}
        isPending={updateMutation.isPending}
      />

      {showViewModal && selectedDepartment && (
        <DepartmentDetailsModal
          department={departmentDetails || selectedDepartment}
          onClose={() => {
            setShowViewModal(false)
            setSelectedDepartment(null)
          }}
          onRemoveRoom={handleRemoveRoom}
          onOpenRoomModal={() => {
            setSelectedDepartment(departmentDetails || selectedDepartment)
            setShowRoomModal(true)
          }}
          onOpenDoctorModal={() => {
            setSelectedDepartment(departmentDetails || selectedDepartment)
            setShowDoctorModal(true)
          }}
          onOpenNurseModal={() => {
            setSelectedDepartment(departmentDetails || selectedDepartment)
            setShowNurseModal(true)
          }}
          onRemoveDoctor={handleRemoveDoctor}
          onRemoveNurse={handleRemoveNurse}
        />
      )}

      <AssignRoomModal
        isOpen={showRoomModal}
        departmentName={selectedDepartment?.name || ''}
        availableRooms={availableRooms || []}
        onClose={() => {
          setShowRoomModal(false)
          setSelectedDepartment(null)
        }}
        onAssign={handleAssignRoom}
        isPending={assignRoomMutation.isPending}
      />

      <AssignDoctorModal
        isOpen={showDoctorModal}
        departmentName={selectedDepartment?.name || ''}
        availableDoctors={availableDoctors || []}
        onClose={() => {
          setShowDoctorModal(false)
          setSelectedDepartment(null)
        }}
        onAssign={handleAssignDoctor}
        isPending={assignDoctorMutation.isPending}
      />

      <AssignNurseModal
        isOpen={showNurseModal}
        departmentName={selectedDepartment?.name || ''}
        availableNurses={availableNurses || []}
        onClose={() => {
          setShowNurseModal(false)
          setSelectedDepartment(null)
        }}
        onAssign={handleAssignNurse}
        isPending={assignNurseMutation.isPending}
      />
    </div>
  )
}
