import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nursesApi, withdrawalsApi, salariesApi } from '../../../../services/api'
import { useAuth } from '../../../../contexts/AuthContext'
import { Calendar, DollarSign, Wallet, X } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function MySalaryPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedPeriod, setSelectedPeriod] = useState<{ start: string; end: string }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
  })
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [withdrawalNotes, setWithdrawalNotes] = useState('')

  // Fetch nurse profile
  const { data: nurseProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ['nurse-profile', user?.id],
    queryFn: () => nursesApi.getMyProfile(),
    enabled: !!user?.id,
  })

  // Fetch saved salaries for this nurse
  const { data: mySalaries = [], isLoading: loadingSalaries, refetch: refetchSalaries } = useQuery({
    queryKey: ['my-salaries'],
    queryFn: () => salariesApi.getMySalaries(),
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    staleTime: 0,
    cacheTime: 0,
  })

  // Fetch my withdrawals
  const { data: myWithdrawals = [] } = useQuery({
    queryKey: ['my-withdrawals'],
    queryFn: () => withdrawalsApi.getMyWithdrawals(),
    enabled: !!user?.id,
  })

  // Handle refresh button
  const handleRefresh = async () => {
    await Promise.all([
      refetchSalaries(),
      queryClient.invalidateQueries({ queryKey: ['my-salaries'] }),
      queryClient.invalidateQueries({ queryKey: ['my-withdrawals'] }),
      queryClient.invalidateQueries({ queryKey: ['nurse-profile', user?.id] }),
    ])
    toast.success('Data refreshed successfully')
  }

  // Find salary for selected period
  const currentPeriodSalary = useMemo(() => {
    if (!mySalaries.length) return null
    
    const selectedStart = new Date(selectedPeriod.start + 'T00:00:00')
    const selectedEnd = new Date(selectedPeriod.end + 'T23:59:59')

    return mySalaries.find((salary: any) => {
      const salaryStart = new Date(salary.periodStart)
      salaryStart.setHours(0, 0, 0, 0)
      const salaryEnd = new Date(salary.periodEnd)
      salaryEnd.setHours(23, 59, 59, 999)
      
      const selectedStartDate = new Date(selectedStart.getFullYear(), selectedStart.getMonth(), selectedStart.getDate())
      const selectedEndDate = new Date(selectedEnd.getFullYear(), selectedEnd.getMonth(), selectedEnd.getDate())
      const salaryStartDate = new Date(salaryStart.getFullYear(), salaryStart.getMonth(), salaryStart.getDate())
      const salaryEndDate = new Date(salaryEnd.getFullYear(), salaryEnd.getMonth(), salaryEnd.getDate())
      
      return selectedStartDate.getTime() === salaryStartDate.getTime() && 
             selectedEndDate.getTime() === salaryEndDate.getTime()
    })
  }, [mySalaries, selectedPeriod])

  const baseSalary = currentPeriodSalary 
    ? parseFloat(currentPeriodSalary.baseSalary?.toString() || '0')
    : (nurseProfile as any)?.salary || 0
  
  const totalSalary = currentPeriodSalary
    ? parseFloat(currentPeriodSalary.totalSalary?.toString() || '0')
    : baseSalary

  // Calculate available balance
  const approvedWithdrawals = useMemo(() => {
    return myWithdrawals
      .filter((w: any) => w.status === 'APPROVED' || w.status === 'COMPLETED')
      .reduce((sum: number, w: any) => sum + (parseFloat(w.amount) || 0), 0)
  }, [myWithdrawals])

  const availableBalance = Math.max(0, totalSalary - approvedWithdrawals)

  // Withdrawal mutation
  const withdrawalMutation = useMutation({
    mutationFn: (data: { amount: number; notes?: string }) => withdrawalsApi.create(data),
    onSuccess: () => {
      toast.success('Withdrawal request submitted successfully')
      queryClient.invalidateQueries({ queryKey: ['my-withdrawals'] })
      setShowWithdrawalModal(false)
      setWithdrawalAmount('')
      setWithdrawalNotes('')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to submit withdrawal request')
    },
  })

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawalAmount)
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    if (amount > availableBalance) {
      toast.error(`Amount exceeds available balance of PKR ${availableBalance.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
      return
    }
    withdrawalMutation.mutate({ amount, notes: withdrawalNotes || undefined })
  }

  if (loadingProfile || loadingSalaries) {
    return (
      <div className="pl-6 pr-8 pt-6 pb-6">
        <div className="text-center py-12">
          <p className="text-black font-bold">Loading salary information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pl-6 pr-8 pt-6 pb-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-black">My Salary</h1>
          <p className="text-sm text-gray-600 mt-0.5">View your salary details</p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-3 py-1.5 bg-black text-white rounded-md text-xs font-bold hover:bg-gray-900 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Period Selection */}
      <div className="bg-white rounded-xl shadow p-3">
        <div className="flex items-center space-x-3">
          <label className="text-sm font-bold text-black">Period:</label>
          <input
            type="date"
            value={selectedPeriod.start}
            onChange={(e) => setSelectedPeriod({ ...selectedPeriod, start: e.target.value })}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black text-black"
          />
          <span className="text-sm text-black font-bold">to</span>
          <input
            type="date"
            value={selectedPeriod.end}
            onChange={(e) => setSelectedPeriod({ ...selectedPeriod, end: e.target.value })}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black text-black"
          />
        </div>
      </div>

      {/* Salary Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-600">Base Salary</p>
              <p className="text-2xl font-extrabold text-black mt-1">
                PKR {baseSalary.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-black rounded-full p-2">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-600">Total Salary</p>
              <p className="text-2xl font-extrabold text-black mt-1">
                PKR {totalSalary.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              {currentPeriodSalary && (
                <p className="text-xs text-gray-500 mt-1">From saved salary record</p>
              )}
            </div>
            <div className="bg-black rounded-full p-2">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal Section */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-black">Available Balance</h2>
            <p className="text-xl font-extrabold text-green-600 mt-1">
              PKR {availableBalance.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Total: PKR {totalSalary.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - 
              Withdrawn: PKR {approvedWithdrawals.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <button
            onClick={() => setShowWithdrawalModal(true)}
            disabled={availableBalance <= 0}
            className="px-4 py-2 bg-black text-white rounded-md text-sm font-bold hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Wallet className="h-4 w-4" />
            <span>Request Withdrawal</span>
          </button>
        </div>
      </div>

      {/* Withdrawal History */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-3 border-b border-gray-200">
          <h2 className="text-base font-extrabold text-black">Withdrawal History</h2>
        </div>
        {myWithdrawals.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-black font-bold">No withdrawal requests yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {myWithdrawals.map((withdrawal: any) => {
              return (
                <div key={withdrawal.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="px-2 py-0.5 text-xs font-bold rounded bg-gray-100 text-black">
                          {withdrawal.status}
                        </span>
                        <span className="text-xs text-gray-600">
                          {format(new Date(withdrawal.requestedAt), 'MMM dd, yyyy hh:mm a')}
                        </span>
                      </div>
                      <p className="text-sm font-extrabold text-black">
                        PKR {parseFloat(withdrawal.amount).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      {withdrawal.notes && (
                        <p className="text-xs text-gray-600 mt-0.5">{withdrawal.notes}</p>
                      )}
                      {withdrawal.rejectionReason && (
                        <p className="text-xs text-red-600 mt-0.5">Reason: {withdrawal.rejectionReason}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {currentPeriodSalary === null && (
        <div className="bg-white rounded-xl shadow">
          <div className="p-6">
            <div className="text-center">
              <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-black font-bold">No salary record found for the selected period.</p>
              <p className="text-xs text-gray-600 mt-1">Please contact admin to generate your salary for this period.</p>
            </div>
          </div>
        </div>
      )}

      {/* Note */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
        <p className="text-xs text-gray-600">
          <strong>Note:</strong> Your salary is based on your base salary as set by the administration. 
          For any queries regarding your salary, please contact the HR department.
          Withdrawal requests are subject to admin approval.
        </p>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h2 className="text-xl font-bold text-black">Request Withdrawal</h2>
              <button
                onClick={() => {
                  setShowWithdrawalModal(false)
                  setWithdrawalAmount('')
                  setWithdrawalNotes('')
                }}
                className="text-black font-bold hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-black mb-1">Available Balance</label>
                <p className="text-lg font-extrabold text-green-600">
                  PKR {availableBalance.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">Amount to Withdraw (PKR) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={availableBalance}
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black text-black"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">Notes (Optional)</label>
                <textarea
                  value={withdrawalNotes}
                  onChange={(e) => setWithdrawalNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black text-black"
                  placeholder="Add any notes..."
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => {
                    setShowWithdrawalModal(false)
                    setWithdrawalAmount('')
                    setWithdrawalNotes('')
                  }}
                  className="px-4 py-1.5 border border-gray-300 rounded-md text-sm font-bold text-black hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawalMutation.isPending || !withdrawalAmount || parseFloat(withdrawalAmount) <= 0}
                  className="px-4 py-1.5 bg-black text-white rounded-md text-sm font-bold hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {withdrawalMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
