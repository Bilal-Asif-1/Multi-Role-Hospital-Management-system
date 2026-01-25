import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { roomsApi } from '../../../../../services/api'
import { Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface RoomSelectFieldProps {
  selectedRooms: string[]
  onRoomsChange: (roomIds: string[]) => void
}

export function RoomSelectField({ selectedRooms, onRoomsChange }: RoomSelectFieldProps) {
  const [roomName, setRoomName] = useState('')
  const queryClient = useQueryClient()

  const { data: availableRooms } = useQuery({
    queryKey: ['available-rooms'],
    queryFn: () => roomsApi.getAll(),
  })

  const createRoomMutation = useMutation({
    mutationFn: async (name: string) => {
      const roomData = {
        roomNumber: `ROOM-${Date.now()}`,
        name: name.trim(),
        type: 'General',
        capacity: 0, // No beds initially
      }
      return await roomsApi.create(roomData)
    },
    onSuccess: (newRoom: any) => {
      queryClient.invalidateQueries({ queryKey: ['available-rooms'] })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      onRoomsChange([...selectedRooms, newRoom.id])
      setRoomName('')
      toast.success('Room created and added successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create room')
    },
  })

  const selectedRoomsData = availableRooms?.filter((room: any) => selectedRooms.includes(room.id)) || []

  const handleCreate = () => {
    if (!roomName.trim()) {
      toast.error('Room name is required')
      return
    }
    createRoomMutation.mutate(roomName)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCreate()
    }
  }

  const removeRoom = (roomId: string) => {
    onRoomsChange(selectedRooms.filter((id) => id !== roomId))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter room name"
          disabled={createRoomMutation.isPending}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={createRoomMutation.isPending || !roomName.trim()}
          className="px-4 py-2 bg-black text-white rounded-md text-sm font-bold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createRoomMutation.isPending ? 'Creating...' : 'Create'}
        </button>
      </div>

      {selectedRoomsData.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedRoomsData.map((room: any) => (
            <span
              key={room.id}
              className="inline-flex items-center px-3 py-1 bg-black text-white rounded-full text-sm font-bold"
            >
              {room.name || `Room ${room.roomNumber}`}
              <button
                type="button"
                onClick={() => removeRoom(room.id)}
                className="ml-2 hover:text-gray-300"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

