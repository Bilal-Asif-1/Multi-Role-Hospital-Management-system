import { X } from 'lucide-react'

interface AssignRoomModalProps {
  isOpen: boolean
  departmentName: string
  availableRooms: any[]
  onClose: () => void
  onAssign: (roomId: string) => void
  isPending: boolean
}

export function AssignRoomModal({
  isOpen,
  departmentName,
  availableRooms,
  onClose,
  onAssign,
  isPending,
}: AssignRoomModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-black">Assign Room to {departmentName}</h2>
          <button onClick={onClose} className="text-black hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">
          {availableRooms && availableRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableRooms.map((room: any) => (
                <div key={room.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-black">{room.name || `Room ${room.roomNumber}`}</h4>
                    <span className="text-sm text-gray-600">{room.type}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Floor: {room.floor || 'N/A'}</p>
                  <p className="text-sm text-gray-600 mb-3">Beds: {room.beds?.length || 0}</p>
                  <button
                    onClick={() => onAssign(room.id)}
                    disabled={isPending}
                    className="w-full px-4 py-2 bg-black text-white rounded-md font-bold hover:bg-gray-900 disabled:opacity-50"
                  >
                    {isPending ? 'Assigning...' : 'Assign Room'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-8">No available rooms to assign</p>
          )}
        </div>
      </div>
    </div>
  )
}

