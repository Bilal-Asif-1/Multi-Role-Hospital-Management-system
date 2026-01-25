import { X, Plus } from 'lucide-react'

interface DepartmentDetailsModalProps {
  department: any
  onClose: () => void
  onRemoveRoom: (roomId: string) => void
  onOpenRoomModal: () => void
  onOpenDoctorModal: () => void
  onOpenNurseModal: () => void
  onRemoveDoctor: (doctorId: string) => void
  onRemoveNurse: (nurseId: string) => void
}

export function DepartmentDetailsModal({
  department,
  onClose,
  onRemoveRoom,
  onOpenRoomModal,
  onOpenDoctorModal,
  onOpenNurseModal,
  onRemoveDoctor,
  onRemoveNurse,
}: DepartmentDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-black">{department.name}</h2>
          <button onClick={onClose} className="text-black hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Department Info - Compact */}
          <div className="grid grid-cols-2 gap-4 pb-3 border-b border-gray-200">
            <div>
              <p className="text-xs font-bold text-gray-600">Name</p>
              <p className="text-sm font-bold text-black mt-1">{department.name}</p>
            </div>
            {department.headDoctorId && (
              <div>
                <p className="text-xs font-bold text-gray-600">Head Doctor</p>
                <p className="text-sm font-bold text-black mt-1">
                  {department.doctors?.find((d: any) => d.id === department.headDoctorId)?.user?.firstName}{' '}
                  {department.doctors?.find((d: any) => d.id === department.headDoctorId)?.user?.lastName}
                </p>
              </div>
            )}
          </div>

          {/* Rooms Section - Compact */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-black">Rooms ({department.rooms?.length || 0})</h3>
              <button
                onClick={onOpenRoomModal}
                className="px-3 py-1 bg-black text-white rounded-md text-xs font-bold hover:bg-gray-900 flex items-center"
              >
                <Plus className="h-3 w-3 mr-1" />
                Assign
              </button>
            </div>
            {department.rooms && department.rooms.length > 0 ? (
              <div className="space-y-2">
                {department.rooms.map((room: any) => {
                  const totalBeds = room.beds?.length || 0
                  const occupiedBeds =
                    room.beds?.filter((bed: any) => bed.assignments?.some((a: any) => a.status === 'ACTIVE'))
                      .length || 0
                  return (
                    <div key={room.id} className="bg-gray-50 p-2 rounded border border-gray-200 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-black">{room.name || `Room ${room.roomNumber}`}</p>
                          <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                            room.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                            room.status === 'OCCUPIED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {room.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {room.type || 'General'} • {occupiedBeds}/{totalBeds} beds
                        </p>
                      </div>
                      <button
                        onClick={() => onRemoveRoom(room.id)}
                        className="text-red-600 hover:text-red-800 text-xs font-bold ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-600 py-2">No rooms assigned</p>
            )}
          </div>

          {/* Staff Section - Compact */}
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-black">
                Staff (Doctors: {department.doctors?.length || 0}, Nurses: {department.nurses?.length || 0})
              </h3>
            </div>

            {/* Doctors Section */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-black">Doctors</h4>
                <button
                  onClick={onOpenDoctorModal}
                  className="px-2 py-1 bg-black text-white rounded-md text-xs font-bold hover:bg-gray-900 flex items-center"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Assign
                </button>
              </div>
              {department.doctors && department.doctors.length > 0 ? (
                <div className="space-y-1.5">
                  {department.doctors.map((doctor: any) => (
                    <div key={doctor.id} className="bg-gray-50 p-2 rounded border border-gray-200 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-black">
                          {doctor.user?.firstName} {doctor.user?.lastName}
                        </p>
                        <p className="text-xs text-gray-600">{doctor.specialization || 'N/A'}</p>
                      </div>
                      <button
                        onClick={() => onRemoveDoctor(doctor.id)}
                        className="text-red-600 hover:text-red-800 text-xs font-bold ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-600 py-1">No doctors assigned</p>
              )}
            </div>

            {/* Nurses Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-black">Nurses</h4>
                <button
                  onClick={onOpenNurseModal}
                  className="px-2 py-1 bg-black text-white rounded-md text-xs font-bold hover:bg-gray-900 flex items-center"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Assign
                </button>
              </div>
              {department.nurses && department.nurses.length > 0 ? (
                <div className="space-y-1.5">
                  {department.nurses.map((nurse: any) => (
                    <div key={nurse.id} className="bg-gray-50 p-2 rounded border border-gray-200 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-black">
                          {nurse.user?.firstName} {nurse.user?.lastName}
                        </p>
                        {nurse.licenseNumber && <p className="text-xs text-gray-600">License: {nurse.licenseNumber}</p>}
                      </div>
                      <button
                        onClick={() => onRemoveNurse(nurse.id)}
                        className="text-red-600 hover:text-red-800 text-xs font-bold ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-600 py-1">No nurses assigned</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

