import { useQuery } from '@tanstack/react-query'
import { appointmentsApi, vitalsApi, labRecordsApi } from '../../../../services/api'
import { format } from 'date-fns'
import { Heart, Activity, Calendar, Clock } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

interface AppointmentCardsProps {
  patientId?: string
}

export default function AppointmentCards({ patientId }: AppointmentCardsProps) {
  const { data: appointments } = useQuery({
    queryKey: ['appointments', patientId],
    queryFn: () => appointmentsApi.getAll(),
    refetchInterval: 30000,
  })

  const { data: vitals } = useQuery({
    queryKey: ['vitals', patientId],
    queryFn: () => vitalsApi.getAll(patientId),
    refetchInterval: 30000,
    enabled: !!patientId,
  })

  const { data: labRecords } = useQuery({
    queryKey: ['lab-records', patientId],
    queryFn: () => labRecordsApi.getAll(patientId),
    refetchInterval: 30000,
    enabled: !!patientId,
  })

  // Get upcoming appointments
  const upcomingAppointments = appointments?.filter((apt: any) => {
    const aptDate = new Date(apt.appointmentDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return aptDate >= today && apt.status === 'SCHEDULED'
  }).slice(0, 2) || []

  // Get latest vitals for each appointment
  const getLatestVitals = (appointment: any) => {
    if (!vitals || !patientId) return null
    return vitals
      .filter((v: any) => v.patientId === patientId)
      .sort((a: any, b: any) => 
        new Date(b.recordedAt || b.createdAt).getTime() - 
        new Date(a.recordedAt || a.createdAt).getTime()
      )[0]
  }

  // Get latest lab records
  const getLatestLabRecords = () => {
    if (!labRecords || !patientId) return null
    return labRecords
      .filter((lab: any) => lab.patientId === patientId)
      .sort((a: any, b: any) => 
        new Date(b.testDate).getTime() - new Date(a.testDate).getTime()
      )[0]
  }

  // Generate chart data for vitals trend (last 7 readings)
  const getVitalsChartData = (vitalType: string) => {
    if (!vitals || !patientId) return []
    const recentVitals = vitals
      .filter((v: any) => v.patientId === patientId)
      .sort((a: any, b: any) => 
        new Date(a.recordedAt || a.createdAt).getTime() - 
        new Date(b.recordedAt || b.createdAt).getTime()
      )
      .slice(-7)

    return recentVitals.map((v: any, idx: number) => {
      let value = null
      if (vitalType === 'heartRate') value = v.heartRate
      if (vitalType === 'respiration') value = v.respirationRate || (v.heartRate ? v.heartRate * 0.2 : null)
      if (vitalType === 'o2sat') value = v.oxygenSaturation
      
      return {
        name: `T${idx + 1}`,
        value: value || 0,
      }
    })
  }

  const getSpecializationIcon = (specialization: string) => {
    const spec = specialization?.toLowerCase() || ''
    if (spec.includes('cardio') || spec.includes('heart')) {
      return { icon: Heart, color: 'bg-red-100 text-red-600' }
    }
    if (spec.includes('pulmo') || spec.includes('lung') || spec.includes('respiratory')) {
      return { icon: Activity, color: 'bg-blue-100 text-blue-600' }
    }
    return { icon: Calendar, color: 'bg-gray-100 text-gray-600' }
  }

  if (upcomingAppointments.length === 0) {
    return null
  }

  const latestLab = getLatestLabRecords()

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900">Upcoming Appointments</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {upcomingAppointments.map((appointment: any) => {
          const latestVitals = getLatestVitals(appointment)
          const doctor = appointment.doctor
          const specialization = doctor?.specialization || 'General'
          const { icon: Icon, color } = getSpecializationIcon(specialization)
          
          const heartRateData = getVitalsChartData('heartRate')
          const o2SatData = getVitalsChartData('o2sat')

          return (
            <div key={appointment.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className={`${color} p-2 rounded-lg`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-semibold text-gray-900">{specialization}</span>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {appointment.appointmentTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Doctor Name */}
              <div className="mb-3">
                <p className="font-semibold text-gray-900">
                  Dr. {doctor?.firstName} {doctor?.lastName}
                </p>
              </div>

              {/* Reason */}
              <div className="mb-4">
                <p className="text-sm text-gray-600">{appointment.reason || 'General Consultation'}</p>
              </div>

              {/* Vitals */}
              {latestVitals && (
                <div className="space-y-3 mb-4">
                  {latestVitals.heartRate && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">Heart Rate:</span>
                        <span className="text-sm font-bold text-gray-900">
                          {latestVitals.heartRate} bpm
                        </span>
                      </div>
                      {heartRateData.length > 0 && (
                        <div className="h-12 mt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={heartRateData}>
                              <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  )}

                  {latestVitals.oxygenSaturation && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">O2 Sat:</span>
                        <span className="text-sm font-bold text-gray-900">
                          {latestVitals.oxygenSaturation}%
                        </span>
                      </div>
                      {o2SatData.length > 0 && (
                        <div className="h-8 mt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={o2SatData}>
                              <Bar
                                dataKey="value"
                                fill="url(#o2Gradient)"
                                radius={[4, 4, 0, 0]}
                              />
                              <defs>
                                <linearGradient id="o2Gradient" x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#fca5a5" />
                                  <stop offset="100%" stopColor="#dc2626" />
                                </linearGradient>
                              </defs>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Lab Values */}
              {latestLab && (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                  {latestLab.results && (
                    <>
                      {latestLab.results.includes('Hgb') || latestLab.results.includes('Hemoglobin') ? (
                        <div>
                          <span className="text-xs text-gray-600">Hgb</span>
                          <p className="text-sm font-bold text-gray-900">
                            {latestLab.results.match(/Hgb[:\s]*([\d.]+)/i)?.[1] || 'N/A'}
                          </p>
                        </div>
                      ) : null}
                      {latestLab.results.includes('RBC') ? (
                        <div>
                          <span className="text-xs text-gray-600">RBC</span>
                          <p className="text-sm font-bold text-gray-900">
                            {latestLab.results.match(/RBC[:\s]*([\d.]+)/i)?.[1] || 'N/A'}
                          </p>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

