import { Building2, Users, UserCog, BedDouble, Edit, Trash2 } from 'lucide-react'

interface DepartmentCardProps {
  department: any
  onEdit: (dept: any) => void
  onDelete: (dept: any) => void
}

export function DepartmentCard({ department, onEdit, onDelete }: DepartmentCardProps) {
  const stats = {
    rooms: department.rooms?.length || 0,
    doctors: department.doctors?.length || 0,
    nurses: department.nurses?.length || 0,
    totalBeds: department.rooms?.reduce((sum: number, room: any) => sum + (room.beds?.length || 0), 0) || 0,
    occupiedBeds:
      department.rooms?.reduce((sum: number, room: any) => {
        return (
          sum +
          (room.beds?.filter((bed: any) => bed.assignments?.some((a: any) => a.status === 'ACTIVE')).length || 0)
        )
      }, 0) || 0,
  }

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl transition-all">
      {/* Header with Logo and Department Name */}
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-black rounded-lg p-3">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-xl font-bold text-black flex-1">{department.name} Department</h3>
      </div>
      {department.description && <p className="text-sm text-gray-600 mb-4">{department.description}</p>}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-black">
          <div className="flex items-center">
            <BedDouble className="h-4 w-4 mr-2 text-black" />
            <span className="font-bold">Rooms:</span>
          </div>
          <span className="font-bold">{stats.rooms}</span>
        </div>
        <div className="flex items-center justify-between text-black">
          <div className="flex items-center">
            <UserCog className="h-4 w-4 mr-2 text-black" />
            <span className="font-bold">Doctors:</span>
          </div>
          <span className="font-bold">{stats.doctors}</span>
        </div>
        <div className="flex items-center justify-between text-black">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-black" />
            <span className="font-bold">Nurses:</span>
          </div>
          <span className="font-bold">{stats.nurses}</span>
        </div>
        <div className="flex items-center justify-between text-black">
          <span className="font-bold">Total Beds:</span>
          <span className="font-bold">{stats.totalBeds}</span>
        </div>
        <div className="flex items-center justify-between text-black">
          <span className="font-bold">Occupied:</span>
          <span className="font-bold text-red-600">{stats.occupiedBeds}</span>
        </div>
      </div>
      <div className="flex items-center justify-center space-x-2 pt-4 border-t border-gray-200">
        <button
          onClick={() => onEdit(department)}
          className="text-black hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
          title="Edit Department"
        >
          <Edit className="h-5 w-5" />
        </button>
        <button
          onClick={() => onDelete(department)}
          className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50"
          title="Delete Department"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

