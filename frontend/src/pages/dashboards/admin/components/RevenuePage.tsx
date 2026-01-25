import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { appointmentsApi, patientsApi, invoicesApi, withdrawalsApi, doctorsApi, nursesApi } from '../../../../services/api'
import { Calendar, Users, DollarSign, TrendingUp, Clock, Filter, CreditCard } from 'lucide-react'
import { format, parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns'

export default function RevenuePage() {
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [filterType, setFilterType] = useState<'all' | 'appointments' | 'registrations' | 'invoices'>('all')

  // Fetch all appointments
  const { data: appointments = [], isLoading: loadingAppointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.getAll(),
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Fetch all patients
  const { data: patients = [], isLoading: loadingPatients } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsApi.getAll(),
    refetchInterval: 30000,
  })

  // Fetch all invoices
  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoicesApi.getAll(),
    refetchInterval: 30000,
  })

  // Fetch all withdrawals
  const { data: withdrawals = [], isLoading: loadingWithdrawals } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: () => withdrawalsApi.getAll(),
    refetchInterval: 30000,
  })

  // Fetch doctors and nurses for employee name lookup
  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorsApi.getAll(),
  })

  const { data: nurses = [] } = useQuery({
    queryKey: ['nurses'],
    queryFn: () => nursesApi.getAll(),
  })

  const isLoading = loadingAppointments || loadingPatients || loadingInvoices || loadingWithdrawals

  // Calculate revenue from invoices
  const totalRevenue = useMemo(() => {
    return invoices
      .filter((inv: any) => inv.status === 'PAID')
      .reduce((sum: number, inv: any) => sum + (parseFloat(inv.total) || 0), 0)
  }, [invoices])

  const todayRevenue = useMemo(() => {
    return invoices
      .filter((inv: any) => {
        if (inv.status !== 'PAID' || !inv.paidAt) return false
        try {
          return isToday(new Date(inv.paidAt))
        } catch {
          return false
        }
      })
      .reduce((sum: number, inv: any) => sum + (parseFloat(inv.total) || 0), 0)
  }, [invoices])

  const weekRevenue = useMemo(() => {
    return invoices
      .filter((inv: any) => {
        if (inv.status !== 'PAID' || !inv.paidAt) return false
        try {
          return isThisWeek(new Date(inv.paidAt))
        } catch {
          return false
        }
      })
      .reduce((sum: number, inv: any) => sum + (parseFloat(inv.total) || 0), 0)
  }, [invoices])

  const monthRevenue = useMemo(() => {
    return invoices
      .filter((inv: any) => {
        if (inv.status !== 'PAID' || !inv.paidAt) return false
        try {
          return isThisMonth(new Date(inv.paidAt))
        } catch {
          return false
        }
      })
      .reduce((sum: number, inv: any) => sum + (parseFloat(inv.total) || 0), 0)
  }, [invoices])

  // Combine all activities (appointments, registrations, invoices)
  const allActivities = useMemo(() => {
    const activities: any[] = []

    // Add appointments
    appointments.forEach((apt: any) => {
      activities.push({
        id: apt.id,
        type: 'appointment',
        typeLabel: 'Appointment Booked',
        date: apt.createdAt,
        appointmentDate: apt.appointmentDate,
        appointmentTime: apt.appointmentTime,
        patient: `${apt.patient?.firstName || ''} ${apt.patient?.lastName || ''}`.trim(),
        doctor: `${apt.doctor?.firstName || ''} ${apt.doctor?.lastName || ''}`.trim(),
        amount: null, // Will be calculated from invoices
        status: apt.status,
        description: `Appointment booked for ${format(new Date(apt.appointmentDate), 'MMM dd, yyyy')} at ${apt.appointmentTime}`,
      })
    })

    // Add patient registrations (using createdAt from patient record)
    patients.forEach((patient: any) => {
      activities.push({
        id: patient.id,
        type: 'registration',
        typeLabel: 'Patient Registered',
        date: patient.createdAt,
        appointmentDate: null,
        appointmentTime: null,
        patient: `${patient.user?.firstName || ''} ${patient.user?.lastName || ''}`.trim(),
        doctor: null,
        amount: null, // Will be calculated from invoices
        status: 'COMPLETED',
        description: `New patient registered: ${patient.user?.firstName || ''} ${patient.user?.lastName || ''}`,
      })
    })

    // Add invoices (paid ones show revenue)
    invoices
      .filter((inv: any) => inv.status === 'PAID')
      .forEach((inv: any) => {
        activities.push({
          id: inv.id,
          type: 'invoice',
          typeLabel: 'Payment Received',
          date: inv.paidAt || inv.createdAt,
          appointmentDate: null,
          appointmentTime: null,
          patient: `${inv.patient?.user?.firstName || ''} ${inv.patient?.user?.lastName || ''}`.trim(),
          doctor: null,
          amount: parseFloat(inv.total) || 0,
          status: inv.status,
          description: `Payment received: PKR ${parseFloat(inv.total || 0).toLocaleString()}`,
          invoiceNumber: inv.invoiceNumber,
        })
      })

    // Helper function to get employee name
    const getEmployeeName = (employeeId: string, employeeType: string) => {
      if (employeeType === 'DOCTOR') {
        const doctor = doctors.find((d: any) => d.id === employeeId)
        return doctor ? `${doctor.user?.firstName || ''} ${doctor.user?.lastName || ''}`.trim() : 'Unknown Doctor'
      } else if (employeeType === 'NURSE') {
        const nurse = nurses.find((n: any) => n.id === employeeId)
        return nurse ? `${nurse.user?.firstName || ''} ${nurse.user?.lastName || ''}`.trim() : 'Unknown Nurse'
      }
      return 'Unknown'
    }

    // Add salary withdrawals (approved and completed ones)
    withdrawals
      .filter((w: any) => w.status === 'APPROVED' || w.status === 'COMPLETED')
      .forEach((w: any) => {
        const employeeName = getEmployeeName(w.employeeId, w.employeeType)
        
        activities.push({
          id: w.id,
          type: 'withdrawal',
          typeLabel: 'Salary Withdrawal',
          date: w.approvedAt || w.completedAt || w.requestedAt || w.createdAt,
          appointmentDate: null,
          appointmentTime: null,
          patient: null,
          doctor: employeeName,
          amount: -parseFloat(w.amount) || 0, // Negative amount to show as expense
          status: w.status,
          description: `Salary withdrawal: PKR ${parseFloat(w.amount || 0).toLocaleString()}`,
          employeeType: w.employeeType,
        })
      })

    // Sort by date (newest first)
    return activities.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA
    })
  }, [appointments, patients, invoices, withdrawals, doctors, nurses])

  // Filter activities
  const filteredActivities = useMemo(() => {
    let filtered = allActivities

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((activity) => {
        if (filterType === 'appointments') return activity.type === 'appointment'
        if (filterType === 'registrations') return activity.type === 'registration'
        if (filterType === 'invoices') return activity.type === 'invoice'
        if (filterType === 'withdrawals') return activity.type === 'withdrawal'
        return true
      })
    }

    // Filter by period
    if (filterPeriod !== 'all') {
      filtered = filtered.filter((activity) => {
        try {
          const activityDate = new Date(activity.date)
          if (filterPeriod === 'today') return isToday(activityDate)
          if (filterPeriod === 'week') return isThisWeek(activityDate)
          if (filterPeriod === 'month') return isThisMonth(activityDate)
        } catch {
          return false
        }
        return true
      })
    }

    // Limit to last 20 transactions
    return filtered.slice(0, 20)
  }, [allActivities, filterType, filterPeriod])

  // Calculate filtered revenue
  const filteredRevenue = useMemo(() => {
    return filteredActivities
      .filter((activity) => activity.amount !== null && activity.amount > 0)
      .reduce((sum, activity) => sum + activity.amount, 0)
  }, [filteredActivities])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return Calendar
      case 'registration':
        return Users
      case 'invoice':
        return DollarSign
      case 'withdrawal':
        return CreditCard
      default:
        return Clock
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'bg-gray-100 text-black'
      case 'registration':
        return 'bg-gray-100 text-black'
      case 'invoice':
        return 'bg-gray-100 text-black'
      default:
        return 'bg-gray-100 text-black'
    }
  }

  return (
    <div className="pl-6 pr-8 pt-6 pb-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-black">Revenue & Financial Activities</h1>
          <p className="text-sm text-gray-600 mt-0.5">Track all revenue-generating activities in real-time</p>
        </div>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-600">Total Revenue</p>
              <p className="text-2xl font-extrabold text-black mt-1">
                PKR {totalRevenue.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              <p className="text-xs font-bold text-gray-600">Today's Revenue</p>
              <p className="text-2xl font-extrabold text-black mt-1">
                PKR {todayRevenue.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-black rounded-full p-2">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-600">This Week</p>
              <p className="text-2xl font-extrabold text-black mt-1">
                PKR {weekRevenue.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              <p className="text-xs font-bold text-gray-600">This Month</p>
              <p className="text-2xl font-extrabold text-black mt-1">
                PKR {monthRevenue.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-black rounded-full p-2">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-black" />
            <span className="text-sm font-bold text-black">Filters:</span>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-black">Period:</label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value as any)}
              className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black text-black"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-black">Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black text-black"
            >
              <option value="all">All Activities</option>
              <option value="appointments">Appointments</option>
              <option value="registrations">Registrations</option>
              <option value="invoices">Payments</option>
              <option value="withdrawals">Withdrawals</option>
            </select>
          </div>

          {filteredRevenue > 0 && (
            <div className="ml-auto">
              <span className="text-xs font-bold text-gray-600">Filtered Revenue: </span>
              <span className="text-sm font-extrabold text-black">
                PKR {filteredRevenue.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Activities List */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-3 border-b border-gray-200">
          <h2 className="text-base font-extrabold text-black">
            Financial Activities ({filteredActivities.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-sm text-black font-bold">Loading activities...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-black font-bold">No activities found for selected filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredActivities.map((activity) => {
              const Icon = getActivityIcon(activity.type)
              const colorClass = getActivityColor(activity.type)

              return (
                <div key={`${activity.type}-${activity.id}`} className="p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className={`rounded-full p-2 ${colorClass} flex-shrink-0`}>
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1 flex-wrap">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded ${colorClass}`}>
                            {activity.typeLabel}
                          </span>
                          {activity.status && (
                            <span className="px-2 py-0.5 text-xs font-bold rounded bg-gray-100 text-gray-800 capitalize">
                              {activity.status.toLowerCase()}
                            </span>
                          )}
                          {activity.invoiceNumber && (
                            <span className="text-xs text-gray-500">#{activity.invoiceNumber}</span>
                          )}
                        </div>

                        <p className="text-sm font-bold text-black truncate">{activity.description}</p>

                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-600">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {format(new Date(activity.date), 'MMM dd, yyyy hh:mm a')}
                          </span>
                          {activity.patient && (
                            <span className="flex items-center truncate">
                              <Users className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{activity.patient}</span>
                            </span>
                          )}
                          {activity.doctor && (
                            <span className="flex items-center truncate">
                              <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">Dr. {activity.doctor}</span>
                            </span>
                          )}
                          {activity.appointmentDate && activity.appointmentTime && (
                            <span className="truncate">
                              {format(new Date(activity.appointmentDate), 'MMM dd')} at {activity.appointmentTime}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {activity.amount !== null && activity.amount !== 0 && (
                      <div className="text-right flex-shrink-0">
                        <p className={`text-lg font-extrabold ${activity.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {activity.amount > 0 ? '+' : ''}PKR {Math.abs(activity.amount).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


