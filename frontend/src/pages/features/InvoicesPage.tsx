import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoicesApi, patientsApi, appointmentsApi, visitNotesApi, prescriptionsApi, doctorsApi, tasksApi, patientQueueApi } from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Receipt, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../../contexts/AuthContext'
import { useRole } from '../../hooks/useRole'

interface InvoicesPageProps {
  showHeading?: boolean
}

export default function InvoicesPage({ showHeading = true }: InvoicesPageProps = {}) {
  const { user } = useAuth()
  const { isAdmin, isDoctor, isNurse } = useRole()
  const [showModal, setShowModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoicesApi.getAll(),
  })

  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsApi.getAll(),
  })

  // Get doctor profile to get doctor.id (not user.id)
  const { data: doctorProfile } = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: () => doctorsApi.getMyProfile(),
    enabled: isDoctor && !!user?.id,
  })

  // Fetch doctor's appointments, visit notes, and prescriptions to filter invoices
  const { data: appointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.getAll(),
    enabled: isDoctor,
  })

  const { data: visitNotes } = useQuery({
    queryKey: ['visit-notes'],
    queryFn: () => visitNotesApi.getAll(),
    enabled: isDoctor,
  })

  const { data: prescriptions } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: () => prescriptionsApi.getAll(),
    enabled: isDoctor,
  })

  // Filter invoices: For doctors, show only invoices for patients they've treated
  const filteredInvoices = useMemo(() => {
    if (!invoices) return []
    
    if (isAdmin) {
      // Admin sees all invoices
      return invoices
    }
    
    if (isDoctor && user?.id && doctorProfile?.id) {
      // Get patient IDs that this doctor has treated
      const treatedPatientIds = new Set<string>()
      
      // From appointments (doctorId is user.id)
      appointments?.forEach((apt: any) => {
        if (apt.doctorId === user.id && apt.patientId) {
          treatedPatientIds.add(apt.patientId)
        }
      })
      
      // From visit notes (doctorId is doctor.id, not user.id)
      visitNotes?.forEach((note: any) => {
        if (note.doctorId === doctorProfile.id && note.patientId) {
          treatedPatientIds.add(note.patientId)
        }
      })
      
      // From prescriptions (doctorId is user.id)
      prescriptions?.forEach((pres: any) => {
        if (pres.doctorId === user.id && pres.patientId) {
          treatedPatientIds.add(pres.patientId)
        }
      })
      
      // Filter invoices to show only those for treated patients
      return invoices.filter((invoice: any) => 
        treatedPatientIds.has(invoice.patientId)
      )
    }
    
    // For other roles, return all invoices (or filter as needed)
    return invoices
  }, [invoices, appointments, visitNotes, prescriptions, isAdmin, isDoctor, user?.id, doctorProfile?.id])

  const createMutation = useMutation({
    mutationFn: invoicesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      setShowModal(false)
      toast.success('Invoice created successfully')
    },
    onError: () => {
      toast.error('Failed to create invoice')
    },
  })

  const markPaidMutation = useMutation({
    mutationFn: invoicesApi.markAsPaid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Invoice marked as paid')
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const items = [
      {
        description: formData.get('itemDescription') as string,
        quantity: Number(formData.get('quantity')),
        price: Number(formData.get('price')),
      },
    ]
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0)
    const tax = subtotal * 0.1
    const total = subtotal + tax

    createMutation.mutate({
      patientId: formData.get('patientId') as string,
      items,
      subtotal,
      tax,
      total,
      dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : undefined,
    })
  }

  return (
    <div className="pl-6 pr-8 pt-6 pb-6">
      <div className="space-y-6">
        {showHeading && (
          <h2 className="text-4xl font-extrabold text-black">Billing & Invoices</h2>
        )}

        {/* Invoices Section */}
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-black">Invoices</h3>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-black hover:bg-gray-900"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Invoice
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-black font-bold">Loading...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="bg-white shadow-lg rounded-xl p-8 text-center">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-black font-bold">No invoices found</p>
            {(isDoctor || isNurse) && (
              <p className="text-sm text-gray-500 mt-2">Invoices will appear here for patients you have worked with</p>
            )}
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {filteredInvoices.map((invoice: any) => (
                <li key={invoice.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Receipt className="h-5 w-5 text-black mr-3" />
                        <div>
                          <p className="text-sm font-bold text-black">
                            {invoice.invoiceNumber}
                          </p>
                          <p className="text-sm text-black">
                            {invoice.patient?.user?.firstName} {invoice.patient?.user?.lastName}
                          </p>
                          <p className="text-sm text-black">
                            {format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-bold text-black flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {Number(invoice.total).toFixed(2)}
                          </p>
                          <span className={`inline-block mt-1 px-2 py-1 text-xs font-bold rounded-full ${
                            invoice.status === 'PAID' ? 'bg-black text-white' :
                            invoice.status === 'PENDING' ? 'bg-gray-700 text-white' :
                            invoice.status === 'OVERDUE' ? 'bg-gray-800 text-white' :
                            'bg-gray-900 text-white'
                          }`}>
                            {invoice.status}
                          </span>
                        </div>
                        {invoice.status === 'PENDING' && (
                          <button
                            onClick={() => markPaidMutation.mutate(invoice.id)}
                            className="text-black hover:text-gray-700 text-sm font-bold"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-black mb-4">Create Invoice</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <select name="patientId" required className="w-full px-3 py-2 border rounded-md">
                  <option value="">Select Patient</option>
                  {patients?.map((patient: any) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.user?.firstName} {patient.user?.lastName}
                    </option>
                  ))}
                </select>
                <input
                  name="itemDescription"
                  placeholder="Item Description"
                  required
                  className="w-full px-3 py-2 border rounded-md"
                />
                <input
                  name="quantity"
                  type="number"
                  placeholder="Quantity"
                  required
                  min="1"
                  className="w-full px-3 py-2 border rounded-md"
                />
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  required
                  min="0"
                  className="w-full px-3 py-2 border rounded-md"
                />
                <input
                  name="dueDate"
                  type="date"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-black font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 font-bold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}





