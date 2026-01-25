import { useState, useMemo } from 'react'
import { X, Printer, Calendar, Receipt, Search } from 'lucide-react'
import { RegistrationPrintReceipt } from './RegistrationPrintReceipt'
import { format } from 'date-fns'

interface TodaysReceiptsModalProps {
  open: boolean
  onClose: () => void
}

export function TodaysReceiptsModal({ open, onClose }: TodaysReceiptsModalProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Get all receipts from localStorage
  const allReceipts = useMemo(() => {
    try {
      const receipts = JSON.parse(localStorage.getItem('walkin_receipts') || '[]')
      // Sort by date - newest first
      return receipts.sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA // Descending order (newest first)
      })
    } catch {
      return []
    }
  }, [open])

  // Filter receipts by patient name/search term
  const filteredReceipts = useMemo(() => {
    if (!searchTerm.trim()) {
      return allReceipts
    }

    const search = searchTerm.toLowerCase().trim()
    return allReceipts.filter((receipt: any) => {
      const firstName = receipt.patient?.user?.firstName?.toLowerCase() || ''
      const lastName = receipt.patient?.user?.lastName?.toLowerCase() || ''
      const fullName = `${firstName} ${lastName}`.trim()
      const email = receipt.patient?.user?.email?.toLowerCase() || ''
      
      return fullName.includes(search) || email.includes(search)
    })
  }, [allReceipts, searchTerm])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 sticky top-0 bg-white z-10 border-b border-gray-200">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-black">All Registration Receipts</h2>
              <p className="text-sm text-gray-500">
                {filteredReceipts.length} receipt{filteredReceipts.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <button onClick={onClose} className="text-black font-bold hover:text-gray-700 ml-4">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-6 pt-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black"
              />
            </div>
          </div>

          <div className="p-6">
            {filteredReceipts.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-bold text-black">
                  {searchTerm ? 'No receipts found matching your search' : 'No receipts found'}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {searchTerm 
                    ? 'Try searching with a different name or email'
                    : 'Receipts will appear here after patient registration'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReceipts.map((receipt: any, index: number) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-4 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                    onClick={() => setSelectedReceipt(receipt)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            receipt.patientType === 'old' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {receipt.patientType === 'old' ? 'Returning' : 'New'}
                          </span>
                        </div>
                        <h3 className="font-bold text-black text-lg">
                          {receipt.patient?.user?.firstName} {receipt.patient?.user?.lastName}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {receipt.patient?.user?.email}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center text-xs text-gray-600">
                        <Calendar className="h-3 w-3 mr-2" />
                        {receipt.createdAt 
                          ? format(new Date(receipt.createdAt), 'dd/MM/yyyy HH:mm')
                          : 'N/A'}
                      </div>
                      {receipt.appointment && (
                        <div className="text-xs text-gray-600">
                          ✓ Appointment scheduled
                        </div>
                      )}
                      {receipt.bedAssignment && (
                        <div className="text-xs text-gray-600">
                          ✓ Bed assigned
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedReceipt(receipt)
                      }}
                      className="w-full px-3 py-2 bg-black text-white rounded-md font-bold hover:bg-gray-900 text-sm flex items-center justify-center"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      View Receipt
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Detail Modal */}
      {selectedReceipt && (
        <RegistrationPrintReceipt
          registrationData={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </>
  )
}
