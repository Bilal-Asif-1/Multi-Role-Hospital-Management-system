import { useQuery } from '@tanstack/react-query'
import { auditApi } from '../services/api'
import { AlertTriangle, X, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function CriticalAlerts() {
  const navigate = useNavigate()
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['critical-alerts'],
    queryFn: () => auditApi.getAlerts(),
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  if (isLoading) {
    return null
  }

  if (!alerts || alerts.length === 0) {
    return null
  }

  const severityColors: Record<string, string> = {
    HIGH: 'bg-red-50 border-red-200 text-red-800',
    MEDIUM: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    LOW: 'bg-blue-50 border-blue-200 text-blue-800',
  }

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
    <div className="space-y-3">
      {alerts.map((alert: any, idx: number) => (
        <div
          key={idx}
          className={`border rounded-lg p-4 ${severityColors[alert.severity] || severityColors.MEDIUM}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-sm mb-1">{alert.message}</p>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold opacity-75">
                    {alert.entityType} • {alert.type}
                  </span>
                  {alert.entityId && (
                    <button
                      onClick={() => navigate(getRoute(alert.entityType, alert.entityId))}
                      className="text-xs font-bold underline hover:no-underline flex items-center space-x-1"
                    >
                      <span>View</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

