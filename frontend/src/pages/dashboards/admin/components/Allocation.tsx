import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { departmentsApi, roomsApi } from '../../../../services/api'
import {
  Building2,
  BedDouble,
  Plus,
  Search,
  X,
  ArrowLeft,
  Trash2,
  LogOut,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function Allocation() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null)
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [showAddBedModal, setShowAddBedModal] = useState(false)
  const [bedQuantity, setBedQuantity] = useState(1)
  const queryClient = useQueryClient()

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getAll(),
  })

  const { data: departmentDetails } = useQuery({
    queryKey: ['department-details', selectedDepartment?.id],
    queryFn: () => departmentsApi.getById(selectedDepartment?.id),
    enabled: !!selectedDepartment?.id && !selectedRoom,
  })

  const { data: roomDetails } = useQuery({
    queryKey: ['room-details', selectedRoom?.id],
    queryFn: () => roomsApi.getById(selectedRoom?.id),
    enabled: !!selectedRoom?.id,
  })

  const addBedMutation = useMutation({
    mutationFn: async ({ roomId, quantity }: { roomId: string; quantity: number }) => {
      // Get existing beds to determine starting number
      const room = await roomsApi.getById(roomId)
      const existingBeds = room.beds || []
      const existingBedNumbers = existingBeds
        .map((bed: any) => {
          const match = bed.label.match(/Bed\s+(\d+)/i)
          return match ? parseInt(match[1]) : 0
        })
        .filter((num: number) => num > 0)
      
      const startNumber = existingBedNumbers.length > 0 ? Math.max(...existingBedNumbers) + 1 : 1
      
      // Create multiple beds
      const promises = []
      for (let i = 0; i < quantity; i++) {
        const bedNumber = startNumber + i
        promises.push(roomsApi.addBed(roomId, { label: `Bed ${bedNumber}` }))
      }
      
      await Promise.all(promises)
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-details'] })
      queryClient.invalidateQueries({ queryKey: ['department-details'] })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      setShowAddBedModal(false)
      setBedQuantity(1)
      toast.success('Beds added successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add beds')
    },
  })

  const deleteBedMutation = useMutation({
    mutationFn: async (bedId: string) => {
      return await roomsApi.deleteBed(bedId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-details'] })
      queryClient.invalidateQueries({ queryKey: ['department-details'] })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      toast.success('Bed deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete bed')
    },
  })

  const releaseBedMutation = useMutation({
    mutationFn: async (bedId: string) => {
      return await roomsApi.releaseBed({ bedId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-details'] })
      queryClient.invalidateQueries({ queryKey: ['department-details'] })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      toast.success('Bed released successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to release bed')
    },
  })

  const filteredDepartments = departments?.filter((dept: any) => {
    const matchesSearch = dept.name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const handleAddBed = () => {
    setBedQuantity(1)
    setShowAddBedModal(true)
  }

  const handleSubmitBed = (e: React.FormEvent) => {
    e.preventDefault()
    if (bedQuantity < 1 || bedQuantity > 50) {
      toast.error('Please enter a quantity between 1 and 50')
      return
    }
    addBedMutation.mutate({
      roomId: selectedRoom.id,
      quantity: bedQuantity,
    })
  }

  const handleDeleteBed = (bedId: string, bedLabel: string, isOccupied: boolean) => {
    if (isOccupied) {
      toast.error('Cannot delete bed with active assignments')
      return
    }
    if (window.confirm(`Are you sure you want to delete bed "${bedLabel}"?`)) {
      deleteBedMutation.mutate(bedId)
    }
  }

  const handleReleaseBed = (bedId: string, bedLabel: string) => {
    if (window.confirm(`Are you sure you want to release bed "${bedLabel}"? This will free the bed for new patients.`)) {
      releaseBedMutation.mutate(bedId)
    }
  }

  // Level 3: Beds Management View
  if (selectedRoom && roomDetails) {
    const roomBeds = roomDetails.beds || []
    const totalBeds = roomBeds.length
    const occupiedBeds = roomBeds.filter((bed: any) => 
      bed.assignments?.some((a: any) => a.status === 'ACTIVE')
    ).length
    const availableBeds = totalBeds - occupiedBeds

    return (
      <div className="pl-6 pr-8 pt-6 pb-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setSelectedRoom(null)
              }}
              className="text-black hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-4xl font-extrabold text-black">
                {roomDetails.name || `Room ${roomDetails.roomNumber}`}
              </h1>
              <p className="text-black mt-2 font-bold">Manage beds allocation</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white shadow-lg rounded-xl p-4">
            <p className="text-xs font-bold text-gray-600">Total Beds</p>
            <p className="text-2xl font-bold text-black">{totalBeds}</p>
          </div>
          <div className="bg-white shadow-lg rounded-xl p-4">
            <p className="text-xs font-bold text-gray-600">Occupied</p>
            <p className="text-2xl font-bold text-black">{occupiedBeds}</p>
          </div>
          <div className="bg-white shadow-lg rounded-xl p-4">
            <p className="text-xs font-bold text-gray-600">Available</p>
            <p className="text-2xl font-bold text-black">{availableBeds}</p>
          </div>
        </div>

        {/* Beds List */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-black">Beds</h3>
            <button
              onClick={handleAddBed}
              className="px-3 py-1.5 bg-black text-white rounded-md text-sm font-bold hover:bg-gray-900 flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Bed
            </button>
          </div>
          {roomBeds.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {roomBeds.map((bed: any) => {
                const isOccupied = bed.assignments?.some((a: any) => a.status === 'ACTIVE')
                const activeAssignment = bed.assignments?.find((a: any) => a.status === 'ACTIVE')
                return (
                  <div
                    key={bed.id}
                    className="p-2 rounded border border-gray-300 bg-white relative group"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-black truncate flex-1">{bed.label}</p>
                      <div className="flex items-center gap-1">
                        {isOccupied && (
                          <button
                            onClick={() => handleReleaseBed(bed.id, bed.label)}
                            disabled={releaseBedMutation.isPending}
                            className="text-gray-400 hover:text-green-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Release bed"
                          >
                            <LogOut className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteBed(bed.id, bed.label, isOccupied)}
                          disabled={isOccupied || deleteBedMutation.isPending}
                          className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                          title="Delete bed"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <span className={`inline-block px-1 py-0.5 text-xs font-bold rounded mt-0.5 ${
                      isOccupied
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-200 text-black'
                    }`}>
                      {isOccupied ? 'Occupied' : 'Available'}
                    </span>
                    {isOccupied && activeAssignment && (
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {activeAssignment.patient?.user?.firstName}{' '}
                        {activeAssignment.patient?.user?.lastName}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-600 py-4 text-center">No beds in this room</p>
          )}
        </div>

        {/* Add Bed Modal */}
        {showAddBedModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-xl font-bold text-black">Add Beds</h2>
                <button
                  onClick={() => {
                    setShowAddBedModal(false)
                    setBedQuantity(1)
                  }}
                  className="text-black hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmitBed} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Number of Beds *</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black"
                    value={bedQuantity}
                    onChange={(e) => setBedQuantity(parseInt(e.target.value) || 1)}
                    placeholder="Enter quantity"
                    required
                    disabled={false}
                    autoComplete="off"
                  />
                  <p className="text-xs text-gray-600 mt-1">Beds will be automatically named: Bed 1, Bed 2, Bed 3, etc.</p>
                </div>
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddBedModal(false)
                      setBedQuantity(1)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md font-bold text-black hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addBedMutation.isPending}
                    className="flex-1 px-4 py-2 bg-black text-white rounded-md font-bold hover:bg-gray-900 disabled:opacity-50"
                  >
                    {addBedMutation.isPending ? 'Adding...' : `Add ${bedQuantity} Bed${bedQuantity > 1 ? 's' : ''}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Level 2: Rooms View (when department is selected)
  if (selectedDepartment && departmentDetails) {
    return (
      <div className="pl-6 pr-8 pt-6 pb-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setSelectedDepartment(null)
                setSelectedRoom(null)
              }}
              className="text-black hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-4xl font-extrabold text-black">{departmentDetails.name}</h1>
              <p className="text-black mt-2 font-bold">Manage rooms and bed allocation</p>
            </div>
          </div>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departmentDetails.rooms && departmentDetails.rooms.length > 0 ? (
            departmentDetails.rooms.map((room: any) => {
              const roomBeds = room.beds || []
              const totalBeds = roomBeds.length
              const occupiedBeds = roomBeds.filter((bed: any) => 
                bed.assignments?.some((a: any) => a.status === 'ACTIVE')
              ).length
              const availableBeds = totalBeds - occupiedBeds

              return (
                <div key={room.id} className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl transition-all">
                  {/* Header with Logo and Room Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-black rounded-lg p-3">
                      <BedDouble className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-black flex-1">
                      {(() => {
                        const roomName = room.name || room.roomNumber?.replace('ROOM-', '') || room.roomNumber
                        // Check if room name starts with a digit
                        const startsWithDigit = /^\d/.test(roomName)
                        return startsWithDigit ? `Room ${roomName}` : roomName
                      })()}
                    </h3>
                  </div>
                  {room.type && (
                    <p className="text-sm text-gray-600 mb-4">{room.type}</p>
                  )}

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-bold text-gray-600">Total Beds</p>
                      <p className="text-lg font-bold text-black">{totalBeds}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-600">Occupied</p>
                      <p className="text-lg font-bold text-black">{occupiedBeds}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-600">Available</p>
                      <p className="text-lg font-bold text-black">{availableBeds}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedRoom(room)}
                    className="w-full bg-black text-white px-4 py-2 rounded-md hover:bg-gray-900 font-bold"
                  >
                    Manage Beds
                  </button>
                </div>
              )
            })
          ) : (
            <div className="col-span-full text-center py-12 text-black font-bold">
              No rooms in this department
            </div>
          )}
        </div>
      </div>
    )
  }

  // Level 1: Departments List View
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
          <h1 className="text-4xl font-extrabold text-black">Allocation</h1>
          <p className="text-black mt-2 font-bold">Manage department rooms and bed allocation</p>
        </div>
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
          filteredDepartments.map((department: any) => {
            const stats = {
              rooms: department.rooms?.length || 0,
              doctors: department.doctors?.length || 0,
              nurses: department.nurses?.length || 0,
              totalBeds: department.rooms?.reduce((sum: number, room: any) => sum + (room.beds?.length || 0), 0) || 0,
              occupiedBeds: department.rooms?.reduce((sum: number, room: any) => {
                return sum + (room.beds?.filter((bed: any) => 
                  bed.assignments?.some((a: any) => a.status === 'ACTIVE')
                ).length || 0)
              }, 0) || 0,
              availableBeds: 0,
            }
            stats.availableBeds = stats.totalBeds - stats.occupiedBeds

            return (
              <div
                key={department.id}
                className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl transition-all"
              >
                {/* Header with Logo and Department Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-black rounded-lg p-3">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-black flex-1">{department.name} Department</h3>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-black">
                    <span className="font-bold">Rooms:</span>
                    <span className="font-bold">{stats.rooms}</span>
                  </div>
                  <div className="flex items-center justify-between text-black">
                    <span className="font-bold">Total Beds:</span>
                    <span className="font-bold">{stats.totalBeds}</span>
                  </div>
                  <div className="flex items-center justify-between text-black">
                    <span className="font-bold">Occupied:</span>
                    <span className="font-bold text-red-600">{stats.occupiedBeds}</span>
                  </div>
                  <div className="flex items-center justify-between text-black">
                    <span className="font-bold">Available:</span>
                    <span className="font-bold text-green-600">{stats.availableBeds}</span>
                  </div>
                  <div className="flex items-center justify-between text-black">
                    <span className="font-bold">Doctors:</span>
                    <span className="font-bold">{stats.doctors}</span>
                  </div>
                  <div className="flex items-center justify-between text-black">
                    <span className="font-bold">Nurses:</span>
                    <span className="font-bold">{stats.nurses}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDepartment(department)}
                  className="w-full bg-black text-white px-4 py-2 rounded-md hover:bg-gray-900 font-bold"
                >
                  Manage
                </button>
              </div>
            )
          })
        ) : (
          <div className="col-span-full text-center py-12 text-black font-bold">
            No departments found
          </div>
        )}
      </div>
    </div>
  )
}
