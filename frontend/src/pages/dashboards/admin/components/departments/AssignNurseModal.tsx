import { X } from 'lucide-react'

interface AssignNurseModalProps {
  isOpen: boolean
  departmentName: string
  availableNurses: any[]
  onClose: () => void
  onAssign: (nurseId: string) => void
  isPending: boolean
}

export function AssignNurseModal({
  isOpen,
  departmentName,
  availableNurses,
  onClose,
  onAssign,
  isPending,
}: AssignNurseModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-black">Assign Nurse to {departmentName}</h2>
          <button onClick={onClose} className="text-black hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">
          {availableNurses && availableNurses.length > 0 ? (
            <div className="space-y-3">
              {availableNurses.map((nurse: any) => (
                <div key={nurse.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-black">
                      {nurse.user?.firstName} {nurse.user?.lastName}
                    </h4>
                    <p className="text-sm text-gray-600">Email: {nurse.user?.email}</p>
                    {nurse.licenseNumber && (
                      <p className="text-sm text-gray-600">License: {nurse.licenseNumber}</p>
                    )}
                  </div>
                  <button
                    onClick={() => onAssign(nurse.id)}
                    disabled={isPending}
                    className="px-4 py-2 bg-black text-white rounded-md font-bold hover:bg-gray-900 disabled:opacity-50"
                  >
                    {isPending ? 'Assigning...' : 'Assign'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-8">No available nurses to assign</p>
          )}
        </div>
      </div>
    </div>
  )
}

