import { useQuery } from '@tanstack/react-query'
import { auditApi } from '../services/api'
import { Link } from 'react-router-dom'
import { Users, UserCog, Building, Calendar, ArrowRight } from 'lucide-react'

interface RelationViewerProps {
  entityType: string
  entityId: string
}

const entityIcons: Record<string, any> = {
  Patient: Users,
  Doctor: UserCog,
  Nurse: Users,
  Room: Building,
  Appointment: Calendar,
}

const entityRoutes: Record<string, (id: string) => string> = {
  Patient: (id) => `/admin/patients/${id}`,
  Doctor: (id) => `/admin/doctors`,
  Nurse: (id) => `/admin/nurses`,
  Room: (id) => `/admin/rooms`,
  Appointment: (id) => `/admin/appointments`,
}

export function RelationViewer({ entityType, entityId }: RelationViewerProps) {
  const { data: relations, isLoading } = useQuery({
    queryKey: ['related-entities', entityType, entityId],
    queryFn: () => auditApi.getRelatedEntities(entityType, entityId),
    enabled: !!entityType && !!entityId,
  })

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow p-4">
        <p className="text-black font-bold">Loading related entities...</p>
      </div>
    )
  }

  if (!relations || relations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="text-lg font-bold text-black mb-2">Related Entities</h3>
        <p className="text-gray-500 text-sm">No related entities found</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="text-lg font-bold text-black mb-4">Related Entities</h3>
      <div className="space-y-4">
        {relations.map((relation: any, idx: number) => {
          const Icon = entityIcons[relation.type] || Users
          const routeFn = entityRoutes[relation.type]

          return (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Icon className="h-5 w-5 text-black" />
                <h4 className="font-bold text-black">{relation.label}</h4>
              </div>
              <div className="space-y-2">
                {relation.items.map((item: any) => (
                  <Link
                    key={item.id}
                    to={routeFn ? routeFn(item.id) : '#'}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors group"
                  >
                    <span className="text-black font-bold">{item.name}</span>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

