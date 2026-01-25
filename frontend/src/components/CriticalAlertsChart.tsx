import { useQuery } from '@tanstack/react-query'
import { auditApi } from '../services/api'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function CriticalAlertsChart() {
  const navigate = useNavigate()
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['critical-alerts'],
    queryFn: () => auditApi.getAlerts(),
    refetchInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="bg-white shadow-lg rounded-xl p-6 max-w-2xl h-[350px] flex flex-col">
        <h3 className="text-lg font-bold text-black mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-black" />
          Critical Alerts
        </h3>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-black font-bold">Loading alerts...</div>
        </div>
      </div>
    )
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white shadow-lg rounded-xl p-6 max-w-2xl h-[350px] flex flex-col">
        <h3 className="text-lg font-bold text-black mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-black" />
          Critical Alerts
        </h3>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-center text-gray-600 font-bold">No active alerts</p>
        </div>
      </div>
    )
  }

  // Group alerts by type
  const alertsByType: Record<string, any[]> = {}
  alerts.forEach((alert: any) => {
    if (!alertsByType[alert.type]) {
      alertsByType[alert.type] = []
    }
    alertsByType[alert.type].push(alert)
  })

  const getRoute = (entityType: string, entityId: string) => {
    switch (entityType) {
      case 'Patient':
        return `/admin/patients/${entityId}`
      case 'Room':
        return `/admin/rooms`
      case 'Doctor':
        return `/admin/doctors`
      case 'Nurse':
        return `/admin/nurses`
      default:
        return '#'
    }
  }

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 max-w-2xl h-[360px] flex flex-col">
      <h3 className="text-lg font-bold text-black mb-4 flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2 text-black" />
        Critical Alerts ({alerts.length})
      </h3>
      
      {/* Chart-like visualization with scroll */}
      <div className="space-y-4 flex-1 overflow-y-auto pr-2">
        {Object.entries(alertsByType).map(([type, typeAlerts]) => (
          <div key={type} className="border border-gray-200 rounded-lg p-4">
            {/* Alert items - Show all with scroll */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {typeAlerts.map((alert: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-gray-50 border border-gray-200 rounded-md p-3 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black truncate">{alert.message}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {alert.entityType} • {alert.type}
                    </p>
                  </div>
                  {alert.entityId && (
                    <button
                      onClick={() => navigate(getRoute(alert.entityType, alert.entityId))}
                      className="ml-3 px-3 py-1 bg-black text-white rounded-md text-xs font-bold hover:bg-gray-800 flex items-center flex-shrink-0"
                    >
                      View
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

