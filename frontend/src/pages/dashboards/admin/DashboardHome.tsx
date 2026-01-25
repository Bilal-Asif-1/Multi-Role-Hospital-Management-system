import { useQuery } from '@tanstack/react-query'
import { auditApi } from '../../../services/api'
import {
  Users,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  BedDouble,
  Stethoscope,
} from 'lucide-react'
import { format } from 'date-fns'
import { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function DashboardHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  
  const { data: kpis, isLoading, isFetching } = useQuery({
    queryKey: ['admin-kpis'],
    queryFn: () => auditApi.getKPIs(),
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (!isFetching && kpis) {
      setLastUpdate(new Date())
    }
  }, [isFetching, kpis])

  if (isLoading) {
    return (
      <div className="pl-6 pr-8 pt-6 pb-6">
        <div className="text-center py-12">
          <p className="text-black font-bold">Loading KPIs...</p>
        </div>
      </div>
    )
  }

  const primaryStats = [
    {
      name: 'Available Rooms',
      value: kpis?.rooms?.status?.AVAILABLE ?? kpis?.rooms?.available ?? 0,
      sublabel: `${kpis?.rooms?.total || 0} total`,
      icon: BedDouble,
      route: '/admin/allocation', // Rooms are managed in allocation page
    },
    {
      name: 'Free Beds',
      value: kpis?.beds?.status?.AVAILABLE ?? kpis?.beds?.available ?? 0,
      sublabel: `${Math.round((kpis?.beds?.availableRatio || (kpis?.beds?.total ? (kpis?.beds?.available ?? 0) / kpis?.beds?.total : 0)) * 100)}% availability`,
      icon: BedDouble,
      route: '/admin/allocation', // Beds are also managed in allocation page
    },
    {
      name: 'Doctors On Shift',
      value: kpis?.staff?.doctors?.onShift ?? kpis?.doctors?.active ?? 0,
      sublabel: `${(kpis?.staff?.doctors?.total ?? kpis?.doctors?.total) || 0} total`,
      icon: Stethoscope,
      route: '/admin/doctors',
    },
    {
      name: 'Total Patients',
      value: kpis?.patients?.total ?? 0,
      sublabel: `${kpis?.patients?.admitted ?? 0} admitted`,
      icon: Users,
      route: '/admin/patients',
    },
  ]

  const financialStats = [
    {
      name: 'Total Revenue',
      value: `PKR ${Number(kpis?.financial?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
    },
    {
      name: "Today's Revenue",
      value: `PKR ${Number(kpis?.financial?.todayRevenue || 0).toLocaleString()}`,
      icon: TrendingUp,
    },
    {
      name: 'Pending Invoices',
      value: kpis?.financial?.pendingInvoices || 0,
      icon: FileText,
    },
    {
      name: "Today's Appointments",
      value: kpis?.appointments?.today || 0,
      icon: Clock,
    },
  ]

  return (
    <div className="pl-6 pr-8 pt-2 pb-6">
      {/* Welcome Banner */}
      <div className="mb-6 bg-gradient-to-r from-black via-gray-900 to-black rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-white mb-2">
              Welcome, {user?.firstName} {user?.lastName}!
            </h2>
            <p className="text-white/90 font-bold">
              Manage your hospital operations, staff, patients, and resources efficiently.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-black">Dashboard</h1>
          </div>
        </div>
      </div>

      {/* Operational KPIs - Top Priority */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {primaryStats.map((stat) => (
          <div
            key={stat.name}
            onClick={() => stat.route && navigate(stat.route)}
            className={`bg-white shadow-lg rounded-xl p-5 hover:shadow-xl hover:scale-[1.01] transition-all ${
              stat.route ? 'cursor-pointer hover:bg-gray-50' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="bg-black rounded-lg p-3">
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 ml-4">
                <p className="text-sm font-bold text-black">{stat.name}</p>
                <p className="text-3xl font-extrabold text-black mt-1">{stat.value}</p>
                <p className="text-xs font-bold text-gray-500 mt-1">{stat.sublabel}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Financial Snapshot & Appointments Overview - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Financial Snapshot */}
        <div className="bg-white shadow-lg rounded-xl p-4">
          <h2 className="text-base font-bold text-black mb-3 flex items-center">
            <DollarSign className="h-4 w-4 mr-2 text-black" />
            Financial Snapshot
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {financialStats.map((stat) => (
              <div key={stat.name} className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                <div className="text-xs font-bold text-gray-500">{stat.name}</div>
                <div className="text-sm font-bold text-black mt-1">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Appointments Overview */}
        <div className="bg-white shadow-lg rounded-xl p-4">
          <h2 className="text-base font-bold text-black mb-3 flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-black" />
            Appointments Overview
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-black font-bold">Today</span>
              <span className="text-base font-bold text-black">{kpis?.appointments?.today || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-black font-bold">This Week</span>
              <span className="text-base font-bold text-black">{kpis?.appointments?.thisWeek || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-black font-bold">This Month</span>
              <span className="text-base font-bold text-black">{kpis?.appointments?.thisMonth || 0}</span>
            </div>
            <div className="flex justify-between items-center border-t border-gray-200 pt-2">
              <span className="text-sm text-black font-bold">Total</span>
              <span className="text-lg font-bold text-black">{kpis?.appointments?.total || 0}</span>
            </div>
          </div>
        </div>
      </div>



    </div>
  )
}



