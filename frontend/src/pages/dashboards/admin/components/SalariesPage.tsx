import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { doctorsApi, nursesApi, appointmentsApi, withdrawalsApi, salariesApi } from '../../../../services/api'
import { UserCog, UserPlus, Calendar, Calculator, Save, X, Wallet, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface AppointmentShare {
  appointmentId: string
  sharePercentage: number
  appointmentDate: string
  appointmentTime: string
  patientName: string
  fee: number
}

interface EmployeeSalary {
  id: string
  name: string
  role: 'DOCTOR' | 'NURSE'
  baseSalary: number
  appointments?: any[]
  appointmentShares: AppointmentShare[]
  totalAppointmentShare: number
  totalSalary: number
}

export default function SalariesPage() {
  const queryClient = useQueryClient()
  const [selectedPeriod, setSelectedPeriod] = useState<{ start: string; end: string }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
  })
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSalary | null>(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [globalSharePercentage, setGlobalSharePercentage] = useState(50) // Single share percentage for all appointments

  // Fetch doctors
  const { data: doctors = [], isLoading: loadingDoctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorsApi.getAll(),
  })

  // Fetch nurses
  const { data: nurses = [], isLoading: loadingNurses } = useQuery({
    queryKey: ['nurses'],
    queryFn: () => nursesApi.getAll(),
  })

  // Fetch appointments for the selected period
  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments', selectedPeriod],
    queryFn: () => appointmentsApi.getAll(),
    enabled: showGenerateModal && !!selectedEmployee,
  })

  // Fetch hospital account
  const { data: hospitalAccount, isLoading: loadingAccount } = useQuery({
    queryKey: ['hospital-account'],
    queryFn: () => withdrawalsApi.getHospitalAccount(),
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Fetch saved salaries
  const { data: savedSalaries = [], isLoading: loadingSalaries } = useQuery({
    queryKey: ['salaries'],
    queryFn: () => salariesApi.getAll({ includeDeleted: false }),
  })

  const isLoading = loadingDoctors || loadingNurses || loadingAccount || loadingSalaries

  // Prepare employees with salary data
  const employees = useMemo(() => {
    const allEmployees: EmployeeSalary[] = []

    // Add doctors
    doctors.forEach((doctor: any) => {
      allEmployees.push({
        id: doctor.id,
        name: `Dr. ${doctor.user?.firstName || ''} ${doctor.user?.lastName || ''}`.trim(),
        role: 'DOCTOR',
        baseSalary: doctor.salary || 0,
        appointments: [],
        appointmentShares: [],
        totalAppointmentShare: 0,
        totalSalary: doctor.salary || 0,
      })
    })

    // Add nurses
    nurses.forEach((nurse: any) => {
      allEmployees.push({
        id: nurse.id,
        name: `${nurse.user?.firstName || ''} ${nurse.user?.lastName || ''}`.trim(),
        role: 'NURSE',
        baseSalary: nurse.salary || 0,
        appointments: [],
        appointmentShares: [],
        totalAppointmentShare: 0,
        totalSalary: nurse.salary || 0,
      })
    })

    return allEmployees
  }, [doctors, nurses])

  // Get all processed appointment IDs from saved salaries (non-deleted)
  const processedAppointmentIds = useMemo(() => {
    const processedIds = new Set<string>()
    
    savedSalaries.forEach((salary: any) => {
      if (salary.employeeId === selectedEmployee?.id && 
          salary.employeeType === selectedEmployee?.role &&
          salary.appointmentShares && 
          Array.isArray(salary.appointmentShares)) {
        salary.appointmentShares.forEach((share: any) => {
          if (share.appointmentId) {
            processedIds.add(share.appointmentId)
          }
        })
      }
    })
    
    return processedIds
  }, [savedSalaries, selectedEmployee])

  // Get appointments for selected employee and period (excluding already processed ones)
  const employeeAppointments = useMemo(() => {
    if (!selectedEmployee || !showGenerateModal) return []

    const startDate = new Date(selectedPeriod.start)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(selectedPeriod.end)
    endDate.setHours(23, 59, 59, 999)

    if (selectedEmployee.role === 'DOCTOR') {
      const doctor = doctors.find((d: any) => d.id === selectedEmployee.id)
      const doctorUserId = doctor?.userId

      return appointments.filter((apt: any) => {
        if (apt.doctorId !== doctorUserId) return false
        const aptDate = new Date(apt.appointmentDate)
        // Exclude cancelled appointments and already processed ones
        return aptDate >= startDate && 
               aptDate <= endDate && 
               apt.status !== 'CANCELLED' &&
               !processedAppointmentIds.has(apt.id)
      })
    }

    return []
  }, [selectedEmployee, appointments, selectedPeriod, doctors, showGenerateModal, processedAppointmentIds])

  // Calculate appointment shares and totals (single share percentage for all appointments)
  const calculateSalary = () => {
    if (!selectedEmployee) return

    const updatedEmployee = { ...selectedEmployee }
    let totalShare = 0
    let totalFees = 0

    // For doctors, calculate from appointments using single share percentage
    if (selectedEmployee.role === 'DOCTOR') {
      const doctor = doctors.find((d: any) => d.id === selectedEmployee.id)
      const appointmentFee = doctor?.appointmentFees || 0
      
      // Calculate total fees and share for all appointments at once
      totalFees = employeeAppointments.length * appointmentFee
      
      // Apply single share percentage to total fees
      totalShare = (totalFees * globalSharePercentage) / 100

      // Update appointment shares array with single share percentage
      const shares: AppointmentShare[] = employeeAppointments.map((apt: any) => ({
        appointmentId: apt.id,
        sharePercentage: globalSharePercentage,
        appointmentDate: apt.appointmentDate,
        appointmentTime: apt.appointmentTime,
        patientName: `${apt.patient?.firstName || ''} ${apt.patient?.lastName || ''}`.trim(),
        fee: appointmentFee,
      }))

      updatedEmployee.appointmentShares = shares
      updatedEmployee.totalAppointmentShare = totalShare
      updatedEmployee.totalSalary = updatedEmployee.baseSalary + totalShare
    } else {
      // For nurses, just base salary
      updatedEmployee.totalSalary = updatedEmployee.baseSalary
    }

    return updatedEmployee
  }

  const handleGenerateSalary = () => {
    if (!selectedEmployee) return

    const employee = employees.find((e) => e.id === selectedEmployee.id)
    if (!employee) return

    // Reset global share percentage when opening modal
    setGlobalSharePercentage(50)

    // Initialize with empty shares - will be calculated when user sets share percentage
    setSelectedEmployee({
      ...employee,
      appointments: employeeAppointments,
      appointmentShares: [],
    })

    setShowGenerateModal(true)
  }

  // Update global share percentage (applies to all appointments)
  const handleGlobalShareChange = (sharePercentage: number) => {
    const percentage = Math.min(100, Math.max(0, sharePercentage))
    setGlobalSharePercentage(percentage)
  }

  const saveSalaryMutation = useMutation({
    mutationFn: (salaryData: any) => salariesApi.create(salaryData),
    onSuccess: () => {
      toast.success('Salary saved successfully')
      setShowGenerateModal(false)
      setSelectedEmployee(null)
      queryClient.invalidateQueries({ queryKey: ['salaries'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to save salary')
    },
  })

  const deleteSalaryMutation = useMutation({
    mutationFn: (id: string) => salariesApi.delete(id),
    onSuccess: () => {
      toast.success('Salary deleted successfully')
      // Invalidate both admin and employee salary queries
      queryClient.invalidateQueries({ queryKey: ['salaries'] })
      queryClient.invalidateQueries({ queryKey: ['my-salaries'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete salary')
    },
  })

  const handleSaveSalary = () => {
    if (!selectedEmployee) return

    const calculated = calculateSalary()
    if (!calculated) return

    const salaryData = {
      employeeId: selectedEmployee.id,
      employeeType: selectedEmployee.role,
      periodStart: selectedPeriod.start,
      periodEnd: selectedPeriod.end,
      baseSalary: calculated.baseSalary,
      appointmentEarnings: calculated.totalAppointmentShare || 0,
      appointmentShares: calculated.appointmentShares || [],
      totalSalary: calculated.totalSalary,
    }

    saveSalaryMutation.mutate(salaryData)
  }

  const handleDeleteSalary = (id: string) => {
    if (window.confirm('Are you sure you want to delete this salary record?')) {
      deleteSalaryMutation.mutate(id)
    }
  }

  // Calculate salary with current share percentage and appointments
  const calculatedSalary = useMemo(() => {
    if (!selectedEmployee) return null
    const updatedEmployee = { ...selectedEmployee }

    if (updatedEmployee.role === 'DOCTOR' && employeeAppointments.length > 0) {
      const doctor = doctors.find((d: any) => d.id === updatedEmployee.id)
      const appointmentFee = doctor?.appointmentFees || 0
      const totalFees = employeeAppointments.length * appointmentFee
      const totalShare = (totalFees * globalSharePercentage) / 100

      // Update appointment shares array
      updatedEmployee.appointmentShares = employeeAppointments.map((apt: any) => ({
        appointmentId: apt.id,
        sharePercentage: globalSharePercentage,
        appointmentDate: apt.appointmentDate,
        appointmentTime: apt.appointmentTime,
        patientName: `${apt.patient?.firstName || ''} ${apt.patient?.lastName || ''}`.trim(),
        fee: appointmentFee,
      }))

      updatedEmployee.totalAppointmentShare = totalShare
      updatedEmployee.totalSalary = updatedEmployee.baseSalary + totalShare
    } else {
      updatedEmployee.totalSalary = updatedEmployee.baseSalary
    }

    return updatedEmployee
  }, [selectedEmployee, globalSharePercentage, employeeAppointments, doctors])

  return (
    <div className="pl-6 pr-8 pt-6 pb-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-black">Employee Salaries</h1>
          <p className="text-sm text-gray-600 mt-0.5">Manage and generate salaries for doctors and nurses</p>
        </div>
      </div>

      {/* Period Selection with Hospital Account */}
      <div className="bg-white rounded-xl shadow p-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-3">
            <Wallet className="h-5 w-5 text-black" />
            <span className="text-base font-bold text-black">Hospital Account:</span>
            <span className="text-base font-extrabold text-black">
              Balance: PKR {(hospitalAccount?.balance ? parseFloat(hospitalAccount.balance.toString()) : 0).toLocaleString('en-PK', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-base font-extrabold text-green-600">
              Revenue: PKR {(hospitalAccount?.totalRevenue ? parseFloat(hospitalAccount.totalRevenue.toString()) : 0).toLocaleString('en-PK', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex items-center space-x-2 ml-auto">
            <label className="text-sm font-bold text-black">Period:</label>
            <input
              type="date"
              value={selectedPeriod.start}
              onChange={(e) => setSelectedPeriod({ ...selectedPeriod, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black text-black text-sm"
            />
            <span className="text-black font-bold">to</span>
            <input
              type="date"
              value={selectedPeriod.end}
              onChange={(e) => setSelectedPeriod({ ...selectedPeriod, end: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black text-black text-sm"
            />
          </div>
        </div>
      </div>

      {/* Saved Salaries */}
      {savedSalaries.length > 0 && (
        <div className="bg-white rounded-xl shadow">
          <div className="p-3 border-b border-gray-200">
            <h2 className="text-base font-extrabold text-black">
              Saved Salaries ({savedSalaries.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {savedSalaries.map((salary: any) => {
              const employee = employees.find((e) => e.id === salary.employeeId)
              return (
                <div key={salary.id} className="p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-sm font-extrabold text-black">
                          {employee?.name || `${salary.employeeType === 'DOCTOR' ? 'Dr. ' : ''}Employee`}
                        </h3>
                        <span className="px-2 py-0.5 text-xs font-bold rounded bg-gray-100 text-black capitalize">
                          {salary.employeeType.toLowerCase()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-600">
                        <span>
                          Period: {format(new Date(salary.periodStart), 'MMM dd, yyyy')} - {format(new Date(salary.periodEnd), 'MMM dd, yyyy')}
                        </span>
                        <span className="font-bold text-black">
                          Total: PKR {parseFloat(salary.totalSalary?.toString() || '0').toLocaleString('en-PK', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        {salary.appointmentEarnings > 0 && (
                          <span className="text-green-600">
                            Appointment Earnings: PKR {parseFloat(salary.appointmentEarnings?.toString() || '0').toLocaleString('en-PK', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Created: {format(new Date(salary.createdAt), 'MMM dd, yyyy hh:mm a')}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSalary(salary.id)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-bold hover:bg-red-700 flex items-center space-x-2 ml-4"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Employees List */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-3 border-b border-gray-200">
          <h2 className="text-base font-extrabold text-black">
            Employees ({employees.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-sm text-black font-bold">Loading employees...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-black font-bold">No employees found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {employees.map((employee) => {
              const Icon = employee.role === 'DOCTOR' ? UserCog : UserPlus

              return (
                <div key={employee.id} className="p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="bg-black rounded-full p-2">
                        <Icon className="h-4 w-4 text-white" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-extrabold text-black">{employee.name}</h3>
                          <span className="px-2 py-0.5 text-xs font-bold rounded bg-gray-100 text-black capitalize">
                            {employee.role.toLowerCase()}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3 text-xs text-gray-600">
                          <span>
                            Base Salary: <span className="font-bold text-black">PKR {employee.baseSalary.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </span>
                          {employee.role === 'DOCTOR' && (
                            <span className="text-black">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              Appointment-based earnings available
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedEmployee(employee)
                        handleGenerateSalary()
                      }}
                      className="px-3 py-1.5 bg-black text-white rounded-md text-sm font-bold hover:bg-gray-900 flex items-center space-x-2"
                    >
                      <Calculator className="h-3 w-3" />
                      <span>Generate Salary</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Generate Salary Modal */}
      {showGenerateModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-black">Generate Salary</h2>
                <p className="text-xs text-gray-600">{selectedEmployee.name}</p>
              </div>
              <button
                onClick={() => {
                  setShowGenerateModal(false)
                  setSelectedEmployee(null)
                }}
                className="text-black font-bold hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Base Salary */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-gray-600">Base Salary</p>
                    <p className="text-lg font-extrabold text-black mt-0.5">
                      PKR {selectedEmployee.baseSalary.toLocaleString('en-PK', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Appointments for Doctors */}
              {selectedEmployee.role === 'DOCTOR' && (
                <div>
                  {employeeAppointments.length > 0 ? (
                    <>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-extrabold text-black">
                            Appointments ({employeeAppointments.length})
                          </h3>
                        </div>
                        <div className="flex items-center space-x-3">
                          <label className="text-xs font-bold text-black">Doctor Share (%):</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={globalSharePercentage}
                            onChange={(e) => handleGlobalShareChange(parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black text-black"
                          />
                          <span className="text-xs text-gray-600">(Applied to all appointments)</span>
                        </div>
                      </div>

                      {/* Appointment List - Read only */}
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {employeeAppointments.map((apt: any) => {
                          const doctor = doctors.find((d: any) => d.id === selectedEmployee.id)
                          const appointmentFee = doctor?.appointmentFees || 0

                          return (
                            <div key={apt.id} className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-xs font-bold text-black">
                                    {format(new Date(apt.appointmentDate), 'MMM dd, yyyy')} at {apt.appointmentTime}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-0.5">
                                    {apt.patient?.firstName || ''} {apt.patient?.lastName || ''}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-600">Fee:</p>
                                  <p className="text-xs font-bold text-black">
                                    PKR {appointmentFee.toLocaleString('en-PK', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-600">
                        {processedAppointmentIds.size > 0 
                          ? 'All appointments for this period have already been processed.'
                          : 'No appointments found for the selected period.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              {calculatedSalary && (
                <div className="space-y-3">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-bold text-black">Base Salary:</span>
                      <span className="text-base font-extrabold text-black">
                        PKR {calculatedSalary.baseSalary.toLocaleString('en-PK', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    {calculatedSalary.role === 'DOCTOR' && employeeAppointments.length > 0 && (
                      <>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-600">Total Appointments:</span>
                          <span className="text-xs font-bold text-black">{employeeAppointments.length}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-600">Total Appointment Fees:</span>
                          <span className="text-xs font-bold text-black">
                            PKR {(() => {
                              const doctor = doctors.find((d: any) => d.id === selectedEmployee.id)
                              const fee = doctor?.appointmentFees || 0
                              const totalFees = employeeAppointments.length * fee
                              return totalFees.toLocaleString('en-PK', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-600">Doctor Share ({globalSharePercentage}%):</span>
                          <span className="text-xs font-extrabold text-green-600">
                            PKR {calculatedSalary.totalAppointmentShare.toLocaleString('en-PK', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-3 border-t border-gray-200 pt-2">
                          <span className="text-xs text-gray-600">Hospital Revenue:</span>
                          <span className="text-xs font-extrabold text-black">
                            PKR {(() => {
                              const doctor = doctors.find((d: any) => d.id === selectedEmployee.id)
                              const fee = doctor?.appointmentFees || 0
                              const totalFees = employeeAppointments.length * fee
                              const hospitalRevenue = totalFees - calculatedSalary.totalAppointmentShare
                              return hospitalRevenue.toLocaleString('en-PK', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            })()}
                          </span>
                        </div>
                        <div className="border-t border-gray-200 pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-base font-bold text-black">Total Salary:</span>
                            <span className="text-xl font-extrabold text-black">
                              PKR {calculatedSalary.totalSalary.toLocaleString('en-PK', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    {calculatedSalary.role === 'NURSE' && (
                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-base font-bold text-black">Total Salary:</span>
                          <span className="text-xl font-extrabold text-black">
                            PKR {calculatedSalary.totalSalary.toLocaleString('en-PK', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hospital Account Impact */}
                  {hospitalAccount && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Wallet className="h-4 w-4 text-black" />
                        <h4 className="text-sm font-bold text-black">Hospital Account Impact</h4>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Current Balance:</span>
                          <span className="text-xs font-bold text-black">
                            PKR {(hospitalAccount.balance ? parseFloat(hospitalAccount.balance.toString()) : 0).toLocaleString('en-PK', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Salary Payment:</span>
                          <span className="text-xs font-bold text-red-600">
                            - PKR {calculatedSalary.totalSalary.toLocaleString('en-PK', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="border-t border-gray-200 pt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-black">Projected Balance:</span>
                            <span className={`text-sm font-extrabold ${
                              (hospitalAccount.balance ? parseFloat(hospitalAccount.balance.toString()) : 0) - calculatedSalary.totalSalary >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              PKR {((hospitalAccount.balance ? parseFloat(hospitalAccount.balance.toString()) : 0) - calculatedSalary.totalSalary).toLocaleString('en-PK', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowGenerateModal(false)
                    setSelectedEmployee(null)
                  }}
                  className="px-4 py-1.5 border border-gray-300 rounded-md text-sm font-bold text-black hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSalary}
                  className="px-4 py-1.5 bg-black text-white rounded-md text-sm font-bold hover:bg-gray-900 flex items-center space-x-2"
                >
                  <Save className="h-3 w-3" />
                  <span>Save Salary</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


