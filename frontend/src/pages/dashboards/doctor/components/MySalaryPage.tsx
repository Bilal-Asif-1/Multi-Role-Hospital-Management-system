import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { doctorsApi, withdrawalsApi, salariesApi, appointmentsApi } from '../../../../services/api'
import { useAuth } from '../../../../contexts/AuthContext'
import { Calendar, DollarSign, Clock, Wallet, X } from 'lucide-react'
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

  // Fetch doctor profile
  const { data: doctorProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: () => doctorsApi.getMyProfile(),
    enabled: !!user?.id,
  })

  // Fetch saved salaries for this doctor
  const { data: mySalaries = [], isLoading: loadingSalaries, refetch: refetchSalaries } = useQuery({
    queryKey: ['my-salaries'],
    queryFn: () => salariesApi.getMySalaries(),
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale to force refetch
    cacheTime: 0, // Don't cache
  })

  // Fetch appointments for selected period to calculate earnings
  const { data: allAppointments = [], refetch: refetchAppointments } = useQuery({
    queryKey: ['appointments', selectedPeriod],
    queryFn: () => appointmentsApi.getAll(),
  })

  // Handle refresh button
  const handleRefresh = async () => {
    await Promise.all([
      refetchSalaries(),
      refetchAppointments(),
      queryClient.invalidateQueries({ queryKey: ['my-salaries'] }),
      queryClient.invalidateQueries({ queryKey: ['appointments'] }),
      queryClient.invalidateQueries({ queryKey: ['doctor-profile'] }),
    ])
    toast.success('Data refreshed successfully')
  }

  // Find salary for selected period (compare dates by day, ignoring time)
  const currentPeriodSalary = useMemo(() => {
    if (!mySalaries.length) return null
    
    // Normalize selected period dates (set to start/end of day)
    const selectedStart = new Date(selectedPeriod.start + 'T00:00:00')
    const selectedEnd = new Date(selectedPeriod.end + 'T23:59:59')

    return mySalaries.find((salary: any) => {
      // Normalize salary period dates from ISO strings
      const salaryStart = new Date(salary.periodStart)
      salaryStart.setHours(0, 0, 0, 0)
      const salaryEnd = new Date(salary.periodEnd)
      salaryEnd.setHours(23, 59, 59, 999)
      
      // Compare dates by year, month, day only
      const selectedStartDate = new Date(selectedStart.getFullYear(), selectedStart.getMonth(), selectedStart.getDate())
      const selectedEndDate = new Date(selectedEnd.getFullYear(), selectedEnd.getMonth(), selectedEnd.getDate())
      const salaryStartDate = new Date(salaryStart.getFullYear(), salaryStart.getMonth(), salaryStart.getDate())
      const salaryEndDate = new Date(salaryEnd.getFullYear(), salaryEnd.getMonth(), salaryEnd.getDate())
      
      return selectedStartDate.getTime() === salaryStartDate.getTime() && 
             selectedEndDate.getTime() === salaryEndDate.getTime()
    })
  }, [mySalaries, selectedPeriod])

  // Filter appointments for selected period and this doctor
  const periodAppointments = useMemo(() => {
    if (!allAppointments.length || !user?.id) return []
    
    const periodStart = new Date(selectedPeriod.start)
    periodStart.setHours(0, 0, 0, 0)
    const periodEnd = new Date(selectedPeriod.end)
    periodEnd.setHours(23, 59, 59, 999)
    
    return allAppointments.filter((apt: any) => {
      if (apt.doctorId !== user.id) return false
      const aptDate = new Date(apt.appointmentDate)
      return aptDate >= periodStart && aptDate <= periodEnd
    })
  }, [allAppointments, selectedPeriod, user?.id])


  const baseSalary = currentPeriodSalary 
    ? parseFloat(currentPeriodSalary.baseSalary?.toString() || '0')
    : (doctorProfile?.salary || 0)
  
  const totalAppointmentEarnings = currentPeriodSalary
    ? parseFloat(currentPeriodSalary.appointmentEarnings?.toString() || '0')
    : 0 // Don't show earnings until admin generates salary

  const totalSalary = currentPeriodSalary
    ? parseFloat(currentPeriodSalary.totalSalary?.toString() || '0')
    : baseSalary // Only show base salary if no salary record

  // Fetch my withdrawals
  const { data: myWithdrawals = [] } = useQuery({
    queryKey: ['my-withdrawals'],
    queryFn: () => withdrawalsApi.getMyWithdrawals(),
  })

  // Calculate available balance (total salary minus already withdrawn)
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
          <p className="text-sm text-gray-600 mt-0.5">View your salary details and earnings</p>
        </div>
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
          <button
            onClick={handleRefresh}
            className="ml-auto px-3 py-1.5 bg-black text-white rounded-md text-xs font-bold hover:bg-gray-900 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Salary Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <p className="text-xs font-bold text-gray-600">Appointments</p>
              <p className="text-2xl font-extrabold text-black mt-1">
                {currentPeriodSalary && currentPeriodSalary.appointmentShares && Array.isArray(currentPeriodSalary.appointmentShares)
                  ? currentPeriodSalary.appointmentShares.length
                  : periodAppointments.length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {currentPeriodSalary && currentPeriodSalary.appointmentShares && Array.isArray(currentPeriodSalary.appointmentShares)
                  ? `${currentPeriodSalary.appointmentShares.length} appointment${currentPeriodSalary.appointmentShares.length !== 1 ? 's' : ''} booked`
                  : `${periodAppointments.length} appointment${periodAppointments.length !== 1 ? 's' : ''} booked`}
              </p>
            </div>
            <div className="bg-black rounded-full p-2">
              <Calendar className="h-5 w-5 text-white" />
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
                <p className="text-xs text-gray-500 mt-1">
                  From saved salary record
                </p>
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
              const statusColors: any = {
                PENDING: 'bg-gray-100 text-black',
                APPROVED: 'bg-gray-100 text-black',
                COMPLETED: 'bg-gray-100 text-black',
                REJECTED: 'bg-gray-100 text-black',
              }
              return (
                <div key={withdrawal.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${statusColors[withdrawal.status] || 'bg-gray-100 text-black'}`}>
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

      {/* Appointment Details from Salary Record - Only show count, no amounts */}
      {currentPeriodSalary && currentPeriodSalary.appointmentShares && Array.isArray(currentPeriodSalary.appointmentShares) && currentPeriodSalary.appointmentShares.length > 0 && (
        <div className="bg-white rounded-xl shadow">
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-black">
                Appointments ({currentPeriodSalary.appointmentShares.length})
              </h2>
              <span className="text-xs text-gray-500">
                Salary Generated: {currentPeriodSalary.createdAt ? format(new Date(currentPeriodSalary.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {currentPeriodSalary.appointmentShares.map((share: any, index: number) => (
              <div key={share.appointmentId || index} className="p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-100 rounded-full p-2">
                    <Calendar className="h-4 w-4 text-black" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-extrabold text-black">
                      {format(new Date(share.appointmentDate), 'MMM dd, yyyy')} at {share.appointmentTime}
                    </h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Patient: {share.patientName || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentPeriodSalary === null && (
        <div className="bg-white rounded-xl shadow">
          <div className="p-6">
            <div className="text-center mb-4">
              <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-black font-bold">No salary record found for the selected period.</p>
              <p className="text-xs text-gray-600 mt-1">Please contact admin to generate your salary for this period.</p>
              {mySalaries.length > 0 && (
                <p className="text-xs text-red-600 mt-2">Note: You have {mySalaries.length} salary record(s), but none match the selected period.</p>
              )}
            </div>
            
            {/* Show appointments summary even without salary record */}
            {periodAppointments.length > 0 && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-sm font-extrabold text-black mb-3">
                  Appointments in Selected Period ({periodAppointments.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {periodAppointments.map((apt: any) => (
                    <div key={apt.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded border border-gray-200">
                      <div className="bg-gray-100 rounded-full p-1.5">
                        <Calendar className="h-3 w-3 text-black" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-black">
                          {format(new Date(apt.appointmentDate), 'MMM dd, yyyy')} at {apt.appointmentTime}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Patient: {apt.patient?.firstName} {apt.patient?.lastName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-600">Total Appointments:</span>
                    <span className="text-sm font-extrabold text-black">{periodAppointments.length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Note */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
        <p className="text-xs text-gray-600">
          <strong>Note:</strong> Salary calculations are based on your base salary and appointment fees. 
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
                <label className="block text-xs font-bold text-black mb-1">
                  Available Balance
                </label>
                <p className="text-lg font-extrabold text-green-600">
                  PKR {availableBalance.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Amount to Withdraw (PKR) *
                </label>
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
                <label className="block text-xs font-bold text-black mb-1">
                  Notes (Optional)
                </label>
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


