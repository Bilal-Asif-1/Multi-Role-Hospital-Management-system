import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { withdrawalsApi, doctorsApi, nursesApi } from '../../../../services/api'
import { CheckCircle, XCircle, Clock, Wallet, Filter, Search } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function WithdrawalsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'>('all')
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState<'all' | 'DOCTOR' | 'NURSE'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch all withdrawals
  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ['withdrawals', statusFilter],
    queryFn: () => withdrawalsApi.getAll({ status: statusFilter === 'all' ? undefined : statusFilter }),
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Fetch doctors and nurses for name lookup
  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorsApi.getAll(),
  })

  const { data: nurses = [] } = useQuery({
    queryKey: ['nurses'],
    queryFn: () => nursesApi.getAll(),
  })

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: withdrawalsApi.approve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] })
      queryClient.invalidateQueries({ queryKey: ['hospital-account'] })
      queryClient.invalidateQueries({ queryKey: ['salaries'] })
      toast.success('Withdrawal approved successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to approve withdrawal')
    },
  })

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason?: string }) =>
      withdrawalsApi.reject(id, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] })
      toast.success('Withdrawal rejected')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to reject withdrawal')
    },
  })

  // Get employee name helper
  const getEmployeeName = (employeeId: string, employeeType: string) => {
    if (employeeType === 'DOCTOR') {
      const doctor = doctors.find((d: any) => d.id === employeeId)
      return doctor ? `Dr. ${doctor.user?.firstName} ${doctor.user?.lastName}` : 'Unknown Doctor'
    } else if (employeeType === 'NURSE') {
      const nurse = nurses.find((n: any) => n.id === employeeId)
      return nurse ? `${nurse.user?.firstName} ${nurse.user?.lastName}` : 'Unknown Nurse'
    }
    return 'Unknown'
  }

  // Filter withdrawals
  const filteredWithdrawals = useMemo(() => {
    let filtered = withdrawals

    // Filter by employee type
    if (employeeTypeFilter !== 'all') {
      filtered = filtered.filter((w: any) => w.employeeType === employeeTypeFilter)
    }

    // Filter by search term (employee name)
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter((w: any) => {
        const name = getEmployeeName(w.employeeId, w.employeeType).toLowerCase()
        return name.includes(search)
      })
    }

    return filtered.sort((a: any, b: any) => {
      // Sort by requested date (newest first)
      return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    })
  }, [withdrawals, employeeTypeFilter, searchTerm, doctors, nurses])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completed' },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    return (
      <span className={`px-2 py-1 text-xs font-bold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const handleApprove = (id: string) => {
    if (window.confirm('Are you sure you want to approve this withdrawal request? This will deduct the amount from the hospital account.')) {
      approveMutation.mutate(id)
    }
  }

  const handleReject = (id: string) => {
    const reason = window.prompt('Please provide a reason for rejection (optional):')
    rejectMutation.mutate({ id, rejectionReason: reason || undefined })
  }

  return (
    <div className="pl-6 pr-8 pt-6 pb-6">
      <div className="mb-6">
        <h1 className="text-4xl font-extrabold text-black">Withdrawal Requests</h1>
        <p className="text-sm text-gray-600 mt-1">Manage employee salary withdrawal requests</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-black" />
            <span className="text-sm font-bold text-black">Filters:</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-black">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="all">All</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-black">Employee Type:</label>
            <select
              value={employeeTypeFilter}
              onChange={(e) => setEmployeeTypeFilter(e.target.value as any)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="all">All</option>
              <option value="DOCTOR">Doctor</option>
              <option value="NURSE">Nurse</option>
            </select>
          </div>

          <div className="flex-1 flex items-center space-x-2 max-w-md">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by employee name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>
        </div>
      </div>

      {/* Withdrawals List */}
      {isLoading ? (
        <div className="text-center py-12 text-black font-bold">Loading withdrawals...</div>
      ) : filteredWithdrawals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-black font-bold text-lg">No withdrawal requests found</p>
          <p className="text-sm text-gray-600 mt-2">
            {statusFilter !== 'all' ? `No ${statusFilter.toLowerCase()} withdrawals` : 'No withdrawals to display'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-3 border-b border-gray-200">
            <p className="text-sm font-bold text-black">
              Total: {filteredWithdrawals.length} withdrawal request{filteredWithdrawals.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredWithdrawals.map((withdrawal: any) => (
              <div key={withdrawal.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-black">
                        {getEmployeeName(withdrawal.employeeId, withdrawal.employeeType)}
                      </h3>
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                        {withdrawal.employeeType}
                      </span>
                      {getStatusBadge(withdrawal.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Amount</p>
                        <p className="font-bold text-black">
                          PKR {parseFloat(withdrawal.amount.toString()).toLocaleString('en-PK', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-gray-600">Requested</p>
                        <p className="font-bold text-black">
                          {format(new Date(withdrawal.requestedAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>

                      {withdrawal.approvedAt && (
                        <div>
                          <p className="text-gray-600">Approved</p>
                          <p className="font-bold text-black">
                            {format(new Date(withdrawal.approvedAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      )}

                      {withdrawal.rejectedAt && (
                        <div>
                          <p className="text-gray-600">Rejected</p>
                          <p className="font-bold text-red-600">
                            {format(new Date(withdrawal.rejectedAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      )}

                      {withdrawal.completedAt && (
                        <div>
                          <p className="text-gray-600">Completed</p>
                          <p className="font-bold text-green-600">
                            {format(new Date(withdrawal.completedAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      )}
                    </div>

                    {withdrawal.notes && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">Notes:</p>
                        <p className="text-sm text-black">{withdrawal.notes}</p>
                      </div>
                    )}

                    {withdrawal.rejectionReason && (
                      <div className="mt-2">
                        <p className="text-sm text-red-600 font-bold">Rejection Reason:</p>
                        <p className="text-sm text-red-700">{withdrawal.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  {withdrawal.status === 'PENDING' && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleApprove(withdrawal.id)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(withdrawal.id)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
